"""
manage.py — dev lifecycle script for Populate

Usage:
  python manage.py start     # start backend + frontend dev servers
  python manage.py stop      # stop running servers
  python manage.py run       # start everything (alias for start)
  python manage.py build     # build React frontend
  python manage.py db        # flask db migrate + upgrade
"""

import argparse
import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent
FRONTEND = ROOT / "frontend"
PID_FILE = ROOT / ".manage_pids.json"

VENV_PYTHON = ROOT / ".venv" / "Scripts" / "python.exe"
PYTHON = str(VENV_PYTHON) if VENV_PYTHON.exists() else sys.executable


def run_cmd(cmd, cwd=None, env=None):
    """Run a command, stream output, and exit on failure."""
    print(f"  $ {' '.join(str(c) for c in cmd)}")
    result = subprocess.run(cmd, cwd=cwd, env=env)
    if result.returncode != 0:
        sys.exit(result.returncode)


def start_background(cmd, cwd=None, label=""):
    """Start a command in the background; return its PID."""
    proc = subprocess.Popen(
        cmd,
        cwd=cwd,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0,
    )
    print(f"  [{label}] started (pid {proc.pid})")
    return proc.pid


def save_pids(pids: dict):
    PID_FILE.write_text(json.dumps(pids))


def load_pids() -> dict:
    if PID_FILE.exists():
        return json.loads(PID_FILE.read_text())
    return {}


def cmd_start():
    existing = load_pids()
    if existing:
        print("Servers appear to already be running. Run `python manage.py stop` first.")
        sys.exit(1)

    print("Starting backend…")
    backend_pid = start_background([PYTHON, "run.py"], cwd=ROOT, label="backend")

    print("Starting frontend…")
    npm = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_pid = start_background([npm, "start"], cwd=FRONTEND, label="frontend")

    save_pids({"backend": backend_pid, "frontend": frontend_pid})
    print("\nBoth servers running.")
    print("  Backend  -> http://localhost:5000")
    print("  Frontend -> http://localhost:3000")
    print("\nStop with: python manage.py stop")


def cmd_stop():
    pids = load_pids()
    if not pids:
        print("No running servers found (no .manage_pids.json).")
        return

    for label, pid in pids.items():
        try:
            if sys.platform == "win32":
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(pid)],
                               capture_output=True)
            else:
                os.kill(pid, signal.SIGTERM)
            print(f"  [{label}] stopped (pid {pid})")
        except (ProcessLookupError, OSError):
            print(f"  [{label}] already gone (pid {pid})")

    PID_FILE.unlink(missing_ok=True)
    print("Done.")


def cmd_build():
    print("Building React frontend…")
    npm = "npm.cmd" if sys.platform == "win32" else "npm"
    run_cmd([npm, "run", "build"], cwd=FRONTEND)
    print("Build complete → frontend/build/")


def cmd_db():
    env = {**os.environ, "FLASK_APP": "run.py"}
    flask = ROOT / ".venv" / "Scripts" / "flask.exe"
    flask_cmd = str(flask) if flask.exists() else "flask"

    print("Running flask db migrate…")
    subprocess.run([flask_cmd, "db", "migrate"], cwd=ROOT, env=env)

    print("Running flask db upgrade…")
    run_cmd([flask_cmd, "db", "upgrade"], cwd=ROOT, env=env)
    print("Database up to date.")


def main():
    parser = argparse.ArgumentParser(description="Populate app manager")
    parser.add_argument(
        "command",
        choices=["start", "stop", "run", "build", "db"],
        help="Command to run",
    )
    args = parser.parse_args()

    commands = {
        "start": cmd_start,
        "run": cmd_start,
        "stop": cmd_stop,
        "build": cmd_build,
        "db": cmd_db,
    }
    commands[args.command]()


if __name__ == "__main__":
    main()