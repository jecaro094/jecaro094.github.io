/**
 * Shared Markdown pipeline.
 *
 * Single source of truth for how a content `.md` turns into HTML. It is consumed
 * in two places that must stay byte-for-byte in sync:
 *
 *   - `astro.config.mjs` → `markdown.remarkPlugins` / `rehypePlugins` /
 *     `shikiConfig`, which renders the published static pages.
 *   - `src/pages/api/preview.ts` → `renderMarkdown()`, which renders the live
 *     editor preview.
 *
 * Every visible element of the site is emitted from here, so a content file only
 * ever contains Markdown plus `:::` directives — never HTML, never a component.
 * Adding a new visual block means adding a directive to this file, never
 * reaching for markup in a `.astro` page or in the content itself.
 */
import type { Root as MdastRoot } from 'mdast';
import type { Root as HastRoot, Element } from 'hast';
import { visit, SKIP } from 'unist-util-visit';
import { toString as mdastToString } from 'mdast-util-to-string';
import remarkDirective from 'remark-directive';

/** Shiki theme for fenced code blocks. Matches the frame in `global.css`. */
export const shikiTheme = 'night-owl' as const;

/** Icon used by the repo buttons and the GitHub pill. */
const GITHUB_ICON = '/media/icons/github.webp';

/**
 * Split a raw `.md` string into its YAML frontmatter block and the Markdown
 * body. Shared by the editor page and the `/api/*` endpoints so all three strip
 * frontmatter identically before rendering or validating it.
 */
export function splitFrontmatter(raw: string): {
  frontmatter: string | null;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/);
  return match
    ? { frontmatter: match[1], body: raw.slice(match[0].length) }
    : { frontmatter: null, body: raw };
}

/* ─────────────────────────── mdast helpers ─────────────────────────── */

type Node = any;

/**
 * A generic block wrapper. `paragraph` is used as the carrier node because
 * `mdast-util-to-hast` runs `state.all()` over its children before applying
 * `hName` / `hProperties`, so it renders any children — block or inline — inside
 * the element we ask for.
 */
function el(
  tagName: string,
  properties: Record<string, unknown>,
  children: Node[] = [],
): Node {
  return {
    type: 'paragraph',
    data: { hName: tagName, hProperties: properties },
    children,
  };
}

/** A leaf element with no Markdown children (img, iframe, span with text…). */
function leaf(tagName: string, properties: Record<string, unknown>, text = ''): Node {
  return {
    type: 'paragraph',
    data: { hName: tagName, hProperties: properties },
    children: text ? [{ type: 'text', value: text }] : [],
  };
}

function attrs(node: Node): Record<string, string> {
  return (node.attributes ?? {}) as Record<string, string>;
}

/** `remark-directive` exposes a valueless attribute (`{copy}`) as an empty string. */
function hasFlag(node: Node, name: string): boolean {
  const value = attrs(node)[name];
  return value !== undefined && value !== null;
}

/** The `[label]` of a directive, when present, dropped from its children. */
function takeLabel(node: Node): string | null {
  const first = node.children?.[0];
  if (first?.type === 'paragraph' && first.data?.directiveLabel) {
    node.children.shift();
    return mdastToString(first);
  }
  return null;
}

/** True for a paragraph made only of inline code spans — the tech-chip row. */
function isTagRow(node: Node): boolean {
  if (node?.type !== 'paragraph') return false;
  const meaningful = node.children.filter(
    (c: Node) => !(c.type === 'text' && c.value.trim() === ''),
  );
  return meaningful.length > 0 && meaningful.every((c: Node) => c.type === 'inlineCode');
}

/** Turn a chip row paragraph into `<ul class="tech-tags"><li class="tech-tag">`. */
function tagRowToList(node: Node): Node {
  const items = node.children
    .filter((c: Node) => c.type === 'inlineCode')
    .map((c: Node) =>
      el('li', { className: ['tech-tag'] }, [{ type: 'text', value: c.value }]),
    );
  return el('ul', { className: ['tech-tags'], 'aria-label': 'Technologies' }, items);
}

/** Pull the first chip row out of `children`, returning it as a `<ul>`. */
function takeTagRow(children: Node[]): Node | null {
  const index = children.findIndex(isTagRow);
  if (index === -1) return null;
  const [row] = children.splice(index, 1);
  return tagRowToList(row);
}

/** Pull the first heading of the given depth out of `children`. */
function takeHeading(children: Node[], depth: number): Node | null {
  const index = children.findIndex((c) => c.type === 'heading' && c.depth === depth);
  if (index === -1) return null;
  return children.splice(index, 1)[0];
}

/** Pull the first paragraph out of `children`. */
function takeParagraph(children: Node[]): Node | null {
  const index = children.findIndex((c) => c.type === 'paragraph');
  if (index === -1) return null;
  return children.splice(index, 1)[0];
}

/** Split a container's children into groups introduced by a heading of `depth`. */
function splitByHeading(children: Node[], depth: number): { heading: Node; body: Node[] }[] {
  const groups: { heading: Node; body: Node[] }[] = [];
  for (const child of children) {
    if (child.type === 'heading' && child.depth === depth) {
      groups.push({ heading: child, body: [] });
    } else if (groups.length > 0) {
      groups[groups.length - 1].body.push(child);
    }
  }
  return groups;
}

/** Replace `parent.children[index]` with one node, telling `visit` where to resume. */
function replace(parent: Node, index: number, node: Node): [typeof SKIP, number] {
  parent.children[index] = node;
  return [SKIP, index];
}

/* ───────────────────────────── admonitions ───────────────────────────── */

type AdmonitionKind = 'note' | 'info' | 'tip' | 'warning' | 'danger';

const ADMONITIONS: Record<AdmonitionKind, { label: string; icon: string }> = {
  note: { label: 'Note', icon: '✎' },
  info: { label: 'Info', icon: 'ℹ' },
  tip: { label: 'Tip', icon: '★' },
  warning: { label: 'Warning', icon: '▲' },
  danger: { label: 'Danger', icon: '■' },
};

/**
 * `:::warning[Heads up] … :::` → `<aside class="admonition admonition-warning">`
 * with a titled header. The inline label overrides the default title.
 */
export function remarkAdmonitions() {
  return (tree: MdastRoot) => {
    visit(tree, (node: Node) => {
      if (node.type !== 'containerDirective') return;
      const config = ADMONITIONS[node.name as AdmonitionKind];
      if (!config) return;

      const title = takeLabel(node) ?? config.label;
      node.data = node.data || {};
      node.data.hName = 'aside';
      node.data.hProperties = {
        className: ['admonition', `admonition-${node.name}`],
        role: 'note',
      };
      node.children.unshift(
        el('p', { className: ['admonition-title'] }, [
          leaf('span', { className: ['admonition-icon'], 'aria-hidden': 'true' }, config.icon),
          { type: 'text', value: ` ${title}` },
        ]),
      );
    });
  };
}

/* ────────────────────────────── social pills ────────────────────────────── */

/** `:link[GitHub]{href=… icon=… copy}` → an action pill. */
function linkPill(node: Node): Node {
  const { href = '#', icon, label: attrLabel } = attrs(node);
  const label = mdastToString(node) || attrLabel || href;
  const copyable = hasFlag(node, 'copy');

  const children: Node[] = [];
  if (icon) {
    children.push(
      el('span', { className: ['social-icon-badge'] }, [
        leaf('img', { className: ['social-icon'], src: icon, alt: '' }),
      ]),
    );
  }
  children.push(leaf('span', { className: ['social-link-label'] }, label));

  if (copyable) {
    children.push(
      el(
        'button',
        {
          type: 'button',
          className: ['copy-btn'],
          'data-copy': href,
          'aria-label': `Copy ${label} link`,
          title: 'Copy link',
        },
        [
          leaf('span', { className: ['copy-glyph'], 'aria-hidden': 'true' }, '⧉'),
          leaf('span', { className: ['copy-check'], 'aria-hidden': 'true' }, '✓'),
        ],
      ),
    );
    // A copyable pill holds a button, so it cannot be an <a> (nested interactive
    // content); interactions.ts makes the whole pill clickable instead.
    return el(
      'div',
      {
        className: ['social-link'],
        'data-url': href,
        role: 'link',
        tabindex: '0',
        'aria-label': `Open ${label}`,
      },
      children,
    );
  }

  return el('a', { className: ['social-link'], href, 'aria-label': `Open ${label}` }, children);
}

/** True for a list item that holds nothing but a single `:link` directive. */
function soleLinkDirective(item: Node): Node | null {
  const blocks = item.children ?? [];
  if (blocks.length !== 1 || blocks[0].type !== 'paragraph') return null;
  const inline = blocks[0].children.filter(
    (c: Node) => !(c.type === 'text' && c.value.trim() === ''),
  );
  if (inline.length !== 1) return null;
  return inline[0].type === 'textDirective' && inline[0].name === 'link' ? inline[0] : null;
}

/**
 * A list whose every item is a lone `:link` directive becomes the row of action
 * pills (`<div class="social-links">`); a stray `:link` elsewhere still renders
 * as a pill.
 */
export function remarkSocialLinks() {
  return (tree: MdastRoot) => {
    visit(tree, 'list', (node: Node, index, parent) => {
      if (parent == null || index == null) return;
      const directives = node.children.map(soleLinkDirective);
      if (directives.length === 0 || directives.some((d: Node) => d === null)) return;
      return replace(
        parent,
        index,
        el('div', { className: ['social-links'] }, directives.map(linkPill)),
      );
    });

    visit(tree, 'textDirective', (node: Node, index, parent) => {
      if (node.name !== 'link' || parent == null || index == null) return;
      return replace(parent, index, linkPill(node));
    });
  };
}

/* ──────────────────────────────── hero ──────────────────────────────── */

/**
 * `:::hero{photo=…}` (landing) or `:::hero{cover=…}` (project / CV page).
 *
 * Inside: `#` is the title, the first paragraph the tagline, a list of `:link`
 * directives the action pills, and anything left over the bio.
 */
export function remarkHero() {
  return (tree: MdastRoot) => {
    visit(tree, 'containerDirective', (node: Node, index, parent) => {
      if (node.name !== 'hero' || parent == null || index == null) return;
      const { photo, cover, alt = '', back, variant } = attrs(node);
      const rest = [...node.children];

      const heading = takeHeading(rest, 1);
      const title = el('h1', { className: ['gradient-text'] }, heading?.children ?? []);
      const taglineSource = takeParagraph(rest);
      const tagline = taglineSource
        ? el('p', { className: ['tagline'] }, taglineSource.children)
        : null;

      // Project / CV hero: full-bleed banner with the cover behind the title.
      if (!photo) {
        const children: Node[] = [
          el('a', { href: back ?? '/', className: ['back-pill'] }, [
            { type: 'text', value: '← Back' },
          ]),
        ];
        if (cover) {
          children.push(leaf('img', { src: cover, alt, className: ['hero-bg'], loading: 'lazy' }));
        }
        children.push(leaf('span', { className: ['hero-overlay'], 'aria-hidden': 'true' }));
        children.push(title);
        if (tagline) children.push(tagline);
        children.push(...rest);
        return replace(
          parent,
          index,
          el(
            'header',
            {
              className: ['project-hero', ...(variant ? [`${variant}-hero`] : []), 'animate'],
            },
            children,
          ),
        );
      }

      // Landing hero: round avatar, heading block, then the bio underneath.
      const headingBlock: Node[] = [title];
      if (tagline) headingBlock.push(tagline);
      const linksIndex = rest.findIndex(
        (c: Node) =>
          c.type === 'paragraph' &&
          (c.data?.hProperties as any)?.className?.includes?.('social-links'),
      );
      if (linksIndex !== -1) headingBlock.push(...rest.splice(linksIndex, 1));

      return replace(
        parent,
        index,
        el('section', { className: ['hero', 'animate'] }, [
          el('div', { className: ['hero-top'] }, [
            el('div', { className: ['avatar'] }, [leaf('img', { src: photo, alt })]),
            el('div', { className: ['hero-heading'] }, headingBlock),
          ]),
          el('div', { className: ['hero-description'] }, rest),
        ]),
      );
    });
  };
}

/* ─────────────────────────── experience timeline ─────────────────────────── */

/**
 * `:::role{period=… logo=… color=…}` → one entry of the experience timeline.
 * `###` is the role, the first paragraph the company line, the chip row the
 * technologies, and the rest the summary.
 */
export function remarkRoles() {
  return (tree: MdastRoot) => {
    visit(tree, 'containerDirective', (node: Node, index, parent) => {
      if (node.name !== 'role' || parent == null || index == null) return;
      const { period = '', logo, color, alt = '' } = attrs(node);
      const rest = [...node.children];

      const heading = takeHeading(rest, 3);
      const company = takeParagraph(rest);
      const tags = takeTagRow(rest);

      const head: Node[] = [];
      if (logo) head.push(leaf('img', { src: logo, alt, className: ['timeline-logo'] }));
      head.push(
        el('div', { className: ['timeline-titles'] }, [
          el('h3', { className: ['timeline-role'] }, heading?.children ?? []),
          company ? el('p', { className: ['timeline-company'] }, company.children) : el('p', {}),
        ]),
      );

      const card: Node[] = [el('header', { className: ['timeline-head'] }, head)];
      for (const block of rest) {
        card.push(
          block.type === 'paragraph'
            ? el('p', { className: ['timeline-summary'] }, block.children)
            : block,
        );
      }
      if (tags) card.push(tags);

      return replace(
        parent,
        index,
        el(
          'li',
          {
            className: ['timeline-item'],
            ...(color ? { style: `--mark:${color}` } : {}),
          },
          [
            leaf('span', { className: ['timeline-marker'], 'aria-hidden': 'true' }),
            el('div', { className: ['timeline-period'] }, [
              leaf('span', { className: ['timeline-year'] }, period),
            ]),
            el('div', { className: ['timeline-body'] }, [
              el('article', { className: ['timeline-card'] }, card),
            ]),
          ],
        ),
      );
    });
  };
}

/* ──────────────────────────── project cards ──────────────────────────── */

/** `:::project{href=… cover=… repo=…}` → one card of the featured grid. */
export function remarkProjectCards() {
  return (tree: MdastRoot) => {
    visit(tree, 'containerDirective', (node: Node, index, parent) => {
      if (node.name !== 'project' || parent == null || index == null) return;
      const { href = '#', cover, repo, alt = '' } = attrs(node);
      const rest = [...node.children];

      const heading = takeHeading(rest, 3);
      const description = takeParagraph(rest);
      const tags = takeTagRow(rest);

      const children: Node[] = [];
      if (cover) {
        children.push(leaf('img', { src: cover, alt, className: ['card-bg'], loading: 'lazy' }));
      }
      children.push(leaf('span', { className: ['card-overlay'], 'aria-hidden': 'true' }));
      children.push(leaf('span', { className: ['card-arrow'] }, '→'));
      children.push(el('h3', {}, heading?.children ?? []));
      if (description) children.push(el('p', { className: ['card-desc'] }, description.children));
      if (tags) children.push(tags);
      children.push(...rest);

      const repos = (repo ?? '')
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);
      if (repos.length > 0) {
        const dropdown =
          repos.length > 1
            ? [
                el(
                  'div',
                  { className: ['card-repo-dropdown'] },
                  repos.map((url) =>
                    el('a', { href: url, className: ['card-repo-item'], target: '_blank', rel: 'noopener noreferrer' }, [
                      { type: 'text', value: repoLabel(url) },
                    ]),
                  ),
                ),
              ]
            : [];
        children.push(
          el('div', { className: ['card-repo'], 'data-urls': repos.join(',') }, [
            leaf('img', { src: GITHUB_ICON, alt: '', className: ['card-repo-icon'] }),
            ...dropdown,
          ]),
        );
      }

      return replace(
        parent,
        index,
        el(
          'div',
          { className: ['project-card'], role: 'link', tabindex: '0', 'data-href': href },
          children,
        ),
      );
    });
  };
}

/** `https://github.com/user/repo` → `user/repo`. */
function repoLabel(url: string): string {
  return url.replace(/\/+$/, '').split('/').slice(-2).join('/');
}

/* ──────────────────────── grids, details, steps ──────────────────────── */

/**
 * `:::grid` → a card grid. Every `###` inside starts a card; its body (a list, a
 * paragraph…) is the card content. `:::grid{variant="auth"}` adds the accent-bar
 * styling used by the authentication cards.
 */
export function remarkGrid() {
  return (tree: MdastRoot) => {
    visit(tree, 'containerDirective', (node: Node, index, parent) => {
      if (node.name !== 'grid' || parent == null || index == null) return;
      const { variant } = attrs(node);
      const cardClass = ['tech-card', ...(variant ? [`${variant}-card`] : [])];
      const cards = splitByHeading(node.children, 3).map(({ heading, body }) =>
        el('div', { className: cardClass }, [el('h4', {}, heading.children), ...body]),
      );
      return replace(
        parent,
        index,
        el('div', { className: ['tech-grid', ...(variant ? [`${variant}-grid`] : [])] }, cards),
      );
    });
  };
}

/** `:::details[Title]` → a collapsible `<details>` card. */
export function remarkDetails() {
  return (tree: MdastRoot) => {
    visit(tree, 'containerDirective', (node: Node, index, parent) => {
      if (node.name !== 'details' || parent == null || index == null) return;
      const title = takeLabel(node) ?? 'Details';
      return replace(
        parent,
        index,
        el('details', { className: ['details-card'] }, [
          el('summary', {}, [
            { type: 'text', value: title },
            leaf('span', { className: ['chevron'], 'aria-hidden': 'true' }, '▾'),
          ]),
          el('div', { className: ['details-body'] }, node.children),
        ]),
      );
    });
  };
}

/**
 * `:::steps` wrapping an ordered list → numbered step cards. A leading
 * `**bold**` run in an item becomes the step title.
 */
export function remarkSteps() {
  return (tree: MdastRoot) => {
    visit(tree, 'containerDirective', (node: Node, index, parent) => {
      if (node.name !== 'steps' || parent == null || index == null) return;
      const list = node.children.find((c: Node) => c.type === 'list');
      if (!list) return;

      const items = list.children.map((item: Node, i: number) => {
        const blocks = [...item.children];
        const content: Node[] = [];
        const first = blocks[0];
        if (first?.type === 'paragraph' && first.children[0]?.type === 'strong') {
          const [strong, ...tail] = first.children;
          content.push(el('h5', {}, strong.children));
          const remainder = tail.filter(
            (c: Node) => !(c.type === 'text' && c.value.trim() === ''),
          );
          if (remainder.length > 0) content.push(el('p', {}, remainder));
          blocks.shift();
        }
        content.push(...blocks);

        return el('li', { className: ['step-item'] }, [
          leaf('span', { className: ['step-badge'], 'aria-hidden': 'true' }, String(i + 1)),
          el('div', { className: ['step-content'] }, content),
        ]);
      });

      return replace(parent, index, el('ol', { className: ['steps'] }, items));
    });
  };
}

/**
 * `:::flow` wrapping an ordered list → the high-level walkthrough list, where a
 * leading `**bold**` run is highlighted as the name of the step.
 */
export function remarkFlow() {
  return (tree: MdastRoot) => {
    visit(tree, 'containerDirective', (node: Node, index, parent) => {
      if (node.name !== 'flow' || parent == null || index == null) return;
      const list = node.children.find((c: Node) => c.type === 'list');
      if (!list) return;

      for (const item of list.children) {
        const first = item.children[0];
        if (first?.type === 'paragraph' && first.children[0]?.type === 'strong') {
          const strong = first.children[0];
          strong.data = { hName: 'span', hProperties: { className: ['step'] } };
        }
      }
      list.data = { hName: 'ol', hProperties: { className: ['flow'] } };
      return replace(parent, index, list);
    });
  };
}

/**
 * `:::endpoints` wrapping a list → API endpoint cards. Each item starts with the
 * route as inline code; the rest of the item is its description.
 */
export function remarkEndpoints() {
  return (tree: MdastRoot) => {
    visit(tree, 'containerDirective', (node: Node, index, parent) => {
      if (node.name !== 'endpoints' || parent == null || index == null) return;
      const list = node.children.find((c: Node) => c.type === 'list');
      if (!list) return;

      const items = list.children.map((item: Node) => {
        const blocks = [...item.children];
        const content: Node[] = [];
        const first = blocks[0];
        if (first?.type === 'paragraph' && first.children[0]?.type === 'inlineCode') {
          const [path, ...tail] = first.children;
          content.push(
            leaf('code', { className: ['endpoint-path'] }, path.value),
          );
          const remainder = tail.filter(
            (c: Node) => !(c.type === 'text' && c.value.trim() === ''),
          );
          // `- \`POST /x\` — description`: drop the separator, the card supplies
          // the visual break between the route and its description.
          if (remainder[0]?.type === 'text') {
            remainder[0].value = remainder[0].value.replace(/^[\s—–-]+/, '');
          }
          if (remainder.length > 0) content.push(el('p', { className: ['endpoint-desc'] }, remainder));
          blocks.shift();
        }
        for (const block of blocks) {
          content.push(
            block.type === 'paragraph'
              ? el('p', { className: ['endpoint-desc'] }, block.children)
              : block,
          );
        }
        return el('li', { className: ['endpoint'] }, content);
      });

      return replace(parent, index, el('ul', { className: ['endpoint-list'] }, items));
    });
  };
}

/* ────────────────────────── media and buttons ────────────────────────── */

/** `::youtube{id=… title=…}` → a responsive 16:9 embed. */
export function remarkYoutube() {
  return (tree: MdastRoot) => {
    visit(tree, 'leafDirective', (node: Node, index, parent) => {
      if (node.name !== 'youtube' || parent == null || index == null) return;
      const { id, title = mdastToString(node) || 'Demo' } = attrs(node);
      if (!id) return;
      return replace(
        parent,
        index,
        el('div', { className: ['video-embed'] }, [
          leaf('iframe', {
            src: `https://www.youtube.com/embed/${id}`,
            title,
            frameBorder: '0',
            allow:
              'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
            allowFullScreen: true,
          }),
        ]),
      );
    });
  };
}

/** `::download[Label]{href=…}` → the CV download button. */
export function remarkDownload() {
  return (tree: MdastRoot) => {
    visit(tree, 'leafDirective', (node: Node, index, parent) => {
      if (node.name !== 'download' || parent == null || index == null) return;
      const { href = '#' } = attrs(node);
      const label = mdastToString(node) || 'Download';
      return replace(
        parent,
        index,
        el('div', { className: ['cv-actions'] }, [
          el('a', { href, download: true, className: ['download-btn'] }, [
            leaf('span', { className: ['download-icon'], 'aria-hidden': 'true' }, '↓'),
            { type: 'text', value: ` ${label}` },
          ]),
        ]),
      );
    });
  };
}

/** `:::repos` wrapping a list of links → GitHub buttons. */
export function remarkRepos() {
  return (tree: MdastRoot) => {
    visit(tree, 'containerDirective', (node: Node, index, parent) => {
      if (node.name !== 'repos' || parent == null || index == null) return;
      const list = node.children.find((c: Node) => c.type === 'list');
      if (!list) return;

      const buttons = list.children.flatMap((item: Node) => {
        const links: Node[] = [];
        visit(item, 'link', (link: Node) => {
          links.push(link);
        });
        return links.map((link) =>
          el('a', { href: link.url, className: ['repo-btn'], target: '_blank', rel: 'noopener noreferrer' }, [
            leaf('img', { src: GITHUB_ICON, alt: '', className: ['repo-btn-icon'] }),
            leaf('span', {}, mdastToString(link) || repoLabel(link.url)),
          ]),
        );
      });

      return replace(parent, index, el('div', { className: ['repo-links'] }, buttons));
    });
  };
}

/* ───────────────────────── document structure ───────────────────────── */

/** `## Title {#custom-id}` → an explicit heading id (Pandoc/kramdown syntax). */
export function remarkHeadingIds() {
  return (tree: MdastRoot) => {
    visit(tree, 'heading', (node: Node) => {
      const last = node.children[node.children.length - 1];
      if (last?.type !== 'text') return;
      const match = last.value.match(/\s*\{#([A-Za-z0-9_-]+)\}\s*$/);
      if (!match) return;
      last.value = last.value.slice(0, match.index).trimEnd();
      if (last.value === '') node.children.pop();
      node.data = node.data || {};
      node.data.hProperties = { ...(node.data.hProperties ?? {}), id: match[1] };
    });
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Consecutive timeline entries / project cards are wrapped in the container the
 * layout expects (`<ol class="timeline">`, `<div class="project-grid">`). Runs
 * after the directives that produce them.
 */
function groupSiblings(children: Node[], className: string, wrapper: Node): Node[] {
  const out: Node[] = [];
  let run: Node[] = [];
  const flush = () => {
    if (run.length === 0) return;
    const props = { ...(wrapper.data.hProperties as Record<string, unknown>) };
    out.push({ ...wrapper, data: { ...wrapper.data, hProperties: props }, children: run });
    run = [];
  };
  for (const child of children) {
    const classes = (child?.data?.hProperties as any)?.className;
    if (Array.isArray(classes) && classes.includes(className)) {
      run.push(child);
    } else {
      flush();
      out.push(child);
    }
  }
  flush();
  return out;
}

export function remarkGroups() {
  return (tree: MdastRoot) => {
    const walk = (node: Node) => {
      if (!Array.isArray(node.children)) return;
      node.children.forEach(walk);
      node.children = groupSiblings(
        node.children,
        'timeline-item',
        el('ol', { className: ['timeline'] }),
      );
      node.children = groupSiblings(
        node.children,
        'project-card',
        el('div', { className: ['project-grid'] }),
      );
    };
    walk(tree);
  };
}

/**
 * Every `##` opens a `<section class="section animate">` holding everything up to
 * the next `##`, with its heading wrapped in the `.section-heading` rule. This is
 * what the hand-written `.astro` pages used to do with literal `<section>` tags.
 */
export function remarkSections() {
  return (tree: MdastRoot) => {
    const out: Node[] = [];
    let current: { id: string; heading: Node; body: Node[] } | null = null;
    let order = 0;

    const flush = () => {
      if (!current) return;
      const delay = 0.2 + order * 0.1;
      order += 1;
      out.push(
        el(
          'section',
          {
            className: ['section', 'animate'],
            id: current.id,
            style: `animation-delay: ${delay.toFixed(2)}s`,
          },
          [
            el('div', { className: ['section-heading'] }, [
              el('h2', {}, current.heading.children),
              leaf('span', { className: ['section-rule'], 'aria-hidden': 'true' }),
              leaf('span', { className: ['section-count'] }, sectionCount(current.body)),
            ]),
            ...current.body,
          ],
        ),
      );
      current = null;
    };

    for (const child of tree.children as Node[]) {
      if (child.type === 'heading' && child.depth === 2) {
        flush();
        // The id moves from the heading onto the section it opens, so `#projects`
        // scrolls to the whole block and the document keeps unique ids.
        const explicit = (child.data?.hProperties as any)?.id as string | undefined;
        if (explicit) delete (child.data.hProperties as any).id;
        current = { id: explicit ?? slugify(mdastToString(child)), heading: child, body: [] };
      } else if (current) {
        current.body.push(child);
      } else {
        out.push(child);
      }
    }
    flush();
    tree.children = out;
  };
}

/** `<n> roles` badge for a section whose body is the experience timeline. */
function sectionCount(body: Node[]): string {
  const timeline = body.find((c) =>
    (c?.data?.hProperties as any)?.className?.includes?.('timeline'),
  );
  if (!timeline) return '';
  const n = timeline.children.length;
  return `${n} ${n === 1 ? 'role' : 'roles'}`;
}

/* ───────────────────────────── rehype passes ───────────────────────────── */

/**
 * Wrap every top-level `<pre>` in the `.expressive-code` frame with a copy
 * button, matching the frame `global.css` styles.
 */
export function rehypeCodeFrame() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'pre' || parent == null || index == null) return;
      if (
        parent.type === 'element' &&
        Array.isArray(parent.properties?.className) &&
        (parent.properties.className as unknown[]).includes('expressive-code')
      ) {
        return;
      }

      (parent.children as unknown[])[index] = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['expressive-code'] },
        children: [
          {
            type: 'element',
            tagName: 'button',
            properties: {
              type: 'button',
              className: ['copy-btn'],
              'aria-label': 'Copy code to clipboard',
            },
            children: [{ type: 'text', value: '⧉' }],
          },
          node,
        ],
      } as Element;
      return [SKIP, index + 1];
    });
  };
}

/**
 * A standalone image (the only thing in its paragraph) becomes a zoomable figure
 * wired to the page lightbox. Its Markdown title, when given, is the caption.
 */
export function rehypeZoomableImages() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'p' || parent == null || index == null) return;
      const children = node.children.filter(
        (c) => !(c.type === 'text' && c.value.trim() === ''),
      );
      if (children.length !== 1) return;
      const img = children[0];
      if (img.type !== 'element' || img.tagName !== 'img') return;

      const caption = img.properties?.title;
      if (img.properties) delete img.properties.title;

      const figure: Element = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['figure-zoom'] },
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: { className: ['zoom-wrap', 'zoomable'] },
            children: [
              img,
              {
                type: 'element',
                tagName: 'span',
                properties: { className: ['zoom-hint'] },
                children: [{ type: 'text', value: '🔍 Click to zoom' }],
              },
            ],
          },
        ],
      };
      if (typeof caption === 'string' && caption !== '') {
        figure.children.push({
          type: 'element',
          tagName: 'figcaption',
          properties: {},
          children: [{ type: 'text', value: caption }],
        });
      }

      return replace(parent as Node, index, figure);
    });
  };
}

/* ──────────────────────────── plugin exports ──────────────────────────── */

/**
 * Order matters: `remark-directive` parses `:::`, the block transforms rewrite
 * those nodes, `remarkGroups` collects the results into their containers, and
 * `remarkSections` finally slices the document by `##`.
 */
export const remarkPlugins = [
  remarkDirective,
  remarkHeadingIds,
  remarkAdmonitions,
  remarkSocialLinks,
  remarkYoutube,
  remarkDownload,
  remarkRepos,
  remarkEndpoints,
  remarkFlow,
  remarkSteps,
  remarkGrid,
  remarkDetails,
  remarkRoles,
  remarkProjectCards,
  remarkHero,
  remarkGroups,
  remarkSections,
];

export const rehypePlugins = [rehypeCodeFrame, rehypeZoomableImages];

/**
 * Standalone renderer for the editor preview endpoint. Mirrors the Astro build:
 * same remark/rehype transforms, same Shiki theme. `remark-gfm` and Shiki are
 * wired explicitly because, unlike the Astro pipeline, nothing else does it.
 */
export async function renderMarkdown(body: string): Promise<string> {
  const [
    { unified },
    { default: remarkParse },
    { default: remarkGfm },
    { default: remarkRehype },
    { default: rehypeShiki },
    { default: rehypeStringify },
  ] = await Promise.all([
    import('unified'),
    import('remark-parse'),
    import('remark-gfm'),
    import('remark-rehype'),
    import('@shikijs/rehype'),
    import('rehype-stringify'),
  ]);

  let pipeline = unified().use(remarkParse).use(remarkGfm);
  for (const plugin of remarkPlugins) pipeline = pipeline.use(plugin as any);
  pipeline = pipeline.use(remarkRehype, { allowDangerousHtml: true }).use(rehypeShiki, {
    theme: shikiTheme,
  });
  for (const plugin of rehypePlugins) pipeline = pipeline.use(plugin as any);

  const file = await pipeline.use(rehypeStringify, { allowDangerousHtml: true }).process(body);
  return String(file);
}
