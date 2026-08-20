# Estructura del agente — `.opencode/`

Este directorio configura el **agente que mantiene el repo del portfolio** (opencode). Sigue la misma arquitectura por capas del repo job-search (`AGENTS.md` + `agents/` + `commands/` + `context/` + `skills/`), pero con contenido adaptado a las tareas del portfolio: contenido, CV y publicación — sin arrastrar la lógica de búsqueda de empleo.

## Estado inicial

> Este esqueleto se creó el **2026-08-20** como referencia operativa. Los archivos son el punto de partida: se espera que evolucionen con el uso (nuevos comandos, skills, contexto).

## Árbol de archivos

```
.opencode/
├── opencode.json                  # config del proyecto (default_agent, comandos registrados)
├── agents/
│   └── core/
│       └── portfolio-manager.md   # agente primario del portfolio
├── commands/
│   ├── add-project.md             # documentar experiencia laboral en projects/<slug>/
│   ├── publish.md                 # build + validación + guía de despliegue a Pages
│   └── refresh-cv.md              # sincronizar cv/ con la página del CV
├── context/
│   ├── core/
│   │   ├── profile.md             # perfil profesional (fuente de contexto del agente)
│   │   └── design.md              # design tokens del sitio (paleta, tipografía, layout)
│   └── project/
│       └── content.md             # reglas de contenido editorial
└── skills/
    └── add-portfolio-project/
        └── SKILL.md               # skill para estructurar proyectos en projects/<slug>/
```

## Qué hace cada capa

| Capa      | Propósito                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------- |
| `opencode.json` | Config del proyecto: agente por defecto (`portfolio-manager`), registro de comandos.          |
| `agents/` | Define el/los agente(s). `portfolio-manager` es el primario: orquesta contenido, CV y publicación.  |
| `commands/` | Prompts invocables con `/`: acciones repetibles y verificables (añadir proyecto, publicar, CV).  |
| `context/` | Conocimiento @inyectable: perfil del candidato, tokens de diseño, reglas de contenido.              |
| `skills/` | Procedimientos reutilizables que el agente carga bajo demanda (lazy loading).                       |

## Cómo funciona

1. **Abrir opencode en este repo** → carga `opencode.json` + `AGENTS.md` + el agente `portfolio-manager`.
2. **Contexto @**: el agente puede referenciar `.opencode/context/core/profile.md`, `core/design.md` y `project/content.md` con `@` para criterios específicos.
3. **Comandos**:
   - `/add-project` — el usuario describe una experiencia en lenguaje natural y el agente estructura `projects/<slug>/` (+ página en el sitio).
   - `/publish` — build, preflight de contenido y guía de despliegue a GitHub Pages.
   - `/refresh-cv` — sincroniza `cv/cv.md` con la página del CV.
4. **Skills (lazy loading)**: `add-portfolio-project` se carga solo cuando el usuario describe un proyecto.

## Convenciones y reglas clave

- **Contenido honesto**: nunca inventar métricas, fechas ni logros; todo verificable desde `projects/` y `cv/`.
- **Fuentes de verdad**: `cv/cv.md` (currículum) y `projects/<slug>/` (experiencia) son las únicas fuentes.
- **Sin commits propios**: el agente no hace push sin petición explícita.
- **Validación**: `npm run build` sin errores antes de dar nada por bueno.

## Cómo extenderlo

- **Nuevo comando**: crear `.opencode/commands/<nombre>.md` (frontmatter `description` + `agent`) y registrarlo en `opencode.json` si procede.
- **Nuevo skill**: crear `.opencode/skills/<nombre>/SKILL.md` con frontmatter `name` + `description` (obligatoria para que se cargue).
- **Nuevo contexto**: añadir `.md` en `context/core/` o `context/project/` y referenciarlo con `@`.
- **Nuevo agente**: crear `.opencode/agents/<nombre>.md` (frontmatter `description`, `mode: primary|subagent`).

> ⚠️ Los cambios en `opencode.json`/agentes/commands/skills se cargan al **reiniciar opencode**.

## Origen

La arquitectura está inspirada en el repo `job-search` (mismo patrón AGENTS.md + capas `.opencode/`), adaptada y simplificada para el portfolio. Decisión registrada en memoria Engram (`portfolio-repo`).