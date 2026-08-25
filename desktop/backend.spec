# PyInstaller spec for the Populate Flask backend, packaged as a single
# binary that Tauri runs as a sidecar process.
#
# Build with:
#   uv run pyinstaller desktop/backend.spec --distpath desktop/src-tauri/binaries
import sys
from pathlib import Path

block_cipher = None
# PyInstaller execs spec files without setting __file__; SPECPATH is the
# injected equivalent (directory containing this .spec file).
project_root = Path(SPECPATH).resolve().parent

# Rust/Tauri sidecars must be named "<name>-<target-triple>[.exe]". The
# target triple is filled in by desktop/build.py after PyInstaller runs,
# since PyInstaller itself doesn't know it.
a = Analysis(
    ["backend_entry.py"],
    pathex=[str(project_root)],
    binaries=[],
    datas=[
        (str(project_root / "migrations"), "migrations"),
    ],
    hiddenimports=[
        "flask_migrate",
        "flask_sqlalchemy",
        "flask_cors",
        "anthropic",
        "bleach",
        "tinycss2",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="populate-backend",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
