# Design tokens — Portfolio

Sistema de diseño del sitio. Mantener coherencia visual en todas las páginas.

## Paleta

| Token          | Valor    | Uso                          |
| -------------- | -------- | ---------------------------- |
| `--bg`         | #0f1115  | Fondo principal (dark)       |
| `--fg`         | #e6e8eb  | Texto principal              |
| `--muted`      | #9aa0a8  | Texto secundario             |
| `--accent`     | #4f8cff  | Links, highlights, CTAs      |
| `--border`     | #262a33  | Bordes y separadores         |

## Tipografía

- Sistema: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- Mono (para código/slugs): monospace

## Principios

- Dark-first, minimalista, legible.
- Los proyectos se muestran como tarjetas con slug, stack y 1-2 líneas de descripción.
- Cero dependencias externas de UI: CSS puro en `src/styles/global.css`.

## Layout

- Header fijo con brand + nav (Proyectos, CV).
- Contenido centrado, max-width 900px.
- Footer con copyright y año actual.