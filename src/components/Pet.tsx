import { Suspense, lazy } from 'react';
import type { OnekoZone } from '../oneko/lib/oneko/zones';

// ~150KB of base64 sprite sheets live behind this import, so it is split into its
// own chunk and pulled in after the page is interactive.
const Oneko = lazy(() => import('../oneko/components/oneko'));

// The cat already treats text line boxes, images and links as unwalkable. These
// are the pieces markup alone does not describe: the canvas the Experience wake
// trails paint on, and the fixed nav rail, which scrolls with nothing and so
// would otherwise be a permanent perch.
const zones: OnekoZone[] = [
  { id: 'nav-rail', type: 'avoid', selector: 'nav[aria-label="Section navigation"]', padding: 16 },
  { id: 'wake-canvas', type: 'avoid', selector: 'canvas', padding: 8 },
];

/**
 * A pixel cat asleep somewhere in the empty space of the hero. Click it and it
 * wakes, trots to another empty perch nearby, and curls up again. It never
 * follows the cursor and never leaves the hero, so it stays out of the way of
 * anyone actually reading the page.
 *
 * Vendored from the oneko shadcn component (MIT) in src/oneko, plus the roam
 * mode added in src/oneko/lib/oneko/roam.ts. The original "cat on a web page"
 * idea and the sprite layout come from oneko.js.
 */
export function Pet() {
  return (
    <Suspense fallback={null}>
      <Oneko
        skin="tuxedo"
        zIndex={30}
        zones={zones}
        // Ignore the pointer entirely, and stay in the hero: the cat hides as
        // soon as the hero scrolls off screen.
        roam
        followCursor={false}
        roamArea="#hero"
        // Asleep until nudged. A click is the only thing that moves it.
        roamNudgeOnly
        // Short hops between perches: 10-30% of the hero's diagonal.
        roamMinHop={0.1}
        roamMaxHop={0.3}
        // The loop ticks at 10fps, so this is px/100ms: a brisk trot, not the
        // darting sprint the cursor-chasing default is tuned for.
        speed={11}
        followDistance={20}
        // Settle and curl up ~0.4s after arriving.
        idleThreshold={400}
        sleepEnabled
        // Big enough to read as a character rather than a stray sprite.
        scale={1.6}
        // Storing a viewport coordinate across visits is wrong for a pet pinned
        // to one section: the layout it was saved against is gone, and it can be
        // restored on top of content or inside a keep-out zone.
        persistPosition={false}
        // No surprise audio or chat bubbles on a portfolio.
        meow={false}
        bubbleEnabled={false}
      />
    </Suspense>
  );
}
