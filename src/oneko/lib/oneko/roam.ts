import { CELL_SIZE, TILE } from "./constants";
import { containsPoint } from "./zones";
import { refreshGridIfNeeded } from "./animation/grid";
import type { CatAnimationDeps } from "./animation/deps";
import type { CatRuntimeState, ObstacleRect, PathPoint } from "./types";

/**
 * Roam mode: the cat ignores the pointer entirely and instead lives at a small
 * set of pivot points inside one region of the page, napping at each until it is
 * nudged (a click) or the ground under it stops being empty.
 *
 * "Empty" is not guesswork. The pathfinding grid already marks every cell under a
 * line of text, an image or a keep-out zone as unwalkable, so a walkable cell is
 * by construction somewhere with nothing to read underneath.
 */

/** How many candidate points to test when rebuilding the pivot set. */
const PIVOT_SAMPLES = 240;
/** Pivots this close together are the same perch; keep them spread out. */
const MIN_PIVOT_SEPARATION = 90;
/** Enough spots to feel varied, few enough to feel like the cat's regular haunts. */
const MAX_PIVOTS = 6;
/** Keep the cat clear of the very edge of its area. */
const EDGE_MARGIN = 20;

/**
 * One cell of slack around the perch. The grid is already inflated by the cat's
 * drawn radius, so this is a margin, not the body size -- adding the radius again
 * here starved the hero down to a single legal perch and the cat stopped moving.
 */
const PERCH_MARGIN_CELLS = 1;

function isWalkable(s: CatRuntimeState, col: number, row: number): boolean {
  const { grid, gridCols: cols } = s;
  return !!grid && grid[row * cols + col] === 0;
}

function isBlockedByZone(s: CatRuntimeState, point: PathPoint): boolean {
  return s.zoneState.blocked.some((rect) => containsPoint(rect, point));
}

/**
 * A point is only a good perch if the cells around it are clear too, so the cat
 * settles in open space instead of wedging itself between two lines of text.
 */
function hasClearance(s: CatRuntimeState, point: PathPoint): boolean {
  if (!s.grid || s.gridCols === 0 || s.gridRows === 0) return false;
  const cells = PERCH_MARGIN_CELLS;
  const col = Math.floor(point.x / CELL_SIZE);
  const row = Math.floor(point.y / CELL_SIZE);
  for (let r = row - cells; r <= row + cells; r++) {
    for (let c = col - cells; c <= col + cells; c++) {
      if (c < 0 || r < 0 || c >= s.gridCols || r >= s.gridRows) return false;
      if (!isWalkable(s, c, r)) return false;
    }
  }
  return !isBlockedByZone(s, point);
}

/** Whether a spot is still open ground under the current obstacle grid. */
export function isSpotClear(s: CatRuntimeState, point: PathPoint): boolean {
  if (!s.grid || s.gridCols === 0 || s.gridRows === 0) return true;
  const col = Math.floor(point.x / CELL_SIZE);
  const row = Math.floor(point.y / CELL_SIZE);
  if (col < 0 || row < 0 || col >= s.gridCols || row >= s.gridRows) return true;
  return isWalkable(s, col, row) && !isBlockedByZone(s, point);
}

/**
 * The part of the roam area that is actually on screen, or null when the area is
 * missing or scrolled out of view. The cat is hidden whenever this is null, which
 * is what keeps it inside its one section of the page.
 */
export function resolveRoamArea(s: CatRuntimeState): ObstacleRect | null {
  const viewport = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
  if (!s.roamAreaCfg) return viewport;

  const element = document.querySelector(s.roamAreaCfg);
  if (!element) return null;

  const r = element.getBoundingClientRect();
  const clipped = {
    left: Math.max(viewport.left, r.left) + EDGE_MARGIN,
    top: Math.max(viewport.top, r.top) + EDGE_MARGIN,
    right: Math.min(viewport.right, r.right) - EDGE_MARGIN,
    bottom: Math.min(viewport.bottom, r.bottom) - EDGE_MARGIN,
  };
  // Too little of the area left on screen to hold a cat.
  const span = TILE * 3;
  if (clipped.right - clipped.left < span || clipped.bottom - clipped.top < span) return null;
  return clipped;
}

function randomPointIn(area: ObstacleRect, random: () => number): PathPoint {
  return {
    x: area.left + random() * (area.right - area.left),
    y: area.top + random() * (area.bottom - area.top),
  };
}

/**
 * Rebuilds the handful of perches the cat rotates between. Recomputed only when
 * the area or the obstacles move, so the cat keeps returning to the same spots
 * rather than picking somewhere brand new on every hop.
 */
function rebuildPivots(s: CatRuntimeState, area: ObstacleRect, random: () => number): PathPoint[] {
  const pivots: PathPoint[] = [];
  for (let i = 0; i < PIVOT_SAMPLES && pivots.length < MAX_PIVOTS; i++) {
    const candidate = randomPointIn(area, random);
    if (!hasClearance(s, candidate)) continue;
    const crowded = pivots.some(
      (p) => Math.hypot(p.x - candidate.x, p.y - candidate.y) < MIN_PIVOT_SEPARATION,
    );
    if (!crowded) pivots.push(candidate);
  }
  return pivots;
}

/**
 * Last resort when no cached perch is usable: any clear spot in the area at all.
 * Without this the cat can end up with nowhere legal to go and stop responding
 * to clicks entirely.
 */
function sampleClearPoint(
  s: CatRuntimeState,
  area: ObstacleRect,
  random: () => number,
): PathPoint | null {
  for (let i = 0; i < PIVOT_SAMPLES; i++) {
    const candidate = randomPointIn(area, random);
    if (Math.hypot(candidate.x - s.nekoPosX, candidate.y - s.nekoPosY) <= TILE) continue;
    if (hasClearance(s, candidate)) return candidate;
  }
  return null;
}

function pivotSignature(s: CatRuntimeState, area: ObstacleRect): string {
  return [
    Math.round(area.left),
    Math.round(area.top),
    Math.round(area.right),
    Math.round(area.bottom),
    s.obstacleRects.length,
    Math.round(s.scale * 100),
  ].join(":");
}

function ensurePivots(s: CatRuntimeState, area: ObstacleRect, random: () => number): PathPoint[] {
  const signature = pivotSignature(s, area);
  if (signature !== s.roamPivotsSignature || s.roamPivots.length === 0) {
    s.roamPivotsSignature = signature;
    s.roamPivots = rebuildPivots(s, area, random);
  }
  return s.roamPivots;
}

/**
 * The next perch to hop to: near enough to read as "trotting over there", far
 * enough not to look like a twitch. Falls back to the best available option
 * rather than refusing to move.
 */
export function pickNextPivot(
  s: CatRuntimeState,
  area: ObstacleRect,
  random: () => number = Math.random,
): PathPoint | null {
  const usable = () => ensurePivots(s, area, random).filter((p) => hasClearance(s, p));

  // The cached perches are validated against the live grid, so a reflow can
  // invalidate them without changing the signature that guards the cache. Force
  // one rebuild in that case, or the cat is stranded at its last perch forever.
  let pivots = usable();
  if (pivots.length < 2) {
    s.roamPivotsSignature = "";
    pivots = usable();
  }
  if (!pivots.length) return sampleClearPoint(s, area, random);

  const here = { x: s.nekoPosX, y: s.nekoPosY };
  const reach = Math.hypot(area.right - area.left, area.bottom - area.top);
  const min = reach * s.roamMinHopCfg;
  const max = reach * s.roamMaxHopCfg;
  const distance = (p: PathPoint) => Math.hypot(p.x - here.x, p.y - here.y);

  const elsewhere = pivots.filter((p) => distance(p) > TILE);
  if (!elsewhere.length) return sampleClearPoint(s, area, random);

  const nearby = elsewhere.filter((p) => distance(p) >= min && distance(p) <= max);
  // With nothing in the preferred band, take one of the closest perches rather
  // than a random one, so a fallback hop is still a short trot.
  const pool = nearby.length
    ? nearby
    : [...elsewhere].sort((a, b) => distance(a) - distance(b)).slice(0, 3);
  return pool[Math.floor(random() * pool.length)] ?? null;
}

/** Ticks of no progress toward a target before the cat is treated as wedged. */
const STUCK_TICKS = 12;

function placeCat(deps: CatAnimationDeps, point: PathPoint): void {
  const s = deps.stateRef.current;
  s.nekoPosX = point.x;
  s.nekoPosY = point.y;
  s.nekoVelX = 0;
  s.nekoVelY = 0;
  s.currentPath = [];
  s.pathWaypointIdx = 0;
  s.roamTarget = null;
  s.roamStuckTicks = 0;
  deps.el.style.left = `${Math.floor(point.x - TILE / 2)}px`;
  deps.el.style.top = `${Math.floor(point.y - TILE / 2)}px`;
}

/**
 * Frees a cat that cannot walk out of where it is standing.
 *
 * A keep-out zone treats its own boundary as outside itself, so a cat resting
 * exactly on that edge is never relocated, yet the swept-collision test rejects
 * every step it tries to take across the zone -- it has a destination and stays
 * pinned forever. It can also be dropped there outright by a restored position or
 * by a zone appearing on top of it. Walking is attempted first; only a cat that
 * has made no progress for a while is lifted to a clear perch.
 */
function rescueIfStuck(deps: CatAnimationDeps, area: ObstacleRect): void {
  const s = deps.stateRef.current;
  const idle = !s.roamTarget;
  const moved = Math.hypot(s.nekoPosX - s.roamLastX, s.nekoPosY - s.roamLastY) > 0.5;
  s.roamLastX = s.nekoPosX;
  s.roamLastY = s.nekoPosY;

  if (idle || moved) {
    s.roamStuckTicks = 0;
    return;
  }
  if (++s.roamStuckTicks < STUCK_TICKS) return;
  s.roamStuckTicks = 0;

  // Standing still on clear ground is arrival, not wedging. The route ends at
  // the nearest walkable cell to the perch, which can be further away than the
  // arrival distance, so the cat legitimately comes to rest short of its target
  // and still holds it. Snapping it elsewhere here is what made a cat that had
  // just settled down to sleep teleport away a second later.
  if (isSpotClear(s, { x: s.nekoPosX, y: s.nekoPosY })) {
    s.roamTarget = null;
    return;
  }

  const perch = pickNextPivot(s, area, Math.random) ?? s.roamTarget;
  if (perch) placeCat(deps, perch);
}

/**
 * Hides the cat while its area is off screen, and pulls it back inside the area
 * when the page reflows underneath it. Returns false when there is nowhere for
 * the cat to be, which skips the rest of the tick.
 */
export function applyRoamArea(deps: CatAnimationDeps): boolean {
  const s = deps.stateRef.current;
  if (!s.roamCfg) return true;

  // The obstacle grid is normally refreshed further down the tick, which a hidden
  // cat never reaches. Refresh it here so the decision below is made against the
  // current layout -- otherwise hiding is a one-way trip: the cat is judged
  // against the viewport it was hidden in and can never find room again.
  refreshGridIfNeeded(deps);

  const area = resolveRoamArea(s);
  if (!area) {
    deps.el.style.visibility = "hidden";
    deps.bubbleEl.style.visibility = "hidden";
    s.roamTarget = null;
    return false;
  }

  const clampedX = Math.min(Math.max(s.nekoPosX, area.left), area.right);
  const clampedY = Math.min(Math.max(s.nekoPosY, area.top), area.bottom);
  if (clampedX !== s.nekoPosX || clampedY !== s.nekoPosY) {
    placeCat(deps, { x: clampedX, y: clampedY });
  }

  // On a narrow viewport the hero can be packed edge to edge, leaving nowhere
  // the cat could sit without covering something. It stays away entirely rather
  // than perching on the text, and reappears at a real perch if room opens up.
  const standingOnContent = !isSpotClear(s, { x: s.nekoPosX, y: s.nekoPosY });
  if (standingOnContent || s.roamHidden) {
    const perch = pickNextPivot(s, area, Math.random);
    if (!perch) {
      deps.el.style.visibility = "hidden";
      deps.bubbleEl.style.visibility = "hidden";
      s.roamHidden = true;
      s.roamTarget = null;
      return false;
    }
    if (s.roamHidden) {
      placeCat(deps, perch);
      s.roamHidden = false;
    }
  }

  deps.el.style.visibility = "";
  rescueIfStuck(deps, area);
  return true;
}

/**
 * Advances roam state by one tick and returns where the cat should be heading.
 * Returning its own position is what makes it stand still, which hands over to
 * the normal idle machinery so it settles and falls asleep on its own.
 */
export function tickRoam(s: CatRuntimeState, random: () => number = Math.random): PathPoint {
  const here = { x: s.nekoPosX, y: s.nekoPosY };
  const area = resolveRoamArea(s);
  if (!area) return here;

  // Already trotting somewhere.
  if (s.roamTarget) {
    if (Math.hypot(s.roamTarget.x - here.x, s.roamTarget.y - here.y) > s.followDistanceCfg) {
      return s.roamTarget;
    }
    s.roamTarget = null;
    s.roamDwell = 0;
    return here;
  }

  // In nudge mode a click is the only thing that wakes the cat up.
  if (s.roamWake) {
    s.roamWake = false;
    s.roamTarget = pickNextPivot(s, area, random);
    if (s.roamTarget) return s.roamTarget;
  }

  // Scrolling and reflow slide content underneath a sleeping cat, so a perch
  // that was empty when it settled may not be empty a moment later. Move rather
  // than sit on top of what someone is trying to read.
  if (!isSpotClear(s, here)) {
    s.roamTarget = pickNextPivot(s, area, random);
    if (s.roamTarget) return s.roamTarget;
  }

  if (s.roamNudgeOnlyCfg) return here;

  // Timed wandering, for when the cat is not waiting on clicks.
  if (s.roamDwell > 0) {
    s.roamDwell--;
    return here;
  }
  const [min, max] = s.roamDwellRange;
  s.roamDwell = Math.round(min + random() * Math.max(0, max - min));
  s.roamTarget = pickNextPivot(s, area, random);
  return s.roamTarget ?? here;
}
