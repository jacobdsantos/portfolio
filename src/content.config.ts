import { defineCollection, z } from 'astro:content';

const research = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    url: z.string().url(),
    tags: z.array(z.string()),
    description: z.string(),
    summary: z.string().optional(),
    image: z.string().optional(),
    source: z.string().optional(),
    type: z.enum(['blog', 'microstory']).optional().default('blog'),
    order: z.number().optional(),
  }),
});

const tools = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    fullName: z.string(),
    description: z.string(),
    impact: z.string(),
    tech: z.array(z.string()),
    status: z.enum(['Production', 'Active Dev', 'Planned']),
    order: z.number().optional(),
  }),
});

const speaking = defineCollection({
  type: 'data',
  schema: z.object({
    type: z.enum(['Training', 'Speaker']),
    title: z.string(),
    org: z.string(),
    location: z.string(),
    flag: z.string(),
    description: z.string(),
    year: z.string().optional(),
    order: z.number().optional(),
  }),
});

export const collections = { research, tools, speaking };
