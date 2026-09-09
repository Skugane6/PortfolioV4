// A loop of the thing the project actually does: gaze drives the crosshair
// around four targets, each tile lights as the cursor lands on it, and the
// face-mesh inset blinks in time with the click ring. Every element runs off
// the same 11s cycle: the tile and blink delays are negative offsets into
// `proj-cursor`, so they stay in sync with the pointer without any JS.
const CYCLE = '11s';

const TARGETS = [
  { left: '8%', top: '12%', label: 'A1', delay: '-0.44s' },
  { left: '66%', top: '10%', label: 'B2', delay: '-9.02s' },
  { left: '74%', top: '56%', label: 'C3', delay: '-6.60s' },
  { left: '44%', top: '68%', label: 'D4', delay: '-3.96s' },
];

// Six lagging copies of the pointer path, shrinking and fading, make the trail.
const TRAIL = [1, 2, 3, 4, 5, 6].map((n) => ({
  delay: `${(n * 0.075).toFixed(3)}s`,
  size: 9 - n,
  opacity: (0.42 - n * 0.055).toFixed(2),
}));

const MESH = [
  { left: '26%', top: '16%' }, { left: '50%', top: '11%' }, { left: '74%', top: '16%' },
  { left: '18%', top: '32%' }, { left: '82%', top: '32%' },
  { left: '30%', top: '62%' }, { left: '50%', top: '58%' }, { left: '70%', top: '62%' },
  { left: '38%', top: '76%' }, { left: '62%', top: '76%' }, { left: '50%', top: '84%' },
];

const FLOW = [
  { n: '1', label: 'WEBCAM' },
  { n: '2', label: 'IRIS LANDMARKS' },
  { n: '3', label: 'SMOOTHED GAZE' },
  { n: '4', label: 'CURSOR + CLICK' },
];

const STATS = [
  { label: 'LATENCY', value: '18ms' },
  { label: 'DRIFT', value: '0.7°' },
  { label: 'BLINKS', value: '142' },
];

const CURSOR_ANIM = `proj-cursor ${CYCLE} cubic-bezier(.45,.05,.55,.95) infinite`;
// Frame 0 of proj-cursor, applied as a base transform so a cancelled
// animation parks the pointer on target A1 instead of the panel corner.
const CURSOR_REST = 'translate(16%, 20%)';

export function EyeVisual() {
  return (
    <div className="proj-anim relative w-full" style={{ maxWidth: 720, animation: 'proj-fade .6s both' }}>
      <div
        className="relative overflow-hidden rounded-[22px]"
        style={{
          border: '1px solid rgba(91,143,240,.18)',
          background: 'linear-gradient(165deg,rgba(13,23,42,.95),#070b12)',
          boxShadow: '0 34px 80px -38px rgba(0,0,0,.92), inset 0 1px 0 rgba(180,210,255,.07)',
        }}
      >
        <div
          className="flex items-center justify-between gap-3.5 px-5 py-[15px]"
          style={{ borderBottom: '1px solid rgba(91,143,240,.12)' }}
        >
          <span className="flex items-center gap-2.5">
            <span aria-hidden="true" className="flex items-center gap-1">
              {[0, 0.18, 0.36].map((delay) => (
                <span
                  key={delay}
                  className="proj-anim h-[11px] w-[3px] rounded-sm bg-accent-text"
                  style={{ animation: `proj-pulse 1.1s ease-in-out infinite ${delay}s` }}
                />
              ))}
            </span>
            <span className="font-mono text-[9.5px] tracking-[.2em]" style={{ color: '#8fa8cc' }}>
              GAZE POINTER · 30 FPS
            </span>
          </span>
          <span
            className="flex items-center gap-2 rounded-full px-3 py-[5px] font-mono text-[9px] tracking-[.18em]"
            style={{ border: '1px solid rgba(74,222,128,.35)', background: 'rgba(74,222,128,.08)', color: '#a7e8bf' }}
          >
            <span
              aria-hidden="true"
              className="proj-anim h-[5px] w-[5px] rounded-full"
              style={{ background: '#4ade80', animation: 'proj-pulse 1.6s ease-in-out infinite' }}
            />
            CALIBRATED · 9-PT
          </span>
        </div>

        <div
          aria-hidden="true"
          className="relative h-[330px] overflow-hidden"
          style={{ background: 'radial-gradient(90% 70% at 50% 30%, rgba(35,66,120,.28), transparent 72%)' }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(91,143,240,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(91,143,240,.055) 1px, transparent 1px)',
              backgroundSize: '36px 36px, 36px 36px',
            }}
          />

          {TARGETS.map((target) => (
            <span
              key={target.label}
              className="proj-anim absolute flex h-14 w-[74px] items-center justify-center rounded-2xl"
              style={{
                left: target.left,
                top: target.top,
                border: '1px solid rgba(91,143,240,.2)',
                background: 'rgba(91,143,240,.02)',
                animation: `proj-tilehit ${CYCLE} cubic-bezier(.2,.8,.2,1) infinite`,
                animationDelay: target.delay,
              }}
            >
              <span className="font-mono text-[8.5px] tracking-[.16em]" style={{ color: '#6c86ab' }}>
                {target.label}
              </span>
            </span>
          ))}

          {TRAIL.map((dot) => (
            <span
              key={dot.delay}
              className="proj-anim absolute left-0 top-0 h-full w-full"
              style={{ transform: CURSOR_REST, animation: CURSOR_ANIM, animationDelay: dot.delay }}
            >
              <span
                className="absolute rounded-full"
                style={{
                  width: dot.size,
                  height: dot.size,
                  marginLeft: -dot.size / 2,
                  marginTop: -dot.size / 2,
                  background: '#7fb0ff',
                  opacity: dot.opacity,
                }}
              />
            </span>
          ))}

          {/* The pointer itself: crosshair arms, reticle, hot centre, click ring. */}
          <div className="proj-anim absolute left-0 top-0 h-full w-full" style={{ transform: CURSOR_REST, animation: CURSOR_ANIM }}>
            <div className="absolute h-0 w-0">
              <span className="absolute rounded-sm" style={{ left: -26, top: -1, width: 18, height: 1.5, background: '#7fb0ff' }} />
              <span className="absolute rounded-sm" style={{ left: 8, top: -1, width: 18, height: 1.5, background: '#7fb0ff' }} />
              <span className="absolute rounded-sm" style={{ left: -1, top: -26, width: 1.5, height: 18, background: '#7fb0ff' }} />
              <span className="absolute rounded-sm" style={{ left: -1, top: 8, width: 1.5, height: 18, background: '#7fb0ff' }} />
              <span
                className="absolute rounded-full"
                style={{
                  left: -19,
                  top: -19,
                  width: 38,
                  height: 38,
                  border: '1px solid rgba(127,176,255,.45)',
                  background: 'rgba(91,143,240,.08)',
                  backdropFilter: 'blur(1px)',
                }}
              />
              <span
                className="absolute rounded-full"
                style={{ left: -4, top: -4, width: 8, height: 8, background: '#eaf2ff', boxShadow: '0 0 14px rgba(127,176,255,.9)' }}
              />
              <span
                className="proj-anim absolute rounded-full"
                style={{
                  left: -30,
                  top: -30,
                  width: 60,
                  height: 60,
                  border: '2px solid #7fb0ff',
                  transform: 'scale(0)',
                  opacity: 0,
                  animation: `proj-click ${CYCLE} cubic-bezier(.2,.8,.2,1) infinite`,
                }}
              />
            </div>
          </div>

          {/* Webcam inset: the face mesh the tracker is reading. */}
          <div
            className="absolute bottom-5 left-5 w-[168px] overflow-hidden rounded-2xl"
            style={{
              border: '1px solid rgba(91,143,240,.22)',
              background: 'rgba(6,11,20,.92)',
              boxShadow: '0 20px 44px -22px rgba(0,0,0,.9)',
            }}
          >
            <div
              className="flex items-center justify-between px-[11px] py-2 font-mono text-[8px] tracking-[.16em]"
              style={{ borderBottom: '1px solid rgba(91,143,240,.14)' }}
            >
              <span style={{ color: '#8fa8cc' }}>CAM 00 · FACE MESH</span>
              <span className="flex items-center gap-[5px]" style={{ color: '#e8756f' }}>
                <span
                  className="proj-anim h-[5px] w-[5px] rounded-full"
                  style={{ background: '#e8756f', animation: 'proj-pulse 1.2s ease-in-out infinite' }}
                />
                REC
              </span>
            </div>
            <div
              className="relative h-[98px]"
              style={{ background: 'radial-gradient(circle at 50% 45%, rgba(91,143,240,.12), transparent 72%)' }}
            >
              {MESH.map((point) => (
                <span
                  key={`${point.left}-${point.top}`}
                  className="absolute rounded-full"
                  style={{ left: point.left, top: point.top, width: 2.5, height: 2.5, background: 'rgba(127,176,255,.55)' }}
                />
              ))}
              <span className="absolute inset-x-0 top-[34px] flex items-center justify-center gap-[26px]">
                {['left', 'right'].map((side) => (
                  <span
                    key={side}
                    className="relative flex h-5 w-[38px] items-center justify-center overflow-hidden rounded-[50%]"
                    style={{ background: '#0b131f', border: '1px solid rgba(127,176,255,.35)' }}
                  >
                    <span
                      className="h-3 w-3 rounded-full bg-accent-text"
                      style={{ boxShadow: '0 0 10px rgba(91,143,240,.8)' }}
                    />
                    <span className="absolute h-[5px] w-[5px] rounded-full" style={{ background: '#0a0f18' }} />
                    {/* Eyelid, one blink per cycle, timed to the click ring. */}
                    <span
                      className="proj-anim absolute inset-0 origin-top rounded-[50%]"
                      style={{
                        background: '#0a0f18',
                        transform: 'scaleY(0.02)',
                        animation: `proj-blink ${CYCLE} linear infinite`,
                      }}
                    />
                  </span>
                ))}
              </span>
              <span
                className="absolute inset-x-0 bottom-[9px] text-center font-mono text-[7.5px] tracking-[.18em]"
                style={{ color: '#5c78a0' }}
              >
                EAR 0.28 · BLINK → CLICK
              </span>
            </div>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-3.5 px-5 py-[13px]"
          style={{ borderTop: '1px solid rgba(91,143,240,.12)' }}
        >
          <span className="flex flex-wrap items-center gap-3.5">
            {FLOW.map((step) => (
              <span key={step.n} className="flex items-center gap-2">
                <span
                  className="flex h-[19px] w-[19px] items-center justify-center rounded-full font-mono text-[8px]"
                  style={{ border: '1px solid rgba(127,176,255,.35)', background: 'rgba(91,143,240,.08)', color: '#9cc2ff' }}
                >
                  {step.n}
                </span>
                <span className="font-mono text-[9px] tracking-[.14em]" style={{ color: '#8fa8cc' }}>
                  {step.label}
                </span>
              </span>
            ))}
          </span>
          <span className="flex flex-wrap items-center gap-[7px]">
            {STATS.map((stat) => (
              <span
                key={stat.label}
                className="flex items-center gap-[7px] rounded-full px-3 py-1.5 font-mono"
                style={{ border: '1px solid rgba(91,143,240,.2)', background: 'rgba(9,16,29,.85)' }}
              >
                <span className="text-[8.5px] tracking-[.16em]" style={{ color: '#5c78a0' }}>
                  {stat.label}
                </span>
                <span className="text-[11px]" style={{ color: '#bcd4f8' }}>
                  {stat.value}
                </span>
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
