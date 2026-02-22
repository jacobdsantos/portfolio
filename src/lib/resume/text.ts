import { STOPWORDS } from './constants';

/**
 * Split text into lowercase word tokens, stripping punctuation.
 * Preserves hyphenated words and ampersand-joined terms (e.g., "att&ck").
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[''""]/g, '') // remove smart quotes
    .replace(/[^\w\s&\-/]/g, ' ') // keep alphanumeric, ampersand, hyphen, slash
    .split(/\s+/)
    .map((t) => t.replace(/^[\-/]+|[\-/]+$/g, '')) // trim leading/trailing hyphens/slashes
    .filter((t) => t.length > 0);
}

/**
 * Normalize text: lowercase, trim, collapse consecutive whitespace.
 */
export function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Filter out stopwords from a token array.
 */
export function removeStopwords(tokens: string[]): string[] {
  return tokens.filter((t) => !STOPWORDS.has(t));
}

/**
 * Extract adjacent word pair bigrams from a token array.
 * Returns bigrams joined with a space, e.g., ["threat intelligence", "malware analysis"].
 */
export function extractBigrams(tokens: string[]): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return bigrams;
}

/**
 * Simple deterministic hash for JD text.
 * Produces a hex string derived from character codes and position mixing.
 * Not cryptographic -- suitable for cache keys and deduplication.
 */
export function simpleHash(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return combined.toString(16).padStart(13, '0');
}
