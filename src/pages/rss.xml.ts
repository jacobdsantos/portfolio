import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const blog = await getCollection('blog');
  return rss({
    title: 'Jacob Santos - Blog',
    description: 'Threat research, security automation, and cybersecurity insights.',
    site: context.site!,
    items: blog
      .filter(post => !post.data.draft)
      .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
      .map(post => ({
        title: post.data.title,
        pubDate: new Date(post.data.date),
        description: post.data.excerpt,
        link: `/blog/${post.slug}/`,
      })),
  });
}
