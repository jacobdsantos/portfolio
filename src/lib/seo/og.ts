/**
 * Resolves the Open Graph image path for a given content type and slug.
 *
 * Generated OG images are expected to live under `/og/` in the public
 * directory following the pattern `{type}-{slug}.png`.
 *
 * Falls back to `/og/default.png` when no type-specific image exists.
 */

/**
 * Returns the path (relative to site root) for the Open Graph image
 * matching the given content type and slug.
 *
 * @param type  - Content type, e.g. `'research'`, `'tool'`, `'talk'`.
 * @param slug  - URL-safe slug of the content item.
 * @returns     - Path like `/og/research-ransomware-deep-dive.png`.
 *
 * @example
 * ```ts
 * resolveOgImage('research', 'warlock-ransomware');
 * // => '/og/research-warlock-ransomware.png'
 *
 * resolveOgImage('', '');
 * // => '/og/default.png'
 * ```
 */
export function resolveOgImage(type: string, slug: string): string {
  if (!type || !slug) {
    return '/og/default.png';
  }

  const sanitisedType = type.replace(/[^a-z0-9-]/gi, '').toLowerCase();
  const sanitisedSlug = slug.replace(/[^a-z0-9-]/gi, '').toLowerCase();

  if (!sanitisedType || !sanitisedSlug) {
    return '/og/default.png';
  }

  return `/og/${sanitisedType}-${sanitisedSlug}.png`;
}
