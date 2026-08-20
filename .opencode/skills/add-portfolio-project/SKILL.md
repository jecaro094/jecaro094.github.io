---
name: add-portfolio-project
description: Estructura una experiencia laboral o proyecto en projects/<slug>/ siguiendo la convención del portfolio. Úsala cuando el usuario describa un proyecto o experiencia pasada en lenguaje natural.
---

# add-portfolio-project

Convierte una descripción en lenguaje natural de experiencia laboral en una entrada estructurada de `projects/<slug>/`.

## Cuándo usarla

- El usuario describe un proyecto/experiencia pasada y quiere documentarlo en el portfolio.
- El usuario pide "documentar", "añadir proyecto", "crear entrada de proyecto".

## Estructura objetivo

```
projects/<slug>/
├── README.md          # índice + timeline de cambios
├── overview.md        # qué es, para qué sirve, contexto
├── architecture.md    # diseño técnico, decisiones clave, trade-offs
├── stack.md           # tecnologías y por qué se eligieron
└── results.md         # métricas y resultados (solo verificables)
```

## Reglas

- **Slug**: kebab-case derivado del nombre (ej. "Quantec DC" → `quantec-dc`).
- **Sin inventar**: métricas, fechas y logros solo si el usuario los menciona; si no, omítelos.
- **Decisión > descripción**: en architecture.md prioriza *por qué* se tomó cada decisión sobre *qué* se implementó.
- **STAR** en overview.md: Situación, Tarea, Acción, Resultado — útil para entrevistas futuras.
- Registra cada cambio en `README.md` del proyecto con fecha.