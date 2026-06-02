# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Populate** is a full-stack fantasy content generator. Users create entities (characters, places, items), the app uses the Anthropic Claude API to generate creative fantasy descriptions, and stores them in PostgreSQL. The frontend is React; the backend is Flask.

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
DATABASE_URL=postgresql://user:pass@localhost:5432/populate
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