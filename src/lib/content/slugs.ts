/**
 * Slug generation and uniqueness checking for content items.
 */

/**
 * Converts an arbitrary text string into a URL-safe kebab-case slug.
 *
 * Transformation steps:
 *   1. Trim whitespace.
 *   2. Normalise Unicode to NFD and strip combining diacritical marks.
 *   3. Lower-case the entire string.
 *   4. Replace non-alphanumeric characters (except hyphens) with hyphens.
 *   5. Collapse consecutive hyphens.
 *   6. Strip leading / trailing hyphens.
 *
 * @example
 * ```ts
 * slugify('Warlock Ransomware: A Deep Dive');
 * // => 'warlock-ransomware-a-deep-dive'
 *
 * slugify('  --hello   WORLD-- ');
 * // => 'hello-world'
 *
 * slugify('Cafe Resume');
 * // => 'cafe-resume'
 * ```
 */
export function slugify(text: string): string {
  return text
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Checks whether `slug` does not already appear in the `existing` array.
 *
 * @param slug     - The slug to test.
 * @param existing - Array of slugs that are already in use.
 * @returns `true` if the slug is unique (not found in `existing`).
 */
export function isUniqueSlug(slug: string, existing: string[]): boolean {
  return !existing.includes(slug);
}
