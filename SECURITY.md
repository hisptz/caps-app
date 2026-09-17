# Security policy

## Supported versions

Reports are accepted against the latest GitHub release and current `main`. Older DHIS2 app zips are not patched unless a Security Advisory says otherwise.

## Reporting a vulnerability

**Do not** open a public issue.

Use **GitHub Private Vulnerability Reporting**:

[https://github.com/hisptz/caps-app/security/advisories/new](https://github.com/hisptz/caps-app/security/advisories/new)

If that form is unavailable, email **[info@hisptanzania.org](mailto:info@hisptanzania.org)** (HISP Tanzania).

Include the app version (`package.json` / release tag), DHIS2 version if relevant, impact, and a reproduction **without** production passwords.

## Scope

- This DHIS2 web app (routes, Route setup, CAPS proxy usage, credentials handling in the browser)
- The GitHub Actions deploy workflow (secrets `DHIS2_USERNAME` / `DHIS2_PASSWORD`)

## Out of scope

- The CAPS backend ([`hisptz/caps-engine`](https://github.com/hisptz/caps-engine)) — report there
- DHIS2 core
- Your local `--proxy` target for `pnpm start`

## Secrets

`.env.example` uses DHIS2 demo `admin` / `district`. Do not commit real instance credentials. `pnpm start` defaults to `--proxy http://localhost:8080`.
