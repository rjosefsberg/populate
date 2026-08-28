"""Entrypoint for the PyInstaller-packaged backend.

Runs the Flask app on a fixed local port, with the SQLite database stored in
the OS-standard per-user data folder instead of the project directory. Tauri
launches this as a sidecar process and talks to it over localhost.
"""
import os
import sys
from pathlib import Path


def _user_data_dir() -> Path:
    if sys.platform == "win32":
        base = os.environ.get("APPDATA", str(Path.home()))
    elif sys.platform == "darwin":
        base = str(Path.home() / "Library" / "Application Support")
    else:
        base = os.environ.get("XDG_DATA_HOME", str(Path.home() / ".local" / "share"))
    path = Path(base) / "Populate"
    path.mkdir(parents=True, exist_ok=True)
    return path


data_dir = _user_data_dir()
db_path = data_dir / "populate.db"

os.environ.setdefault("DATABASE_URL", f"sqlite:///{db_path}")
os.environ.setdefault("FLASK_ENV", "production")

from app import create_app, db  # noqa: E402
from app import models  # noqa: E402,F401  (registers all tables with db.metadata)

app = create_app("production", instance_path=str(data_dir))

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
