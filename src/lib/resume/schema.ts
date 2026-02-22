import { z } from 'zod';

export const resumeLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const resumeBulletSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  keywords: z.array(z.string()),
  metrics: z.array(z.string()).optional(),
  style: z.enum(['harvard', 'natural']).optional(),
});

export const resumeExperienceSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  tags: z.array(z.string()),
  bullets: z.array(resumeBulletSchema).min(1),
});

export const resumeProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  links: z.array(resumeLinkSchema).optional(),
  bullets: z.array(resumeBulletSchema).min(1),
  tags: z.array(z.string()),
});

export const resumeSummarySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  text: z.string().min(1),
  keywords: z.array(z.string()),
});

export const resumeSkillGroupSchema = z.object({
  group: z.string().min(1),
  items: z.array(z.string().min(1)).min(1),
});

export const resumeEducationSchema = z.object({
  id: z.string().min(1),
  school: z.string().min(1),
  degree: z.string().min(1),
  date: z.string().min(1),
});

export const resumeCertificationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  issuer: z.string().min(1),
  date: z.string().min(1),
});

export const resumePublicationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  publisher: z.string().min(1),
  date: z.string().min(1),
  url: z.string().url().optional(),
});

export const resumeBasicsSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  location: z.string().min(1),
  links: z.array(resumeLinkSchema),
});

export const resumeMasterSchema = z.object({
  basics: resumeBasicsSchema,
  summaries: z.array(resumeSummarySchema).min(1),
  skills: z.array(resumeSkillGroupSchema).min(1),
  experience: z.array(resumeExperienceSchema).min(1),
  projects: z.array(resumeProjectSchema),
  education: z.array(resumeEducationSchema),
  certifications: z.array(resumeCertificationSchema),
  publications: z.array(resumePublicationSchema),
});

export type ValidationResult =
  | { success: true; data: z.infer<typeof resumeMasterSchema> }
  | { success: false; errors: z.ZodError };

export function validateResumeMaster(data: unknown): ValidationResult {
  const result = resumeMasterSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
