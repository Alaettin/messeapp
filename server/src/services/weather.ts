import { getDb, withDb, getSetting } from '../db/index.js';

export interface WeatherData {
  temperature: string;
  description: string;
  humidity: string;
  wind: string;
  location: string;
}

const WEATHER_CODES: Record<number, string> = {
  0: 'Klar',
  1: 'Überwiegend klar',
  2: 'Teilweise bewölkt',
  3: 'Bewölkt',
  45: 'Nebel',
  48: 'Nebel mit Reif',
  51: 'Leichter Nieselregen',
  53: 'Nieselregen',
  55: 'Starker Nieselregen',
  61: 'Leichter Regen',
  63: 'Regen',
  65: 'Starker Regen',
  71: 'Leichter Schneefall',
  73: 'Schneefall',
  75: 'Starker Schneefall',
  80: 'Leichte Regenschauer',
  81: 'Regenschauer',
  82: 'Starke Regenschauer',
  85: 'Leichte Schneeschauer',
  86: 'Schneeschauer',
  95: 'Gewitter',
  96: 'Gewitter mit Hagel',
  99: 'Gewitter mit starkem Hagel',
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

  const result: WeatherData = {
    temperature: `${weather.temperature}`,
    description: WEATHER_CODES[weather.weatherCode] || `Code ${weather.weatherCode}`,
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
