# CI Pipeline Plan

## Platform

GitHub Actions. The repo is already on GitHub, no third-party integration needed, and the free tier covers this workload comfortably.

---

## Trigger

Run on every push to `master` and on every pull request targeting `master`.

---

## Jobs

### 1. Backend tests

**Runner:** `ubuntu-latest`

**Steps:**
1. Checkout code
2. Set up Python 3.13
3. Install dependencies from `requirements.txt`
4. Run `pytest` (config in `pytest.ini` already handles test discovery and the pylama workaround)

**Environment variables needed:**
- No real secrets required — tests use SQLite in-memory and mock all Anthropic calls.
- `SECRET_KEY` can be a dummy value set inline in the workflow.

**Expected output:** 68 tests, ~2s

---

### 2. Frontend tests

**Runner:** `ubuntu-latest`

**Steps:**
1. Checkout code
2. Set up Node 20
3. `npm ci` in `frontend/` (faster and stricter than `npm install` in CI)
4. Run `npx jest --config jest.config.js --watchAll=false --ci`
   - The `--ci` flag disables interactive mode and fails on any warning-as-error
   - Uses `jest.config.js` directly to avoid the `react-scripts` glob issue

**Environment variables needed:** None

**Expected output:** 47 tests, ~10s

---

## Secrets

No secrets needed for the test suite itself. If you later add e2e tests or a deploy step, the following would need to be added to GitHub repo Settings → Secrets:
- `ANTHROPIC_API_KEY` (for any tests that don't mock the API)
- `DATABASE_URL` (only if switching from the default SQLite to a hosted database)

---

## File to create

`.github/workflows/ci.yml` — the standard path GitHub Actions expects.

---

## The workflow file (proposed)

```yaml
name: CI

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  backend:
    name: Backend tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"
          cache: pip

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run pytest
        env:
          SECRET_KEY: ci-secret
        run: pytest

  frontend:
    name: Frontend tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Run Jest
        working-directory: frontend
        run: npx jest --config jest.config.js --watchAll=false --ci
```

---

## Notes / decisions to review

- **Jobs run in parallel** by default in GitHub Actions, so total wall-clock time is ~max(backend, frontend) rather than sum. Both are fast so this isn't critical, but it's a nice property.
- **`npm ci` vs `npm install`** — `npm ci` is preferred in CI because it installs exactly what's in `package-lock.json` and fails if the lockfile is out of sync, catching drift early.
- **Caching** — `actions/setup-python` with `cache: pip` and `actions/setup-node` with `cache: npm` cache the dependency download layer between runs. On a warm cache, install steps drop from ~30s to ~5s.
- **No deploy step included** — this plan covers tests only, as requested.
- **Branch strategy** — currently targeting `master` directly. If you adopt a feature-branch / PR workflow, the `pull_request` trigger already handles that.
- **`pylama` issue** — the `pytest.ini` `addopts = -p no:pylama` already disables the broken plugin, so this is a non-issue in CI (GitHub-hosted runners won't have pylama installed anyway).
