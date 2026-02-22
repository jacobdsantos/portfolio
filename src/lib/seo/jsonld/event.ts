/**
 * Generates a schema.org Event JSON-LD object for speaking engagements,
 * workshops, or conference appearances.
 */

import { site } from '../site';

export interface EventJsonLdOptions {
  /** Event / talk name. */
  name: string;
  /** ISO-8601 date string (e.g. `'2025-09-20'`). */
  date: string;
  /** Venue or location name (can include city / country). */
  location: string;
  /** Short description of the event or talk. */
  description: string;
  /** Optional canonical URL for the event page. */
  url?: string;
  /** Optional ISO-8601 end date. */
  endDate?: string;
  /** Event attendance mode. Defaults to `'OfflineEventAttendanceMode'`. */
  attendanceMode?: 'OfflineEventAttendanceMode' | 'OnlineEventAttendanceMode' | 'MixedEventAttendanceMode';
}

export interface EventJsonLd {
  '@context': 'https://schema.org';
  '@type': 'Event';
  name: string;
  startDate: string;
  endDate?: string;
  eventAttendanceMode: string;
  location: {
    '@type': 'Place';
    name: string;
  };
  description: string;
  url?: string;
  performer: {
    '@type': 'Person';
    name: string;
    url: string;
  };
  organizer: {
    '@type': 'Person';
    name: string;
    url: string;
  };
}

/**
 * Returns a schema.org `Event` JSON-LD object.
 *
 * @example
 * ```ts
 * eventJsonLd({
 *   name: 'Ransomware Attack Chain Workshop',
 *   date: '2025-09-20',
 *   location: 'Manila, Philippines',
 *   description: 'Hands-on workshop covering ransomware kill chains...',
 * });
 * ```
 */
export function eventJsonLd(opts: EventJsonLdOptions): EventJsonLd {
  const {
    name,
    date,
    location,
    description,
    url,
    endDate,
    attendanceMode = 'OfflineEventAttendanceMode',
  } = opts;

  const resolvedUrl = url
    ? url.startsWith('http')
      ? url
      : `${site.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    startDate: date,
    ...(endDate ? { endDate } : {}),
    eventAttendanceMode: `https://schema.org/${attendanceMode}`,
    location: {
      '@type': 'Place',
      name: location,
    },
    description,
    ...(resolvedUrl ? { url: resolvedUrl } : {}),
    performer: {
      '@type': 'Person',
      name: site.siteName,
      url: site.baseUrl,
    },
    organizer: {
      '@type': 'Person',
      name: site.siteName,
      url: site.baseUrl,
    },
  };
}
