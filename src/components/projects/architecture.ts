import type { ArchEdge, ArchNode } from '../../content/types';

/** Grid metrics for architecture diagrams, in CSS px. */
export const CELL = { w: 172, h: 72, gx: 40, gy: 52, pad: 24 } as const;

export interface PlacedNode extends ArchNode {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Route {
  from: string;
  to: string;
  label?: string;
  points: [number, number][];
}

export interface ArchitectureLayout {
  width: number;
  height: number;
  nodes: PlacedNode[];
  /** The product boundary: spans every column, around the rows holding inside nodes. */
  boundary: { x: number; y: number; w: number; h: number } | null;
  routes: Route[];
}

const BOUNDARY_INSET = 16;

/**
 * Places nodes on their grid cells and routes each edge orthogonally, the way
 * a block diagram is drawn: straight when source and target share a row or
 * column, otherwise one bend, leaving the source on the side facing the
 * target's row so the stroke never crosses a box on the source's own row.
 */
export function layoutArchitecture(nodes: ArchNode[], edges: ArchEdge[]): ArchitectureLayout {
  const cols = Math.max(...nodes.map((n) => n.col)) + 1;
  const rows = Math.max(...nodes.map((n) => n.row)) + 1;
  const width = CELL.pad * 2 + cols * CELL.w + (cols - 1) * CELL.gx;
  const height = CELL.pad * 2 + rows * CELL.h + (rows - 1) * CELL.gy;

  const placed: PlacedNode[] = nodes.map((n) => ({
    ...n,
    x: CELL.pad + n.col * (CELL.w + CELL.gx),
    y: CELL.pad + n.row * (CELL.h + CELL.gy),
    w: CELL.w,
    h: CELL.h,
  }));
  const byId = new Map(placed.map((n) => [n.id, n]));

  const insideRows = nodes.filter((n) => n.inside).map((n) => n.row);
  const boundary = insideRows.length
    ? (() => {
        const top = CELL.pad + Math.min(...insideRows) * (CELL.h + CELL.gy) - BOUNDARY_INSET;
        const bottom = CELL.pad + Math.max(...insideRows) * (CELL.h + CELL.gy) + CELL.h + BOUNDARY_INSET;
        return { x: CELL.pad / 2, y: top, w: width - CELL.pad, h: bottom - top };
      })()
    : null;

  const routes: Route[] = edges.map((e) => {
    const a = byId.get(e.from);
    if (!a) throw new Error(`edge from unknown node "${e.from}"`);
    const acx = a.x + a.w / 2;
    const acy = a.y + a.h / 2;

    if (e.to === 'boundary') {
      if (!boundary) throw new Error(`edge to boundary but no node is inside`);
      const above = a.y + a.h <= boundary.y;
      const points: [number, number][] = above
        ? [
            [acx, a.y + a.h],
            [acx, boundary.y],
          ]
        : [
            [acx, a.y],
            [acx, boundary.y + boundary.h],
          ];
      return { from: e.from, to: e.to, label: e.label, points };
    }

    const b = byId.get(e.to);
    if (!b) throw new Error(`edge to unknown node "${e.to}"`);
    const bcx = b.x + b.w / 2;
    const bcy = b.y + b.h / 2;
    let points: [number, number][];

    if (a.row === b.row) {
      points = b.col > a.col ? [[a.x + a.w, acy], [b.x, bcy]] : [[a.x, acy], [b.x + b.w, bcy]];
    } else if (a.col === b.col) {
      points = b.row > a.row ? [[acx, a.y + a.h], [bcx, b.y]] : [[acx, a.y], [bcx, b.y + b.h]];
    } else if (b.row > a.row) {
      // Target below: drop from the source, then run across into the target's side.
      const entry = b.col > a.col ? b.x : b.x + b.w;
      points = [[acx, a.y + a.h], [acx, bcy], [entry, bcy]];
    } else {
      // Target above: run across on the source's row, then rise into the target.
      const exit = b.col > a.col ? a.x + a.w : a.x;
      points = [[exit, acy], [bcx, acy], [bcx, b.y + b.h]];
    }
    return { from: e.from, to: e.to, label: e.label, points };
  });

  return { width, height, nodes: placed, boundary, routes };
}

/** True when an axis-aligned segment passes through the interior of a box. */
export function segmentCrossesBox(p: [number, number], q: [number, number], box: { x: number; y: number; w: number; h: number }) {
  const [x1, y1] = p;
  const [x2, y2] = q;
  const inset = 1;
  const left = box.x + inset;
  const right = box.x + box.w - inset;
  const top = box.y + inset;
  const bottom = box.y + box.h - inset;
  if (x1 === x2) {
    const lo = Math.min(y1, y2);
    const hi = Math.max(y1, y2);
    return x1 > left && x1 < right && hi > top && lo < bottom;
  }
  const lo = Math.min(x1, x2);
  const hi = Math.max(x1, x2);
  return y1 > top && y1 < bottom && hi > left && lo < right;
}
