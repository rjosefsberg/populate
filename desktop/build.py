"""One-shot build script for the Populate desktop app.

Runs three steps:
  1. npm run build          -> frontend/build (static React app)
  2. pyinstaller             -> desktop/src-tauri/binaries/populate-backend-<triple>[.exe]
  3. cargo tauri build       -> installer in desktop/src-tauri/target/release/bundle

Requires Node, uv, and the Rust/Tauri toolchain (rustc, cargo, tauri-cli) on
PATH. See desktop/README.md for one-time setup.
"""
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DESKTOP = ROOT / "desktop"
BIN_DIR = DESKTOP / "src-tauri" / "binaries"


def run(cmd, cwd):
    print(f"\n$ {' '.join(cmd)}  (in {cwd})")
    try:
        subprocess.run(cmd, cwd=cwd, check=True, shell=(sys.platform == "win32"))
    except FileNotFoundError:
        raise SystemExit(
            f"Could not run '{cmd[0]}'. It's not on PATH in this shell.\n"
            "If you just installed a tool, close and reopen this terminal so it "
            "picks up the updated PATH, then try again."
        )


def rust_target_triple() -> str:
    try:
        result = subprocess.run(
            ["rustc", "-vV"], capture_output=True, text=True, shell=(sys.platform == "win32")
        )
    except FileNotFoundError:
        raise SystemExit(
            "Could not run 'rustc'. It's not on PATH in this shell.\n"
            "If you just installed Rust, close and reopen this terminal (or run "
            "`refreshenv` if you have it) so it picks up the updated PATH, then try again."
        )
    if result.returncode != 0:
        raise SystemExit(
            "'rustc -vV' failed:\n"
            f"{result.stderr or result.stdout}\n"
            "If Rust was just installed, close and reopen this terminal so it picks up "
            "the updated PATH, then try again."
        )
    for line in result.stdout.splitlines():
        if line.startswith("host:"):
            return line.split(":", 1)[1].strip()
    raise RuntimeError("Could not determine rustc host triple")


def main():
    run(["npm", "run", "build"], cwd=ROOT / "frontend")

    BIN_DIR.mkdir(parents=True, exist_ok=True)
    run(
        ["uv", "run", "pyinstaller", "backend.spec", "--distpath", str(BIN_DIR), "--noconfirm"],
        cwd=DESKTOP,
    )

    triple = rust_target_triple()
    exe_suffix = ".exe" if sys.platform == "win32" else ""
    built = BIN_DIR / f"populate-backend{exe_suffix}"
    target = BIN_DIR / f"populate-backend-{triple}{exe_suffix}"
    shutil.copy2(built, target)
    print(f"Sidecar binary ready: {target}")

    run(["cargo", "tauri", "build"], cwd=DESKTOP / "src-tauri")

    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    bundle_dir = DESKTOP / "src-tauri" / "target" / "release" / "bundle"
    copied = []
    for installer in bundle_dir.rglob("*"):
        if installer.suffix.lower() in (".msi", ".exe", ".dmg", ".app", ".deb", ".appimage"):
            if installer.is_dir():
                continue
            dest = dist / installer.name
            shutil.copy2(installer, dest)
            copied.append(dest)

    print("\nDone. Installer(s) copied to dist/:")
    for path in copied:
        print(f"  {path}")
    if not copied:
        print(f"  (none found — check {bundle_dir})")


if __name__ == "__main__":
    main()
