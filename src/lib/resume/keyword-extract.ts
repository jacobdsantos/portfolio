import { KEYWORD_WEIGHTS } from './constants';
import { tokenize, removeStopwords, extractBigrams, normalize } from './text';

/** Maximum number of keywords to return from extraction. */
const MAX_KEYWORDS = 50;

/**
 * Extract weighted keywords from a job description text.
 *
 * Algorithm:
 * 1. Tokenize the JD, remove stopwords, count unigram frequencies.
 * 2. Extract bigrams and count their frequencies.
 * 3. Apply domain-specific weight multipliers from KEYWORD_WEIGHTS.
 * 4. Score = frequency * weight_multiplier (default multiplier = 1.0).
 * 5. Deduplicate: if a bigram's component unigrams are both present and the
 *    bigram has a higher weight, suppress the unigrams.
 * 6. Return top MAX_KEYWORDS terms sorted by weight descending.
 */
export function extractKeywords(
  text: string,
): Array<{ term: string; weight: number }> {
  const normalizedText = normalize(text);
  const allTokens = tokenize(text);
  const filteredTokens = removeStopwords(allTokens);

  // Count unigram frequencies
  const unigramCounts = new Map<string, number>();
  for (const token of filteredTokens) {
    unigramCounts.set(token, (unigramCounts.get(token) ?? 0) + 1);
  }

  // Count bigram frequencies from filtered tokens
  const bigrams = extractBigrams(filteredTokens);
  const bigramCounts = new Map<string, number>();
  for (const bigram of bigrams) {
    bigramCounts.set(bigram, (bigramCounts.get(bigram) ?? 0) + 1);
  }

  // Also check for known multi-word KEYWORD_WEIGHTS terms in the normalized text
  const knownBigramTerms = Object.keys(KEYWORD_WEIGHTS).filter(
    (k) => k.includes(' ') || k.includes('&'),
  );
  for (const term of knownBigramTerms) {
    const termLower = term.toLowerCase();
    // Count occurrences of this known term in the normalized text
    let count = 0;
    let searchFrom = 0;
    while (true) {
      const idx = normalizedText.indexOf(termLower, searchFrom);
      if (idx === -1) break;
      count++;
      searchFrom = idx + 1;
    }
    if (count > 0 && !bigramCounts.has(termLower)) {
      bigramCounts.set(termLower, count);
    }
  }

  // Score all terms
  const scored = new Map<string, number>();

  // Score bigrams first
  const bigramComponents = new Set<string>();
  bigramCounts.forEach((count, bigram) => {
    const weight = lookupWeight(bigram);
    const score = count * weight;
    if (score > 0) {
      scored.set(bigram, score);
      // Track component words of scored bigrams with boosted weights
      const parts = bigram.split(/\s+/);
      if (weight > 1.0) {
        for (const part of parts) {
          bigramComponents.add(part);
        }
      }
    }
  });

  // Score unigrams, suppressing those already covered by higher-weight bigrams
  unigramCounts.forEach((count, token) => {
    // Skip single-character tokens
    if (token.length <= 1) return;

    const weight = lookupWeight(token);
    const score = count * weight;

    if (score > 0) {
      // Suppress unigram if it's a component of a bigram with a higher weight
      if (bigramComponents.has(token)) {
        // Only include if the unigram itself has a notable weight
        if (weight >= 1.5) {
          scored.set(token, score);
        }
      } else {
        scored.set(token, score);
      }
    }
  });

  // Sort by weight descending, then alphabetically for stability
  const entries = Array.from(scored.entries())
    .map(([term, weight]) => ({ term, weight: Math.round(weight * 100) / 100 }))
    .sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;
      return a.term.localeCompare(b.term);
    });

  return entries.slice(0, MAX_KEYWORDS);
}

/**
 * Look up the weight multiplier for a term.
 * Checks exact match first, then tries common variations.
 * Returns 1.0 as the default if no match is found.
 */
function lookupWeight(term: string): number {
  const lower = term.toLowerCase();

  // Direct match
  if (KEYWORD_WEIGHTS[lower] !== undefined) {
    return KEYWORD_WEIGHTS[lower];
  }

  // Try with hyphens replaced by spaces
  const spaced = lower.replace(/-/g, ' ');
  if (spaced !== lower && KEYWORD_WEIGHTS[spaced] !== undefined) {
    return KEYWORD_WEIGHTS[spaced];
  }

  // Try with spaces replaced by hyphens
  const hyphenated = lower.replace(/\s+/g, '-');
  if (hyphenated !== lower && KEYWORD_WEIGHTS[hyphenated] !== undefined) {
    return KEYWORD_WEIGHTS[hyphenated];
  }

  // Default weight for terms not in the domain dictionary
  return 1.0;
}
