"""Generates placeholder app icons with no external dependencies.

Draws a simple solid rounded-square glyph at each required size and writes
plain PNGs, plus a .ico that embeds the PNG bytes (a format modern Windows
and Tauri both accept). Replace these with real artwork later by dropping
new files at the same paths.
"""
import struct
import zlib
from pathlib import Path

ICON_DIR = Path(__file__).resolve().parent / "src-tauri" / "icons"
BG = (91, 74, 173, 255)   # a plain indigo square as a stand-in mark
FG = (240, 236, 255, 255)


def make_png(size: int) -> bytes:
    pad = max(2, size // 8)
    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            inside = pad <= x < size - pad and pad <= y < size - pad
            r, g, b, a = FG if inside else BG
            row += bytes((r, g, b, a))
        rows.append(b"\x00" + bytes(row))
    raw = b"".join(rows)

    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data))
        )

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    idat = zlib.compress(raw, 9)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


def make_ico(png_bytes_by_size: dict) -> bytes:
    sizes = sorted(png_bytes_by_size)
    header = struct.pack("<HHH", 0, 1, len(sizes))
    entries = b""
    offset = 6 + 16 * len(sizes)
    images = b""
    for size in sizes:
        data = png_bytes_by_size[size]
        dim = size if size < 256 else 0
        entries += struct.pack(
            "<BBBBHHII", dim, dim, 0, 0, 1, 32, len(data), offset
        )
        images += data
        offset += len(data)
    return header + entries + images


def main():
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    sizes = {
        "32x32.png": 32,
        "128x128.png": 128,
        "128x128@2x.png": 256,
    }
    pngs = {}
    for name, size in sizes.items():
        data = make_png(size)
        (ICON_DIR / name).write_bytes(data)
        pngs[size] = data
        print(f"wrote {name}")

    ico_sizes = {16: make_png(16), 32: pngs[32], 48: make_png(48), 256: pngs[256]}
    (ICON_DIR / "icon.ico").write_bytes(make_ico(ico_sizes))
    print("wrote icon.ico")


if __name__ == "__main__":
    main()
