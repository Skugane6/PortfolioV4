// Static stand-in for NetworkField, shown to visitors on narrow viewports or
// with prefers-reduced-motion set — a frozen constellation echoing the same
// node-and-edge network instead of just a plain glow. Hero supplies the
// ambient radial-gradient wash behind this (shared with the live 3D case);
// this component only draws the constellation itself.
const VIEW_WIDTH = 400;
const VIEW_HEIGHT = 340;
const NODE_COUNT = 18;
const MAX_LINK_DISTANCE = 75;
const HUB_STRIDE = 5;

// A tiny seeded PRNG (mulberry32) so the layout is fixed at build time —
// no per-render recomputation, no hydration mismatch, same "random" look
// every load.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20240517);

const nodes = Array.from({ length: NODE_COUNT }, () => ({
  x: random() * VIEW_WIDTH,
  y: random() * VIEW_HEIGHT,
}));

const edges: Array<[number, number]> = [];
for (let i = 0; i < nodes.length; i++) {
  for (let j = i + 1; j < nodes.length; j++) {
    const dx = nodes[i].x - nodes[j].x;
    const dy = nodes[i].y - nodes[j].y;
    if (Math.sqrt(dx * dx + dy * dy) < MAX_LINK_DISTANCE) {
      edges.push([i, j]);
    }
  }
}

export function NetworkFieldFallback() {
  return (
    <div aria-hidden="true" data-testid="network-field-fallback" className="absolute inset-0">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full opacity-60"
      >
        {edges.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="#2f6fdb"
            strokeOpacity={0.35}
            strokeWidth={1}
          />
        ))}
        {nodes.map((node, i) => (
          <circle
            key={i}
            cx={node.x}
            cy={node.y}
            r={i % HUB_STRIDE === 0 ? 3.5 : 2}
            fill={i % HUB_STRIDE === 0 ? '#8fc4ff' : '#4c8dff'}
            fillOpacity={i % HUB_STRIDE === 0 ? 0.8 : 0.65}
          />
        ))}
      </svg>
    </div>
  );
}
