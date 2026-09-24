"""Build the self-hosted font files for the site.

    python scripts/build-fonts.py

Downloads the Latin subsets Google Fonts serves for Archivo (variable,
wdth 62-125, wght 100-900) and B612 Mono (400, 700), then:

- instances Archivo down to the axis ranges the design uses
  (wdth 62-100, wght 400-700), which drops about a third of the file;
- keeps B612 Mono as served (it is already a small Latin subset);
- subsets both to the characters the site renders (CHARSET below).

The fallback @font-face sizes in src/design/tokens.css are measured, not
computed here: see scripts/audit/measure-fallback.mjs.

Requires fontTools and brotli (pip install fonttools brotli).
"""

import os
import sys
import tempfile
import urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "fonts")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

SOURCES = {
    "archivo": "https://fonts.gstatic.com/s/archivo/v25/k3kQo8UDI-1M0wlSfdnoLg.woff2",
    "b612mono-400": "https://fonts.gstatic.com/s/b612mono/v16/kmK_Zq85QVWbN1eW6lJV0A7d.woff2",
    "b612mono-700": "https://fonts.gstatic.com/s/b612mono/v16/kmK6Zq85QVWbN1eW6lJdayvIpcVO.woff2",
}

# Every character the site renders: printable ASCII, Latin-1, and the
# punctuation and symbols in use. Check new copy against this when adding
# symbols (a glyph outside it falls back to the system font).
CHARSET = (
    "".join(chr(c) for c in range(0x20, 0x7F))
    + "".join(chr(c) for c in range(0xA0, 0x100))
    + "–—‘’“”•…←↑→↓↕▾−×°·"
    + "⌘≈≥Σσ "
)


def subset_font(font):
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["kern", "liga", "calt", "tnum", "lnum", "case", "ccmp", "locl", "mark", "mkmk"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    sub = subset.Subsetter(opts)
    sub.populate(text=CHARSET)
    sub.subset(font)
    return font




def fetch(name, url, tmp):
    path = os.path.join(tmp, name + ".woff2")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req) as resp, open(path, "wb") as fh:
        fh.write(resp.read())
    return path


def main():
    os.makedirs(OUT, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        src = {name: fetch(name, url, tmp) for name, url in SOURCES.items()}

        archivo = TTFont(src["archivo"])
        inst = instancer.instantiateVariableFont(archivo, {"wght": (400, 700), "wdth": (62, 100)})
        inst = subset_font(inst)
        inst.flavor = "woff2"
        out = os.path.join(OUT, "archivo-var.woff2")
        inst.save(out)
        print(f"archivo-var.woff2  {os.path.getsize(out):>7} bytes")

        for name in ("b612mono-400", "b612mono-700"):
            font = subset_font(TTFont(src[name]))
            font.flavor = "woff2"
            out = os.path.join(OUT, name + ".woff2")
            font.save(out)
            print(f"{name}.woff2  {os.path.getsize(out):>7} bytes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
