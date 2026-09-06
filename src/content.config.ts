import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      tagline: z.string(),
      cover: image(),

      // Home grid ("Featured Projects")
      order: z.number().default(99),
      featured: z.boolean().default(true),
      cardName: z.string().optional(),
      cardDescription: z.string().optional(),
      cardTech: z.array(z.string()).optional(),

      // Context section
      contextHeading: z.string().default('Context'),

      // Optional blocks — each page renders only what it declares
      demo: z
        .object({
          youtubeId: z.string(),
          title: z.string(),
        })
        .optional(),
      repoUrl: z
        .union([z.string().url(), z.array(z.string().url())])
        .optional(),
      code: z
        .object({
          filename: z.string().default(''),
          lang: z.string().default('python'),
          source: z.string(),
        })
        .optional(),
      technologies: z.array(
        z.object({
          heading: z.string(),
          items: z.array(z.string()),
        }),
      ),
    }),
});

// Long-form "Explanation" section body for a project, authored as HTML/Markdown.
// One file per project slug; projects without one simply omit it.
const explanations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/explanations' }),
  schema: z.object({}),
});

const site = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/site' }),
  schema: z.object({
    title: z.string(),
    heading: z.string().optional(),
    tagline: z.string(),
    // CV page only
    downloadLabel: z.string().optional(),
    pdfPath: z.string().optional(),
    imagePath: z.string().optional(),
    imageAlt: z.string().optional(),
  }),
});

const experience = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/experience' }),
  schema: ({ image }) =>
    z.object({
      order: z.number(),
      period: z.string(),
      company: z.string(),
      via: z.string().default(''),
      role: z.string(),
      summary: z.string(),
      tech: z.array(z.string()),
      brandColor: z.string(),
      logo: image(),
    }),
});

export const collections = { projects, explanations, site, experience };
