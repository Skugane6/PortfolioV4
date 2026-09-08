import {
  CELL_SIZE,
  SPRITE_RADIUS,
  TILE,
  OBSTACLE_INTERVAL,
  PATH_RECALC_INTERVAL,
  PATH_RECALC_MOUSE_CELLS,
} from "../constants";
import { buildGrid, collectObstacles } from "../pathfinding";
import type { CatAnimationDeps } from "./deps";
import { recalculatePath } from "./movement";

export function refreshGridIfNeeded(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  if (s.frameCount - s.lastObstacleRefresh < OBSTACLE_INTERVAL) {
    return;
  }
  const softObstacles = collectObstacles().filter(
    (rect) =>
      !s.zoneState.favorites.some(
        ({ rect: favorite }) =>
          rect.left >= favorite.left &&
          rect.right <= favorite.right &&
          rect.top >= favorite.top &&
          rect.bottom <= favorite.bottom,
      ),
  );
  s.obstacleRects = [...softObstacles, ...s.zoneState.blocked];
  s.lastObstacleRefresh = s.frameCount;
  s.gridCols = Math.ceil(window.innerWidth / CELL_SIZE);
  s.gridRows = Math.ceil(window.innerHeight / CELL_SIZE);
  // A scaled-up cat needs a correspondingly wider berth around every obstacle.
  const radius = Math.max(SPRITE_RADIUS, (TILE / 2) * (s.scale || 1));
  s.grid = buildGrid(s.obstacleRects, s.gridCols, s.gridRows, radius);
  s.lastPathRecalcFrame = -PATH_RECALC_INTERVAL;
}

export function recalcPathIfNeeded(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  const mouseCol = Math.floor(s.zoneState.movementTarget.x / CELL_SIZE);
  const mouseRow = Math.floor(s.zoneState.movementTarget.y / CELL_SIZE);
  const mouseMoved =
    Math.abs(mouseCol - s.lastPathTargetCol) > PATH_RECALC_MOUSE_CELLS ||
    Math.abs(mouseRow - s.lastPathTargetRow) > PATH_RECALC_MOUSE_CELLS;
  if (s.frameCount - s.lastPathRecalcFrame >= PATH_RECALC_INTERVAL || mouseMoved) {
    recalculatePath(deps);
  }
}
