import type { ResumeMaster, ResumeRenderModel, ResumeSection } from './types';
import { extractKeywords } from './keyword-extract';
import { computeAtsScore, findMissingKeywords } from './ats';
import { simpleHash, normalize } from './text';

/**
 * Harvard-style action verbs organized by category.
 * These strong verbs help bullets pass ATS systems and
 * convey impact to hiring managers.
 */
const ACTION_VERBS = {
  leadership: ['Spearheaded', 'Orchestrated', 'Directed', 'Championed', 'Pioneered', 'Led'],
  creation: ['Architected', 'Engineered', 'Designed', 'Developed', 'Built', 'Created', 'Launched'],
  analysis: ['Investigated', 'Analyzed', 'Dissected', 'Evaluated', 'Assessed', 'Identified', 'Uncovered'],
  improvement: ['Optimized', 'Streamlined', 'Accelerated', 'Enhanced', 'Modernized', 'Transformed'],
  delivery: ['Delivered', 'Deployed', 'Shipped', 'Published', 'Produced', 'Presented', 'Authored'],
  collaboration: ['Collaborated', 'Partnered', 'Mentored', 'Trained', 'Coordinated', 'Facilitated'],
};

/**
 * Map of bullet IDs to Harvard-style rewrites.
 * Each entry has multiple variants keyed by focus area,
 * so the generator can pick the best match for the JD.
 */
const BULLET_VARIANTS: Record<string, Record<string, string>> = {
  'exp1-b1': {
    research: 'Spearheaded publication of 17 peer-cited threat research articles dissecting novel ransomware TTPs, EDR evasion techniques, and cross-platform attack chains — intelligence leveraged by 50+ global SOC teams to fortify detection capabilities',
    writing: 'Authored 17 in-depth research articles on the company blog analyzing ransomware families, APT campaigns, and defense evasion techniques, establishing thought leadership across global security operations communities',
    threat_intel: 'Published 17 original threat intelligence articles covering novel ransomware families, APT tradecraft, and EDR evasion methods — research directly integrated into detection signatures and hunting playbooks used by global security teams',
    default: 'Published 17 research articles on the company research blog covering novel ransomware families, APT campaigns, cross-platform threats, and EDR evasion techniques reaching global security operations teams',
  },
  'exp1-b2': {
    communication: 'Authored 14 viral X/Twitter microstory threads translating complex threat intelligence into actionable, widely-shared analyst content that expanded the team\'s public research footprint',
    research: 'Produced 14 X/Twitter research threads delivering real-time threat intelligence on emerging ransomware campaigns, BYOVD techniques, and cross-platform attack patterns to the global cybersecurity community',
    default: 'Authored 14 X/Twitter microstory threads translating complex threat intelligence into actionable, widely-shared analyst content',
  },
  'exp1-b3': {
    engineering: 'Architected and deployed 10+ production-grade security automation platforms — including AI-driven threat triage pipelines, Model Context Protocol servers, and a multi-model orchestration desktop application — collectively eliminating 200+ analyst-hours monthly',
    ai: 'Engineered 10+ AI-powered security tools including LLM-driven threat inquiry pipelines, multi-model routing engines (70+ models, 5 providers), and MCP servers for threat intelligence platforms — automating workflows that previously consumed 200+ analyst-hours monthly',
    automation: 'Designed, built, and deployed 10+ production tools including AI-powered threat inquiry pipelines, MCP servers, Streamlit-based analysis platforms, and a desktop GUI application, collectively saving hundreds of analyst-hours monthly',
    default: 'Designed, built, and deployed 10+ production tools including AI-powered threat inquiry pipelines, MCP servers, Streamlit-based analysis platforms, and a desktop GUI application, collectively saving hundreds of analyst-hours monthly',
  },
  'exp1-b4': {
    training: 'Delivered INTERPOL cybercrime training programs (Operation Synergia, Advanced Threat Defense) equipping 100+ international law enforcement officers across APAC, Africa, EU, and MENA regions with ransomware forensics and cross-border investigation methodologies',
    leadership: 'Orchestrated advanced cybercrime training curricula for INTERPOL operations spanning APAC, Africa, EU, and MENA — equipping 100+ international law enforcement officers with ransomware forensics and cross-border investigation methodologies',
    default: 'Delivered INTERPOL cybercrime training programs including Operation Synergia and Advanced Threat Defense to international law enforcement officers across APAC, Africa, EU, and MENA regions',
  },
  'exp1-b5': {
    training: 'Led Advanced Threat Defense training curriculum internationally in Japan, Oman, and the Philippines for government agencies (DICT, USAID BEACON/CPIT) and financial sector enterprises, building regional cyber defense capacity',
    leadership: 'Directed international cybersecurity training delivery across 3 countries for government agencies (DICT, USAID BEACON/CPIT) and financial sector enterprises, establishing the team as the go-to resource for advanced threat defense education',
    default: 'Led Advanced Threat Defense training curriculum internationally in Japan, Oman, and the Philippines for government agencies (DICT, USAID BEACON/CPIT) and financial sector enterprises',
  },
  'exp1-b6': {
    communication: 'Keynoted at Philippine Airlines for Cybersecurity Awareness Month and presented original research at DECODE flagship cybersecurity conference, DOST ICT Summit, and CIRQIT enterprise security events, reaching 500+ industry professionals',
    leadership: 'Delivered keynote presentations at marquee industry events including DECODE, DOST ICT Summit, and CIRQIT, plus Philippine Airlines Cybersecurity Awareness Month — establishing public visibility for the team\'s threat research capabilities',
    default: 'Keynoted at Philippine Airlines for Cybersecurity Awareness Month and presented at DECODE flagship cybersecurity conference, DOST ICT Summit, and CIRQIT enterprise security events',
  },
  'exp1-b7': {
    research: 'Tracked and documented evolving ransomware tradecraft including BYOVD driver exploitation, GPO-distributed payloads, Safe Mode abuse for defense evasion, and cross-platform targeting of ESXi and Linux infrastructure',
    threat_intel: 'Investigated emerging ransomware TTPs including BYOVD attacks, GPO abuse for lateral movement, Safe Mode exploitation, and Linux/ESXi targeting — producing detection guidance adopted by enterprise SOC teams',
    default: 'Tracked and documented evolving ransomware tradecraft including BYOVD, GPO abuse, safe mode exploitation, and cross-platform targeting of ESXi and Linux infrastructure',
  },
  'exp2-b1': {
    threat_intel: 'Investigated and triaged high-priority threat inquiries across the full hunting pipeline — from IOC enrichment and OSINT analysis to SPOT report generation and customer-facing security advisories',
    analysis: 'Analyzed and triaged threat inquiries end-to-end across the hunting pipeline, performing IOC enrichment, OSINT collection, and SPOT report generation to deliver actionable customer-facing security advisories',
    default: 'Investigated and triaged threat inquiries across the full threat hunting pipeline from IOC enrichment and OSINT analysis to SPOT report generation and customer-facing advisories',
  },
  'exp2-b2': {
    threat_intel: 'Tracked emerging ransomware families and APT campaigns, contributing threat intelligence to internal and external-facing security advisories that informed enterprise defense strategies',
    research: 'Monitored and analyzed emerging ransomware families and APT campaigns, producing threat intelligence that informed both internal hunting operations and customer-facing security advisories',
    default: 'Tracked emerging ransomware families and APT campaigns, contributing threat intelligence to internal and external-facing security advisories',
  },
  'exp2-b3': {
    analysis: 'Enriched indicators of compromise using VirusTotal, WRS, and internal threat intelligence platforms, enabling accurate threat classification and response prioritization for critical security incidents',
    automation: 'Leveraged VirusTotal, WRS, and internal platforms for systematic IOC enrichment, improving threat classification accuracy and reducing response triage time for the hunting team',
    default: 'Enriched indicators of compromise using VirusTotal, WRS, and internal threat intelligence platforms for accurate threat classification and response prioritization',
  },
};

/**
 * Summary templates that can be dynamically composed based on JD focus.
 */
const SUMMARY_TEMPLATES: Record<string, string> = {
  threat_research: 'Senior threat researcher with deep expertise in {focus_areas}. Published 17 research articles reaching global security teams. Designed and shipped 10+ production-grade security automation tools. Delivered advanced threat defense training internationally for INTERPOL and government agencies across 4 countries. Combines deep technical research with a builder mentality — creating tools and intelligence that elevate collective defense.',
  tool_builder: 'Security engineer and researcher who builds AI-powered tools that multiply team capability. Designed and deployed 10+ production tools including {tool_examples}, collectively saving hundreds of analyst-hours monthly. Published 17 research articles on ransomware, APT campaigns, and EDR evasion. Delivered training for INTERPOL and government agencies across 4 countries.',
  security_engineer: 'Security-focused software engineer with expertise in {tech_skills}. Built 10+ production-grade security tools including AI inquiry pipelines, MCP protocol servers, and multi-model orchestration platforms. Published 17 threat research articles on ransomware and APT campaigns. Experienced in delivering international cybersecurity training for INTERPOL and government organizations.',
  analyst: 'Threat intelligence analyst and researcher specializing in {focus_areas}. Published 17 research articles on ransomware TTPs, APT campaigns, and defense evasion techniques. Experienced in full-lifecycle threat hunting from IOC enrichment through OSINT analysis to report generation. Delivered advanced threat defense training for INTERPOL and international government agencies.',
};

/** Focus area detection patterns */
const FOCUS_PATTERNS: Record<string, string[]> = {
  research: ['research', 'threat research', 'threat intelligence', 'malware analysis', 'ransomware', 'apt', 'publish', 'analysis'],
  engineering: ['python', 'node.js', 'typescript', 'api', 'automation', 'tool', 'develop', 'build', 'engineer', 'software', 'programming'],
  ai: ['ai', 'llm', 'machine learning', 'prompt engineering', 'artificial intelligence', 'nlp', 'model', 'rag'],
  training: ['training', 'mentor', 'teach', 'instructor', 'education', 'curriculum', 'workshop'],
  communication: ['presentation', 'writing', 'communication', 'technical writing', 'report', 'publish', 'blog'],
  threat_intel: ['threat intelligence', 'threat hunting', 'ioc', 'indicator', 'osint', 'soc', 'incident response', 'triage'],
  analysis: ['analyze', 'investigate', 'forensic', 'reverse engineer', 'malware analysis', 'incident', 'triage'],
  leadership: ['lead', 'senior', 'manage', 'direct', 'head', 'principal', 'staff', 'architect'],
};

export interface GenerateInput {
  master: ResumeMaster;
  jobDescriptionText: string;
  options: {
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
  };
}

export interface GenerateOutput {
  renderModel: ResumeRenderModel;
  analysis: {
    detectedFocusAreas: string[];
    extractedKeywords: Array<{ term: string; weight: number }>;
    atsScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    bulletSelections: Record<string, string>;
  };
  /** AI assessment of JD fit — only present for AI-generated resumes */
  aiAssessment?: {
    jdAnalysis: string;
    tailoringApproach: string;
    strengths: string[];
    gaps: string[];
    overallFit: 'strong' | 'good' | 'moderate' | 'stretch';
  };
}

/**
 * Generate a tailored resume from master data and a job description.
 *
 * Unlike the old "match & score" approach, this function:
 * 1. Analyzes the JD to detect focus areas and priority skills
 * 2. Generates a custom professional summary
 * 3. Selects the best bullet variant for each experience item
 * 4. Reorders skills to front-load JD matches
 * 5. Cherry-picks and ranks projects by relevance
 * 6. Selects relevant publications
 *
 * Everything runs client-side — no API calls.
 */
export function generateTailoredResume(input: GenerateInput): GenerateOutput {
  const { master, jobDescriptionText, options } = input;

  // Step 1: Extract JD keywords and detect focus areas
  const extractedKeywords = extractKeywords(jobDescriptionText);
  const jdTermsLower = new Set(extractedKeywords.map((k) => k.term.toLowerCase()));
  const jdTextLower = jobDescriptionText.toLowerCase();

  const focusAreas = detectFocusAreas(jdTextLower, jdTermsLower);
  const primaryFocus = focusAreas[0] || 'research';

  // Step 2: Generate tailored summary
  const tailoredSummary = generateSummary(master, focusAreas, jdTermsLower, jdTextLower);

  // Step 3: Select best bullet variants and build experience
  const bulletSelections: Record<string, string> = {};
  const experienceItems = master.experience.map((exp) => {
    const bullets = exp.bullets.map((bullet) => {
      const variant = selectBestVariant(bullet.id, focusAreas, jdTermsLower);
      bulletSelections[bullet.id] = variant.focus;
      return {
        id: bullet.id,
        text: variant.text,
        matched: variant.matchCount > 0,
        matchedTerms: variant.matchedTerms,
        _score: variant.matchCount,
      };
    });

    // Sort bullets: highest match score first
    bullets.sort((a, b) => b._score - a._score);

    return {
      company: exp.company,
      role: exp.role,
      dates: `${exp.startDate} - ${exp.endDate === 'Present' ? 'Present' : exp.endDate}`,
      location: exp.location,
      bullets: bullets.map(({ _score: _, ...rest }) => rest),
    };
  });

  // Step 4: Reorder skills to front-load JD matches
  const reorderedSkills = reorderSkills(master.skills, jdTermsLower);

  // Step 5: Rank and select projects by JD relevance
  const rankedProjects = rankProjects(master.projects, jdTermsLower, focusAreas);

  // Step 6: Select relevant publications
  const rankedPublications = rankPublications(master.publications, jdTermsLower);

  // Collect all resume keywords for ATS scoring
  const allResumeKeywords = new Set<string>();

  // From summary
  Array.from(jdTermsLower).forEach((term) => {
    if (tailoredSummary.toLowerCase().includes(term)) {
      allResumeKeywords.add(term);
    }
  });

  // From experience bullets
  for (const exp of experienceItems) {
    for (const bullet of exp.bullets) {
      const textLower = bullet.text.toLowerCase();
      Array.from(jdTermsLower).forEach((term) => {
        if (textLower.includes(term)) allResumeKeywords.add(term);
      });
    }
  }

  // From skills
  for (const group of reorderedSkills) {
    for (const item of group.items) {
      const itemLower = item.toLowerCase();
      Array.from(jdTermsLower).forEach((term) => {
        if (itemLower.includes(term) || term.includes(itemLower)) {
          allResumeKeywords.add(term);
        }
      });
    }
  }

  // From projects
  for (const proj of rankedProjects) {
    const combined = `${proj.summary} ${proj.bullets.map((b: { text: string }) => b.text).join(' ')}`.toLowerCase();
    Array.from(jdTermsLower).forEach((term) => {
      if (combined.includes(term)) allResumeKeywords.add(term);
    });
  }

  const matchedKeywords = Array.from(allResumeKeywords);
  const jdTerms = extractedKeywords.map((k) => k.term);
  const missingKeywords = findMissingKeywords(jdTerms, matchedKeywords);
  const atsScore = computeAtsScore(matchedKeywords, jdTerms, extractedKeywords);

  // Build render model
  const sections: ResumeSection[] = [];

  if (options.includeSections.summary) {
    sections.push({
      type: 'summary',
      title: 'Professional Summary',
      blocks: [tailoredSummary],
    });
  }

  if (options.includeSections.skills && reorderedSkills.length > 0) {
    sections.push({
      type: 'skills',
      title: 'Technical Skills',
      groups: reorderedSkills,
    });
  }

  if (options.includeSections.experience && experienceItems.length > 0) {
    sections.push({
      type: 'experience',
      title: 'Experience',
      items: experienceItems,
    });
  }

  if (options.includeSections.projects && rankedProjects.length > 0) {
    sections.push({
      type: 'projects',
      title: 'Tools & Projects',
      items: rankedProjects,
    });
  }

  if (options.includeSections.education && master.education.length > 0) {
    sections.push({
      type: 'education',
      title: 'Education',
      items: master.education.map((e) => ({ school: e.school, degree: e.degree, date: e.date })),
    });
  }

  if (options.includeSections.certifications && master.certifications.length > 0) {
    sections.push({
      type: 'certifications',
      title: 'Certifications',
      items: master.certifications.map((c) => ({ name: c.name, issuer: c.issuer, date: c.date })),
    });
  }

  if (options.includeSections.publications && rankedPublications.length > 0) {
    sections.push({
      type: 'publications',
      title: 'Selected Publications',
      items: rankedPublications,
    });
  }

  // Apply page trimming
  const trimmedSections = options.maxPages === 1 ? trimForOnePage(sections) : sections;

  const renderModel: ResumeRenderModel = {
    meta: {
      templateId: 'clean',
      bulletStyle: 'harvard',
      jdHash: simpleHash(normalize(jobDescriptionText)),
      atsScore,
      matchedKeywords,
      missingKeywords,
      generatedAt: Date.now(),
    },
    header: {
      name: master.basics.name,
      label: options.targetRole || inferTargetRole(jdTextLower) || master.basics.label,
      contactLines: [
        master.basics.email,
        ...(master.basics.phone ? [master.basics.phone] : []),
        master.basics.location,
      ],
      links: master.basics.links,
    },
    sections: trimmedSections,
  };

  return {
    renderModel,
    analysis: {
      detectedFocusAreas: focusAreas,
      extractedKeywords,
      atsScore,
      matchedKeywords,
      missingKeywords,
      bulletSelections,
    },
  };
}

/**
 * Detect the primary focus areas of the JD based on keyword patterns.
 * Returns sorted by relevance (highest first).
 */
function detectFocusAreas(jdTextLower: string, jdTermsLower: Set<string>): string[] {
  const scores: Record<string, number> = {};

  for (const [focus, patterns] of Object.entries(FOCUS_PATTERNS)) {
    let score = 0;
    for (const pattern of patterns) {
      if (jdTermsLower.has(pattern)) score += 2;
      else if (jdTextLower.includes(pattern)) score += 1;
    }
    if (score > 0) scores[focus] = score;
  }

  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([focus]) => focus);
}

/**
 * Generate a tailored professional summary by selecting the best template
 * and filling in JD-specific details.
 */
function generateSummary(
  master: ResumeMaster,
  focusAreas: string[],
  jdTermsLower: Set<string>,
  jdTextLower: string,
): string {
  // Pick template based on primary focus
  const primary = focusAreas[0] || 'research';
  let templateKey = 'threat_research';

  if (['engineering', 'ai'].includes(primary)) {
    templateKey = 'tool_builder';
  } else if (primary === 'analysis' || primary === 'threat_intel') {
    templateKey = 'analyst';
  }

  // Check if JD emphasizes software/engineering more than research
  const engineeringSignals = ['software engineer', 'developer', 'full stack', 'backend', 'frontend', 'devops', 'sre', 'platform'];
  if (engineeringSignals.some((s) => jdTextLower.includes(s))) {
    templateKey = 'security_engineer';
  }

  let template = SUMMARY_TEMPLATES[templateKey] || SUMMARY_TEMPLATES.threat_research;

  // Fill in dynamic placeholders
  const focusTerms: string[] = [];
  const techTerms: string[] = [];
  const toolExamples: string[] = [];

  // Collect relevant focus terms from JD
  const focusKeywordMap: Record<string, string[]> = {
    'ransomware analysis': ['ransomware'],
    'APT campaign tracking': ['apt', 'advanced persistent threat', 'campaign'],
    'defense evasion techniques': ['defense evasion', 'edr', 'evasion'],
    'threat hunting': ['threat hunting'],
    'malware analysis': ['malware analysis', 'malware'],
    'threat intelligence': ['threat intelligence'],
    'incident response': ['incident response'],
    'MITRE ATT&CK mapping': ['mitre', 'mitre att&ck', 'att&ck'],
  };

  for (const [label, triggers] of Object.entries(focusKeywordMap)) {
    if (triggers.some((t) => jdTermsLower.has(t) || jdTextLower.includes(t))) {
      focusTerms.push(label);
    }
  }
  if (focusTerms.length === 0) focusTerms.push('ransomware analysis', 'threat hunting', 'defense evasion techniques');

  // Tech skills from JD
  const techMap = ['Python', 'Node.js', 'TypeScript', 'JavaScript', 'React', 'SQL', 'REST APIs'];
  for (const tech of techMap) {
    if (jdTermsLower.has(tech.toLowerCase()) || jdTextLower.includes(tech.toLowerCase())) {
      techTerms.push(tech);
    }
  }
  if (techTerms.length === 0) techTerms.push('Python', 'Node.js', 'TypeScript');

  // Tool examples
  const toolMap: Record<string, string> = {
    'ai': 'AI-driven threat triage pipelines',
    'mcp': 'Model Context Protocol servers',
    'llm': 'multi-model LLM orchestration engines',
    'automation': 'threat intelligence automation platforms',
    'streamlit': 'Streamlit-based analysis dashboards',
  };
  for (const [trigger, example] of Object.entries(toolMap)) {
    if (jdTermsLower.has(trigger) || jdTextLower.includes(trigger)) {
      toolExamples.push(example);
    }
  }
  if (toolExamples.length === 0) toolExamples.push('AI inquiry pipelines', 'MCP servers', 'threat intelligence platforms');

  template = template
    .replace('{focus_areas}', focusTerms.slice(0, 3).join(', '))
    .replace('{tech_skills}', techTerms.slice(0, 4).join(', '))
    .replace('{tool_examples}', toolExamples.slice(0, 3).join(', '));

  return template;
}

/**
 * Select the best bullet variant based on detected focus areas and JD keyword matches.
 */
function selectBestVariant(
  bulletId: string,
  focusAreas: string[],
  jdTermsLower: Set<string>,
): { text: string; focus: string; matchCount: number; matchedTerms: string[] } {
  const variants = BULLET_VARIANTS[bulletId];

  if (!variants) {
    // No variants available — return empty
    return { text: '', focus: 'default', matchCount: 0, matchedTerms: [] };
  }

  let bestText = variants.default || '';
  let bestFocus = 'default';
  let bestMatchCount = 0;
  let bestMatchedTerms: string[] = [];

  // Score each variant against JD keywords
  for (const [focus, text] of Object.entries(variants)) {
    if (focus === 'default') continue;

    const textLower = text.toLowerCase();
    const matchedTerms: string[] = [];

    Array.from(jdTermsLower).forEach((term) => {
      if (textLower.includes(term)) matchedTerms.push(term);
    });

    // Bonus for matching a detected focus area
    const focusBonus = focusAreas.includes(focus) ? 3 : 0;
    const score = matchedTerms.length + focusBonus;

    if (score > bestMatchCount) {
      bestMatchCount = score;
      bestText = text;
      bestFocus = focus;
      bestMatchedTerms = matchedTerms;
    }
  }

  // If no variant scored well, also score the default
  if (bestMatchCount === 0) {
    const defaultText = variants.default || '';
    const textLower = defaultText.toLowerCase();
    Array.from(jdTermsLower).forEach((term) => {
      if (textLower.includes(term)) bestMatchedTerms.push(term);
    });
    bestMatchCount = bestMatchedTerms.length;
  }

  return {
    text: bestText,
    focus: bestFocus,
    matchCount: bestMatchCount,
    matchedTerms: bestMatchedTerms,
  };
}

/**
 * Reorder skill groups and items within groups to front-load JD matches.
 */
function reorderSkills(
  skills: Array<{ group: string; items: string[] }>,
  jdTermsLower: Set<string>,
): Array<{ group: string; items: string[] }> {
  return skills
    .map((group) => {
      // Score each item
      const scored = group.items.map((item) => {
        const itemLower = item.toLowerCase();
        let score = 0;
        Array.from(jdTermsLower).forEach((term) => {
          if (itemLower === term) score += 2;
          else if (itemLower.includes(term) || term.includes(itemLower)) score += 1;
        });
        return { item, score };
      });

      // Sort: matched items first, then original order
      scored.sort((a, b) => b.score - a.score);

      const groupScore = scored.reduce((sum, s) => sum + s.score, 0);
      return {
        group: group.group,
        items: scored.map((s) => s.item),
        _groupScore: groupScore,
      };
    })
    .sort((a, b) => b._groupScore - a._groupScore)
    .map(({ _groupScore: _, ...rest }) => rest);
}

/**
 * Rank projects by relevance to the JD.
 */
function rankProjects(
  projects: ResumeMaster['projects'],
  jdTermsLower: Set<string>,
  focusAreas: string[],
): Array<{
  name: string;
  summary: string;
  links?: Array<{ label: string; url: string }>;
  bullets: Array<{ id: string; text: string; matched: boolean; matchedTerms: string[] }>;
}> {
  const scored = projects.map((proj) => {
    let score = 0;
    const combinedText = `${proj.name} ${proj.summary} ${proj.tags.join(' ')} ${proj.bullets.map((b) => b.text).join(' ')}`.toLowerCase();

    Array.from(jdTermsLower).forEach((term) => {
      if (combinedText.includes(term)) score += 1;
    });

    // Bonus for tag matches
    for (const tag of proj.tags) {
      if (jdTermsLower.has(tag.toLowerCase())) score += 2;
      for (const focus of focusAreas) {
        if (tag.toLowerCase().includes(focus)) score += 1;
      }
    }

    const bullets = proj.bullets.map((bullet) => {
      const textLower = bullet.text.toLowerCase();
      const matchedTerms: string[] = [];
      Array.from(jdTermsLower).forEach((term) => {
        if (textLower.includes(term) || bullet.keywords.some((k) => k.toLowerCase() === term)) {
          matchedTerms.push(term);
        }
      });
      return {
        id: bullet.id,
        text: bullet.text,
        matched: matchedTerms.length > 0,
        matchedTerms,
      };
    });

    return {
      name: proj.name,
      summary: proj.summary,
      links: proj.links,
      bullets,
      _score: score,
    };
  });

  return scored
    .sort((a, b) => b._score - a._score)
    .map(({ _score: _, ...rest }) => rest);
}

/**
 * Rank publications by relevance to JD keywords.
 */
function rankPublications(
  publications: ResumeMaster['publications'],
  jdTermsLower: Set<string>,
): Array<{ title: string; publisher: string; date: string; url?: string }> {
  const scored = publications.map((pub) => {
    const titleLower = pub.title.toLowerCase();
    let score = 0;
    Array.from(jdTermsLower).forEach((term) => {
      if (titleLower.includes(term)) score += 1;
    });
    return { ...pub, _score: score };
  });

  return scored
    .sort((a, b) => b._score - a._score)
    .map(({ id: _, _score: __, ...rest }) => rest);
}

/**
 * Try to infer a target role title from the JD text.
 */
function inferTargetRole(jdTextLower: string): string | null {
  const rolePatterns = [
    /(?:job\s*title|position|role)\s*:\s*([^\n]+)/i,
    /(?:we are (?:looking for|hiring|seeking) (?:a|an))\s+([^\n.]+)/i,
  ];

  for (const pattern of rolePatterns) {
    const match = jdTextLower.match(pattern);
    if (match?.[1]) {
      // Title-case the extracted role
      return match[1]
        .trim()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .slice(0, 60);
    }
  }

  return null;
}

/**
 * Trim sections to fit within a single-page budget.
 */
function trimForOnePage(sections: ResumeSection[]): ResumeSection[] {
  const maxBullets = 16;
  let bulletCount = 0;

  return sections.map((section) => {
    if (section.type === 'experience') {
      return {
        ...section,
        items: section.items.map((item) => {
          const remaining = Math.max(0, maxBullets - bulletCount);
          const trimmed = item.bullets.slice(0, Math.min(remaining, 5));
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
          const trimmed = item.bullets.slice(0, Math.min(remaining, 1));
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
