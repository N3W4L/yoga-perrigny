/** Plan du site, généré selon l'adresse de publication (astro.config.mjs). */
import type { APIRoute } from 'astro';

const pages = ['', 'mentions-legales/', 'confidentialite/'];

export const GET: APIRoute = ({ site }) => {
  const base = new URL(import.meta.env.BASE_URL, site);
  const urls = pages.map((page) => `  <url>\n    <loc>${new URL(page, base).href}</loc>\n  </url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
