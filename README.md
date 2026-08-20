# Portfolio — jecaro094

Portfolio personal de **Jesús Caballero Rodríguez** — Senior Backend Engineer (Python · APIs · Data Engineering).

## Estado actual del repo

> **Última actualización**: 2026-08-20 · commit `ff987e1`

El repo se ha creado como **esqueleto funcional** del nuevo portfolio, con el contenido real ya migrado:

- ✅ Sitio **Astro 5** (output estático → HTML/CSS/JS puro) con 7 páginas generadas:
  - `/` — landing
  - `/projects/` — listado + página de detalle por proyecto (4 proyectos documentados)
  - `/cv/` — currículum renderizado desde `cv/cv.md` + descargas (.md / imagen)
- ✅ **Proyectos migrados** desde el repo job-search: `mapfre-softtek`, `quantec-dc`, `santander-softtek`, `technest` (overview, architecture, decisions, challenges, stack).
- ✅ **CV migrado**: `cv/cv.md` (única fuente de verdad) + `cv/cv.png`, con copias en `public/cv/` para descarga desde el sitio.
- ✅ **Esqueleto del agente** (`.opencode/`) adaptado al portfolio — ver [`.opencode/README.md`](.opencode/README.md).
- ✅ Repo publicado en GitHub: `jecaro094/portfolio` (público, branch `main`).
- ⏳ **Pendiente**: activar GitHub Pages y decidir la URL final (ver [Publicación](#publicación)).

## Stack

- [Astro](https://astro.build) 5 — generador de sitio estático (HTML/CSS/JS puro)
- CSS vanilla, sin frameworks de UI (design tokens en `src/styles/global.css`)
- Node ≥ 18 (verificado con Node v21)

## Desarrollo local

Requisitos: Node ≥ 18 y npm.

```bash
# 1. Instalar dependencias (solo la primera vez)
npm install

# 2. Servidor de desarrollo con hot-reload
npm run dev          # → http://localhost:4321

# 3. Build de producción (genera dist/)
npm run build

# 4. Servir el build localmente (verificar enlaces antes de publicar)
npm run preview
```

### Comandos útiles

| Comando          | Qué hace                                            |
| ---------------- | --------------------------------------------------- |
| `npm run dev`    | Dev server con hot-reload                           |
| `npm run build`  | Genera `dist/` (estático)                           |
| `npm run preview`| Sirve el build localmente                           |
| `npm run astro`  | CLI de Astro (diagnóstico, sync, etc.)              |

## Estructura

```
portfolio/
├── AGENTS.md                    # reglas de operación del agente del repo
├── astro.config.mjs             # config Astro (site/base comentados — ver Publicación)
├── src/
│   ├── pages/                   # index, projects/ (listado + [slug]), cv/
│   ├── layouts/Layout.astro     # layout base (header, nav, footer)
│   └── styles/global.css        # design tokens y estilos
├── public/                      # favicon, cv/ (descargas), assets estáticos
├── projects/<slug>/             # documentación de experiencia laboral (fuente de contenido)
├── cv/                          # cv.md (única fuente del currículum) + cv.png
└── .opencode/                   # configuración del agente — ver .opencode/README.md
```

### Cómo se generan las páginas

- **Proyectos**: `src/pages/projects/index.astro` y `src/pages/projects/[slug].astro` leen los `.md` de `projects/<slug>/` en build-time. **Añadir un proyecto = crear `projects/<slug>/overview.md` (+architecture/decisions/challenges/stack)** y la página aparece sola.
- **CV**: `src/pages/cv/index.astro` renderiza `cv/cv.md` con formato ligero. **Actualizar el CV = editar `cv/cv.md`** y reconstruir.

## Publicación

Actualmente el repo se llama `portfolio` → la URL de GitHub Pages será:

```
https://jecaro094.github.io/portfolio/
```

### Para activar GitHub Pages (URL con subruta)

1. En GitHub: Settings → Pages → Source: **GitHub Actions** (o "Deploy from a branch" con `main` + `/docs` tras copiar `dist/`).
2. En `astro.config.mjs`, descomentar `base: '/portfolio'` para que los assets carguen bajo la subruta.
3. `npm run build` y publicar `dist/` (el workflow de CI/CD lo hará automáticamente cuando se monte).

### Para migrar a la URL raíz `https://jecaro094.github.io`

1. Renombrar el repo en GitHub a `jecaro094.github.io`.
2. En `astro.config.mjs`: descomentar `site: 'https://jecaro094.github.io'` y eliminar `base`.
3. Montar CI/CD: workflow estándar de Astro + `actions/deploy-pages` (comando `/publish` del agente documenta el flujo).

## Trabajar con el agente (opencode)

Este repo incluye un agente primario (`portfolio-manager`) con comandos propios. Para usarlo:

1. Abre opencode en este directorio (reinicia si ya estaba abierto en otro repo).
2. Comandos disponibles: `/add-project`, `/publish`, `/refresh-cv`.

Más detalle en [`.opencode/README.md`](.opencode/README.md).

## Contacto

- GitHub: [jecaro094](https://github.com/jecaro094)
- Sitio: `https://jecaro094.github.io` (en construcción)