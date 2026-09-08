import type { CSSProperties, ReactNode } from 'react';
import { IdeFrame } from './IdeFrame';

// The scene is authored against a fixed 900x760 coordinate space and scaled
// to fit by useStageTilt, so every offset here is a plain pixel number that
// lines up with the SVG connectors drawn in the same space. Moving a panel
// means moving its polyline to match — the two are deliberately in one
// coordinate system rather than one being a percentage of the other.
const STAGE_WIDTH = 900;
const STAGE_HEIGHT = 760;

// Connector routes, shared by the dashed base layer and the bright pulse
// that travels along it, so the two can never drift apart.
const CONNECTORS = [
  { points: '120,210 120,265 230,265', pulse: '4.2s linear infinite' },
  { points: '555,175 555,200 620,200 620,225', pulse: '5.4s linear infinite 1.1s' },
  { points: '95,380 95,305 230,305', pulse: '4.8s linear infinite 2.2s' },
  { points: '532,594 532,620 400,620 400,555', pulse: '5.8s linear infinite .6s' },
  // No pulse on this one — it runs behind the IDE for most of its length.
  { points: '190,505 250,505 250,672 372,672', pulse: null },
];

// Square terminals sitting at the origin end of each connector.
const TERMINALS = [
  { x: 120, y: 210 },
  { x: 555, y: 175 },
  { x: 95, y: 380 },
  { x: 532, y: 594 },
  { x: 372, y: 672 },
];

const NODES = [
  { cx: 230, cy: 265, delay: '0s' },
  { cx: 620, cy: 225, delay: '.8s' },
  { cx: 230, cy: 305, delay: '1.6s' },
  { cx: 400, cy: 555, delay: '2.4s' },
];

interface StagePanelProps {
  /** left / top / width / height in the stage's own coordinate space. */
  position: CSSProperties;
  /** Per-panel parallax weights. z sets its depth in the 3D stack. */
  depth: { x: number; y: number; z: number };
  /** `animation` shorthand for the idle float. */
  float: string;
  /** Chrome overrides layered onto the shared panel surface. */
  surface?: CSSProperties;
  children: ReactNode;
}

// Three nested elements on purpose: the outer one holds the pointer
// parallax, the middle one the idle float, and the inner one the chrome.
// Collapsing them would put two independent animations on one transform.
function StagePanel({ position, depth, float, surface, children }: StagePanelProps) {
  return (
    <div
      className="absolute"
      style={{
        ...position,
        transform: `translate3d(calc(var(--mx, 0) * ${depth.x}px), calc(var(--my, 0) * ${depth.y}px), ${depth.z}px)`,
      }}
    >
      <div className="hero-anim h-full w-full" style={{ animation: float }}>
        <div
          className="flex h-full w-full flex-col rounded-md"
          style={{
            border: '1px solid rgba(84,146,246,.6)',
            background: 'rgba(8,20,42,.78)',
            boxShadow: '0 0 26px rgba(38,104,232,.28), inset 0 0 34px rgba(20,58,138,.35)',
            padding: '14px 16px',
            ...surface,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function DeployStep({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-xs" style={{ color: '#cfdff7' }}>
      <span
        className="flex h-[15px] w-[15px] items-center justify-center rounded-full text-[9px]"
        style={{ border: '1px solid #4f8bf0', color: '#7fb0ff' }}
      >
        ✓
      </span>
      {label}
    </div>
  );
}

function SolutionItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-[11px] text-[12.5px]" style={{ color: '#cfdff7' }}>
      <span
        className="h-[7px] w-[7px] rounded-full"
        style={{ background: '#5b95ef', boxShadow: '0 0 8px rgba(91,149,239,.9)' }}
      />
      {label}
    </div>
  );
}

// Height / reveal-delay pairs for the impact chart. The last bar is the
// "now" column and gets the brighter gradient.
const IMPACT_BARS = [
  { height: '34%', delay: '.7s' },
  { height: '52%', delay: '.82s' },
  { height: '42%', delay: '.94s' },
  { height: '70%', delay: '1.06s' },
  { height: '92%', delay: '1.18s' },
];

export function HeroStage() {
  return (
    <div
      className="relative"
      style={{
        width: STAGE_WIDTH,
        height: STAGE_HEIGHT,
        transformStyle: 'preserve-3d',
        // --mx / --my are written every frame by useStageTilt; the constants
        // are the scene's resting attitude when the pointer is centred.
        transform:
          'perspective(2100px) rotateX(calc(5deg + 2.5deg * var(--my, 0))) rotateY(calc(21deg + 4deg * var(--mx, 0))) rotateZ(-1.6deg)',
      }}
    >
      <svg
        viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`}
        className="absolute inset-0 overflow-visible"
        style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform: 'translateZ(10px)' }}
      >
        {/* Dashed base routes */}
        <g fill="none" stroke="#3d76cc" strokeWidth="1.2" strokeDasharray="6 6">
          {CONNECTORS.map((connector) => (
            <polyline
              key={connector.points}
              points={connector.points}
              className="hero-anim"
              style={{ animation: 'hero-dash-flow 14s linear infinite' }}
            />
          ))}
        </g>

        {/* Bright packet travelling each route */}
        <g
          fill="none"
          stroke="#9fc6ff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="16 900"
          opacity=".95"
        >
          {CONNECTORS.filter((connector) => connector.pulse).map((connector) => (
            <polyline
              key={connector.points}
              points={connector.points}
              className="hero-anim"
              style={{ animation: `hero-pulse-travel ${connector.pulse}` }}
            />
          ))}
        </g>

        {/* Diamond terminals */}
        <g fill="#6fa4f5">
          {TERMINALS.map((terminal) => (
            <rect
              key={`${terminal.x}-${terminal.y}`}
              x={terminal.x - 4}
              y={terminal.y - 4}
              width="8"
              height="8"
              transform={`rotate(45 ${terminal.x} ${terminal.y})`}
            />
          ))}
        </g>

        {/* Pulsing junctions */}
        <g fill="#8fbcff">
          {NODES.map((node) => (
            <circle
              key={`${node.cx}-${node.cy}`}
              cx={node.cx}
              cy={node.cy}
              r="3.2"
              className="hero-anim"
              style={{ animation: `hero-node-pulse 3.4s ease-in-out infinite ${node.delay}` }}
            />
          ))}
        </g>

        {/* The one warm annotation in the scene — a runtime callout. Its
            elbow starts at x=724 rather than x=700: the IDEAS panel's right
            edge is at 700 and carries its own parallax, so an elbow flush
            against it slid under the panel on half the pointer positions and
            took the RUNTIME OK label with it. */}
        <g stroke="#e08a3c" strokeWidth="1.1" fill="none" opacity=".8">
          <path d="M724,318 L784,318 L784,280" />
          <circle cx="724" cy="318" r="3.4" fill="#e08a3c" stroke="none" />
        </g>

        {/* Dimension line under the IDE. It stops at x=420 rather than
            running the IDE's full width: past that it passed underneath the
            SCALABLE SOLUTIONS panel, and the rotation pulls the two layers
            apart enough for the rule and its label to read as a collision. */}
        <g stroke="#2f4c78" strokeWidth="1" fill="none">
          <path d="M230,700 L420,700" />
          <path d="M230,694 L230,706 M420,694 L420,706" />
        </g>

        <g fill="#5f86c8" fontFamily="'JetBrains Mono', monospace" fontSize="11" letterSpacing="2.4">
          <text x="243" y="690">
            IDE · 470 × 330
          </text>
          <text x="790" y="276">
            RUNTIME OK
          </text>
          <text x="16" y="600" opacity=".7">
            PLANE 02
          </text>
        </g>

        {/* Registration crosshairs */}
        <g fill="#2f4c78" fontFamily="'JetBrains Mono', monospace" fontSize="14">
          <text x="300" y="60">
            +
          </text>
          <text x="770" y="420">
            +
          </text>
          <text x="150" y="740">
            +
          </text>
          <text x="440" y="480" opacity=".5">
            +
          </text>
        </g>
      </svg>

      {/* Deploy checklist — the frontmost panel */}
      <StagePanel
        position={{ left: 20, top: 60, width: 200, height: 150 }}
        depth={{ x: 20, y: 12, z: 160 }}
        float="hero-float-a 11s ease-in-out infinite"
        surface={{ gap: '12px' }}
      >
        <div
          className="flex items-center justify-between font-mono text-[9px] tracking-[0.26em]"
          style={{ color: '#9dc0f2' }}
        >
          <span>DEPLOY</span>
          <span style={{ color: '#5b86cc' }}>—</span>
        </div>
        <div className="flex flex-col gap-[11px]">
          <DeployStep label="Build" />
          <DeployStep label="Test" />
          <DeployStep label="Deploy" />
        </div>
      </StagePanel>

      {/* Ideas to impact ladder — sits behind the stage plane */}
      <StagePanel
        position={{ left: 500, top: 25, width: 200, height: 150 }}
        depth={{ x: -8, y: -6, z: -30 }}
        float="hero-float-b 13s ease-in-out infinite"
        surface={{
          justifyContent: 'space-between',
          border: '1px solid rgba(84,146,246,.55)',
          background: 'rgba(8,20,42,.72)',
          boxShadow: '0 0 22px rgba(38,104,232,.22), inset 0 0 30px rgba(20,58,138,.3)',
        }}
      >
        <div className="flex flex-col gap-[7px]">
          <div className="flex items-start justify-between">
            <span
              className="font-mono text-xs tracking-[0.14em]"
              style={{ color: '#dce8fb' }}
            >
              IDEAS
            </span>
            <span className="text-[13px] leading-none" style={{ color: '#6f9dee' }}>
              +
            </span>
          </div>
          <span className="h-px" style={{ background: 'rgba(96,150,245,.28)' }} />
          <span className="font-mono text-xs tracking-[0.14em]" style={{ color: '#dce8fb' }}>
            CODE
          </span>
          <span className="h-px" style={{ background: 'rgba(96,150,245,.28)' }} />
          <span className="font-mono text-xs tracking-[0.14em]" style={{ color: '#dce8fb' }}>
            PRODUCTS
          </span>
          <span className="h-px" style={{ background: 'rgba(96,150,245,.28)' }} />
        </div>
        <div className="flex items-end justify-between">
          <span className="font-mono text-xs tracking-[0.14em]" style={{ color: '#7fb0ff' }}>
            IMPACT
          </span>
          <span className="text-[13px] leading-none" style={{ color: '#6f9dee' }}>
            +
          </span>
        </div>
      </StagePanel>

      {/* Impact chart */}
      <StagePanel
        position={{ left: 0, top: 380, width: 190, height: 150 }}
        depth={{ x: 24, y: 14, z: 130 }}
        float="hero-float-b 10s ease-in-out infinite 1.4s"
        surface={{
          gap: '10px',
          padding: '13px 15px 12px',
          background: 'rgba(8,20,42,.8)',
          boxShadow: '0 0 26px rgba(38,104,232,.26), inset 0 0 32px rgba(20,58,138,.32)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] text-[8px]"
              style={{ border: '1px solid #4f8bf0', color: '#7fb0ff' }}
            >
              ▥
            </span>
            <span
              className="font-mono text-[9px] tracking-[0.2em]"
              style={{ color: '#9dc0f2' }}
            >
              REAL-WORLD IMPACT
            </span>
          </div>
          <span className="text-[10px]" style={{ color: '#5b86cc' }}>
            —
          </span>
        </div>
        <div className="font-mono text-[7px] tracking-[0.22em]" style={{ color: '#3f6098' }}>
          USERS · SYSTEMS · UPTIME · SPEED
        </div>
        <div
          className="flex flex-1 items-end gap-[9px] px-0.5 pb-1"
          style={{ borderBottom: '1px solid rgba(96,150,245,.3)' }}
        >
          {IMPACT_BARS.map((bar, index) => (
            <span
              key={bar.delay}
              className="hero-anim flex-1 origin-bottom"
              style={{
                height: bar.height,
                background:
                  index === IMPACT_BARS.length - 1
                    ? 'linear-gradient(180deg, #7fb0ff, #2f6fe0)'
                    : 'linear-gradient(180deg, #5b95ef, #24518f)',
                animation: `hero-bar-grow 1s cubic-bezier(.2,.8,.2,1) ${bar.delay} both`,
              }}
            />
          ))}
        </div>
        <div
          className="flex justify-between font-mono text-[7px] tracking-[0.18em]"
          style={{ color: '#3f6098' }}
        >
          <span>Q1</span>
          <span>Q2</span>
          <span>Q3</span>
          <span>Q4</span>
          <span>NOW</span>
        </div>
      </StagePanel>

      {/* Scalable solutions */}
      <StagePanel
        position={{ left: 452, top: 594, width: 260, height: 170 }}
        depth={{ x: -12, y: -8, z: -10 }}
        float="hero-float-a 12s ease-in-out infinite .8s"
        surface={{
          gap: '14px',
          padding: '16px 18px',
          border: '1px solid rgba(84,146,246,.58)',
          background: 'rgba(8,20,42,.75)',
          boxShadow: '0 0 24px rgba(38,104,232,.24), inset 0 0 32px rgba(20,58,138,.3)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-[18px] w-[18px] items-center justify-center rounded-[3px] text-[9px]"
            style={{ border: '1px solid #4f8bf0', color: '#7fb0ff' }}
          >
            ▦
          </span>
          <span className="font-mono text-xs tracking-[0.16em]" style={{ color: '#e2ecfd' }}>
            SCALABLE SOLUTIONS
          </span>
        </div>
        <div className="flex flex-col gap-[11px]">
          <SolutionItem label="Web Applications" />
          <SolutionItem label="Automations" />
          <SolutionItem label="Better Workflows" />
        </div>
        <div
          className="mt-auto flex items-center justify-between font-mono text-[8px] tracking-[0.22em]"
          style={{ color: '#3f6098' }}
        >
          <span>//// BUILT TO SCALE</span>
          <span style={{ color: '#6f9dee' }}>+</span>
        </div>
      </StagePanel>

      {/* The IDE, with its own registration frame and corner brackets */}
      <div
        className="absolute"
        style={{
          left: 230,
          top: 225,
          width: 470,
          height: 330,
          transform:
            'translate3d(calc(var(--mx, 0) * 10px), calc(var(--my, 0) * 6px), 40px)',
        }}
      >
        <IdeFrame />
      </div>
    </div>
  );
}
