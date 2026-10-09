# Contributing

Thank you for helping to improve this starter. It is meant to be read, run and changed by students,
so small, clear changes are better than clever ones.

## Set up

Follow the [README](README.md): two conda environments, the local PostgreSQL server
(`scripts/db.sh`), `python -m app.migrate`, `python seed.py`, then the API and the frontend.
[docs/api.md](docs/api.md) describes the API, the database and how to add a feature.

## Before you open a pull request

Run these from the project folder (the PostgreSQL server must be running):

```bash
cd backend
ruff check app tests seed.py
ruff format --check app tests seed.py
pytest
cd ../frontend
npm run typecheck
npm test
npm run build
```

Nothing runs automatically on GitHub, so run these commands yourself before you submit a change.

## Browser tests

`scripts/e2e.sh` runs the Playwright tests in `frontend/e2e/` against a throw-away stack. It creates the
database `ecommerce_e2e` on the local PostgreSQL server (which must be running: `scripts/db.sh start`),
starts a second API on port 8100 and a second Vite server on port 5273, runs the tests, then stops both
servers and drops the database, also when a test fails or you press Ctrl+C. It never touches the
development database or the development servers on ports 8000 and 5173.

```bash
scripts/e2e.sh                       # every browser test
scripts/e2e.sh e2e/smoke.e2e.ts      # one file (the path is relative to frontend/)
scripts/e2e.sh --headed              # show the browser window
E2E_CHANNEL=chrome scripts/e2e.sh    # use the Google Chrome installed on this computer
```

With `E2E_CHANNEL=chrome` nothing is downloaded. Otherwise run `npx playwright install chromium` once,
from `frontend/`: it downloads a private Chromium into your user cache folder, needs no administrator
rights and registers nothing in the system (`PLAYWRIGHT_BROWSERS_PATH=0` keeps it inside `node_modules`).
Do not run `npx playwright install --with-deps`: it installs operating-system packages with administrator
rights.

## Conventions

- **Language.** Code, comments, commit messages and documents are in English. Texts that users see
  are Turkish and live in `frontend/src/locales/tr/*.json`; use `t('namespace.key')` in the
  components and never write user-facing text into a component.
- **Tests first.** A new behaviour or a bug fix comes with a test that fails without the change.
  The route-security test (`backend/tests/api/test_route_security.py`) checks every API route
  automatically: a new route must either be listed as public there or require a login.
- **SQL.** Only in `backend/app/repositories/`, always with parameters (`%s`). Build dynamic SQL
  with `psycopg.sql` and a fixed whitelist, never with f-strings.
- **Migrations.** A new numbered file in `backend/migrations/`. Never edit a migration that has
  been applied: the runner stores a checksum and stops when it changes.
- **Secrets.** They live in `backend/.env`, which is git-ignored. Only `.env.example` files are
  committed.
- **Dependencies.** Versions are pinned (`requirements*.txt`, `package.json`). Say in the pull
  request why a new dependency is needed.

## Commits and pull requests

- One topic per pull request, with a short description of what changed and why.
- Commit messages: a short imperative summary (`fix: refuse blank names`), optionally a longer body.
- Describe how you checked the change (tests you ran, screens you tried).

## Security

Please do not open a public issue for a vulnerability. Use the repository's private vulnerability
reporting (the Security tab on GitHub) or contact the owner through their GitHub profile.
