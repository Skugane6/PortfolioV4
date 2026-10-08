// The analytics projects (this and the ensemble panel) run on a teal accent
// rather than the site's blue. It is the one deliberate palette break in the
// section: it separates "data work" from the product build at a glance, and
// keeps the CraftTraq screenshots the only blue-chrome panel.
const TEAL = '#2dd4bf';

const STATS = [
  { label: 'ANN. RETURN', value: '14.2%' },
  { label: 'VOL', value: '7.7%' },
  { label: 'VaR 95', value: '-2.4%' },
];

// Return-distribution histogram under the frontier chart.
const BAR_HEIGHTS = [38, 52, 30, 66, 44, 78, 56, 88, 62, 96, 70, 58, 84, 46];

export function RiskVisual() {
  return (
    <div className="proj-anim relative w-full" style={{ maxWidth: 760, animation: 'proj-fade .6s both' }}>
      <div
        className="relative overflow-hidden rounded-[20px] px-[22px] pb-[18px] pt-6"
        style={{
          border: `1px solid ${TEAL}2e`,
          background: 'linear-gradient(165deg,rgba(9,20,24,.95),#070b12)',
          boxShadow: '0 30px 70px -34px rgba(0,0,0,.9), inset 0 1px 0 rgba(140,240,226,.06)',
        }}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-[5px]">
            <span className="font-mono text-[9.5px] tracking-[.2em]" style={{ color: '#5aa89e' }}>
              EFFICIENT FRONTIER · VaR 95%
            </span>
            <span className="text-[22px] font-semibold -tracking-[.01em]" style={{ color: '#e6fffb' }}>
              Sharpe 1.84
            </span>
          </div>
          <div className="flex gap-[18px]">
            {STATS.map((stat) => (
              <span key={stat.label} className="flex flex-col gap-1 text-right">
                <span className="font-mono text-[9px] tracking-[.16em]" style={{ color: '#4a6b7a' }}>
                  {stat.label}
                </span>
                <span className="font-mono text-[13px]" style={{ color: TEAL }}>
                  {stat.value}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="relative h-60">
          {/* Gridlines, then a scan line sweeping the plot area. */}
          <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((line) => (
              <span
                key={line}
                className="h-px"
                style={{ background: line === 4 ? `${TEAL}24` : `${TEAL}14` }}
              />
            ))}
          </div>
          <div
            aria-hidden="true"
            className="proj-anim absolute inset-y-0 w-px"
            style={{
              left: '2%',
              background: `linear-gradient(180deg,transparent,${TEAL}80,transparent)`,
              animation: 'proj-vscan 5s ease-in-out infinite alternate',
            }}
          />
          <svg
            viewBox="0 0 700 240"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            <defs>
              <linearGradient id="proj-risk-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={TEAL} stopOpacity=".28" />
                <stop offset="100%" stopColor={TEAL} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M12 196 L112 128 L212 214 L312 96 L412 148 L512 44 L612 92 L612 240 L12 240 Z"
              fill="url(#proj-risk-area)"
              className="proj-anim"
              style={{ animation: 'proj-fade 1.6s ease-out both .7s' }}
            />
            {/* Optimised portfolio, then the benchmark it is measured against. */}
            <polyline
              points="12,196 112,128 212,214 312,96 412,148 512,44 612,92"
              fill="none"
              stroke={TEAL}
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray="1400"
              className="proj-anim"
              style={{ animation: 'proj-draw 2.1s cubic-bezier(.4,0,.2,1) both .15s' }}
            />
            <polyline
              points="12,224 112,206 212,228 312,178 412,204 512,166 612,190"
              fill="none"
              stroke="#14776d"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray="1400"
              className="proj-anim"
              style={{ animation: 'proj-draw 2.4s cubic-bezier(.4,0,.2,1) both .45s' }}
            />
            <circle cx="112" cy="128" r="6" fill={TEAL} className="proj-anim" style={{ animation: 'proj-fade .5s both 1.1s' }} />
            <circle cx="312" cy="96" r="6" fill={TEAL} className="proj-anim" style={{ animation: 'proj-fade .5s both 1.5s' }} />
            <circle cx="512" cy="44" r="7" fill="#e6fffb" className="proj-anim" style={{ animation: 'proj-fade .5s both 1.9s' }} />
          </svg>
        </div>

        <div aria-hidden="true" className="mt-3.5 flex h-11 items-end gap-[5px]">
          {BAR_HEIGHTS.map((height, i) => (
            <span
              key={i}
              className="proj-anim flex-1 origin-bottom rounded-[1px]"
              style={{
                height: `${height}%`,
                background: `${TEAL}57`,
                animation: 'proj-grow .8s cubic-bezier(.2,.8,.2,1) both',
                animationDelay: `${(0.6 + i * 0.045).toFixed(2)}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
