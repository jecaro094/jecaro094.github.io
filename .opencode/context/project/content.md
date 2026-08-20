# Reglas de contenido — Portfolio

## Tono y estilo

- Español (idioma principal del sitio). Inglés permitido para términos técnicos y títulos de proyectos.
- Honesto y verificable: nada de métricas inventadas.
- Conciso: cada proyecto en 1-2 frases en el listado, detalle en su página propia.

## Estructura de proyecto (en `projects/<slug>/`)

1. `overview.md` — qué es, para qué sirve, contexto (formato STAR si aplica).
2. `architecture.md` — decisiones de diseño, trade-offs, por qué se eligió cada pieza.
3. `stack.md` — tecnologías con justificación breve.
4. `results.md` — métricas/resultados solo si son reales y verificables.

## Páginas del sitio

- `src/pages/index.astro` — landing: nombre, tagline, links principales.
- `src/pages/projects/` — listado de proyectos (una página por proyecto).
- `src/pages/cv/` — currículum (fuente: `cv/cv.md`).

## Validación antes de publicar

- `npm run build` sin errores.
- Sin enlaces rotos.
- Fechas coherentes.
- CV sincronizado con proyectos.