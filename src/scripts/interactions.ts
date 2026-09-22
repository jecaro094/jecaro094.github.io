/**
 * Behaviour for the markup emitted by `src/lib/markdown.ts`.
 *
 * Every page renders its content through `<Content />`, and the editor renders
 * the same HTML into its preview pane, so the wiring has to be callable against
 * an arbitrary root rather than assuming `document` — the editor re-runs it after
 * each preview refresh. Handlers are marked on the element so a re-run over
 * already-wired nodes is a no-op.
 */

const WIRED = 'data-wired';

function once(el: Element): boolean {
  if (el.hasAttribute(WIRED)) return false;
  el.setAttribute(WIRED, '');
  return true;
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

const copyTimers = new WeakMap<Element, number>();

/** Flash the copied state on a button for a moment. */
function flashCopied(btn: Element): void {
  btn.classList.add('copied');
  const pending = copyTimers.get(btn);
  if (pending) clearTimeout(pending);
  copyTimers.set(
    btn,
    window.setTimeout(() => btn.classList.remove('copied'), 1600),
  );
}

/** Project cards: pointer tilt, and the whole card acting as a link. */
function wireProjectCards(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('.project-card').forEach((card) => {
    if (!once(card)) return;

    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-3px)`;
    });
    const resetTilt = () => {
      card.style.transform = '';
    };
    card.addEventListener('pointerleave', resetTilt);
    card.addEventListener('blur', resetTilt);

    const open = (target: EventTarget | null) => {
      if (target instanceof Element && target.closest('.card-icons')) return;
      const href = card.dataset.href;
      if (href) window.location.href = href;
    };
    card.addEventListener('click', (e) => open(e.target));
    card.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target instanceof Element && e.target.closest('.card-icons')) return;
      e.preventDefault();
      open(e.target);
    });
  });

  // A single URL opens directly; several show the hover dropdown instead.
  root.querySelectorAll<HTMLElement>('.card-icon-btn[data-urls]').forEach((btn) => {
    if (!once(btn)) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const urls = btn.dataset.urls;
      if (urls && !urls.includes(',')) window.open(urls, '_blank', 'noopener');
    });
  });
}

/** Social pills: click to open, inner button to copy the URL. */
function wireSocialLinks(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('.social-link[data-url]').forEach((pill) => {
    if (!once(pill)) return;
    const open = () => {
      const url = pill.dataset.url;
      if (!url) return;
      // mailto: has no page to open — navigate in place so the mail client
      // (or the OS handler) launches instead of a blank tab.
      if (url.startsWith('mailto:')) {
        window.location.href = url;
        return;
      }
      window.open(url, '_blank', 'noopener');
    };
    pill.addEventListener('click', (e) => {
      if (e.target instanceof Element && e.target.closest('.copy-btn')) return;
      open();
    });
    pill.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      open();
    });
  });

  root.querySelectorAll<HTMLElement>('.copy-btn[data-copy]').forEach((btn) => {
    if (!once(btn)) return;
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await copyToClipboard(btn.dataset.copy ?? '');
      flashCopied(btn);
    });
  });
}

/** Copy button on the frame `rehypeCodeFrame` wraps around every code block. */
function wireCodeCopyButtons(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('.expressive-code .copy-btn').forEach((btn) => {
    if (!once(btn)) return;
    btn.addEventListener('click', async () => {
      const code = btn.parentElement?.querySelector('pre')?.textContent ?? '';
      await copyToClipboard(code);
      flashCopied(btn);
    });
  });
}

/** Zoomable figures open the page-level lightbox. */
function wireLightbox(root: ParentNode): void {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg') as HTMLImageElement | null;
  if (!lightbox || !lightboxImg) return;

  const close = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
  };

  if (once(lightbox)) {
    document.getElementById('lightboxClose')?.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  root.querySelectorAll<HTMLElement>('.zoomable').forEach((wrap) => {
    if (!once(wrap)) return;
    wrap.addEventListener('click', () => {
      const img = wrap.querySelector('img');
      if (!img) return;
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
    });
  });
}

/** Highlight the header tab of whichever section is on screen. */
function wireSectionTabs(root: ParentNode): void {
  const tabs = document.querySelectorAll<HTMLElement>('.nav-tab[data-section]');
  if (tabs.length === 0) return;

  const sections = [...tabs]
    .map((tab) => root.querySelector(`#${CSS.escape(tab.dataset.section ?? '')}`))
    .filter((section): section is Element => section !== null && once(section));
  if (sections.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        tabs.forEach((t) => t.classList.remove('active'));
        document
          .querySelector(`.nav-tab[data-section="${entry.target.id}"]`)
          ?.classList.add('active');
      }
    },
    { rootMargin: '-20% 0px -60% 0px' },
  );
  sections.forEach((section) => observer.observe(section));
}

/** Wire every interactive element inside `root`. Safe to call repeatedly. */
export function wireInteractions(root: ParentNode = document): void {
  wireProjectCards(root);
  wireSocialLinks(root);
  wireCodeCopyButtons(root);
  wireLightbox(root);
  wireSectionTabs(root);
}
