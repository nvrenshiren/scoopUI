# scoopUI Web UI Design Integration

## Design source

The shared source of visual tokens and interaction patterns is the COHESION design system in `D:\Work\dawi\design` (version `2.0.0` at the time of this integration). Follow its `README.md`, `DESIGN.md`, and `theme/` configuration. This app keeps its existing product identity, Tauri/React stack, shadcn/Radix components, and Windows desktop scope.

The application uses the COHESION shadcn New York / Neutral foundation and its generated brand tokens. Do not add a second palette or hand-maintain a competing color scale in this project. The shared brand configuration is the source for primary, link, focus, and semantic states. The application keeps its dark default and light/system choices.

## Token sync

Generated files in `src/theme/` are checked in so builds do not depend on another checkout:

- `cohesion-shadcn.css` — generated shadcn semantic tokens from `preview/shadcn/tokens.css`.
- `cohesion-semantic.css` — semantic status and canvas tokens derived by the shared theme factory and brand atmosphere configuration.

Refresh both files with:

```powershell
npm run sync:cohesion
```

The script reads `D:\Work\dawi\design` by default. Other machines should set `COHESION_DESIGN_ROOT` to a checkout of the intended COHESION version. It fails clearly when the source files or factory are missing. Do not edit generated token files directly.

## Application conventions

- Keep Scoop package names, versions, paths, CLI output, and configuration keys in a monospace stack; use the system UI stack for other text to preserve offline startup and Windows readability.
- Use a compact navigation rail and task-oriented content density. Tables remain vertically scrollable and keep their existing keyboard access and row actions.
- Use canvas atmosphere only as a low contrast background detail. Keep primary, information, success, warning, and danger colors tied to their semantic roles.
- Keep focus rings visible, labels bilingual, destructive actions explicit, and cancellation neutral. Respect the system reduced-motion preference.
- Preserve all existing business behavior and state contracts in `docs/prd/`, `docs/architecture/`, and `docs/acceptance/`; these govern functionality, while the COHESION system governs visual styling.
