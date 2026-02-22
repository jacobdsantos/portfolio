import { create } from 'zustand';
import type { ResumeMaster, TemplateId } from '../../../lib/resume/types';
import { generateTailoredResume } from '../../../lib/resume/generate';
import type { GenerateOutput } from '../../../lib/resume/generate';
import masterData from '../../../data/resume-master.json';

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
  master: ResumeMaster;
  jdText: string;
  templateId: TemplateId;
  maxPages: 1 | 2;
  includeSections: IncludeSections;
  targetRole: string;
  generateOutput: GenerateOutput | null;
  isGenerating: boolean;

  // Actions
  setJdText: (text: string) => void;
  setTemplateId: (id: TemplateId) => void;
  setMaxPages: (pages: 1 | 2) => void;
  toggleSection: (section: keyof IncludeSections) => void;
  setTargetRole: (role: string) => void;
  generate: () => void;
}

export const useResumeStore = create<ResumeState>((set, get) => ({
  master: masterData as unknown as ResumeMaster,
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
  generateOutput: null,
  isGenerating: false,

  setJdText: (text: string) => set({ jdText: text }),

  setTemplateId: (id: TemplateId) => {
    set({ templateId: id });
    const state = get();
    if (state.generateOutput) {
      state.generate();
    }
  },

  setMaxPages: (pages: 1 | 2) => {
    set({ maxPages: pages });
    const state = get();
    if (state.generateOutput) {
      state.generate();
    }
  },

  toggleSection: (section: keyof IncludeSections) => {
    set((state) => ({
      includeSections: {
        ...state.includeSections,
        [section]: !state.includeSections[section],
      },
    }));
    const state = get();
    if (state.generateOutput) {
      state.generate();
    }
  },

  setTargetRole: (role: string) => set({ targetRole: role }),

  generate: () => {
    const state = get();
    set({ isGenerating: true });

    // Use setTimeout to avoid blocking the UI thread
    setTimeout(() => {
      const output = generateTailoredResume({
        master: state.master,
        jobDescriptionText: state.jdText,
        options: {
          maxPages: state.maxPages,
          includeSections: state.includeSections,
          targetRole: state.targetRole || undefined,
        },
      });

      // Update template ID in render model
      output.renderModel.meta.templateId = state.templateId;

      set({ generateOutput: output, isGenerating: false });
    }, 50);
  },
}));
