/**
 * Compute an ATS (Applicant Tracking System) compatibility score.
 *
 * The score is a percentage (0-100) representing how many of the JD's
 * important keywords were matched by the resume content.
 *
 * @param matchedKeywords - Keywords from the JD that were found in the resume
 * @param totalKeywords - All keywords extracted from the JD
 * @returns Score from 0 to 100
 */
export function computeAtsScore(
  matchedKeywords: string[],
  totalKeywords: string[],
): number {
  if (totalKeywords.length === 0) return 0;

  const matchCount = matchedKeywords.length;
  const totalCount = totalKeywords.length;

  const rawScore = (matchCount / totalCount) * 100;

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
