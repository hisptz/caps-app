# CAPS — DHIS2 operator app

The CAPS frontend is a **DHIS2 web application** (App Platform) for configuring and monitoring climate → prediction → DHIS2 pipelines. It is not a standalone SPA: DHIS2 hosts it, authenticates the user, and **proxies** CAPS HTTP through a Route (`code: caps` → `routes/caps/run/...`).

The backend lives in [hisptz/caps-engine](https://github.com/hisptz/caps-engine). This repo: [hisptz/caps-app](https://github.com/hisptz/caps-app).

**License:** [BSD 3-Clause](./LICENSE). Copyright © 2026 HISP Tanzania (`package.json` `"license": "BSD-3-Clause"`).

### Features

- Dashboard, pipelines (create/edit), executions, analytics, dead letters, climate data, settings
- First-run **CAPS Route** setup (`CapsSetupGate` / welcome flow)
- Handler config forms aligned with backend handler keys
- DHIS2 org units and data elements via `@dhis2/app-runtime` and `@hisptz/dhis2-ui`

### Tech stack

React 18, TypeScript, DHIS2 App Platform (`@dhis2/cli-app-scripts`, Vite), `@dhis2/ui`, `@dhis2/app-runtime`, TanStack Query v4, react-hook-form + Zod, react-router v7 (`HashRouter`), pnpm (`packageManager`: pnpm 11.5.1).

App title in `d2.config.js`: **CAPS**. Entry: `src/app/App.tsx`.

## Prerequisites

- Node.js (CI uses **24** for lint/typecheck; release workflow uses **22**)
- [pnpm](https://pnpm.io) 11.x (see `package.json` `packageManager`)
- A DHIS2 instance to proxy against in development (default `pnpm start` uses `--proxy http://localhost:8080`, matching `.env.example`)

## Scripts

| Script                       | Command          | What it does                                                                                                       |
| ---------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| Dev                          | `pnpm start`     | `d2-app-scripts start --proxy http://localhost:8080` → [http://localhost:3000](http://localhost:3000)              |
| Test (Jest via App Platform) | `pnpm test`      | `d2-app-scripts test` (tests under `src/`; **no `*.test.*` files in the tree at draft time**)                      |
| E2E                          | `pnpm e2e`       | Playwright (`playwright.config.ts`, `testDir: e2e`, `baseURL` http://127.0.0.1:3000). **`e2e/` has no specs yet.** |
| Typecheck                    | `pnpm typecheck` | `tsc --noEmit`                                                                                                     |
| Lint                         | `pnpm lint`      | ESLint + `prettier -c .`                                                                                           |
| Format                       | `pnpm format`    | Prettier write                                                                                                     |
| Build                        | `pnpm build`     | Production zip under `build/bundle/`                                                                               |
| Deploy                       | `pnpm deploy`    | Upload zip to a DHIS2 instance (App Management authority). Run `pnpm build` first.                                 |

Do **not** use the stock `yarn start` / `yarn test` App Platform boilerplate — this repo is **pnpm**.

## Environment variables

From `.env.example` (DHIS2 **dev credentials for local tooling**, not the CAPS API URL):

| Variable         | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `DHIS2_BASE_URL` | DHIS2 instance URL (example: `http://localhost:8080`) |
| `D2_USERNAME`    | DHIS2 username (example: `admin`)                     |
| `D2_PASSWORD`    | DHIS2 password (example: `district`)                  |

The CAPS backend URL is stored as a **DHIS2 Route** at runtime, not in these env vars. See [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md).

Deploy workflow uses GitHub secrets `DHIS2_USERNAME`, `DHIS2_PASSWORD` and variable `DHIS2_INSTANCE_URL` — those are CI-only, not local `.env` names.

## Hash routing

Client routes must use `HashRouter` so they do not collide with DHIS2 server routing. URLs look like `/#/pipelines/:id`.

## Contributing

[CONTRIBUTING.md](./CONTRIBUTING.md) · [SECURITY.md](./SECURITY.md) · [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

## Learn more

- [DHIS2 Application Platform](https://developers.dhis2.org/docs/app-platform/getting-started)
- [DHIS2 Application Runtime](https://runtime.dhis2.nu/)
