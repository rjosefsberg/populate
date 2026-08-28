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
  `%APPDATA%\Populate\populate.db`, and serves `/api/entities` correctly.
- `frontend/build` builds cleanly via `npm run build`.
- Tauri project files (`Cargo.toml`, `tauri.conf.json`, `src/main.rs`) are
  written but not yet built or run — that needs the Rust toolchain above.

## Regenerating icons

`desktop/make_icons.py` writes placeholder icons to
`desktop/src-tauri/icons/`. Replace those files with real artwork any time;
the build script does not regenerate them.

## Distributing to friends

Three things that don't hold on a genuinely clean Windows install, and how
this build handles (or doesn't handle) each:

- **WebView2 Runtime.** Tauri renders through it; Windows 11 ships it,
  Windows 10 usually has it via Windows Update but that's not guaranteed
  offline. `tauri.conf.json` sets `webviewInstallMode: offlineInstaller`,
  which bundles the full WebView2 installer (~120MB) into our installer —
  no internet needed on the friend's machine, at the cost of a bigger
  download.
- **Antivirus / Defender false positives.** PyInstaller's single-file
  bootloader commonly trips Defender's heuristics, and the installer is
  unsigned on top of that. A friend's first run may get quarantined rather
  than just SmartScreen-warned. No fix without code signing (paid cert,
  out of scope here) — worth testing on a real clean VM before wide
  distribution, and warning friends it may happen.
- **Windows SmartScreen.** Unsigned installer, so SmartScreen warns on
  first run regardless. Friends click "More info" -> "Run anyway".

Each friend's data lives at `%APPDATA%\Populate\populate.db` on their own
machine, independent of everyone else's.
