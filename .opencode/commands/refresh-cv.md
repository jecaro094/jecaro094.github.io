---
description: Sincroniza el CV desde cv/ y regenera las páginas derivadas.
agent: portfolio-manager
---

Sincroniza el currículum.

1. `cv/cv.md` es la única fuente de verdad del CV.
2. Si hay cambios:
   - Regenera/actualiza `src/pages/cv/index.astro` (o la página que exponga el CV en el sitio).
   - Re-exporta `cv/cv.png` si procede (o actualiza el enlace de descarga).
3. Verifica coherencia: fechas, empresas, skills y enlaces (LinkedIn, GitHub) deben coincidir con `projects/`.
4. Ejecuta `npm run build` para validar.
5. Actualiza la fecha de "última actualización" visible en la página del CV.