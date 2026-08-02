import type { MetadataRoute } from 'next';

// APP_URL is already a required Backend env var (see .env.example) reused
// here as the canonical site origin — sitemap generation runs server-side
// at build/request time, so it doesn't need a NEXT_PUBLIC_ prefix.
const BASE_URL = process.env.APP_URL ?? 'http://localhost:3000';

/** Public marketing pages only — /dashboard is excluded here the same way it's disallowed in robots.txt. */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/docs', '/about', '/security', '/contact', '/privacy', '/terms'];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.6,
  }));
}
