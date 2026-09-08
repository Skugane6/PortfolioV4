// The centrepiece of the hero stage: a mock editor showing the smallest
// FastAPI app that still looks like real work. Purely decorative — the
// stage that hosts it is aria-hidden, so none of this text is announced
// and none of the glyphs need accessible names.

// Syntax palette, shared by every token below so a colour change is one
// edit rather than eleven.
const SYNTAX = {
  keyword: '#c98ad6',
  plain: '#9dc0f2',
  type: '#6fd6c0',
  punctuation: '#cfdff7',
  decorator: '#dcc98a',
  string: '#d69a72',
} as const;

interface Token {
  text: string;
  color: string;
}

// One entry per rendered line, blanks included — the line-number gutter
// counts these, so an omitted blank would desynchronise the two columns.
const CODE_LINES: Token[][] = [
  [
    { text: 'from', color: SYNTAX.keyword },
    { text: ' fastapi ', color: SYNTAX.plain },
    { text: 'import', color: SYNTAX.keyword },
    { text: ' FastAPI', color: SYNTAX.type },
  ],
  [
    { text: 'from', color: SYNTAX.keyword },
    { text: ' models ', color: SYNTAX.plain },
    { text: 'import', color: SYNTAX.keyword },
    { text: ' router', color: SYNTAX.plain },
  ],
  [{ text: ' ', color: SYNTAX.plain }],
  [
    { text: 'app = ', color: SYNTAX.plain },
    { text: 'FastAPI', color: SYNTAX.type },
    { text: '()', color: SYNTAX.punctuation },
  ],
  [{ text: ' ', color: SYNTAX.plain }],
  [
    { text: '@app.get', color: SYNTAX.decorator },
    { text: '(', color: SYNTAX.punctuation },
    { text: '"/"', color: SYNTAX.string },
    { text: ')', color: SYNTAX.punctuation },
  ],
  [
    { text: 'def', color: SYNTAX.keyword },
    { text: ' read_root', color: SYNTAX.decorator },
    { text: '():', color: SYNTAX.punctuation },
  ],
  [
    { text: '    return', color: SYNTAX.keyword },
    { text: ' {', color: SYNTAX.punctuation },
  ],
  [
    { text: '        "message"', color: SYNTAX.plain },
    { text: ': ', color: SYNTAX.punctuation },
    { text: '"Build. Solve. Improve."', color: SYNTAX.string },
  ],
  [{ text: '    }', color: SYNTAX.punctuation }],
  [{ text: ')', color: SYNTAX.punctuation }],
];

// Lines type themselves in one after another, starting once the headline
// stagger has finished so the two do not compete for attention.
const CODE_START_DELAY = 0.7;
const CODE_LINE_STEP = 0.12;

const PROJECT_TREE = [
  { label: 'app', glyph: '▾', color: '#6f9dee', indented: false, bright: true },
  { label: 'routes', glyph: '▪', color: '#6f9dee', indented: true, bright: false },
  { label: 'models', glyph: '▪', color: '#6f9dee', indented: true, bright: false },
  { label: 'services', glyph: '▪', color: '#6f9dee', indented: true, bright: false },
  { label: 'utils', glyph: '▪', color: '#6f9dee', indented: true, bright: false },
  { label: 'tests', glyph: '▸', color: '#6f9dee', indented: false, bright: false },
  { label: '.env', glyph: '▫', color: '#4f8bf0', indented: false, bright: false },
  { label: 'requirements.txt', glyph: '▫', color: '#4f8bf0', indented: false, bright: false },
  { label: 'README.md', glyph: '▫', color: '#4f8bf0', indented: false, bright: false },
];

export function IdeWindow() {
  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden rounded-lg"
      style={{
        border: '1px solid rgba(110,168,255,.7)',
        background: 'rgba(7,17,36,.92)',
        boxShadow:
          '0 26px 70px rgba(3,8,20,.7), 0 0 40px rgba(44,112,240,.3), inset 0 0 60px rgba(18,52,124,.35)',
      }}
    >
      {/* Title bar */}
      <div
        className="flex h-[30px] flex-none items-center gap-3 px-3"
        style={{ borderBottom: '1px solid rgba(96,150,245,.28)', background: 'rgba(10,24,50,.9)' }}
      >
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: '#e05f52' }} />
          <span className="h-2 w-2 rounded-full" style={{ background: '#e0b03c' }} />
          <span className="h-2 w-2 rounded-full" style={{ background: '#4fbf6a' }} />
        </div>
        <div
          className="flex items-center gap-2 rounded px-3 py-[5px] font-mono text-[10px] tracking-[0.1em]"
          style={{
            border: '1px solid rgba(96,150,245,.35)',
            background: 'rgba(16,36,72,.9)',
            color: '#cfdff7',
          }}
        >
          <span style={{ color: '#7fb0ff' }}>◆</span> app.py{' '}
          <span style={{ color: '#5b86cc' }}>×</span>
        </div>
        <div className="flex-1" />
        <div className="flex gap-3.5 font-mono text-[11px]" style={{ color: '#6f9dee' }}>
          <span>—</span>
          <span>□</span>
          <span>×</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Activity bar */}
        <div
          className="flex w-9 flex-none flex-col items-center gap-[18px] py-3.5 text-xs"
          style={{
            borderRight: '1px solid rgba(96,150,245,.22)',
            background: 'rgba(9,21,44,.7)',
            color: '#5b86cc',
          }}
        >
          <span style={{ color: '#a9c8ff' }}>▤</span>
          <span>⌕</span>
          <span>⑂</span>
          <span>▷</span>
          <span>▧</span>
        </div>

        {/* Editor pane */}
        <div className="relative flex min-w-0 flex-1 gap-2.5 overflow-hidden px-2.5 py-3">
          <div
            className="hero-anim pointer-events-none absolute inset-x-0 top-0 h-[34px]"
            style={{
              background: 'linear-gradient(180deg, rgba(122,178,255,.16), rgba(122,178,255,0))',
              animation: 'hero-scan-sweep 7s ease-in-out infinite',
            }}
          />
          <div
            className="flex w-4 flex-none flex-col gap-0.5 text-right font-mono text-[10px] leading-[1.55]"
            style={{ color: 'var(--color-annotation-dim)' }}
          >
            {CODE_LINES.map((_, index) => (
              <span key={index}>{index + 1}</span>
            ))}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 whitespace-pre font-mono text-[10px] leading-[1.55]">
            {CODE_LINES.map((tokens, lineIndex) => (
              <span
                key={lineIndex}
                className="hero-anim"
                style={{
                  animation: `hero-fade-in .3s ease ${(
                    CODE_START_DELAY +
                    lineIndex * CODE_LINE_STEP
                  ).toFixed(2)}s both`,
                }}
              >
                {tokens.map((token, tokenIndex) => (
                  <span key={tokenIndex} style={{ color: token.color }}>
                    {token.text}
                  </span>
                ))}
                {lineIndex === CODE_LINES.length - 1 && (
                  <span
                    className="hero-anim ml-0.5 inline-block h-3 w-1.5 align-[-2px]"
                    style={{
                      background: '#a9c8ff',
                      animation: 'hero-caret-blink 1.1s steps(1) infinite',
                    }}
                  />
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Project tree */}
        <div
          className="flex w-[132px] flex-none flex-col gap-[7px] px-2.5 py-3 font-mono text-[9.5px]"
          style={{
            borderLeft: '1px solid rgba(96,150,245,.22)',
            background: 'rgba(9,21,44,.7)',
            color: '#9dc0f2',
          }}
        >
          <div className="mb-[3px] tracking-[0.2em]" style={{ color: '#5b86cc' }}>
            PROJECT
          </div>
          {PROJECT_TREE.map((entry) => (
            <div
              key={entry.label}
              className={`flex items-center gap-1.5 ${entry.indented ? 'pl-3' : ''}`}
              style={entry.bright ? { color: '#cfdff7' } : undefined}
            >
              <span style={{ color: entry.color }}>{entry.glyph}</span> {entry.label}
            </div>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div
        className="flex h-[22px] flex-none items-center gap-4 px-3 font-mono text-[8px] tracking-[0.2em]"
        style={{
          borderTop: '1px solid rgba(96,150,245,.24)',
          background: 'rgba(10,24,50,.9)',
          color: '#5b86cc',
        }}
      >
        <span style={{ color: '#7fb0ff' }}>● UVICORN 127.0.0.1:8000</span>
        <span>PY 3.12</span>
        <span className="ml-auto">LN 11 · COL 2</span>
      </div>
    </div>
  );
}
