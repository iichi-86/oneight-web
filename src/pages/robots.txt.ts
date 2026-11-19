import type { APIRoute } from 'astro';
import { site } from '../data/site';
export const GET: APIRoute = () => new Response(`User-agent: *\n${site.allowIndexing ? 'Allow: /\nDisallow: /api/' : 'Disallow: /'}\n${site.allowIndexing && site.origin ? `Sitemap: ${site.origin}/sitemap.xml\n` : ''}`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
