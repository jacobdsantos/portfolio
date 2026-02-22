/**
 * Compute an ATS (Applicant Tracking System) compatibility score.
 *
 * Uses a weighted scoring system: keywords with higher domain relevance
 * (from KEYWORD_WEIGHTS) contribute more to the score than generic terms.
 * This prevents low scores caused by missing generic JD filler words
 * while properly rewarding matching on real technical/domain terms.
 *
 * @param matchedKeywords - Keywords from the JD that were found in the resume
 * @param totalKeywords - All keywords extracted from the JD
 * @param keywordWeights - Optional weight map; if provided, uses weighted scoring
 * @returns Score from 0 to 100
 */
export function computeAtsScore(
  matchedKeywords: string[],
  totalKeywords: string[],
  keywordWeights?: Array<{ term: string; weight: number }>,
): number {
  if (totalKeywords.length === 0) return 0;

  // If we have weight information, use weighted scoring
  if (keywordWeights && keywordWeights.length > 0) {
    const weightMap = new Map(keywordWeights.map((k) => [k.term.toLowerCase(), k.weight]));
    const matchedSet = new Set(matchedKeywords.map((k) => k.toLowerCase()));

    let matchedWeight = 0;
    let totalWeight = 0;

    for (const kw of totalKeywords) {
      const kwLower = kw.toLowerCase();
      const weight = weightMap.get(kwLower) ?? 1.0;
      totalWeight += weight;
      if (matchedSet.has(kwLower)) {
        matchedWeight += weight;
      }
    }

    if (totalWeight === 0) return 0;
    const rawScore = (matchedWeight / totalWeight) * 100;
    return Math.round(Math.min(100, Math.max(0, rawScore)));
  }

  // Fallback: simple percentage
  const rawScore = (matchedKeywords.length / totalKeywords.length) * 100;
  return Math.round(Math.min(100, Math.max(0, rawScore)));
}

/**
 * Classify an ATS score into a human-readable grade.
 *
 * @param score - ATS score from 0-100
 * @returns Grade string
 */
export function getAtsGrade(
  score: number,
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

/**
 * Find keywords from the JD that are missing from the resume.
 *
 * Comparison is case-insensitive. Returns the missing keywords in their
 * original JD casing.
 *
 * @param jdKeywords - All keywords extracted from the job description
 * @param resumeKeywords - Keywords found in the resume content
 * @returns Keywords present in the JD but absent from the resume
 */
export function findMissingKeywords(
  jdKeywords: string[],
  resumeKeywords: string[],
): string[] {
  const resumeSet = new Set(resumeKeywords.map((k) => k.toLowerCase()));
  return jdKeywords.filter((k) => !resumeSet.has(k.toLowerCase()));
}
