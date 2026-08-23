# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Populate** is a full-stack fantasy content generator. Users create entities (characters, places, items), the app uses the Anthropic Claude API to generate creative fantasy descriptions, and stores them in SQLite. The frontend is React; the backend is Flask.

## Commands

### Backend

```bash
# Run development server (from project root)
python run.py

# Database migrations
flask db migrate -m "description"
flask db upgrade

# Install dependencies (uses uv or pip)
pip install -r requirements.txt
```

Backend runs on `http://localhost:5000`.

### Frontend

```bash
cd frontend

npm start        # Dev server at http://localhost:3000 (proxies API to :5000)
npm run build    # Production build to frontend/build/
npm test         # Run tests
```

## Architecture

### Backend (`app/`)

Layered Flask application:

- **`routes.py`** — HTTP handlers, thin layer that delegates to services
- **`services/entity_service.py`** — Business logic, including Anthropic API calls (`claude-sonnet-4-6`) for the `/api/entities/generate` endpoint
- **`models/entity.py`** — SQLAlchemy model (`id`, `title`, `body`, `created_at`)
- **`__init__.py`** — App factory; registers extensions (SQLAlchemy, Flask-Migrate, CORS)
- **`config.py`** — `DevelopmentConfig` / `ProductionConfig` loaded from `.env`

### Frontend (`frontend/src/`)

- **`api/entities.js`** — All fetch calls to the backend; single source of truth for API endpoints
- **`App.js`** — Root component; holds global state (entity list, selected entity, edit/preview modes)
- **`components/`** — Presentational components; `Sidebar`, `EntityCard`, `EntityDetail`, `AddEntityModal`, `AddEntityForm`, `EditEntityForm`, `PreviewCard`

### Environment

Required `.env` variables (see `.env` for current values):
```
FLASK_APP=run.py
FLASK_ENV=development
DATABASE_URL=sqlite:///populate.db  # optional, this is the default
ANTHROPIC_API_KEY=...
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/entities` | List all |
| POST | `/api/entities` | Create |
| GET | `/api/entities/<id>` | Get one |
| PUT | `/api/entities/<id>` | Update |
| DELETE | `/api/entities/<id>` | Delete |
| POST | `/api/entities/generate` | Generate description via Claude |


## Writing

Write every reply in ASD-STE100 Simplified Technical English, STE-flavored mode.
The full rules are in `.claude/skills/ste-writing/SKILL.md`. Apply them without
being asked. Load that skill when you need the detail.

The short form:

- One instruction per sentence. Max 20 words for an instruction, 25 otherwise.
- Active voice. No contractions. No semicolons.
- Use the short common word. Use one name for one thing.
- No marketing adjectives.

## Style

- Report results. Do not editorialize about them.
- Banned: "honest", "honestly", "worth noting", "to be clear", "the real
  question", "not X but Y", "I do not want to gloss over", "worth saying".
- Do not narrate your own reasoning quality, corrections, or diligence. Fix the
  error in one line. Move on.
- No preamble. No summary paragraph. No closing offer unless asked.
- State a caveat as a plain fact in one sentence, or leave it out.
- Answer the question asked. Do not add adjacent advice.

## Work rules

- Paste raw command output verbatim. The user cannot see tool results.
- Ask before running commands to test a theory. Answer from knowledge first.
- Stay inside this folder. Ask before reading anything outside it.
- The user is QA for the interface. Launch the app and give specific actions to
  try. Do not judge appearance yourself.
- Never put AI attribution in commit messages.