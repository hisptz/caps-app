---
name: update-community-docs
description: >-
    Keeps this DHIS2 app’s open-source community files in sync with source. Use
    after changing package.json scripts or proxy URL, d2.config.js, .env.example,
    App.tsx routes, capsApi, Playwright/Jest, or CI/deploy workflows; and when
    the user mentions README, CONTRIBUTING, SECURITY, GETTING_STARTED, or GitHub
    issue/PR templates.
---

# Update community docs (caps-app)

After a source change that affects how people install, run, test, deploy, or contribute, patch community files in this repo in the **same turn**.

Read [file-map.md](file-map.md).

## Files

`README.md`, `docs/GETTING_STARTED.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/*.yml`. Touch `CODE_OF_CONDUCT.md` only for contact/name changes. **Do not modify LICENSE.**

## Workflow

1. Map the diff via [file-map.md](file-map.md).
2. Edit in place; keep headings; patch facts only (scripts, proxy URL, env names, hash routes, CI, deploy secrets _names_).
3. If unknown, `<!-- TODO: … -->` — do not invent env vars absent from `.env.example` / `package.json`. Contact is info@hisptanzania.org; owner is HISP Tanzania; do not rewrite LICENSE.
4. Mention updated files in the summary (or why none changed).

## Rules

- Truth: `package.json`, `d2.config.js`, `App.tsx`, `src/capsApi`, CI YAML, Playwright/Jest config.
- Org/repo from `git remote` (default `hisptz/caps-app`).
- Contact: info@hisptanzania.org. CODEOWNERS: `@hisptz` + that email.
- Keep HashRouter, Conventional Commits, and CAPS-via-DHIS2-Route unless those files change.
- Be honest if Jest/e2e suites are empty; do not claim CI runs tests unless the workflow does.
