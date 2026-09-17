# Community files vs source (this repo)

| Source change                                           | Update                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| `package.json` scripts, `packageManager`, `start` proxy | `README.md`, `docs/GETTING_STARTED.md`, `CONTRIBUTING.md`, `SECURITY.md` |
| `d2.config.js`                                          | README title/entry                                                       |
| `.env.example`                                          | README + GETTING_STARTED env tables                                      |
| `src/app/App.tsx` routes                                | GETTING_STARTED route table; bug_report screens                          |
| `src/capsApi/**`                                        | GETTING_STARTED proxy path; CONTRIBUTING DataEngine rule                 |
| Playwright / Jest / `e2e/`                              | GETTING_STARTED + CONTRIBUTING tests                                     |
| `.github/workflows/*.yml`                               | CONTRIBUTING CI; deploy secret/var names in GETTING_STARTED              |
| New `src/` folders                                      | GETTING_STARTED tree                                                     |
