import type { MatchInput, MatchOutput } from './types';
import { extractKeywords } from './keyword-extract';
import { computeAtsScore, findMissingKeywords } from './ats';
import { buildRenderModel } from './render-model';
import { simpleHash, normalize } from './text';

/**
 * Build a matched, ATS-optimized resume from master data and a job description.
 *
 * This is the main pure entry point. It does not call fetch, access localStorage,
 * or use any DOM APIs. Given the same input, it produces the same output
 * (deterministic aside from `meta.generatedAt` timestamp).
 *
 * Pipeline:
 * 1. Extract weighted keywords from JD text
 * 2. Score each bullet in master data against JD keywords
 * 3. Compute ATS score (matched vs total keywords)
 * 4. Build the template-agnostic render model
 */
export function buildMatchedResume(input: MatchInput): MatchOutput {
  const { master, jobDescriptionText, options } = input;

  // Step 1: Extract JD keywords
  const extractedKeywords = extractKeywords(jobDescriptionText);
  const jdTerms = extractedKeywords.map((k) => k.term);
  const jdTermsLower = new Set(jdTerms.map((t) => t.toLowerCase()));

  // Step 2: Score each bullet against JD keywords
  const bulletScores: Record<string, number> = {};

  // Collect all resume keywords for ATS matching
  const allResumeKeywords = new Set<string>();

  // Score experience bullets
  for (const exp of master.experience) {
    for (const bullet of exp.bullets) {
      const score = scoreBullet(bullet.text, bullet.keywords, jdTermsLower);
      bulletScores[bullet.id] = score;
      collectMatchedTerms(bullet.text, bullet.keywords, jdTermsLower, allResumeKeywords);
    }
  }

  // Score project bullets
  for (const proj of master.projects) {
    for (const bullet of proj.bullets) {
      const score = scoreBullet(bullet.text, bullet.keywords, jdTermsLower);
      bulletScores[bullet.id] = score;
      collectMatchedTerms(bullet.text, bullet.keywords, jdTermsLower, allResumeKeywords);
    }
  }

  // Also collect keywords from skills, summaries, and publications
  for (const skillGroup of master.skills) {
    for (const item of skillGroup.items) {
      const itemLower = item.toLowerCase();
      if (jdTermsLower.has(itemLower)) {
        allResumeKeywords.add(itemLower);
      }
      // Check if skill item text appears as a substring match
      Array.from(jdTermsLower).forEach((jdTerm) => {
        if (itemLower.includes(jdTerm) || jdTerm.includes(itemLower)) {
          allResumeKeywords.add(jdTerm);
        }
      });
    }
  }

  for (const summary of master.summaries) {
    collectMatchedTerms(summary.text, summary.keywords, jdTermsLower, allResumeKeywords);
  }

  // Step 3: Compute ATS score
  const matchedKeywords = Array.from(allResumeKeywords);
  const missingKeywords = findMissingKeywords(jdTerms, matchedKeywords);
  const atsScore = computeAtsScore(matchedKeywords, jdTerms);

  // Step 4: Build render model
  const jdHash = simpleHash(normalize(jobDescriptionText));

  const renderModel = buildRenderModel(
    master,
    {
      matchedKeywords,
      missingKeywords,
      atsScore,
      jdHash,
      bulletScores,
      extractedKeywords,
    },
    {
      bulletStyle: options.bulletStyle,
      maxPages: options.maxPages,
      includeSections: options.includeSections,
      targetRole: options.targetRole,
    },
  );

  return {
    renderModel,
    debug: {
      extractedKeywords,
      bulletScores,
    },
  };
}

/**
 * Score a bullet by counting how many JD keywords appear in its text and keyword tags.
 * Each match contributes 1 point. Partial substring matches contribute 0.5.
 */
function scoreBullet(
  text: string,
  keywords: string[],
  jdTermsLower: Set<string>,
): number {
  let score = 0;
  const textLower = text.toLowerCase();
  const kwSet = new Set(keywords.map((k) => k.toLowerCase()));

  const jdTermsArr = Array.from(jdTermsLower);
  const kwArr = Array.from(kwSet);

  for (const term of jdTermsArr) {
    // Exact match in keywords array
    if (kwSet.has(term)) {
      score += 1;
      continue;
    }

    // Check if term appears in bullet text
    if (textLower.includes(term)) {
      score += 1;
      continue;
    }

    // Check partial matches (JD term contains a keyword or vice versa)
    for (const kw of kwArr) {
      if (kw.includes(term) || term.includes(kw)) {
        score += 0.5;
        break;
      }
    }
  }

  return score;
}

/**
 * Collect matched JD terms found in a piece of text and its keyword tags
 * into the provided set.
 */
function collectMatchedTerms(
  text: string,
  keywords: string[],
  jdTermsLower: Set<string>,
  matchedSet: Set<string>,
): void {
  const textLower = text.toLowerCase();
  const kwLower = new Set(keywords.map((k) => k.toLowerCase()));

  Array.from(jdTermsLower).forEach((term) => {
    if (kwLower.has(term) || textLower.includes(term)) {
      matchedSet.add(term);
    }
  });
}
