/**
 * Generates a schema.org Article JSON-LD object for research posts / blog entries.
 */

import { site } from '../site';

export interface ArticleJsonLdOptions {
  /** Article title. */
  title: string;
  /** Short description / excerpt. */
  description: string;
  /** ISO-8601 publication date string (e.g. `'2025-06-15'`). */
  date: string;
  /** Canonical URL of the article. */
  url: string;
  /** Optional hero / OG image URL. */
  image?: string;
}

export interface ArticleJsonLd {
  '@context': 'https://schema.org';
  '@type': 'Article';
  headline: string;
  description: string;
  datePublished: string;
  url: string;
  image?: string;
  author: {
    '@type': 'Person';
    name: string;
    url: string;
  };
  publisher: {
    '@type': 'Person';
    name: string;
    url: string;
  };
  mainEntityOfPage: {
    '@type': 'WebPage';
    '@id': string;
  };
}

/**
 * Returns a schema.org `Article` JSON-LD object.
 *
 * @example
 * ```ts
 * articleJsonLd({
 *   title: 'Warlock Ransomware Deep Dive',
 *   description: 'Analysis of the Warlock ransomware family...',
 *   date: '2025-06-15',
 *   url: 'https://jacobsantos.pages.dev/research/warlock',
 *   image: '/og/research-warlock.png',
 * });
 * ```
 */
export function articleJsonLd(opts: ArticleJsonLdOptions): ArticleJsonLd {
  const { title, description, date, url, image } = opts;

  const resolvedUrl = url.startsWith('http') ? url : `${site.baseUrl}${url}`;
  const resolvedImage = image
    ? image.startsWith('http')
      ? image
      : `${site.baseUrl}${image.startsWith('/') ? '' : '/'}${image}`
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    datePublished: date,
    url: resolvedUrl,
    ...(resolvedImage ? { image: resolvedImage } : {}),
    author: {
      '@type': 'Person',
      name: site.siteName,
      url: site.baseUrl,
    },
    publisher: {
      '@type': 'Person',
      name: site.siteName,
      url: site.baseUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': resolvedUrl,
    },
  };
}
