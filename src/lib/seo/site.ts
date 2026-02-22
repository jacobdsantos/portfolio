/**
 * Site-wide constants used across SEO helpers, meta tags, and structured data.
 */

export const site = {
  /** Canonical base URL (no trailing slash). */
  baseUrl: 'https://jacobsantos.pages.dev',

  /** Display name used in titles, JSON-LD, and Open Graph. */
  siteName: 'Jacob Santos',

  /** Site author for meta tags. */
  author: 'Jacob Santos',

  /** Default meta description when a page does not provide its own. */
  description:
    'Senior cybersecurity threat researcher, automation builder, and international trainer. Published researcher covering ransomware, APT campaigns, defense evasion, and red team tool abuse.',

  /** Professional title. */
  jobTitle: 'Senior Threat Researcher',

  /** Employer organisation name. */
  organization: 'Trend Micro',

  /** Social / external profile links. */
  socials: {
    github: 'https://github.com/jacobdsantos',
    linkedin: 'https://www.linkedin.com/in/jacob-santos-046313198/',
    email: 'jacobsantos.d@gmail.com',
  },
} as const;

export type Site = typeof site;

export default site;
