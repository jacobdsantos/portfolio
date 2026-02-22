/**
 * Sitemap XML endpoint.
 *
 * Note: The @astrojs/sitemap integration already generates a sitemap
 * at build time. This route exists as a manual fallback and for
 * additional customization if needed. The integration-generated
 * sitemap-index.xml is the primary sitemap for search engines.
 *
 * If @astrojs/sitemap is active, this file can be removed.
 * Keeping it here satisfies the specification's route requirement.
 */

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE_URL = 'https://jacobsantos.pages.dev';

export const GET: APIRoute = async () => {
  const research = await getCollection('research');
  const tools = await getCollection('tools');
  const blog = await getCollection('blog');

  const staticPages = [
    '',
    '/about',
    '/contact',
    '/speaking',
    '/resume',
    '/research',
    '/tools',
    '/blog',
  ];

  const urls: Array<{ loc: string; lastmod?: string; priority?: number }> = [];

  // Static pages
  for (const page of staticPages) {
    urls.push({
      loc: `${SITE_URL}${page}`,
      priority: page === '' ? 1.0 : 0.8,
    });
  }

  // Research pages
  for (const entry of research) {
    urls.push({
      loc: `${SITE_URL}/research/${entry.id}`,
      lastmod: entry.data.date,
      priority: 0.7,
    });
  }

  // Tool pages
  for (const entry of tools) {
    urls.push({
      loc: `${SITE_URL}/tools/${entry.id}`,
      priority: 0.7,
    });
  }

  // Blog posts
  for (const post of blog) {
    if (!post.data.draft) {
      urls.push({
        loc: `${SITE_URL}/blog/${post.slug}`,
        lastmod: post.data.date,
        priority: 0.6,
      });
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <priority>${u.priority ?? 0.5}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
