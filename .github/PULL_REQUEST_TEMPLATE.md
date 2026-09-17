## Summary

<!-- What and why. Link issues with Fixes #nnn when applicable. -->

## Type of change

- [ ] `feat` — new capability (minor)
- [ ] `fix` — bug fix (patch)
- [ ] `docs` — documentation only
- [ ] `refactor` / `chore` / `ci` / `test`
- [ ] Breaking change (`feat!` / `BREAKING CHANGE:` in the commit)

## How to verify

<!-- e.g. pnpm start, screens, pnpm lint, pnpm typecheck -->

## Checklist

- [ ] Conventional Commit title (semantic-release on `main`)
- [ ] `pnpm lint` and `pnpm typecheck` pass
- [ ] HashRouter unchanged; CAPS calls still go through `src/capsApi`
- [ ] User-facing strings use `i18n.t()` where you added UI copy
- [ ] No secrets or production DHIS2 passwords in the diff
- [ ] I have read [CONTRIBUTING.md](../CONTRIBUTING.md)
