// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

export default defineConfig({
  site: 'https://jacobsantos.pages.dev',
  integrations: [
    tailwind(),
    sitemap(),
    react(),
    mdx(),
  ],
  markdown: {
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
    ],
    shikiConfig: {
      theme: 'github-dark',
    },
  },
  vite: {
    build: {
      // html2pdf.js is lazy-loaded via dynamic import() only when user clicks "Save PDF"
      chunkSizeWarningLimit: 1024,
    },
  },
});
