---
description: Añade o actualiza un proyecto del portfolio usando proyectos/ como fuente.
agent: portfolio-manager
---

Añade o actualiza un proyecto del portfolio a partir de la descripción que el usuario proporcione.

1. Si el usuario describe experiencia laboral o un proyecto en lenguaje natural, carga la skill `add-portfolio-project` para estructurarla siguiendo la convención de `projects/<slug>/`.
2. Crea/actualiza:
   - `projects/<slug>/overview.md` — qué es y para qué sirve
   - `projects/<slug>/architecture.md` — diseño técnico, decisiones
   - `projects/<slug>/stack.md` — tecnologías usadas
3. Si el proyecto debe aparecer en el sitio, crea o actualiza la página correspondiente en `src/pages/projects/`.
4. Registra el cambio en el timeline de `projects/<slug>/README.md` (o créalo si no existe).
5. Valida: `npm run build` y comprueba que la página del proyecto se genera sin errores.

Sé riguroso con los datos: no inventes métricas, fechas ni logros que el usuario no haya mencionado.