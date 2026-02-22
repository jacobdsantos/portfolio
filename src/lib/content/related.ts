/**
 * Finds related content items based on shared tag overlap.
 */

export interface RelatedItem {
  tags: string[];
  slug: string;
  [key: string]: unknown;
}

/**
 * Returns items from `items` sorted by the number of tags they share
 * with `currentTags`, in descending order. Items whose slug matches the
 * current item (if one is present in the list) are excluded automatically.
 *
 * When two items share the same number of tags they retain their original
 * order (stable sort).
 *
 * @param currentTags - Tags of the item you want to find related content for.
 * @param items       - The full pool of content items to search through.
 * @param max         - Maximum number of related items to return. Defaults to `4`.
 * @param currentSlug - Optional slug of the current item. Items matching this
 *                      slug are excluded from the results. When omitted, no
 *                      automatic self-exclusion happens.
 * @returns Up to `max` items with at least one shared tag, sorted by relevance.
 *
 * @example
 * ```ts
 * const related = findRelated(
 *   ['ransomware', 'APT'],
 *   allArticles,
 *   3,
 *   'warlock-ransomware',
 * );
 * ```
 */
export function findRelated<T extends RelatedItem>(
  currentTags: string[],
  items: T[],
  max: number = 4,
  currentSlug?: string,
): T[] {
  if (currentTags.length === 0 || items.length === 0) {
    return [];
  }

  const tagSet = new Set(currentTags.map((t) => t.toLowerCase()));

  const scored = items
    .filter((item) => currentSlug === undefined || item.slug !== currentSlug)
    .map((item) => {
      const sharedCount = item.tags.reduce(
        (acc, t) => acc + (tagSet.has(t.toLowerCase()) ? 1 : 0),
        0,
      );
      return { item, sharedCount };
    })
    .filter(({ sharedCount }) => sharedCount > 0);

  scored.sort((a, b) => b.sharedCount - a.sharedCount);

  return scored.slice(0, max).map(({ item }) => item);
}
