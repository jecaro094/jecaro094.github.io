// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { remarkPlugins, rehypePlugins, shikiTheme } from './src/lib/markdown.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://jecaro094.github.io',
  // Stay static: every page prerenders to plain HTML under `dist/client/`. The
  // Node adapter only exists so the dev-only editor routes (`/api/*`,
  // `/editor/**`) can opt out with `export const prerender = false`. They also
  // guard on `import.meta.env.DEV`, so the published site is read-only.
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  // The rendering pipeline lives in src/lib/markdown.ts so the editor preview
  // endpoint can reuse the exact same transforms and theme.
  markdown: {
    remarkPlugins,
    rehypePlugins,
    shikiConfig: { theme: shikiTheme },
  },
});
