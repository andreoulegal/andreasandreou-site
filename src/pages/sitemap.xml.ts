import type { APIRoute } from 'astro';
import { getPublishedArticles } from '../lib/articles';

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = (site?.toString() || 'https://andreasandreou.gr').replace(/\/$/, '');
  const articles = await getPublishedArticles();
  const urls = [
    '/',
    '/bio',
    '/work',
    '/public-contribution',
    '/articles',
    ...articles.map((article) => `/articles/${article.slug}`)
  ];
  const body = urls.map((path) => `  <url><loc>${baseUrl}${path}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
