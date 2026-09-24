"""Draw the site mark, a detail-reference bubble with S over K, from Archivo's
own glyph outlines (condensed bold), so the icon needs no font at runtime.

    python scripts/build-icon.py   ->  public/favicon.svg (and prints its path data)

Requires fontTools (pip install fonttools brotli).
"""

import os

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, "public", "fonts", "archivo-var.woff2")

font = instancer.instantiateVariableFont(TTFont(FONT), {"wght": 700, "wdth": 68})
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
upm = font["head"].unitsPerEm
cap = font["OS/2"].sCapHeight or 0.7 * upm

C = 256          # centre of the 512 canvas
R = 200          # bubble radius
CAP_PX = 128     # cap height of each letter on the canvas


def glyph_path(char, cx, baseline):
    name = cmap[ord(char)]
    g = glyphs[name]
    scale = CAP_PX / cap
    # Centre the glyph on its advance-independent bounds.
    from fontTools.pens.boundsPen import BoundsPen

    bp = BoundsPen(glyphs)
    g.draw(bp)
    xmin, _, xmax, _ = bp.bounds
    width = (xmax - xmin) * scale
    dx = cx - width / 2 - xmin * scale
    pen = SVGPathPen(glyphs)
    # Font units are y-up; SVG is y-down.
    g.draw(TransformPen(pen, (scale, 0, 0, -scale, dx, baseline)))
    return pen.getCommands()


# Each letter sits optically centred in its half of the bubble.
s_path = glyph_path("S", C, C - 40)
k_path = glyph_path("K", C, C + 40 + CAP_PX)

svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0f2a4c"/>
  <circle cx="{C}" cy="{C}" r="{R}" fill="none" stroke="#eef3fa" stroke-width="20"/>
  <line x1="{C - R}" y1="{C}" x2="{C + R}" y2="{C}" stroke="#eef3fa" stroke-width="16"/>
  <path fill="#eef3fa" d="{s_path}"/>
  <path fill="#eef3fa" d="{k_path}"/>
</svg>
"""

out = os.path.join(ROOT, "public", "favicon.svg")
with open(out, "w", encoding="utf-8") as fh:
    fh.write(svg)
print("wrote", out, len(svg), "bytes")
