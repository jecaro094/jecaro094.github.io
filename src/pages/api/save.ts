/**
 * Save endpoint for the editor.
 *
 * `POST { slug: string, content: string }` → overwrites `<slug>.md` inside
 * `src/content/`. Guards, in order:
 *   - 403 unless running under `astro dev` (`import.meta.env.DEV`).
 *   - slug resolved with `resolveContentPath` (rejects `..` / absolute / non-`.md`).
 *   - 404 if the target file does not already exist — the editor only edits,
 *     never creates. Adding a page stays a filesystem operation.
 *   - 422 if the frontmatter block is not valid YAML.
 *
 * After a successful write the Content Layer's watch on `src/content/` reloads
 * the collection and HMRs the published page.
 */
import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import yaml from 'js-yaml';
import { splitFrontmatter } from '../../lib/markdown';
import { resolveContentPath, ContentPathError } from '../../lib/content-files';

export const prerender = false;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  if (!import.meta.env.DEV) {
    return json({ error: 'Editing is disabled on the published site' }, 403);
  }

  let slug: string;
  let content: string;
  try {
    const body = (await request.json()) as { slug?: unknown; content?: unknown };
    if (typeof body.slug !== 'string' || typeof body.content !== 'string') {
      return json({ error: 'Expected { slug: string, content: string }' }, 400);
    }
    slug = body.slug;
    content = body.content;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { frontmatter } = splitFrontmatter(content);
  if (frontmatter !== null) {
    try {
      yaml.load(frontmatter);
    } catch (err) {
      return json({ error: `Invalid frontmatter YAML: ${(err as Error).message}` }, 422);
    }
  }

  let target: string;
  try {
    target = resolveContentPath(slug);
  } catch (err) {
    if (err instanceof ContentPathError) return json({ error: err.message }, 400);
    throw err;
  }

  try {
    await fs.access(target);
  } catch {
    return json({ error: `No content file for "${slug}"` }, 404);
  }

  try {
    await fs.writeFile(target, content, 'utf8');
  } catch (err) {
    return json({ error: `Write failed: ${(err as Error).message}` }, 500);
  }

  return json({ ok: true });
};
