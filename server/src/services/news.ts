import { getDb, withDb, getSetting } from '../db/index.js';

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  date: string;
}

function parseRssItems(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
    const block = match[1];

    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      || block.match(/<title>(.*?)<\/title>/)?.[1]
      || '';

    const link = block.match(/<link>(.*?)<\/link>/)?.[1]
      || block.match(/<link\/>(.*?)(?:<|$)/)?.[1]
      || '';

    const source = block.match(/<source[^>]*>(.*?)<\/source>/)?.[1]
      || block.match(/<source[^>]*url="[^"]*">(.*?)<\/source>/)?.[1]
      || '';

    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';

    // Skip the feed-level title (first item might be the feed itself)
    if (!title || title.includes('Google News')) continue;

    items.push({
      title: decodeHtmlEntities(title),
      link: link.trim(),
      source: decodeHtmlEntities(source),
      date: pubDate ? new Date(pubDate).toISOString() : '',
    });
  }

  return items;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function getNewsForCity(city: string): Promise<NewsItem[]> {
  if (!city?.trim()) return [];

  const cacheMinutes = await getSetting('news_cache_minutes', 30);

  // Check cache
  const db = await getDb();
  const cached = db.exec(
    "SELECT data FROM news_cache WHERE city = ? AND fetched_at > datetime('now', ?)",
    [city, `-${cacheMinutes} minutes`]
  );

  if (cached.length > 0 && cached[0].values.length > 0) {
    try {
      return JSON.parse(cached[0].values[0][0] as string) as NewsItem[];
    } catch {}
  }

  // Fetch from Google News RSS (search by city name for local results)
  try {
    console.log(`News: fetching for city "${city}"`);
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(city)}&hl=en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      console.error(`News RSS error: ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const items = parseRssItems(xml);

    // Save to cache
    await withDb((db) => {
      db.run(
        "INSERT OR REPLACE INTO news_cache (city, data, fetched_at) VALUES (?, ?, datetime('now'))",
        [city, JSON.stringify(items)]
      );
    });

    return items;
  } catch (err) {
    console.error('News fetch error:', err);
    return [];
  }
}
