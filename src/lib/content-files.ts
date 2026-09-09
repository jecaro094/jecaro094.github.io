/**
 * Filesystem access to `src/content/`.
 *
 * Only the dev-only editor routes (`/editor/**`, `/api/save`) read or write
 * through here, and this module is the single place that decides which paths
 * they may touch. A slug is a collection-qualified content id — `site/home`,
 * `projects/pokeapi` — matching the `editSlug` a page passes to `Layout.astro`.
 */
import path from 'node:path';

/** Root of the content collections, resolved from the project working directory. */
export const CONTENT_DIR = path.resolve(process.cwd(), 'src/content');

/** Thrown for a slug that is missing, malformed, or escapes `CONTENT_DIR`. */
export class ContentPathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentPathError';
  }
}

/**
 * Resolve `<slug>.md` to an absolute path inside `src/content/`, rejecting
 * anything that would climb out of it (`..`, an absolute slug, a non-`.md`
 * target). The returned path is safe to hand to `fs`.
 */
export function resolveContentPath(slug: string | undefined): string {
  if (typeof slug !== 'string' || slug.trim() === '') {
    throw new ContentPathError('Missing content slug');
  }
  if (path.isAbsolute(slug)) {
    throw new ContentPathError('Content slug must be relative');
  }

  const target = path.resolve(CONTENT_DIR, `${slug}.md`);
  if (!target.startsWith(CONTENT_DIR + path.sep)) {
    throw new ContentPathError('Content path escapes src/content');
  }
  if (path.extname(target) !== '.md') {
    throw new ContentPathError('Content path is not a .md file');
  }
  return target;
}
