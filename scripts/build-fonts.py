"""Build the self-hosted font files for the site.

    python scripts/build-fonts.py

Downloads the Latin subsets Google Fonts serves for Archivo (variable,
wdth 62-125, wght 100-900) and B612 Mono (400, 700), then:

- instances Archivo down to the axis ranges the design uses
  (wdth 62-100, wght 400-700), which drops about a third of the file;
- keeps B612 Mono as served (it is already a small Latin subset);
- prints @font-face fallback overrides (size-adjust, ascent/descent/line-gap
  overrides) that make a local Arial occupy the same box as each face, so the
  swap from fallback to web font does not shift layout.

Requires fontTools and brotli (pip install fonttools brotli).
"""

import os
import sys
import tempfile
import urllib.request

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

# Arial's metrics, the fallback every target platform has.
ARIAL = {"unitsPerEm": 2048, "xAvgCharWidth": 904, "ascent": 1854, "descent": 434, "lineGap": 67}


def fetch(name, url, tmp):
    path = os.path.join(tmp, name + ".woff2")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req) as resp, open(path, "wb") as fh:
        fh.write(resp.read())
    return path


def avg_width(font):
    """Average advance of lowercase a-z plus space, weighted evenly.

    OS/2.xAvgCharWidth is computed differently across tools, so measure the
    glyphs body text is actually made of instead."""
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    chars = "abcdefghijklmnopqrstuvwxyz "
    widths = [hmtx[cmap[ord(c)]][0] for c in chars if ord(c) in cmap]
    return sum(widths) / len(widths)


def arial_avg():
    # Arial advances for a-z and space (units per 2048 em), from its hmtx.
    arial = [1139, 1139, 1024, 1139, 1139, 569, 1139, 1139, 455, 455, 1024, 455, 1706,
             1139, 1139, 1139, 1139, 682, 1024, 569, 1139, 1024, 1479, 1024, 1024, 1024, 569]
    return sum(arial) / len(arial)


def overrides(font):
    upm = font["head"].unitsPerEm
    hhea = font["hhea"]
    size_adjust = (avg_width(font) / upm) / (arial_avg() / ARIAL["unitsPerEm"])
    return {
        "size-adjust": f"{size_adjust * 100:.2f}%",
        "ascent-override": f"{hhea.ascent / upm / size_adjust * 100:.2f}%",
        "descent-override": f"{abs(hhea.descent) / upm / size_adjust * 100:.2f}%",
        "line-gap-override": f"{hhea.lineGap / upm / size_adjust * 100:.2f}%",
    }


def main():
    os.makedirs(OUT, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        src = {name: fetch(name, url, tmp) for name, url in SOURCES.items()}

        archivo = TTFont(src["archivo"])
        inst = instancer.instantiateVariableFont(archivo, {"wght": (400, 700), "wdth": (62, 100)})
        inst.flavor = "woff2"
        out = os.path.join(OUT, "archivo-var.woff2")
        inst.save(out)
        print(f"archivo-var.woff2  {os.path.getsize(out):>7} bytes")
        print("  fallback", overrides(TTFont(out)))

        for name in ("b612mono-400", "b612mono-700"):
            font = TTFont(src[name])
            font.flavor = "woff2"
            out = os.path.join(OUT, name + ".woff2")
            font.save(out)
            print(f"{name}.woff2  {os.path.getsize(out):>7} bytes")
            if name.endswith("400"):
                print("  fallback", overrides(TTFont(out)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
