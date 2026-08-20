---
description: Build + validación + guía de despliegue a GitHub Pages.
agent: portfolio-manager
---

Ejecuta el pipeline de publicación del portfolio.

1. **Build**: `npm run build` — debe terminar sin errores.
2. **Preflight de contenido**:
   - Comprueba que no haya enlaces rotos en las páginas generadas (busca referencias a rutas inexistentes).
   - Verifica que `cv/` esté sincronizado con la página de CV.
   - Confirma que las fechas de los proyectos sean coherentes.
3. **Guía de despliegue** (según el estado actual):
   - Hoy: el repo se llama `portfolio` → la URL de Pages será `https://jecaro094.github.io/portfolio/` (requiere `base: '/portfolio'` en `astro.config.mjs`).
   - Futuro: renombrar el repo a `jecaro094.github.io` para URL raíz → descomentar `site` en `astro.config.mjs` y quitar `base`.
4. **CI/CD**: cuando el usuario lo pida, crea `.github/workflows/deploy.yml` con el workflow estándar de Astro + actions/deploy-pages.
5. Reporta al usuario: URL de preview local (`npm run preview`), URL de producción esperada y estado del build.