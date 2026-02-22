import { create } from 'zustand';
import type { ResumeMaster, TemplateId, ResumeRenderModel, ResumeSection } from '../../../lib/resume/types';
import { generateTailoredResume } from '../../../lib/resume/generate';
import type { GenerateOutput } from '../../../lib/resume/generate';
import { generateWithAI, getProviderDefaults, getProviders } from '../../../lib/resume/ai-generate';
import type { AIGenerateResult, ProviderId } from '../../../lib/resume/ai-generate';
import { extractKeywords } from '../../../lib/resume/keyword-extract';
import { computeAtsScore, findMissingKeywords } from '../../../lib/resume/ats';
import { simpleHash, normalize } from '../../../lib/resume/text';
import masterData from '../../../data/resume-master.json';

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                               */
/* ------------------------------------------------------------------ */

function loadString(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch { /* quota exceeded or SSR */ }
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface IncludeSections {
  summary: boolean;
  skills: boolean;
  experience: boolean;
  projects: boolean;
  education: boolean;
  certifications: boolean;
  publications: boolean;
}

export interface ResumeState {
  // Master data
  master: ResumeMaster;

  // API config (persisted to localStorage)
  provider: ProviderId;
  apiKey: string;
  apiEndpoint: string;
  model: string;

  // Inputs
  jdText: string;
  templateId: TemplateId;
  maxPages: 1 | 2;
  includeSections: IncludeSections;
  targetRole: string;

  // Generation output
  generateOutput: GenerateOutput | null;
  isGenerating: boolean;
  error: string | null;
  generationMode: 'ai' | 'local' | null;

  // Edit overlay — user overrides on top of generated content
  editedSummary: string | null;
  editedBullets: Record<string, string>;

  // Actions — config
  setProvider: (provider: ProviderId) => void;
  setApiKey: (key: string) => void;
  setApiEndpoint: (endpoint: string) => void;
  setModel: (model: string) => void;

  // Actions — inputs
  setJdText: (text: string) => void;
  setTemplateId: (id: TemplateId) => void;
  setMaxPages: (pages: 1 | 2) => void;
  toggleSection: (section: keyof IncludeSections) => void;
  setTargetRole: (role: string) => void;

  // Actions — generation
  generate: () => Promise<void>;
  generateLocal: () => void;

  // Actions — editing
  editSummary: (text: string) => void;
  editBullet: (bulletId: string, text: string) => void;
  resetEdit: (field: 'summary' | string) => void;
  resetAllEdits: () => void;

  // Computed — effective render model with edits applied
  getEffectiveOutput: () => GenerateOutput | null;
}

/* ------------------------------------------------------------------ */
/*  Build render model from AI result                                  */
/* ------------------------------------------------------------------ */

function buildFromAI(
  master: ResumeMaster,
  ai: AIGenerateResult,
  options: {
    templateId: TemplateId;
    maxPages: 1 | 2;
    includeSections: IncludeSections;
    jdText: string;
  },
): GenerateOutput {
  const { templateId, maxPages, includeSections, jdText } = options;
  const extractedKeywords = extractKeywords(jdText);
  const jdTerms = extractedKeywords.map((k) => k.term);
  const jdTermsLower = new Set(jdTerms.map((t) => t.toLowerCase()));

  // Build sections from AI result
  const sections: ResumeSection[] = [];

  if (includeSections.summary) {
    sections.push({
      type: 'summary',
      title: 'Professional Summary',
      blocks: [ai.summary],
    });
  }

  if (includeSections.skills && ai.skillGroups.length > 0) {
    sections.push({
      type: 'skills',
      title: 'Technical Skills',
      groups: ai.skillGroups,
    });
  }

  if (includeSections.experience) {
    const items = ai.experience.map((aiExp) => {
      const masterExp = master.experience.find((e) => e.id === aiExp.id);
      return {
        company: masterExp?.company ?? '',
        role: masterExp?.role ?? '',
        dates: masterExp ? `${masterExp.startDate} - ${masterExp.endDate}` : '',
        location: masterExp?.location,
        bullets: aiExp.bullets.map((b) => {
          const textLower = b.text.toLowerCase();
          const matchedTerms: string[] = [];
          jdTermsLower.forEach((term) => {
            if (textLower.includes(term)) matchedTerms.push(term);
          });
          return { id: b.id, text: b.text, matched: matchedTerms.length > 0, matchedTerms };
        }),
      };
    });
    sections.push({ type: 'experience', title: 'Experience', items });
  }

  if (includeSections.projects) {
    const orderedProjects = (ai.projectOrder ?? [])
      .map((id) => master.projects.find((p) => p.id === id))
      .filter(Boolean) as ResumeMaster['projects'];
    // Add any projects not in the AI order
    for (const p of master.projects) {
      if (!orderedProjects.some((op) => op.id === p.id)) orderedProjects.push(p);
    }

    sections.push({
      type: 'projects',
      title: 'Tools & Projects',
      items: orderedProjects.map((proj) => ({
        name: proj.name,
        summary: proj.summary,
        links: proj.links,
        bullets: proj.bullets.map((b) => {
          const textLower = b.text.toLowerCase();
          const matchedTerms: string[] = [];
          jdTermsLower.forEach((term) => {
            if (textLower.includes(term)) matchedTerms.push(term);
          });
          return { id: b.id, text: b.text, matched: matchedTerms.length > 0, matchedTerms };
        }),
      })),
    });
  }

  if (includeSections.education && master.education.length > 0) {
    sections.push({
      type: 'education',
      title: 'Education',
      items: master.education.map((e) => ({ school: e.school, degree: e.degree, date: e.date })),
    });
  }

  if (includeSections.certifications && master.certifications.length > 0) {
    sections.push({
      type: 'certifications',
      title: 'Certifications',
      items: master.certifications.map((c) => ({ name: c.name, issuer: c.issuer, date: c.date })),
    });
  }

  if (includeSections.publications && master.publications.length > 0) {
    const orderedPubs = (ai.publicationOrder ?? [])
      .map((id) => master.publications.find((p) => p.id === id))
      .filter(Boolean) as ResumeMaster['publications'];
    for (const p of master.publications) {
      if (!orderedPubs.some((op) => op.id === p.id)) orderedPubs.push(p);
    }
    sections.push({
      type: 'publications',
      title: 'Selected Publications',
      items: orderedPubs.map((p) => ({ title: p.title, publisher: p.publisher, date: p.date, url: p.url })),
    });
  }

  // Apply page trimming
  const trimmed = maxPages === 1 ? trimForOnePage(sections) : sections;

  // Collect all resume text for ATS scoring
  const allResumeKeywords = new Set<string>();
  const allText = collectAllText(trimmed);
  jdTermsLower.forEach((term) => {
    if (allText.includes(term)) allResumeKeywords.add(term);
  });

  const matchedKeywords = Array.from(allResumeKeywords);
  const missingKeywords = findMissingKeywords(jdTerms, matchedKeywords);
  const atsScore = computeAtsScore(matchedKeywords, jdTerms, extractedKeywords);

  const renderModel: ResumeRenderModel = {
    meta: {
      templateId,
      bulletStyle: 'harvard',
      jdHash: simpleHash(normalize(jdText)),
      atsScore,
      matchedKeywords,
      missingKeywords,
      generatedAt: Date.now(),
    },
    header: {
      name: master.basics.name,
      label: ai.targetRole || master.basics.label,
      contactLines: [
        master.basics.email,
        ...(master.basics.phone ? [master.basics.phone] : []),
        master.basics.location,
      ],
      links: master.basics.links,
    },
    sections: trimmed,
  };

  return {
    renderModel,
    analysis: {
      detectedFocusAreas: [], // AI doesn't use focus areas
      extractedKeywords,
      atsScore,
      matchedKeywords,
      missingKeywords,
      bulletSelections: {},
    },
    aiAssessment: ai.assessment ?? undefined,
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function collectAllText(sections: ResumeSection[]): string {
  const parts: string[] = [];
  for (const s of sections) {
    if (s.type === 'summary') parts.push(...s.blocks);
    if (s.type === 'skills') s.groups.forEach((g) => parts.push(...g.items));
    if (s.type === 'experience') s.items.forEach((i) => i.bullets.forEach((b) => parts.push(b.text)));
    if (s.type === 'projects') s.items.forEach((i) => { parts.push(i.summary); i.bullets.forEach((b) => parts.push(b.text)); });
    if (s.type === 'publications') s.items.forEach((i) => parts.push(i.title));
  }
  return parts.join(' ').toLowerCase();
}

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
      return { ...section, items: section.items.slice(0, 3) };
    }
    return section;
  });
}

/** Apply user edits on top of a render model, recalculate ATS */
function applyEdits(
  output: GenerateOutput,
  editedSummary: string | null,
  editedBullets: Record<string, string>,
  jdText: string,
): GenerateOutput {
  const extractedKeywords = output.analysis.extractedKeywords;
  const jdTerms = extractedKeywords.map((k) => k.term);
  const jdTermsLower = new Set(jdTerms.map((t) => t.toLowerCase()));

  const sections = output.renderModel.sections.map((section) => {
    if (section.type === 'summary' && editedSummary !== null) {
      return { ...section, blocks: [editedSummary] };
    }
    if (section.type === 'experience') {
      return {
        ...section,
        items: section.items.map((item) => ({
          ...item,
          bullets: item.bullets.map((b) => {
            const text = editedBullets[b.id] ?? b.text;
            const textLower = text.toLowerCase();
            const matchedTerms: string[] = [];
            jdTermsLower.forEach((term) => {
              if (textLower.includes(term)) matchedTerms.push(term);
            });
            return { ...b, text, matched: matchedTerms.length > 0, matchedTerms };
          }),
        })),
      };
    }
    return section;
  });

  // Recalculate ATS
  const allResumeKeywords = new Set<string>();
  const allText = collectAllText(sections);
  jdTermsLower.forEach((term) => {
    if (allText.includes(term)) allResumeKeywords.add(term);
  });

  const matchedKeywords = Array.from(allResumeKeywords);
  const missingKeywords = findMissingKeywords(jdTerms, matchedKeywords);
  const atsScore = computeAtsScore(matchedKeywords, jdTerms, extractedKeywords);

  return {
    renderModel: {
      ...output.renderModel,
      meta: { ...output.renderModel.meta, atsScore, matchedKeywords, missingKeywords },
      sections,
    },
    analysis: {
      ...output.analysis,
      atsScore,
      matchedKeywords,
      missingKeywords,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useResumeStore = create<ResumeState>((set, get) => ({
  master: masterData as unknown as ResumeMaster,

  // API config — persisted
  provider: (loadString('resume-api-provider', 'anthropic') as ProviderId),
  apiKey: loadString('resume-api-key', ''),
  apiEndpoint: loadString('resume-api-endpoint', 'https://api.anthropic.com'),
  model: loadString('resume-api-model', 'claude-4.6-opus'),

  // Inputs
  jdText: '',
  templateId: 'clean',
  maxPages: 1,
  includeSections: {
    summary: true,
    skills: true,
    experience: true,
    projects: true,
    education: true,
    certifications: true,
    publications: true,
  },
  targetRole: '',

  // Output
  generateOutput: null,
  isGenerating: false,
  error: null,
  generationMode: null,

  // Edits
  editedSummary: null,
  editedBullets: {},

  /* -- Config actions -- */

  setProvider: (provider) => {
    saveString('resume-api-provider', provider);
    const defaults = getProviderDefaults(provider);
    saveString('resume-api-endpoint', defaults.endpoint);
    saveString('resume-api-model', defaults.model);
    set({ provider, apiEndpoint: defaults.endpoint, model: defaults.model });
  },

  setApiKey: (key) => {
    saveString('resume-api-key', key);
    set({ apiKey: key });
  },

  setApiEndpoint: (endpoint) => {
    saveString('resume-api-endpoint', endpoint);
    set({ apiEndpoint: endpoint });
  },

  setModel: (model) => {
    saveString('resume-api-model', model);
    set({ model });
  },

  /* -- Input actions -- */

  setJdText: (text) => set({ jdText: text }),

  setTemplateId: (id) => {
    set({ templateId: id });
    const state = get();
    if (state.generateOutput) {
      set({
        generateOutput: {
          ...state.generateOutput,
          renderModel: { ...state.generateOutput.renderModel, meta: { ...state.generateOutput.renderModel.meta, templateId: id } },
        },
      });
    }
  },

  setMaxPages: (pages) => {
    set({ maxPages: pages });
    // Regenerate if we have output (uses local since it's just a re-render)
    const state = get();
    if (state.generateOutput) state.generateLocal();
  },

  toggleSection: (section) => {
    set((state) => ({
      includeSections: {
        ...state.includeSections,
        [section]: !state.includeSections[section],
      },
    }));
    const state = get();
    if (state.generateOutput) state.generateLocal();
  },

  setTargetRole: (role) => set({ targetRole: role }),

  /* -- Generation actions -- */

  generate: async () => {
    const state = get();
    const { provider, apiKey, apiEndpoint, model, master, jdText, includeSections, maxPages, templateId, targetRole } = state;

    if (!jdText.trim()) return;

    set({ isGenerating: true, error: null, editedSummary: null, editedBullets: {} });

    // If no API key, skip AI and use local generation
    if (!apiKey.trim()) {
      set({ error: 'Set your API key and endpoint in API Configuration above to enable AI generation. Using local mode.' });
      state.generateLocal();
      return;
    }

    try {
      const aiResult = await generateWithAI({
        provider,
        apiKey,
        apiEndpoint,
        model,
        master,
        jobDescriptionText: jdText,
        targetRole: targetRole || undefined,
      });

      const output = buildFromAI(master, aiResult, {
        templateId,
        maxPages,
        includeSections,
        jdText,
      });

      set({ generateOutput: output, isGenerating: false, generationMode: 'ai' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error during AI generation';
      set({ error: message, isGenerating: false });

      // Fall back to local generation so user still gets something
      state.generateLocal();
    }
  },

  generateLocal: () => {
    const state = get();
    const { master, jdText, maxPages, includeSections, targetRole, templateId } = state;

    if (!jdText.trim()) return;

    set({ isGenerating: true, error: state.error });

    setTimeout(() => {
      const output = generateTailoredResume({
        master,
        jobDescriptionText: jdText,
        options: { maxPages, includeSections, targetRole: targetRole || undefined },
      });
      output.renderModel.meta.templateId = templateId;
      set({
        generateOutput: output,
        isGenerating: false,
        generationMode: state.apiKey ? 'local' : 'local',
      });
    }, 50);
  },

  /* -- Edit actions -- */

  editSummary: (text) => set({ editedSummary: text }),

  editBullet: (bulletId, text) =>
    set((state) => ({
      editedBullets: { ...state.editedBullets, [bulletId]: text },
    })),

  resetEdit: (field) => {
    if (field === 'summary') {
      set({ editedSummary: null });
    } else {
      set((state) => {
        const next = { ...state.editedBullets };
        delete next[field];
        return { editedBullets: next };
      });
    }
  },

  resetAllEdits: () => set({ editedSummary: null, editedBullets: {} }),

  /* -- Computed -- */

  getEffectiveOutput: () => {
    const { generateOutput, editedSummary, editedBullets, jdText } = get();
    if (!generateOutput) return null;

    const hasEdits = editedSummary !== null || Object.keys(editedBullets).length > 0;
    if (!hasEdits) return generateOutput;

    return applyEdits(generateOutput, editedSummary, editedBullets, jdText);
  },
}));
