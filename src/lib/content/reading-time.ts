/**
 * Estimates reading time for a block of text.
 */

/** Average adult reading speed in words per minute. */
const WORDS_PER_MINUTE = 200;

/**
 * Calculates the estimated reading time for the given content string.
 *
 * The function:
 *   1. Strips HTML tags (in case raw MDX/HTML is passed).
 *   2. Collapses whitespace and splits on word boundaries.
 *   3. Divides word count by 200 WPM and rounds up.
 *   4. Returns a minimum of 1 minute.
 *
 * @param content - Plain text or HTML/MDX string.
 * @returns Estimated reading time in whole minutes (minimum 1).
 *
 * @example
 * ```ts
 * calculateReadingTime('Hello '.repeat(400));
 * // => 2
 *
 * calculateReadingTime('Short');
 * // => 1
 * ```
 */
export function calculateReadingTime(content: string): number {
  // Strip HTML tags
  const text = content.replace(/<[^>]*>/g, '');

  // Split on whitespace and filter out empty tokens
  const words = text.split(/\s+/).filter((w) => w.length > 0);

  const minutes = Math.ceil(words.length / WORDS_PER_MINUTE);

  return Math.max(1, minutes);
}
