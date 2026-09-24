# The cat (the drawing set's checker)

`Cat.tsx` is a small purpose-built component: it lives on the cover title block's
top rule, naps until woken (click, tap, Enter, or "Wake the cat" in the command
palette), walks along the rule, and holds still under reduced motion. It replaced
the vendored oneko runtime (about 4,500 lines of roaming and pathfinding) that the
previous site used, whose free-roaming perch choice could land on the hero's
primary button on phones (docs/overhaul/AUDIT.md §2, item 11).

The sprite sheet is `public/cat/tuxedo.webp` (8 × 4 frames of 32 px), extracted
from that vendored component's bundled `tuxedo` sheet.

## Credits (carried over from the vendored component)

Component: [oneko.dhrv.pw](https://oneko.dhrv.pw), MIT. The "cat follows the
cursor" idea and the 8×4 sprite layout come from
[adryd325/oneko.js](https://github.com/adryd325/oneko.js), MIT.

The sprite art is **not** covered by that MIT code license and belongs to its
original creators. Provenance of the sheets, as credited by
[oneko-swift](https://github.com/oneko-swift/oneko-swift#credits):

| Skin | Source |
| --- | --- |
| `tuxedo` (the only one shipped) | A generated variant of the community sheets, from the upstream component, derived from Masayuki Koba's original X11 oneko via [adryd325/oneko.js](https://github.com/adryd325/oneko.js) and the [Oneko Source Database](https://github.com/tallypaws/oneko_db) |

The sheet is served as a same-origin image, so no `data:` exception is needed in a Content Security Policy.
