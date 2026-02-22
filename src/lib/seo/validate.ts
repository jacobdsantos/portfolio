/**
 * Validates a meta-tag object and returns an array of human-readable
 * error / warning strings. An empty array means everything looks good.
 */

export interface MetaLike {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  [key: string]: unknown;
}

/**
 * Checks common SEO requirements against the supplied meta object.
 *
 * Rules checked:
 *   - `title` is present and between 10 and 70 characters.
 *   - `description` is present and between 50 and 160 characters.
 *   - `canonical` is present and starts with `https://`.
 *   - `ogImage` is present and points to a `.png`, `.jpg`, or `.webp`.
 *   - `ogTitle` matches `title` (consistency check).
 *   - `ogDescription` matches `description`.
 *
 * @returns Array of validation messages. Empty when valid.
 */
export function validateMeta(meta: MetaLike): string[] {
  const issues: string[] = [];

  // --- title ---
  if (!meta.title) {
    issues.push('Missing "title" — every page needs a unique title tag.');
  } else {
    if (meta.title.length < 10) {
      issues.push(
        `Title is too short (${meta.title.length} chars). Aim for at least 10 characters.`,
      );
    }
    if (meta.title.length > 70) {
      issues.push(
        `Title is too long (${meta.title.length} chars). Keep it under 70 characters to avoid truncation in SERPs.`,
      );
    }
  }

  // --- description ---
  if (!meta.description) {
    issues.push('Missing "description" — a meta description improves click-through rate.');
  } else {
    if (meta.description.length < 50) {
      issues.push(
        `Description is too short (${meta.description.length} chars). Aim for at least 50 characters.`,
      );
    }
    if ((meta.description as string).length > 160) {
      issues.push(
        `Description is too long (${(meta.description as string).length} chars). Keep it under 160 characters.`,
      );
    }
  }

  // --- canonical ---
  if (!meta.canonical) {
    issues.push('Missing "canonical" URL — needed to prevent duplicate content issues.');
  } else if (typeof meta.canonical === 'string' && !meta.canonical.startsWith('https://')) {
    issues.push('Canonical URL should use HTTPS.');
  }

  // --- ogImage ---
  if (!meta.ogImage) {
    issues.push('Missing "ogImage" — social shares will lack a preview image.');
  } else if (typeof meta.ogImage === 'string') {
    const ext = meta.ogImage.split('.').pop()?.toLowerCase();
    if (!ext || !['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      issues.push(
        `ogImage "${meta.ogImage}" does not end with a recognised image extension (.png, .jpg, .webp).`,
      );
    }
  }

  // --- og consistency ---
  if (meta.ogTitle && meta.title && meta.ogTitle !== meta.title) {
    issues.push(
      'ogTitle differs from title — they should usually match for consistency.',
    );
  }

  if (
    meta.ogDescription &&
    meta.description &&
    meta.ogDescription !== meta.description
  ) {
    issues.push(
      'ogDescription differs from description — they should usually match.',
    );
  }

  return issues;
}
