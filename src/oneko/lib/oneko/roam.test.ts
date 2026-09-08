import { describe, it, expect } from 'vitest';
import { CELL_SIZE } from './constants';
import { createInitialCatState } from './initial-state';
import { applyRoamArea, isSpotClear, pickNextPivot, resolveRoamArea, tickRoam } from './roam';
import type { CatAnimationDeps } from './animation/deps';
import type { CatRuntimeState, ObstacleRect } from './types';

/**
 * The cat's behaviour is driven off the pathfinding grid, which jsdom cannot
 * produce (it has no layout). These tests build the grid by hand instead, so the
 * roam rules are exercised directly: 0 is open ground, 1 is something to avoid.
 */
function makeState(overrides: Partial<CatRuntimeState> = {}): CatRuntimeState {
  const state = createInitialCatState({
    roam: true,
    roamNudgeOnly: true,
    speed: 10,
    scale: 1,
    opacity: 1,
    rotationAmount: 0,
    idleThreshold: 600,
    freerunChance: 0,
    freerunDuration: 0,
    bubbleEnabled: false,
    bubbleDisplayFrames: 0,
    bubbleCooldown: 0,
    bubbleChance: 0,
    followDistance: 20,
    animationSpeed: 1,
    bubbleText: '',
    meow: false,
    volume: 0,
    laserPointer: false,
  });
  const cols = Math.ceil(window.innerWidth / CELL_SIZE);
  const rows = Math.ceil(window.innerHeight / CELL_SIZE);
  return Object.assign(state, {
    grid: new Uint8Array(cols * rows),
    gridCols: cols,
    gridRows: rows,
    nekoPosX: 100,
    nekoPosY: 100,
    ...overrides,
  });
}

/**
 * A stand-in for the animation's DOM handles. `lastObstacleRefresh` is pinned to
 * the current tick so `applyRoamArea` does not rebuild the grid from the (empty)
 * jsdom document and discard the obstacles a test has set up.
 */
function makeDeps(state: CatRuntimeState): CatAnimationDeps {
  state.lastObstacleRefresh = state.frameCount;
  return {
    stateRef: { current: state },
    el: document.createElement('div'),
    bubbleEl: document.createElement('div'),
  } as unknown as CatAnimationDeps;
}

const wholeViewport = (): ObstacleRect => ({
  left: 0,
  top: 0,
  right: window.innerWidth,
  bottom: window.innerHeight,
});

/** Marks a rectangle of cells as occupied, the way a block of text would. */
function block(state: CatRuntimeState, rect: ObstacleRect) {
  for (let y = Math.floor(rect.top / CELL_SIZE); y <= Math.floor(rect.bottom / CELL_SIZE); y++) {
    for (let x = Math.floor(rect.left / CELL_SIZE); x <= Math.floor(rect.right / CELL_SIZE); x++) {
      if (x >= 0 && y >= 0 && x < state.gridCols && y < state.gridRows) {
        state.grid![y * state.gridCols + x] = 1;
      }
    }
  }
}

describe('roam', () => {
  it('stays put in nudge mode until it is clicked', () => {
    const state = makeState();
    for (let i = 0; i < 50; i++) {
      const target = tickRoam(state, () => 0.5);
      expect(target).toEqual({ x: 100, y: 100 });
    }
    expect(state.roamTarget).toBeNull();
  });

  it('picks a new perch when clicked, then settles again on arrival', () => {
    const state = makeState();
    state.roamWake = true;

    const target = tickRoam(state);
    expect(state.roamTarget).not.toBeNull();
    expect(Math.hypot(target.x - 100, target.y - 100)).toBeGreaterThan(20);

    // Arriving at the perch clears the target, which hands back to the idle
    // machinery so the cat lies down and sleeps.
    state.nekoPosX = target.x;
    state.nekoPosY = target.y;
    const settled = tickRoam(state);
    expect(state.roamTarget).toBeNull();
    expect(settled).toEqual({ x: target.x, y: target.y });
  });

  it('leaves a perch that content has scrolled underneath, without being clicked', () => {
    const state = makeState();
    expect(tickRoam(state)).toEqual({ x: 100, y: 100 });

    block(state, { left: 60, top: 60, right: 140, bottom: 140 });
    const target = tickRoam(state);
    expect(target).not.toEqual({ x: 100, y: 100 });
  });

  it('never chooses a perch that sits on content', () => {
    const state = makeState();
    // Leave only a clear strip down the right-hand side.
    block(state, { left: 0, top: 0, right: window.innerWidth * 0.6, bottom: window.innerHeight });

    for (let i = 0; i < 40; i++) {
      const perch = pickNextPivot(state, wholeViewport(), Math.random);
      if (!perch) continue;
      expect(isSpotClear(state, perch)).toBe(true);
    }
  });

  it('still finds somewhere to go when its cached perches go stale', () => {
    const state = makeState();
    // Prime the cache, then invalidate every remembered perch.
    pickNextPivot(state, wholeViewport(), Math.random);
    state.roamPivots = [
      { x: 300, y: 300 },
      { x: 400, y: 400 },
    ];
    block(state, { left: 260, top: 260, right: 440, bottom: 440 });

    const perch = pickNextPivot(state, wholeViewport(), Math.random);
    expect(perch).not.toBeNull();
    expect(isSpotClear(state, perch!)).toBe(true);
  });

  it('lifts a cat that cannot walk out of where it is standing', () => {
    // Regression: resting exactly on a keep-out boundary counts as outside the
    // zone (so nothing relocates the cat) while the swept-collision test rejects
    // every step across it, leaving the cat pinned with a target it never
    // reaches. Movement is simulated as "blocked" by simply never moving it.
    const state = makeState();
    const deps = makeDeps(state);

    // Genuinely wedged: the ground the cat is standing on is not walkable.
    block(state, { left: 60, top: 60, right: 140, bottom: 140 });
    state.roamTarget = { x: 700, y: 400 };
    const wedgedAt = { x: state.nekoPosX, y: state.nekoPosY };

    for (let i = 0; i < 40; i++) applyRoamArea(deps);

    const movedTo = { x: state.nekoPosX, y: state.nekoPosY };
    expect(movedTo).not.toEqual(wedgedAt);
    expect(isSpotClear(state, movedTo)).toBe(true);
    // And the element itself was moved, not just the internal position.
    expect(deps.el.style.left).not.toBe('');
  });

  it('sleeps where it stopped instead of teleporting on arrival', () => {
    // Regression: the route ends at the nearest walkable cell to the perch, so
    // the cat can come to rest further from its target than the arrival
    // distance and still be holding it. That looked like being wedged, and the
    // cat teleported away a second after settling down to sleep.
    const state = makeState();
    const deps = makeDeps(state);

    // Resting on clear ground, target still set and well out of arrival range.
    state.roamTarget = { x: 700, y: 400 };
    const restedAt = { x: state.nekoPosX, y: state.nekoPosY };

    for (let i = 0; i < 40; i++) applyRoamArea(deps);

    expect({ x: state.nekoPosX, y: state.nekoPosY }).toEqual(restedAt);
    // The target is released, so it settles rather than holding a pose forever.
    expect(state.roamTarget).toBeNull();
  });

  it('leaves a cat that is making progress alone', () => {
    const state = makeState();
    const deps = makeDeps(state);

    state.roamTarget = { x: 700, y: 400 };
    for (let i = 0; i < 40; i++) {
      state.nekoPosX += 5; // walking normally
      applyRoamArea(deps);
    }
    expect(state.roamStuckTicks).toBe(0);
    expect(state.roamTarget).toEqual({ x: 700, y: 400 });
  });

  it('reports no area when its section is missing, which hides the cat', () => {
    const state = makeState();
    state.roamAreaCfg = '#not-in-this-document';
    expect(resolveRoamArea(state)).toBeNull();
  });
});
