# oneko (vendored)

The pixel cat in the hero. Vendored source, not an npm dependency — it ships as a
shadcn registry component, and this project is not a shadcn project, so the files
were installed by hand from `https://oneko.dhrv.pw/r/oneko.json` and the `@/`
imports rewritten to paths relative to this directory. It has no runtime
dependencies of its own.

Rendered by `src/components/Pet.tsx`, which is the only file that should need
touching to change how the cat behaves.

## Local changes

The upstream component follows the cursor. This one does not, so a few things
were added or changed:

- **`lib/oneko/roam.ts`** (new) — roam mode. The cat lives at a handful of pivot
  points inside one region of the page, sleeps at each until it is clicked, and
  hops to another. Also relocates itself if content scrolls underneath it, or if
  it ends up wedged somewhere it cannot walk out of.
- **`lib/oneko/pathfinding.ts`** — obstacles now include the rendered line boxes
  of visible text, via a `TreeWalker` plus `Range.getClientRects()`. Upstream
  matched a list of tags, which misses any copy inside a `span` or a `div` — most
  of it on a typical page. `buildGrid` also takes the clearance radius as an
  argument so a scaled-up cat gets a correspondingly wider berth.
- **`lib/oneko/constants.ts`** — `SPRITE_RADIUS` is half the sprite rather than a
  quarter, so a walkable cell is one the whole cat fits inside.
- **`lib/oneko/animation/idle.ts`** — in nudge mode the cat curls up as soon as it
  settles instead of taking a detour through the other idle animations.
- **`lib/oneko/dom.ts`**, **`start-cat-animation.ts`**, **`teardown.ts`** — the cat
  is clickable in roam mode, and its own DOM is tagged `data-oneko-ui` so it never
  counts as an obstacle to itself.
- **`lib/oneko/skin-sheets.json`** — trimmed from the upstream 24 coats to the six
  this site can use, which cut the lazy-loaded chunk from 576KB to 135KB gzipped.

`src/oneko/lib/oneko/roam.test.ts` covers the behaviour that is ours.

## Credits

Component: [oneko.dhrv.pw](https://oneko.dhrv.pw), MIT. The "cat follows the
cursor" idea and the 8×4 sprite layout come from
[adryd325/oneko.js](https://github.com/adryd325/oneko.js), MIT.

The sprite art is **not** covered by that MIT code license and belongs to its
original creators. Sheets kept here and their provenance, as credited by
[oneko-swift](https://github.com/oneko-swift/oneko-swift#credits):

| Skin | Source |
| --- | --- |
| `classic` | Masayuki Koba's original X11 oneko, via [adryd325/oneko.js](https://github.com/adryd325/oneko.js) |
| `tora` | Original X11 bitmaps from [tie/oneko](https://github.com/tie/oneko), assembled by oneko-swift |
| `calico`, `ghost` | Community art from the [Oneko Source Database](https://github.com/tallypaws/oneko_db) |
| `tuxedo`, `blue-frost` | Generated variants of the above, from the upstream component |

The sheets are inlined as `data:` URLs, so a Content Security Policy for this site
needs `data:` in `img-src`.
