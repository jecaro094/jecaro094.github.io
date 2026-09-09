import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Frontmatter is deliberately minimal: `title` feeds `<title>` and `tagline` the
 * meta description, and that is all a page needs to declare. Everything visible
 * — hero, photo, buttons, experience timeline, project cards, technologies —
 * lives in the Markdown body as `:::` directives, so a content file stays
 * readable and editable in the dev editor. `.passthrough()` keeps an extra field
 * from failing the build while the schema stays out of the way.
 */
const pageSchema = z
  .object({
    title: z.string(),
    tagline: z.string().optional(),
  })
  .passthrough();

const site = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/site' }),
  schema: pageSchema,
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: pageSchema,
});

export const collections = { site, projects };
