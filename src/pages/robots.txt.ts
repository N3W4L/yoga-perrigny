/** robots.txt, généré selon l'adresse de publication. Pris en compte par les
    moteurs seulement à la racine d'un domaine (ex. yoga-perrigny.com). */
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(`${import.meta.env.BASE_URL}sitemap.xml`, site).href;
  return new Response(`User-agent: *\nAllow: /\nDisallow: ${import.meta.env.BASE_URL}admin/\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
