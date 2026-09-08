import {
  CELL_SIZE,
  MEDIA_OBSTACLE_SELECTOR,
  MIN_TEXT_OBSTACLE_AREA,
  NEIGHBOR_OFFSETS,
  OBSTACLE_SELECTOR,
  ONEKO_OWN_DOM_SELECTOR,
  SPRITE_RADIUS,
} from "./constants";
import { shouldIncludeObstacleRect, toObstacleRect } from "./obstacle-filters";
import type { ObstacleRect, PathPoint } from "./types";

// Flat index of the neighbor at (r+dr, c+dc), or -1 if it falls outside the grid.
function neighborIndex(
  r: number,
  c: number,
  dr: number,
  dc: number,
  rows: number,
  cols: number,
): number {
  const nr = r + dr;
  const nc = c + dc;
  if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return -1;
  return nr * cols + nc;
}

function isExcludedFromObstacles(element: Element | null): boolean {
  return (
    !element ||
    !!element.closest('[data-oneko-zone="attract"]') ||
    !!element.closest(ONEKO_OWN_DOM_SELECTOR)
  );
}

/**
 * Adds the rendered line boxes of every visible run of text.
 *
 * Element rects alone miss any copy that lives in a span or a div, which is most
 * of it on a typical page. Ranges give the actual laid-out lines instead, so the
 * cat walks around the words rather than around their containers -- it can still
 * use the gap between two short lines, and it no longer strolls across a caption
 * just because the caption was not a <p>.
 */
function collectTextObstacles(rects: ObstacleRect[], vw: number, vh: number): void {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (isExcludedFromObstacles(parent)) return NodeFilter.FILTER_REJECT;
      const style = getComputedStyle(parent!);
      if (style.visibility === "hidden" || style.display === "none" || style.opacity === "0") {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const range = document.createRange();
  let node = walker.nextNode();
  while (node) {
    range.selectNodeContents(node);
    for (const line of range.getClientRects()) {
      if (
        line.width * line.height >= MIN_TEXT_OBSTACLE_AREA &&
        line.right > 0 &&
        line.bottom > 0 &&
        line.left < vw &&
        line.top < vh
      ) {
        rects.push(toObstacleRect(line));
      }
    }
    node = walker.nextNode();
  }
}

export function collectObstacles(): ObstacleRect[] {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rects: ObstacleRect[] = [];

  for (const node of document.querySelectorAll(`${OBSTACLE_SELECTOR},${MEDIA_OBSTACLE_SELECTOR}`)) {
    if (isExcludedFromObstacles(node)) continue;
    const r = node.getBoundingClientRect();
    if (shouldIncludeObstacleRect(r, vw, vh)) {
      rects.push(toObstacleRect(r));
    }
  }
  collectTextObstacles(rects, vw, vh);

  return rects;
}

export function buildGrid(
  rects: ObstacleRect[],
  cols: number,
  rows: number,
  radius: number = SPRITE_RADIUS,
): Uint8Array {
  const grid = new Uint8Array(cols * rows);

  for (const rect of rects) {
    const c0 = Math.max(0, Math.floor((rect.left - radius) / CELL_SIZE));
    const c1 = Math.min(cols - 1, Math.ceil((rect.right + radius) / CELL_SIZE));
    const r0 = Math.max(0, Math.floor((rect.top - radius) / CELL_SIZE));
    const r1 = Math.min(rows - 1, Math.ceil((rect.bottom + radius) / CELL_SIZE));

    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        grid[row * cols + col] = 1;
      }
    }
  }

  return grid;
}

export function worldToCell(worldX: number, worldY: number, cols: number, rows: number): number {
  const col = Math.max(0, Math.min(cols - 1, Math.floor(worldX / CELL_SIZE)));
  const row = Math.max(0, Math.min(rows - 1, Math.floor(worldY / CELL_SIZE)));
  return row * cols + col;
}

function cellToWorld(idx: number, cols: number): PathPoint {
  return {
    x: ((idx % cols) + 0.5) * CELL_SIZE,
    y: (Math.floor(idx / cols) + 0.5) * CELL_SIZE,
  };
}

export function nearestWalkable(
  startIdx: number,
  grid: Uint8Array,
  cols: number,
  rows: number,
): number {
  if (grid[startIdx] === 0) {
    return startIdx;
  }

  const visited = new Uint8Array(grid.length);
  const queue: number[] = [startIdx];
  visited[startIdx] = 1;
  let head = 0;

  while (head < queue.length) {
    const idx = queue[head++];
    const r = Math.floor(idx / cols);
    const c = idx % cols;

    for (const [dr, dc] of NEIGHBOR_OFFSETS) {
      const nIdx = neighborIndex(r, c, dr, dc, rows, cols);
      if (nIdx === -1 || visited[nIdx]) {
        continue;
      }
      visited[nIdx] = 1;
      if (grid[nIdx] === 0) {
        return nIdx;
      }
      queue.push(nIdx);
    }
  }

  return startIdx;
}

function heapBubble(data: [number, number][], i: number): void {
  let idx = i;
  while (idx > 0) {
    const parent = Math.floor((idx - 1) / 2);
    if (data[parent][0] <= data[idx][0]) {
      break;
    }
    const tmp = data[parent];
    data[parent] = data[idx];
    data[idx] = tmp;
    idx = parent;
  }
}

function heapSink(data: [number, number][], i: number): void {
  const n = data.length;
  let idx = i;

  for (let step = 0; step < n; step++) {
    let smallest = idx;
    const left = 2 * idx + 1;
    const right = 2 * idx + 2;
    if (left < n && data[left][0] < data[smallest][0]) {
      smallest = left;
    }
    if (right < n && data[right][0] < data[smallest][0]) {
      smallest = right;
    }
    if (smallest === idx) {
      break;
    }
    const tmp = data[smallest];
    data[smallest] = data[idx];
    data[idx] = tmp;
    idx = smallest;
  }
}

function smoothPath(rawPath: number[], cols: number): PathPoint[] {
  const points = rawPath.map((idx) => cellToWorld(idx, cols));
  if (points.length <= 2) {
    return points;
  }

  const result: PathPoint[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = result.at(-1) as PathPoint;
    const cur = points[i];
    const next = points[i + 1];
    const cross = (cur.x - prev.x) * (next.y - cur.y) - (cur.y - prev.y) * (next.x - cur.x);
    if (Math.abs(cross) > 1e-6) {
      result.push(cur);
    }
  }

  result.push(points.at(-1) as PathPoint);
  return result;
}

function relaxNeighbors(
  idx: number,
  cols: number,
  rows: number,
  grid: Uint8Array,
  dist: Float64Array,
  prev: Int32Array,
  heap: [number, number][],
) {
  const r = Math.floor(idx / cols);
  const c = idx % cols;

  for (const [dr, dc, edgeCost] of NEIGHBOR_OFFSETS) {
    const nIdx = neighborIndex(r, c, dr, dc, rows, cols);
    if (nIdx === -1 || grid[nIdx] === 1) {
      continue;
    }
    if (dr !== 0 && dc !== 0 && (grid[r * cols + c + dc] || grid[(r + dr) * cols + c])) continue;
    const newDist = dist[idx] + edgeCost;
    if (newDist < dist[nIdx]) {
      dist[nIdx] = newDist;
      prev[nIdx] = idx;
      heap.push([newDist, nIdx]);
      heapBubble(heap, heap.length - 1);
    }
  }
}

function searchRoute(
  startIdx: number,
  goalIdx: number,
  grid: Uint8Array,
  cols: number,
  rows: number,
): Int32Array | null {
  const dist = new Float64Array(grid.length).fill(Number.POSITIVE_INFINITY);
  const prev = new Int32Array(grid.length).fill(-1);
  const heap: [number, number][] = [];

  dist[startIdx] = 0;
  heap.push([0, startIdx]);

  while (heap.length > 0) {
    const top = heap.at(0) as [number, number];
    const last = heap.at(-1) as [number, number];
    heap[0] = last;
    heap.pop();
    heapSink(heap, 0);

    const [cost, idx] = top;
    if (idx === goalIdx) {
      break;
    }
    if (cost > dist[idx]) {
      continue;
    }

    relaxNeighbors(idx, cols, rows, grid, dist, prev, heap);
  }

  return Number.isFinite(dist[goalIdx]) ? prev : null;
}

function reconstructCellPath(prev: Int32Array, goalIdx: number): number[] {
  const rawPath: number[] = [];
  let cur = goalIdx;
  while (cur !== -1) {
    rawPath.push(cur);
    cur = prev[cur];
  }
  rawPath.reverse();
  return rawPath;
}

export function findRoute(
  startIdx: number,
  goalIdx: number,
  grid: Uint8Array,
  cols: number,
  rows: number,
): PathPoint[] {
  if (startIdx === goalIdx) {
    return [cellToWorld(startIdx, cols)];
  }

  const prev = searchRoute(startIdx, goalIdx, grid, cols, rows);
  if (!prev) {
    return [];
  }

  return smoothPath(reconstructCellPath(prev, goalIdx), cols);
}
