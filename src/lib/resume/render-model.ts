import type {
  ResumeMaster,
  ResumeRenderModel,
  ResumeSection,
  ResumeLink,
  TemplateId,
} from './types';

interface MatchResult {
  matchedKeywords: string[];
  missingKeywords: string[];
  atsScore: number;
  jdHash: string;
  bulletScores: Record<string, number>;
  extractedKeywords: Array<{ term: string; weight: number }>;
}

interface BuildOptions {
  bulletStyle: 'harvard' | 'natural';
  templateId?: TemplateId;
  maxPages: 1 | 2;
  includeSections: {
    summary: boolean;
    skills: boolean;
    experience: boolean;
    projects: boolean;
    education: boolean;
    certifications: boolean;
    publications: boolean;
  };
  targetRole?: string;
}

/**
 * Build a template-agnostic render model from master data and match results.
 *
 * This function transforms the raw ResumeMaster data and keyword match results
 * into a structured render model that any template can consume. It handles:
 * - Section filtering based on includeSections options
 * - Contact line formatting
 * - Date formatting
 * - Bullet matching annotation
 * - Bullet sorting by relevance score
 * - Page budget trimming
 */
export function buildRenderModel(
  master: ResumeMaster,
  matchResult: MatchResult,
  options: BuildOptions,
): ResumeRenderModel {
  const templateId = options.templateId ?? 'clean';
  const matchedTermsLower = new Set(
    matchResult.matchedKeywords.map((k) => k.toLowerCase()),
  );

  // Build header
  const contactLines: string[] = [];
  if (master.basics.email) {
    contactLines.push(master.basics.email);
  }
  if (master.basics.phone) {
    contactLines.push(master.basics.phone);
  }
  if (master.basics.location) {
    contactLines.push(master.basics.location);
  }

  const header = {
    name: master.basics.name,
    label: options.targetRole ?? master.basics.label,
    contactLines,
    links: master.basics.links,
  };

  // Build sections
  const sections: ResumeSection[] = [];

  // Summary
  if (options.includeSections.summary && master.summaries.length > 0) {
    // Pick the best summary based on keyword overlap
    const bestSummary = selectBestSummary(master, matchResult.extractedKeywords);
    sections.push({
      type: 'summary',
      title: 'Summary',
      blocks: [bestSummary],
    });
  }

  // Skills
  if (options.includeSections.skills && master.skills.length > 0) {
    sections.push({
      type: 'skills',
      title: 'Technical Skills',
      groups: master.skills.map((g) => ({
        group: g.group,
        items: [...g.items],
      })),
    });
  }

  // Experience
  if (options.includeSections.experience && master.experience.length > 0) {
    const experienceItems = master.experience.map((exp) => {
      const annotatedBullets = exp.bullets
        .map((bullet) => {
          const score = matchResult.bulletScores[bullet.id] ?? 0;
          const matchedTerms = findMatchedTermsInBullet(
            bullet.text,
            bullet.keywords,
            matchedTermsLower,
          );
          return {
            id: bullet.id,
            text: bullet.text,
            matched: matchedTerms.length > 0,
            matchedTerms,
            _score: score,
          };
        })
        .sort((a, b) => b._score - a._score)
        .map(({ _score: _, ...rest }) => rest);

      return {
        company: exp.company,
        role: exp.role,
        dates: formatDateRange(exp.startDate, exp.endDate),
        location: exp.location,
        bullets: annotatedBullets,
      };
    });

    sections.push({
      type: 'experience',
      title: 'Experience',
      items: experienceItems,
    });
  }

  // Projects
  if (options.includeSections.projects && master.projects.length > 0) {
    const projectItems = master.projects.map((proj) => {
      const annotatedBullets = proj.bullets
        .map((bullet) => {
          const score = matchResult.bulletScores[bullet.id] ?? 0;
          const matchedTerms = findMatchedTermsInBullet(
            bullet.text,
            bullet.keywords,
            matchedTermsLower,
          );
          return {
            id: bullet.id,
            text: bullet.text,
            matched: matchedTerms.length > 0,
            matchedTerms,
            _score: score,
          };
        })
        .sort((a, b) => b._score - a._score)
        .map(({ _score: _, ...rest }) => rest);

      return {
        name: proj.name,
        summary: proj.summary,
        links: proj.links,
        bullets: annotatedBullets,
      };
    });

    sections.push({
      type: 'projects',
      title: 'Tools & Projects',
      items: projectItems,
    });
  }

  // Education
  if (options.includeSections.education && master.education.length > 0) {
    sections.push({
      type: 'education',
      title: 'Education',
      items: master.education.map((e) => ({
        school: e.school,
        degree: e.degree,
        date: e.date,
      })),
    });
  }

  // Certifications
  if (options.includeSections.certifications && master.certifications.length > 0) {
    sections.push({
      type: 'certifications',
      title: 'Certifications',
      items: master.certifications.map((c) => ({
        name: c.name,
        issuer: c.issuer,
        date: c.date,
      })),
    });
  }

  // Publications
  if (options.includeSections.publications && master.publications.length > 0) {
    sections.push({
      type: 'publications',
      title: 'Selected Publications',
      items: master.publications.map((p) => ({
        title: p.title,
        publisher: p.publisher,
        date: p.date,
        url: p.url,
      })),
    });
  }

  // Apply page budget trimming for single-page resumes
  const trimmedSections =
    options.maxPages === 1 ? trimForOnePage(sections) : sections;

  return {
    meta: {
      templateId,
      bulletStyle: options.bulletStyle,
      jdHash: matchResult.jdHash,
      atsScore: matchResult.atsScore,
      matchedKeywords: matchResult.matchedKeywords,
      missingKeywords: matchResult.missingKeywords,
      generatedAt: Date.now(),
    },
    header,
    sections: trimmedSections,
  };
}

/**
 * Select the best summary based on keyword overlap with JD.
 */
function selectBestSummary(
  master: ResumeMaster,
  extractedKeywords: Array<{ term: string; weight: number }>,
): string {
  if (master.summaries.length === 1) {
    return master.summaries[0].text;
  }

  const jdTerms = new Set(extractedKeywords.map((k) => k.term.toLowerCase()));

  let bestIdx = 0;
  let bestScore = -1;

  for (let i = 0; i < master.summaries.length; i++) {
    const summary = master.summaries[i];
    let score = 0;
    for (const kw of summary.keywords) {
      if (jdTerms.has(kw.toLowerCase())) {
        score++;
      }
    }
    // Also check the text itself for keyword mentions
    const textLower = summary.text.toLowerCase();
    Array.from(jdTerms).forEach((term) => {
      if (textLower.includes(term)) {
        score += 0.5;
      }
    });
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return master.summaries[bestIdx].text;
}

/**
 * Find which matched JD keywords appear in a bullet's text or keyword tags.
 */
function findMatchedTermsInBullet(
  text: string,
  bulletKeywords: string[],
  matchedTermsLower: Set<string>,
): string[] {
  const found: string[] = [];
  const textLower = text.toLowerCase();
  const bulletKwLower = new Set(bulletKeywords.map((k) => k.toLowerCase()));

  Array.from(matchedTermsLower).forEach((term) => {
    if (textLower.includes(term) || bulletKwLower.has(term)) {
      found.push(term);
    }
  });

  return found;
}

/**
 * Format a date range string for display.
 * Handles "Present" as a special end date value.
 */
function formatDateRange(startDate: string, endDate: string): string {
  const end = endDate.toLowerCase() === 'present' ? 'Present' : endDate;
  return `${startDate} - ${end}`;
}

/**
 * Trim sections to fit within a single-page budget.
 * Heuristic: limit total bullets to ~18, keep top-scoring bullets,
 * limit projects to top 3, truncate publications to top 3.
 */
function trimForOnePage(sections: ResumeSection[]): ResumeSection[] {
  const maxBullets = 18;
  let bulletCount = 0;

  return sections.map((section) => {
    if (section.type === 'experience') {
      return {
        ...section,
        items: section.items.map((item) => {
          const remaining = Math.max(0, maxBullets - bulletCount);
          const trimmed = item.bullets.slice(0, Math.min(remaining, 6));
          bulletCount += trimmed.length;
          return { ...item, bullets: trimmed };
        }),
      };
    }
    if (section.type === 'projects') {
      return {
        ...section,
        items: section.items.slice(0, 3).map((item) => {
          const remaining = Math.max(0, maxBullets - bulletCount);
          const trimmed = item.bullets.slice(0, Math.min(remaining, 2));
          bulletCount += trimmed.length;
          return { ...item, bullets: trimmed };
        }),
      };
    }
    if (section.type === 'publications') {
      return {
        ...section,
        items: section.items.slice(0, 3),
      };
    }
    return section;
  });
}
