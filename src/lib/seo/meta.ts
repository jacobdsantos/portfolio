/**
 * Builds a normalised set of meta-tag values for a given page.
 */

import { site } from './site';

export interface MetaOptions {
  /** Page-specific title (will be templated as "title | siteName"). */
  title: string;
  /** Page-specific description. */
  description: string;
  /** Canonical URL override. Defaults to `site.baseUrl`. */
  canonical?: string;
  /** Open Graph image URL (absolute or path). */
  ogImage?: string;
  /** Open Graph type. Defaults to `'website'`. */
  type?: 'website' | 'article' | 'profile';
}

export interface MetaResult {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  ogSiteName: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  author: string;
}

/**
 * Produces a flat object of meta-tag values ready to be spread into
 * `<meta>` elements inside an Astro layout `<head>`.
 *
 * Title templating appends the site name:
 *   `"Research"` becomes `"Research | Jacob Santos"`.
 *
 * If the raw title already matches the site name it is used as-is to
 * avoid duplication on the home page.
 */
export function buildMeta(opts: MetaOptions): MetaResult {
  const { title, description, canonical, ogImage, type = 'website' } = opts;

  const templatedTitle =
    title === site.siteName || title.includes(site.siteName)
      ? title
      : `${title} | ${site.siteName}`;

  const resolvedCanonical = canonical ?? site.baseUrl;

  const resolvedImage = ogImage
    ? ogImage.startsWith('http')
      ? ogImage
      : `${site.baseUrl}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`
    : `${site.baseUrl}/og/default.png`;

  return {
    title: templatedTitle,
    description,
    canonical: resolvedCanonical,
    ogTitle: templatedTitle,
    ogDescription: description,
    ogImage: resolvedImage,
    ogType: type,
    ogSiteName: site.siteName,
    twitterCard: 'summary_large_image',
    twitterTitle: templatedTitle,
    twitterDescription: description,
    twitterImage: resolvedImage,
    author: site.author,
  };
}
