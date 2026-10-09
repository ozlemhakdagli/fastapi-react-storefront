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

GitHub Actions runs the same commands for every pull request.

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

Please do not open a public issue for a vulnerability. Contact the maintainer privately.
