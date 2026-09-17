# Getting started (CAPS DHIS2 app)

Operator console for CAPS, installed as a DHIS2 web app. The browser never calls the CAPS API on another origin: DHIS2 **Routes** proxy to the backend (`CAPS_ROUTE_CODE = 'caps'`, prefix `routes/caps/run` in `src/capsApi/capsRoute.ts`).

Backend repo: [hisptz/caps-engine](https://github.com/hisptz/caps-engine).

## Stack

| Layer           | In this repo                                                                              |
| --------------- | ----------------------------------------------------------------------------------------- |
| App             | DHIS2 App Platform (`d2.config.js` → `src/app/App.tsx`)                                   |
| UI              | React 18, `@dhis2/ui`, `@hisptz/dhis2-ui`                                                 |
| Data            | `@dhis2/app-runtime` (`useDataQuery` / DataEngine); TanStack Query v4 for CAPS list state |
| Forms           | react-hook-form + Zod                                                                     |
| Routing         | `react-router` v7 **`HashRouter`**                                                        |
| Package manager | pnpm 11 (`pnpm-lock.yaml`, `pnpm-workspace.yaml` hoist patterns for DHIS2)                |
| Lint            | ESLint (`@dhis2/config-eslint`) + Prettier                                                |
| Unit tests      | `d2-app-scripts test` (Jest)                                                              |
| E2E             | Playwright (`pnpm e2e`)                                                                   |
| Release         | semantic-release → zip in `build/bundle/`                                                 |

## Prerequisites

- Node 22–24 (CI typecheck/eslint uses 24; release job uses 22)
- pnpm 11.5.x (`package.json` `packageManager` field)
- A DHIS2 instance for `pnpm start --proxy` and for Route setup

## Install and run

```bash
git clone https://github.com/hisptz/caps-app.git
cd caps-app
cp .env.example .env
pnpm install
pnpm start
```

Open [http://localhost:3000](http://localhost:3000). The start script is:

```text
d2-app-scripts start --proxy http://localhost:8080
```

`.env.example` is for DHIS2 CLI credentials, not CAPS:

```
DHIS2_BASE_URL=http://localhost:8080
D2_USERNAME=admin
D2_PASSWORD=district
```

On first load, if no DHIS2 Route with `code:eq:caps` exists, `CapsSetupGate` shows welcome/setup so you can register the CAPS base URL. After that, UI routes:

| Hash path          | Page             |
| ------------------ | ---------------- |
| `#/`               | Dashboard        |
| `#/pipelines`      | Pipelines        |
| `#/pipelines/:id`  | Pipeline detail  |
| `#/executions`     | Executions       |
| `#/executions/:id` | Execution detail |
| `#/analytics`      | Analytics        |
| `#/dead-letters`   | Dead letters     |
| `#/climate-data`   | Climate data     |
| `#/settings`       | Settings         |
| `#/about`          | About            |

## Tests and quality

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm e2e          # starts `pnpm start` if needed (playwright.config.ts)
pnpm build
```

Playwright uses `testDir: 'e2e'` and iPhone 12 viewport. There are **no e2e spec files** in the tree yet, so `pnpm e2e` may report an empty suite.

CI does not run Jest or Playwright today.

## Project structure

```
caps-app/
├── src/
│   ├── app/App.tsx              # shell: QueryClient, CapsSetupGate, HashRouter, routes
│   ├── capsApi/                 # CAPS HTTP via DHIS2 DataEngine (client, endpoints, Route helpers)
│   ├── pages/                   # route screens
│   ├── modules/                 # pipelines, monitoring, climate-data, settings, welcome, handlers, …
│   ├── shared/                  # AppMenu, CapsSetupGate, HandlerConfigForms, types
│   ├── styles/
│   ├── queryClient.ts
│   └── setupTests.js
├── i18n/
├── public/
├── e2e/                         # Playwright (configured; specs not present at draft time)
├── d2.config.js
├── viteConfigExtensions.mts
├── playwright.config.ts
├── package.json
├── pnpm-lock.yaml
└── .env.example
```

## Deploy

```bash
pnpm build
pnpm deploy
```

`deploy` prompts for server URL and a DHIS2 user with App Management. GitHub `deploy.yml` (on published release) runs `pnpm run deploy --username ${{ secrets.DHIS2_USERNAME }} --password ${{ secrets.DHIS2_PASSWORD }} ${{ vars.DHIS2_INSTANCE_URL }}`.

## Next

- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [README.md](../README.md)
