export type ResumeLink = { label: string; url: string };

export type ResumeBullet = {
  id: string;
  text: string;
  keywords: string[];
  metrics?: string[];
  style?: 'harvard' | 'natural';
};

export type ResumeExperience = {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  tags: string[];
  bullets: ResumeBullet[];
};

export type ResumeProject = {
  id: string;
  name: string;
  summary: string;
  links?: ResumeLink[];
  bullets: ResumeBullet[];
  tags: string[];
};

export type ResumeMaster = {
  basics: {
    name: string;
    label: string;
    email: string;
    phone?: string;
    location: string;
    links: ResumeLink[];
  };
  summaries: Array<{
    id: string;
    label: string;
    text: string;
    keywords: string[];
  }>;
  skills: Array<{ group: string; items: string[] }>;
  experience: ResumeExperience[];
  projects: ResumeProject[];
  education: Array<{ id: string; school: string; degree: string; date: string }>;
  certifications: Array<{ id: string; name: string; issuer: string; date: string }>;
  publications: Array<{ id: string; title: string; publisher: string; date: string; url?: string }>;
};

export type TemplateId = 'clean' | 'harvard' | 'technical' | 'executive';

export type ResumeRenderModel = {
  meta: {
    templateId: TemplateId;
    bulletStyle: 'harvard' | 'natural';
    jdHash: string;
    atsScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    generatedAt: number;
  };
  header: {
    name: string;
    label?: string;
    contactLines: string[];
    links: ResumeLink[];
  };
  sections: ResumeSection[];
};

export type ResumeSection =
  | { type: 'summary'; title: string; blocks: string[] }
  | { type: 'skills'; title: string; groups: Array<{ group: string; items: string[] }> }
  | { type: 'experience'; title: string; items: Array<{
      company: string; role: string; dates: string; location?: string;
      bullets: Array<{ id: string; text: string; matched: boolean; matchedTerms: string[] }>;
    }> }
  | { type: 'projects'; title: string; items: Array<{
      name: string; summary: string; links?: ResumeLink[];
      bullets: Array<{ id: string; text: string; matched: boolean; matchedTerms: string[] }>;
    }> }
  | { type: 'education'; title: string; items: Array<{ school: string; degree: string; date: string }> }
  | { type: 'certifications'; title: string; items: Array<{ name: string; issuer: string; date: string }> }
  | { type: 'publications'; title: string; items: Array<{ title: string; publisher: string; date: string; url?: string }> };

export type MatchInput = {
  master: ResumeMaster;
  jobDescriptionText: string;
  options: {
    bulletStyle: 'harvard' | 'natural';
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
};

export type MatchOutput = {
  renderModel: ResumeRenderModel;
  debug: {
    extractedKeywords: Array<{ term: string; weight: number }>;
    bulletScores: Record<string, number>;
  };
};
