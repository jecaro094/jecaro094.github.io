# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # first time only
npm run dev          # dev server → http://localhost:4321 (the editor lives here)
npm run build        # build → dist/client (static site) + dist/server
npm run preview      # serve the build locally
```

There is no test suite, linter, or formatter configured. `npm run build` is the
only validation gate.

## Architecture

Astro 5, `output: 'static'`, vanilla CSS, no UI framework.
`site: 'https://jecaro094.github.io'` with **no `base`** (served at the domain root).

The `@astrojs/node` adapter is configured, but the site is still static: every
page prerenders to `dist/client/`. The adapter exists only so the dev-only editor
routes can opt out with `export const prerender = false`.

### Content is the data layer, and it is plain Markdown

Every visible string, image and list comes from `src/content/` via `getEntry` +
`render`. `src/content.config.ts` defines two collections, `site` and `projects`,
sharing one deliberately minimal schema: `title`, an optional `tagline`, and
`.passthrough()`. **Nothing else belongs in frontmatter.** Structured frontmatter
carrying visible copy is what this structure replaced — it renders as unreadable
YAML in the editor.

| File | Page |
| --- | --- |
| `src/content/site/home.md` | `/` — hero, photo, action pills, experience timeline and featured project cards, all in one file |
| `src/content/site/cv.md` | `/cv` |
| `src/content/projects/<slug>.md` | `/projects/<slug>/` |

The `.astro` files under `src/pages/` are ~15-line shells: read the entry, render
`<Content />` inside `<Layout>`. They hold no copy and almost no markup.

### `src/lib/markdown.ts` is the single rendering pipeline

It is the one source of truth for Markdown → HTML, consumed by `astro.config.mjs`
for the published pages and by `/api/preview` for the editor preview, so the two
can never diverge. **Every visual block on the site is emitted from here.** Adding
a new kind of block means adding a directive to this file — never markup in a
`.astro` page, never HTML in a content file.

Directive vocabulary (on top of GFM, Shiki and `:::note|info|tip|warning|danger`):

| Markup | Renders |
| --- | --- |
| `:::hero{photo=…}` / `:::hero{cover=… variant=…}` | Page header: `#` title, first paragraph tagline, `:link` list action pills, rest bio |
| `:link[GitHub]{href=… icon=… copy}` | Action pill, with a copy-to-clipboard button when `copy` is set |
| `:::role{period=… logo=… color=…}` | Experience timeline entry |
| `:::project{href=… cover=… repo=…}` | Featured project card |
| `::youtube{id=… title=…}` | Responsive 16:9 embed |
| `:::grid` / `:::grid{variant="auth"}` | Card grid; each `###` inside opens a card |
| `:::details[Title]` | Collapsible `<details>` |
| `:::steps` / `:::flow` / `:::endpoints` | Numbered step cards / walkthrough list / endpoint cards |
| `:::repos` | Link list → GitHub buttons |
| `::download[Label]{href=…}` | Download button |
| Paragraph of only `` `code` `` | Row of technology chips |
| `![alt](/media/x.webp "Caption")` | Zoomable figure wired to the page lightbox |
| `## Title {#id}` | Opens a `<section class="section" id="id">` running to the next `##` |

Ordering is document order — there is no `order` field. Nesting containers needs a
longer fence on the outer one, like code fences (`:::::details` > `::::steps` >
`:::endpoints`).

### Project pages are hand-written, not a dynamic route

There is no `[slug].astro`. Each project has its own file, e.g.
`src/pages/projects/qr-voting-survey.astro`, hardcoding its slug in
`getEntry('projects', '<slug>')`. The home cards link to `/projects/<slug>/`, so
**the content filename must match the page route filename** or the card 404s.

Adding a project therefore means: create `src/content/projects/<slug>.md`, put the
cover in `public/media/covers/`, and copy `pokeapi.astro` to
`src/pages/projects/<slug>.astro` changing the two slug strings.

### The editor (dev-only)

Reached from the **Edit** link `Layout.astro` adds to the header when the editor
is enabled, driven by the `editSlug` prop each page passes (`site/home`,
`projects/pokeapi`…).

- `src/pages/editor/[...slug]/edit.astro` (`prerender = false`) — reads the raw
  `.md`, server-renders the first preview, then mounts CodeMirror 6 (Markdown
  mode, `Mod-s` to save, snippet completion for the whole directive vocabulary).
  Split view, dirty flag, `beforeunload` guard, toasts.
- `src/pages/api/preview.ts` — `POST { content }` → validate frontmatter YAML
  (422) → `renderMarkdown(body)` → `{ html }`. Debounced ~200 ms, stale responses
  dropped by a sequence counter.
- `src/pages/api/save.ts` — `POST { slug, content }`. Guards in order: 403 unless
  the editor is enabled, path resolution, 404 if the file does not already exist
  (the editor edits, never creates), 422 on invalid YAML. After the write the
  Content Layer's watch on `src/content/` HMRs the published page.
- `src/lib/content-files.ts` — `resolveContentPath()`, the path-safety boundary
  shared by the edit page and `/api/save`.
- `src/lib/editor-enabled.ts` — exports `EDITOR_ENABLED`, the single switch every
  editor route and the header link check.

`EDITOR_ENABLED` is `ENABLE_EDITOR` (an `astro:env` server var, declared in
`astro.config.mjs`, default `false`) OR `import.meta.env.DEV`. So the editor is
on by default under `astro dev`, and a build exposes it only when
`ENABLE_EDITOR=true` is set explicitly — the published static site never carries
the API routes anyway, so it stays unreachable there regardless.

### Images

All images live in `public/media/` (`icons/`, `logos/`, `covers/`) and are
referenced by absolute URL, so they are plain editable text in a content file.
`astro:assets` is not used, which means **anything added there must be optimized
before committing** (the covers are webp; the originals were up to 2.6 MB).

### Styling

- `src/styles/global.css` — design tokens (`--bg`, `--fg`, `--muted`, `--accent`,
  `--border`), body background animation, `.animate`, `.gradient-text`, header
  chrome, inline `code`, the `.expressive-code` code frame.
- `src/styles/content.css` — **everything the Markdown pipeline emits**. Astro's
  scoped `<style>` never reaches `<Content />` output, so a rule for a directive's
  markup has to live here. `Layout.astro` and the editor page both import it, and
  that is what keeps the preview identical to the page.
- `src/styles/editor.css` — editor split view, top bar, toasts.
- `src/scripts/interactions.ts` — `wireInteractions(root)`: card tilt, copy
  buttons, lightbox, section tabs. Called by `Layout.astro` for a page and again
  by the editor after every preview refresh, so it must stay idempotent and take
  a root rather than assuming `document`.

Page-specific `<style>` blocks are no longer the pattern: if a rule targets
rendered content, it belongs in `content.css`.

## Content authoring rules

Content files must be plain, clean Markdown that a non-technical editor could
edit. Two approaches have been explicitly rejected and must not be reintroduced:

- **No MDX composing Astro components** in content files.
- **No raw HTML blocks inside Markdown.** Use Markdown primitives and the
  directives above. If a richer format is genuinely needed, add a remark/rehype
  transform to `src/lib/markdown.ts` so the editor preview and the published page
  stay in sync — do not reach for a component or inline HTML.

## Deployment

`.github/workflows/deploy.yml`:

- Push to `main` → **CI build only**, nothing is published.
- Tag `v*` or manual `workflow_dispatch` → build, upload `dist/client`, deploy to
  GitHub Pages, and (for tags) create a GitHub Release with generated notes.

So shipping a content change to the live site requires pushing a version tag, not
just merging to `main`.

Both build steps run with `ENABLE_EDITOR: ${{ vars.ENABLE_EDITOR || 'false' }}`,
so the deployed site is editor-off unless the `ENABLE_EDITOR` repo **variable**
(Settings → Secrets and variables → Actions → Variables) is set to `true`.

## Stale documentation — trust `src/`

`README.md`, `AGENTS.md`, `.opencode/` and the root `projects/` and `cv/`
directories describe an earlier structure and are **not read by the build**.
`.opencode/` and `AGENTS.md` configure a different agent runtime (opencode) and
are not instructions for work here.

Repo docs and commit history are in Spanish; site content is in English.
