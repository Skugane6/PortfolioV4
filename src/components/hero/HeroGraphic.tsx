import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import panelCodeEditor from '../../assets/hero/panel-code-editor.webp';
import panelDeploy from '../../assets/hero/panel-deploy.webp';
import panelIdeasCode from '../../assets/hero/panel-ideas-code.webp';
import panelImpactChart from '../../assets/hero/panel-impact-chart.webp';
import panelScalableSolutions from '../../assets/hero/panel-scalable-solutions.webp';
import { computeParallaxOffset } from '../../utils/parallax';

// Panel positions and the connector lines below share one 0-100 coordinate
// space (the container's own box), so moving a panel and its line stays a
// one-line edit instead of two numbers that have to be kept in sync by eye.
interface Panel {
  src: string;
  className: string;
  floatRange: number;
  floatDuration: number;
  floatDelay: number;
}

const PANELS: Panel[] = [
  {
    src: panelDeploy,
    className: 'left-0 top-0 w-[30%] z-10',
    floatRange: 8,
    floatDuration: 6,
    floatDelay: 0.3,
  },
  {
    src: panelIdeasCode,
    className: 'right-0 top-0 w-[27%] z-10',
    floatRange: 8,
    floatDuration: 6.5,
    floatDelay: 0.5,
  },
  {
    // The code editor is the focal panel — biggest, centered, drawn above
    // the four satellites around it, with enough clearance on every side
    // that the dotted connectors below have open space to run through.
    src: panelCodeEditor,
    className: 'left-[19%] top-[33%] w-[56%] z-20',
    floatRange: 10,
    floatDuration: 7,
    floatDelay: 0,
  },
  {
    src: panelImpactChart,
    className: 'left-0 bottom-0 w-[34%] z-10',
    floatRange: 9,
    floatDuration: 7.5,
    floatDelay: 0.6,
  },
  {
    src: panelScalableSolutions,
    className: 'right-0 bottom-0 w-[36%] z-10',
    floatRange: 9,
    floatDuration: 6.8,
    floatDelay: 0.2,
  },
];

// Dotted lines from each satellite panel in toward the code editor's edge,
// in the same percent coordinates as the panels above (measured against the
// rendered layout — see the design notes for how these were derived).
const CONNECTORS = [
  { x1: 27, y1: 22, x2: 26, y2: 33 },
  { x1: 73, y1: 20, x2: 72, y2: 33 },
  { x1: 30, y1: 78, x2: 30, y2: 68 },
  { x1: 70, y1: 78, x2: 70, y2: 68 },
];

// Resting 3D tilt for the whole composition — panels and connector lines all
// share this one transform (rather than each panel getting its own), so the
// scene reads as a single isometric-ish plane viewed at an angle, matching
// the reference: every card slopes down to the right by the same amount,
// and the wider code-editor panel shows more foreshortening simply because
// it spans further from the rotation's center — true 3D perspective, not a
// per-panel fudge. Mouse movement adds a small delta on top (see rotateX/
// rotateY below); with no pointer input, or reduced motion, the springs sit
// at 0 and the scene rests at exactly this angle.
const BASE_ROTATE_X = 10;
const BASE_ROTATE_Y = -24;
const BASE_ROTATE_Z = 8;
const POINTER_TILT_RANGE = 3;

export function HeroGraphic() {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse-driven tilt on the whole composition. This runs through raw motion
  // values (not the initial/animate/whileHover props), so it sits outside
  // what MotionConfig(reducedMotion="user") in App.tsx auto-suppresses — the
  // handler below explicitly no-ops when the user prefers reduced motion, so
  // the springs simply never leave 0 and the scene rests at the base tilt.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 60, damping: 20 });
  const springY = useSpring(pointerY, { stiffness: 60, damping: 20 });
  const rotateX = useTransform(
    springY,
    [-1, 1],
    [BASE_ROTATE_X + POINTER_TILT_RANGE, BASE_ROTATE_X - POINTER_TILT_RANGE]
  );
  const rotateY = useTransform(
    springX,
    [-1, 1],
    [BASE_ROTATE_Y - POINTER_TILT_RANGE, BASE_ROTATE_Y + POINTER_TILT_RANGE]
  );

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (shouldReduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offset = computeParallaxOffset(
      {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: ((event.clientY - rect.top) / rect.height) * 2 - 1,
      },
      1
    );
    pointerX.set(offset.x);
    pointerY.set(offset.y);
  }

  function handlePointerLeave() {
    pointerX.set(0);
    pointerY.set(0);
  }

  return (
    // Purely illustrative — the same "build, ship, scale" story is already
    // in the headline and copy, so the whole composition is hidden from
    // screen readers rather than narrated panel by panel. Hidden below lg:
    // five absolutely-positioned panels don't have room to breathe on a
    // phone-width column next to the text.
    <div
      aria-hidden="true"
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative hidden aspect-[7/6] w-full [perspective:900px] lg:block"
    >
      {/* SVG and panels share this one 3D-transformed wrapper — one rotation
          for the whole scene, not a rotate-per-panel — so the dotted
          connectors stay glued to the panel edges they point at instead of
          rendering as a flat, untilted overlay. */}
      <motion.div
        style={{
          rotateX: shouldReduceMotion ? BASE_ROTATE_X : rotateX,
          rotateY: shouldReduceMotion ? BASE_ROTATE_Y : rotateY,
          rotateZ: BASE_ROTATE_Z,
        }}
        className="absolute inset-0 [transform-style:preserve-3d]"
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        >
          {CONNECTORS.map((line, index) => (
            <motion.line
              key={index}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="rgba(91,143,240,0.5)"
              strokeWidth={0.35}
              strokeDasharray="1.6 1.8"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.5 + index * 0.15, ease: 'easeOut' }}
            />
          ))}
          {CONNECTORS.map((line, index) => (
            <motion.circle
              key={`node-${index}`}
              cx={line.x2}
              cy={line.y2}
              r={0.8}
              fill="#5b8ff0"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 1.1 + index * 0.15 }}
            />
          ))}
        </svg>

        {PANELS.map((panel, index) => (
          <motion.div
            key={panel.src}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 * index, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute ${panel.className}`}
          >
            {/* Nested motion element: the parent above owns the one-time
                entrance, this one owns the endless float loop, so the two
                animations don't have to be reconciled into a single
                keyframe list. */}
            <motion.img
              src={panel.src}
              alt=""
              animate={{ y: [0, -panel.floatRange, 0] }}
              transition={{
                duration: panel.floatDuration,
                delay: panel.floatDelay,
                repeat: Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut',
              }}
              className="block w-full drop-shadow-[0_20px_45px_rgba(6,14,28,0.55)]"
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
