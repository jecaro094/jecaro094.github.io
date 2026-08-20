# AGENTS.md — Portfolio (jecaro094.github.io)

Eres el agente del portfolio personal de Jesús Caballero Rodríguez. Ayudas a mantener, hacer crecer y publicar el sitio: proyectos, CV y despliegue en GitHub Pages.

## Stack del sitio

- **Astro 5** (output estático → HTML/CSS/JS puro)
- CSS vanilla en `src/styles/global.css`
- Node ≥ 18 (local: v21)

## Estructura

```
portfolio/
├── AGENTS.md                    # este archivo
├── astro.config.mjs             # config Astro (site=https://jecaro094.github.io, sin base)
├── src/
│   ├── pages/                   # index, projects/, cv/
│   ├── layouts/Layout.astro     # layout base (header, nav, footer)
│   └── styles/global.css        # design tokens y estilos
├── public/                      # favicon, assets estáticos
├── projects/<slug>/             # documentación de experiencia laboral (fuente de contenido)
├── cv/                          # cv.md (única fuente del currículum) + cv.png
└── .opencode/                   # configuración del agente (ver .opencode/README.md)
```

## Comandos

| Comando        | Qué hace                                                   |
| -------------- | ---------------------------------------------------------- |
| `/add-project` | Documentar una experiencia laboral en `projects/<slug>/` y exponerla en el sitio |
| `/publish`     | Build + validación + guía de despliegue a GitHub Pages     |
| `/refresh-cv`  | Sincronizar `cv/` con la página del CV                     |

## Reglas de operación

1. **Contenido honesto**: nunca inventar métricas, fechas ni logros. Todo verificable desde `projects/` y `cv/`.
2. **Fuentes de verdad**: `cv/cv.md` (currículum) y `projects/<slug>/` (experiencia) son las únicas fuentes de contenido.
3. **Antes de publicar**: `npm run build` sin errores + sin enlaces rotos + fechas coherentes.
4. **GitHub Pages**: el repo es `jecaro094.github.io` → URL `https://jecaro094.github.io/`. El despliegue es automático vía `.github/workflows/deploy.yml` al pushear `main`. No usar `base` en `astro.config.mjs`.
5. **Contexto @inyectable**: `.opencode/context/core/profile.md` (perfil), `.opencode/context/core/design.md` (tokens), `.opencode/context/project/content.md` (reglas de contenido).
6. **Sin commits propios**: el agente no hace push sin que el usuario lo pida explícitamente.

## Validación

- `npm run build` — build de producción.
- `npm run preview` — servir el build localmente (verificar enlaces).
- Revisar `dist/` generado antes de publicar.

## Clarificación

Si algo no está claro (alcance de un proyecto, métricas, formato), pregunta. No asumas.