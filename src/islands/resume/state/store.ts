import { create } from 'zustand';
import type { ResumeMaster, ResumeRenderModel, TemplateId, MatchOutput } from '../../../lib/resume/types';
import { buildMatchedResume } from '../../../lib/resume/match';
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
  bulletStyle: 'harvard' | 'natural';
  maxPages: 1 | 2;
  includeSections: IncludeSections;
  targetRole: string;
  matchOutput: MatchOutput | null;

  // Actions
  setJdText: (text: string) => void;
  setTemplateId: (id: TemplateId) => void;
  setBulletStyle: (style: 'harvard' | 'natural') => void;
  setMaxPages: (pages: 1 | 2) => void;
  toggleSection: (section: keyof IncludeSections) => void;
  setTargetRole: (role: string) => void;
  runMatch: () => void;
  reorderBullets: (experienceId: string, fromIndex: number, toIndex: number) => void;
}

export const useResumeStore = create<ResumeState>((set, get) => ({
  master: masterData as unknown as ResumeMaster,
  jdText: '',
  templateId: 'clean',
  bulletStyle: 'natural',
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
  matchOutput: null,

  setJdText: (text: string) => set({ jdText: text }),

  setTemplateId: (id: TemplateId) => {
    set({ templateId: id });
    // Re-run match if we have output
    const state = get();
    if (state.matchOutput) {
      state.runMatch();
    }
  },

  setBulletStyle: (style: 'harvard' | 'natural') => {
    set({ bulletStyle: style });
    const state = get();
    if (state.matchOutput) {
      state.runMatch();
    }
  },

  setMaxPages: (pages: 1 | 2) => {
    set({ maxPages: pages });
    const state = get();
    if (state.matchOutput) {
      state.runMatch();
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
    if (state.matchOutput) {
      state.runMatch();
    }
  },

  setTargetRole: (role: string) => set({ targetRole: role }),

  runMatch: () => {
    const state = get();
    const output = buildMatchedResume({
      master: state.master,
      jobDescriptionText: state.jdText,
      options: {
        bulletStyle: state.bulletStyle,
        maxPages: state.maxPages,
        includeSections: state.includeSections,
        targetRole: state.targetRole || undefined,
      },
    });
    set({ matchOutput: output });
  },

  reorderBullets: (experienceId: string, fromIndex: number, toIndex: number) => {
    set((state) => {
      const master = { ...state.master };

      // Check experience
      const expIdx = master.experience.findIndex((e) => e.id === experienceId);
      if (expIdx >= 0) {
        const exp = { ...master.experience[expIdx] };
        const bullets = [...exp.bullets];
        const [moved] = bullets.splice(fromIndex, 1);
        if (moved) {
          bullets.splice(toIndex, 0, moved);
          exp.bullets = bullets;
          master.experience = [
            ...master.experience.slice(0, expIdx),
            exp,
            ...master.experience.slice(expIdx + 1),
          ];
        }
        return { master };
      }

      // Check projects
      const projIdx = master.projects.findIndex((p) => p.id === experienceId);
      if (projIdx >= 0) {
        const proj = { ...master.projects[projIdx] };
        const bullets = [...proj.bullets];
        const [moved] = bullets.splice(fromIndex, 1);
        if (moved) {
          bullets.splice(toIndex, 0, moved);
          proj.bullets = bullets;
          master.projects = [
            ...master.projects.slice(0, projIdx),
            proj,
            ...master.projects.slice(projIdx + 1),
          ];
        }
        return { master };
      }

      return {};
    });
  },
}));
