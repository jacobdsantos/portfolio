/**
 * Generates a schema.org Person JSON-LD object for Jacob Santos.
 */

import { site } from '../site';

export interface PersonJsonLd {
  '@context': 'https://schema.org';
  '@type': 'Person';
  name: string;
  jobTitle: string;
  worksFor: {
    '@type': 'Organization';
    name: string;
  };
  url: string;
  sameAs: string[];
  knowsAbout: string[];
  description: string;
  email: string;
}

/**
 * Returns a fully-formed schema.org `Person` JSON-LD object.
 *
 * Can be serialised directly into a `<script type="application/ld+json">`
 * tag in an Astro layout.
 *
 * @example
 * ```astro
 * <script type="application/ld+json" set:html={JSON.stringify(personJsonLd())} />
 * ```
 */
export function personJsonLd(): PersonJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.siteName,
    jobTitle: site.jobTitle,
    worksFor: {
      '@type': 'Organization',
      name: site.organization,
    },
    url: site.baseUrl,
    sameAs: [
      site.socials.github,
      site.socials.linkedin,
    ],
    knowsAbout: [
      'Ransomware Analysis',
      'Advanced Persistent Threats',
      'Threat Intelligence',
      'MITRE ATT&CK',
      'Malware Analysis',
      'Security Automation',
    ],
    description: site.description,
    email: site.socials.email,
  };
}
