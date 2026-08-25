# Populate desktop app

Wraps the existing Flask + React app in a Tauri desktop shell. The backend
runs as a bundled sidecar process; the frontend is the same React build
served locally. Each install runs against its own local SQLite file — no
server, no login screen. The Anthropic API key is not wired up in this
build; AI generation is expected to stay a feature only you use elsewhere.

## One-time toolchain setup

Not yet installed on this machine. Needed once, before the first build:

1. Install Rust: https://rustup.rs (`rustup-init.exe`, default options).
2. Install the Tauri CLI: `cargo install tauri-cli --version "^2"`
3. Install the MSVC C++ Build Tools (Rust on Windows needs a linker):
   https://visualstudio.microsoft.com/visual-cpp-build-tools/ — select the
   "Desktop development with C++" workload.

This is a multi-GB, one-time install. Everything else below is already set
up and tested.

## Build

From the project root:

```
uv run python desktop/build.py
```

This runs, in order:
1. `npm run build` in `frontend/` (React production build)
2. PyInstaller, packaging the Flask backend into `desktop/src-tauri/binaries/populate-backend-<target-triple>.exe`
3. `cargo tauri build`, producing the installer

The finished installer(s) (`.msi` and `.exe` from NSIS) are copied to
`dist/` at the project root.

## What's already verified

- `desktop/backend.spec` builds the Flask backend into a single .exe via
  PyInstaller. Verified: it starts on `127.0.0.1:5000`, creates
  `%APPDATA%\Populate\populate.db`, and serves `/api/entities` and
  `/api/auth/me` correctly.
- `frontend/build` builds cleanly via `npm run build`.
- Desktop mode (`DESKTOP_MODE=1`, set by `desktop/backend_entry.py`) skips
  the password login screen, since each install is single-user and local.
- Tauri project files (`Cargo.toml`, `tauri.conf.json`, `src/main.rs`) are
  written but not yet built or run — that needs the Rust toolchain above.

## Regenerating icons

`desktop/make_icons.py` writes placeholder icons to
`desktop/src-tauri/icons/`. Replace those files with real artwork any time;
the build script does not regenerate them.

## Distributing to friends

The installer is unsigned, so Windows SmartScreen will warn on first run.
Friends click "More info" -> "Run anyway". Code signing removes this
warning but needs a paid certificate and is out of scope here.

Each friend's data lives at `%APPDATA%\Populate\populate.db` on their own
machine, independent of everyone else's.
