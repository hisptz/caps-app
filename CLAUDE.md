# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm start          # Dev server at http://localhost:3000
pnpm build          # Production build (outputs to build/bundle/)
pnpm test           # Run tests
pnpm lint           # ESLint + Prettier check
pnpm format         # Auto-format with Prettier
pnpm deploy         # Deploy to a DHIS2 instance
```

Run a single test file:

```bash
pnpm test -- --testPathPattern=App.test
```

## Architecture

This is a **DHIS2 Web Application** built on the [DHIS2 App Platform](https://developers.dhis2.org/docs/app-platform/getting-started) using React 18, TypeScript, and Vite.

**Entry point:** `d2.config.js` points to `src/App.tsx`, which is the root component loaded by the DHIS2 app adapter.

**Routing:** Uses `HashRouter` (required for DHIS2 server compatibility — do not switch to `BrowserRouter`). Routes are defined in `App.tsx`.

**Data fetching:** All DHIS2 API calls go through `@dhis2/app-runtime`'s `useDataQuery` hook. This is the standard pattern — avoid direct `fetch` calls to the DHIS2 API.

**Path alias:** `@/*` resolves to `src/*` (configured in both `tsconfig.json` and `viteConfigExtensions.mts`).

**i18n:** Use `@dhis2/d2-i18n`'s `i18n.t()` for any user-facing strings. Strings are extracted to `i18n/en.pot`.

**CSS:** Component-scoped CSS Modules (`.module.css`). Global styles via plain CSS.

**Forms (recommended):** Use **React Hook Form** + **Zod** (`zodResolver`) + **`FormProvider`**. Colocate Zod schemas under `src/features/<feature>/schemas/`. For **modals**, follow `PipelineCreateModal` / `PipelineEditModal`: wrap content in `FormProvider`, put a real `<form id="…">` with `onSubmit={form.handleSubmit(…)}` inside `ModalContent`, use **`Controller`** for `@dhis2/ui` fields (`value` / `onChange` with `value ?? ''` for strings), map API failures with **`form.setError('root', …)`** or field-level `setError`, show root issues with **`NoticeBox`**, and wire the primary action with **`type="submit"`** + **`form="…"`** from `ModalActions` so the submit button stays outside the form DOM. Call **`form.reset(…)`** + **`clearErrors()`** in a `useEffect` when the modal opens (or when the edited entity changes). For full-page forms (settings, welcome), the same stack applies; keep a stable `form` id when the submit control is not nested inside the `<form>`.

## Key Libraries

- `@dhis2/app-runtime` — data queries, mutations, current user context
- `@dhis2/ui` — DHIS2 design system components (buttons, tables, inputs, etc.)
- `react-router` v7 — client-side routing

## DHIS2-Specific Notes

- The `@dhis2/cli-app-scripts` toolchain wraps Vite; most build config lives in `viteConfigExtensions.mts`.
- `pnpm-workspace.yaml` configures public hoisting for DHIS2 packages — do not remove those hoist patterns.
- The build artifact is a `.zip` file deployable directly to a DHIS2 instance.

<!-- SPECKIT START -->

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan at:
`specs/001-pipeline-config-crud/plan.md`

<!-- SPECKIT END -->

<!-- code-review-graph MCP tools -->

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool                        | Use when                                               |
| --------------------------- | ------------------------------------------------------ |
| `detect_changes`            | Reviewing code changes — gives risk-scored analysis    |
| `get_review_context`        | Need source snippets for review — token-efficient      |
| `get_impact_radius`         | Understanding blast radius of a change                 |
| `get_affected_flows`        | Finding which execution paths are impacted             |
| `query_graph`               | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes`     | Finding functions/classes by name or keyword           |
| `get_architecture_overview` | Understanding high-level codebase structure            |
| `refactor_tool`             | Planning renames, finding dead code                    |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
