# Contributing to CAPS (DHIS2 app)

Thanks for helping improve the operator console. This repository is the **frontend**. Pipeline execution lives in [`hisptz/caps-engine`](https://github.com/hisptz/caps-engine).

## Code of conduct

[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

## How we work

1. Search [existing issues](https://github.com/hisptz/caps-app/issues).
2. Use the issue templates. Security: [SECURITY.md](./SECURITY.md), not a public issue.
3. Branch from `main`, open a PR with [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md).
4. Target **`main`**. semantic-release runs on push to `main` and attaches the `build/bundle/*.zip` asset.

## Setup

See [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md).

```bash
cp .env.example .env
pnpm install
pnpm start
```

Dev server: [http://localhost:3000](http://localhost:3000). `pnpm start` proxies to `http://localhost:8080` (override the `--proxy` flag if your DHIS2 is elsewhere).

## Commands

| Task                           | Command          |
| ------------------------------ | ---------------- |
| Install                        | `pnpm install`   |
| Dev                            | `pnpm start`     |
| Typecheck                      | `pnpm typecheck` |
| Lint (ESLint + Prettier check) | `pnpm lint`      |
| Format                         | `pnpm format`    |
| Unit tests                     | `pnpm test`      |
| Playwright                     | `pnpm e2e`       |
| Production zip                 | `pnpm build`     |
| Deploy zip to DHIS2            | `pnpm deploy`    |

CI (`.github/workflows/ci.yml`) on push to `main` and on pull requests: `pnpm typecheck`, `pnpm exec eslint`, `pnpm exec prettier -c .`. It does **not** currently run `pnpm test` or `pnpm e2e`.

Pre-commit (Husky) runs lint-staged (ESLint `--max-warnings=0` + Prettier on JS/TS; Prettier on css/json/md/yml).

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/). Releases on `main` depend on `feat` / `fix` / breaking markers (`package.json` version is updated by semantic-release).

Examples: `fix(pipelines): reset form errors on edit`, `feat(settings): persist route URL`.

There is no commitlint hook; please still match the convention.

## Pull requests

- Keep PRs focused.
- Do not switch `HashRouter` to `BrowserRouter`.
- CAPS HTTP must go through `src/capsApi` (`routes/caps/run`), not a hard-coded backend origin in the browser.
- User-facing strings: `@dhis2/d2-i18n` `i18n.t()`.
- Forms: React Hook Form + Zod (`FormProvider`), matching existing pipeline modals.
- No secrets or real instance passwords in the diff.

## Questions

Use [GitHub issues](https://github.com/hisptz/caps-app/issues). Security: [SECURITY.md](./SECURITY.md). Other questions: [info@hisptanzania.org](mailto:info@hisptanzania.org).
