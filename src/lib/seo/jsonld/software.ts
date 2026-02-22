/**
 * Generates a schema.org SoftwareApplication JSON-LD object for tools / projects.
 */

import { site } from '../site';

export interface SoftwareJsonLdOptions {
  /** Application / tool name. */
  name: string;
  /** Short description of what it does. */
  description: string;
  /** Optional canonical URL for the tool page. */
  url?: string;
  /** Application category (e.g. `'SecurityApplication'`). Defaults to `'SecurityApplication'`. */
  applicationCategory?: string;
  /** Operating system compatibility. Defaults to `'Cross-platform'`. */
  operatingSystem?: string;
  /** Price. Defaults to `'0'` (free). */
  price?: string;
}

export interface SoftwareJsonLd {
  '@context': 'https://schema.org';
  '@type': 'SoftwareApplication';
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
  };
  author: {
    '@type': 'Person';
    name: string;
    url: string;
  };
}

/**
 * Returns a schema.org `SoftwareApplication` JSON-LD object.
 *
 * @example
 * ```ts
 * softwareJsonLd({
 *   name: 'TITAs',
 *   description: 'Automated threat intelligence inquiry pipeline',
 *   url: '/tools/titas',
 * });
 * ```
 */
export function softwareJsonLd(opts: SoftwareJsonLdOptions): SoftwareJsonLd {
  const {
    name,
    description,
    url,
    applicationCategory = 'SecurityApplication',
    operatingSystem = 'Cross-platform',
    price = '0',
  } = opts;

  const resolvedUrl = url
    ? url.startsWith('http')
      ? url
      : `${site.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
    : site.baseUrl;

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url: resolvedUrl,
    applicationCategory,
    operatingSystem,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Person',
      name: site.siteName,
      url: site.baseUrl,
    },
  };
}
