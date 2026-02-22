import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const blog = await getCollection('blog');

  const publishedPosts = blog
    .filter((post: { data: { draft?: boolean } }) => !post.data.draft)
    .sort((a: { data: { date: string } }, b: { data: { date: string } }) =>
      new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
    );

  return rss({
    title: 'Jacob Santos - Blog',
    description: 'Threat research, security automation, and cybersecurity insights.',
    site: context.site!,
    items: publishedPosts.map((post: { data: { title: string; date: string; excerpt: string }; slug: string }) => ({
      title: post.data.title,
      pubDate: new Date(post.data.date),
      description: post.data.excerpt,
      link: `/blog/${post.slug}/`,
    })),
  });
}
