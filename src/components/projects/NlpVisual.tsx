// Shares the teal accent with RiskVisual — see the note there.
const TEAL = '#2dd4bf';

// The ensemble as a graph: tokens fan out to the three encoders, those pool
// into two heads, and the heads converge on one label. The three animated
// dots each trace one of the paths end to end.
const EDGES = [
  'M70 150 L250 62',
  'M70 150 L250 150',
  'M70 150 L250 238',
  'M250 62 L430 106',
  'M250 150 L430 106',
  'M250 150 L430 194',
  'M250 238 L430 194',
  'M430 106 L590 150',
  'M430 194 L590 150',
];

const PACKETS = [
  { path: 'M70 150 L250 62 L430 106 L590 150', delay: '0s' },
  { path: 'M70 150 L250 150 L430 194 L590 150', delay: '1.1s' },
  { path: 'M70 150 L250 238 L430 194 L590 150', delay: '2.2s' },
];

const NODES = [
  { cx: 70, cy: 150, r: 17, fill: '#0d9488', delay: '0s' },
  { cx: 250, cy: 62, r: 12, fill: '#115e59', delay: '.2s' },
  { cx: 250, cy: 150, r: 12, fill: '#115e59', delay: '.3s' },
  { cx: 250, cy: 238, r: 12, fill: '#115e59', delay: '.4s' },
  { cx: 430, cy: 106, r: 14, fill: '#0f766e', delay: '.55s' },
  { cx: 430, cy: 194, r: 14, fill: '#0f766e', delay: '.65s' },
];

const METRICS = [
  { label: 'ACCURACY', value: '94.1%', width: '94%' },
  { label: 'F1 MACRO', value: '0.921', width: '92%' },
  { label: 'PRECISION', value: '0.936', width: '94%' },
  { label: 'RECALL', value: '0.908', width: '91%' },
];

export function NlpVisual() {
  return (
    <div className="proj-anim relative w-full" style={{ maxWidth: 740, animation: 'proj-fade .6s both' }}>
      <div
        className="relative overflow-hidden rounded-[20px] p-[22px]"
        style={{
          border: `1px solid ${TEAL}2e`,
          background: 'linear-gradient(165deg,rgba(9,20,24,.95),#070b12)',
          boxShadow: '0 30px 70px -34px rgba(0,0,0,.9), inset 0 1px 0 rgba(140,240,226,.06)',
        }}
      >
        <div className="mb-3.5 flex items-center justify-between gap-3.5">
          <span className="font-mono text-[9.5px] tracking-[.2em]" style={{ color: '#5aa89e' }}>
            ENSEMBLE · BERT + CNN/BiLSTM
          </span>
          <span
            className="flex items-center gap-2 font-mono text-[9.5px] tracking-[.16em]"
            style={{ color: '#4a6b7a' }}
          >
            <span
              aria-hidden="true"
              className="proj-anim h-1.5 w-1.5 rounded-full"
              style={{ background: TEAL, animation: 'proj-pulse 1.6s ease-in-out infinite' }}
            />
            MLFLOW RUN 47
          </span>
        </div>

        <svg viewBox="0 0 660 300" aria-hidden="true" className="block h-auto w-full overflow-visible">
          <g
            stroke="#186e66"
            strokeWidth="1.6"
            fill="none"
            strokeDasharray="6 5"
            className="proj-anim"
            style={{ animation: 'proj-dash 9s linear infinite' }}
          >
            {EDGES.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <g fill={TEAL}>
            {PACKETS.map((packet) => (
              <circle
                key={packet.path}
                r="6"
                className="proj-anim"
                style={{
                  offsetPath: `path('${packet.path}')`,
                  animation: `proj-offset 3.4s linear infinite ${packet.delay}`,
                }}
              />
            ))}
          </g>
          {NODES.map((node) => (
            <circle
              key={`${node.cx}-${node.cy}`}
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill={node.fill}
              stroke={TEAL}
              strokeWidth="1.5"
              className="proj-anim"
              style={{ animation: `proj-fade .6s both ${node.delay}` }}
            />
          ))}
          <circle cx="590" cy="150" r="18" fill="#eafffb" className="proj-anim" style={{ animation: 'proj-fade .6s both .85s' }} />
          <g fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="1.6" fill="#4a6b7a">
            <text x="70" y="192" textAnchor="middle">TOKENS</text>
            <text x="250" y="24" textAnchor="middle">BERT</text>
            <text x="250" y="284" textAnchor="middle">BiLSTM</text>
            <text x="430" y="62" textAnchor="middle">POOL</text>
            <text x="590" y="192" textAnchor="middle" fill={TEAL}>LABEL</text>
          </g>
        </svg>

        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {METRICS.map((metric, i) => (
            <span
              key={metric.label}
              className="flex flex-col gap-1.5 rounded-[14px] px-[13px] py-3"
              style={{ border: `1px solid ${TEAL}24`, background: `${TEAL}0a` }}
            >
              <span className="font-mono text-[8.5px] tracking-[.16em]" style={{ color: '#4a6b7a' }}>
                {metric.label}
              </span>
              <span className="font-mono text-[15px]" style={{ color: '#8ff0e2' }}>
                {metric.value}
              </span>
              <span aria-hidden="true" className="block h-0.5 overflow-hidden" style={{ background: `${TEAL}26` }}>
                <span
                  className="proj-anim block h-full origin-left"
                  style={{
                    width: metric.width,
                    background: TEAL,
                    animation: 'proj-track 1.4s cubic-bezier(.2,.8,.2,1) both',
                    animationDelay: `${0.5 + i * 0.1}s`,
                  }}
                />
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
