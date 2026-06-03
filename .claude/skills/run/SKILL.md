---
description: Launch the Populate Flask backend and React frontend dev servers
---

# Running Populate

Two servers must run in parallel: Flask on :5000 and React on :3000. The React dev server proxies `/api/*` to Flask.

## Prerequisites

- `.env` at project root with `FLASK_APP=run.py`, `FLASK_ENV=development`, `ANTHROPIC_API_KEY`
- Python deps installed (`pip install -r requirements.txt`)
- Node deps installed (`cd frontend && npm install`)

## Launch

Start both servers from the project root (Windows PowerShell):

```powershell
# Backend — Flask on http://localhost:5000
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python run.py"

# Frontend — React on http://localhost:3000
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"
```

Or in two separate terminals:

```
# Terminal 1 (project root)
python run.py

# Terminal 2
cd frontend
npm start
```

## Smoke test

```powershell
# Backend health
curl http://localhost:5000/api/entities

# Frontend (proxies to backend)
curl http://localhost:3000/api/entities
```

Both should return a JSON array.

## Notes

- `run.py` prints `Database connected successfully` on startup; a failure message means `.env` is misconfigured.
- React hot-reloads on save; Flask restarts automatically in debug mode.
- Port 3000 or 5000 already in use → find the PID with `netstat -ano | findstr :3000` and kill it, or set `PORT=3001` before `npm start`.
