import { getDb, withDb, getSetting } from '../db/index.js';

export interface WeatherData {
  temperature: string;
  description: string;
  description_en: string;
  humidity: string;
  wind: string;
  location: string;
}

const WEATHER_CODES: Record<number, { de: string; en: string }> = {
  0: { de: 'Klar', en: 'Clear sky' },
  1: { de: 'Überwiegend klar', en: 'Mainly clear' },
  2: { de: 'Teilweise bewölkt', en: 'Partly cloudy' },
  3: { de: 'Bewölkt', en: 'Overcast' },
  45: { de: 'Nebel', en: 'Fog' },
  48: { de: 'Nebel mit Reif', en: 'Depositing rime fog' },
  51: { de: 'Leichter Nieselregen', en: 'Light drizzle' },
  53: { de: 'Nieselregen', en: 'Moderate drizzle' },
  55: { de: 'Starker Nieselregen', en: 'Dense drizzle' },
  61: { de: 'Leichter Regen', en: 'Slight rain' },
  63: { de: 'Regen', en: 'Moderate rain' },
  65: { de: 'Starker Regen', en: 'Heavy rain' },
  71: { de: 'Leichter Schneefall', en: 'Slight snowfall' },
  73: { de: 'Schneefall', en: 'Moderate snowfall' },
  75: { de: 'Starker Schneefall', en: 'Heavy snowfall' },
  80: { de: 'Leichte Regenschauer', en: 'Slight rain showers' },
  81: { de: 'Regenschauer', en: 'Moderate rain showers' },
  82: { de: 'Starke Regenschauer', en: 'Violent rain showers' },
  85: { de: 'Leichte Schneeschauer', en: 'Slight snow showers' },
  86: { de: 'Schneeschauer', en: 'Heavy snow showers' },
  95: { de: 'Gewitter', en: 'Thunderstorm' },
  96: { de: 'Gewitter mit Hagel', en: 'Thunderstorm with hail' },
  99: { de: 'Gewitter mit starkem Hagel', en: 'Thunderstorm with heavy hail' },
};

function extractCity(address: string): string {
  // Split by comma, look for city (often after PLZ)
  const parts = address.split(',').map(p => p.trim());

  for (const part of parts) {
    // Match "12345 CityName" pattern
    const match = part.match(/\d{4,5}\s+(.+)/);
    if (match) return match[1].trim();
  }

  // Fallback: use the second-to-last part (often city), or first part
  if (parts.length >= 2) return parts[parts.length - 2].replace(/\d{4,5}/, '').trim();
  return parts[0];
}

async function geocode(city: string): Promise<{ lat: number; lon: number; name: string } | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=de`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results?.length) return null;
    const r = data.results[0];
    return { lat: r.latitude, lon: r.longitude, name: r.name };
  } catch (err) {
    console.error('Geocoding error:', err);
    return null;
  }
}

async function fetchWeather(lat: number, lon: number): Promise<{
  temperature: number;
  humidity: number;
  wind: number;
  weatherCode: number;
} | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const c = data.current;
    return {
      temperature: c.temperature_2m,
      humidity: c.relative_humidity_2m,
      wind: c.wind_speed_10m,
      weatherCode: c.weather_code,
    };
  } catch (err) {
    console.error('Weather API error:', err);
    return null;
  }
}

export async function getWeatherForAddress(address: string): Promise<WeatherData | null> {
  if (!address?.trim()) return null;

  const cacheMinutes = await getSetting('weather_cache_minutes', 30);

  // Check cache
  const db = await getDb();
  const cached = db.exec(
    "SELECT data, fetched_at FROM weather_cache WHERE address = ? AND fetched_at > datetime('now', ?)",
    [address, `-${cacheMinutes} minutes`]
  );

  if (cached.length > 0 && cached[0].values.length > 0) {
    try {
      return JSON.parse(cached[0].values[0][0] as string) as WeatherData;
    } catch {}
  }

  // Fetch fresh data
  const city = extractCity(address);
  if (!city) return null;

  const geo = await geocode(city);
  if (!geo) return null;

  const weather = await fetchWeather(geo.lat, geo.lon);
  if (!weather) return null;

  const code = WEATHER_CODES[weather.weatherCode];
  const result: WeatherData = {
    temperature: `${weather.temperature}`,
    description: code?.de || `Code ${weather.weatherCode}`,
    description_en: code?.en || `Code ${weather.weatherCode}`,
    humidity: `${weather.humidity}`,
    wind: `${weather.wind}`,
    location: geo.name,
  };

  // Save to cache
  await withDb((db) => {
    db.run(
      "INSERT OR REPLACE INTO weather_cache (address, data, fetched_at) VALUES (?, ?, datetime('now'))",
      [address, JSON.stringify(result)]
    );
  });

  return result;
}
