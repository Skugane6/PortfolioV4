// CRJ-900 side-elevation cutaway, ported from the design reference.
// Purely presentational: every dynamic bit is a CSS custom property
// (--pi intro, --po opening amount, --detail rivet-line toggle, --amber
// accent color) set by the caller (Experience.tsx) on an ancestor element.
export function PlaneCutawaySvg() {
  return (
    <svg
      viewBox="0 0 1600 420"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="skinUp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d4a5c" />
          <stop offset="55%" stopColor="#232c3a" />
          <stop offset="100%" stopColor="#161d28" />
        </linearGradient>
        <linearGradient id="skinDn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b222e" />
          <stop offset="45%" stopColor="#2a3341" />
          <stop offset="100%" stopColor="#38445a" />
        </linearGradient>
      </defs>

      <g style={{ opacity: 'calc(var(--pi, 0) - var(--po, 0) * 1.6)' }} stroke="#3f4d61" strokeWidth={1} fill="none">
        <path d="M 62 96 H 1580" strokeDasharray="6 6" />
        <path d="M 62 88 V 104 M 1580 88 V 104" />
        <text
          x={820}
          y={84}
          fill="#7e8da0"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, letterSpacing: '.14em' }}
          textAnchor="middle"
          stroke="none"
        >
          36.40 m
        </text>
        <path d="M 40 168 H 20 M 40 258 H 20 M 26 168 V 258" strokeDasharray="4 5" />
      </g>

      <g
        strokeLinecap="round"
        fill="none"
        vectorEffect="non-scaling-stroke"
        style={{
          transform: 'scaleY(calc(1 + var(--po, 0) * 10))',
          transformOrigin: '800px 210px',
          transformBox: 'view-box',
          opacity: 'calc(var(--po, 0) * 1.3)',
        }}
      >
        <path
          d="M 348 190 V 230 M 394 188 V 232 M 440 188 V 232 M 486 188 V 232 M 532 188 V 232 M 578 188 V 232 M 624 188 V 232 M 670 188 V 232 M 716 188 V 232 M 762 188 V 232 M 808 188 V 232 M 854 188 V 232 M 900 188 V 232 M 946 188 V 232 M 992 188 V 232 M 1038 188 V 232 M 1084 188 V 232 M 1126 190 V 230"
          stroke="#48586e"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <path d="M 340 222 H 1132" stroke="#5c6f88" strokeWidth={1} strokeDasharray="14 8" vectorEffect="non-scaling-stroke" />
        <path d="M 340 198 H 1132" stroke="#3b4859" strokeWidth={1} strokeDasharray="3 7" vectorEffect="non-scaling-stroke" />
      </g>

      {/* Lower fuselage — cargo bay */}
      <g
        style={{
          transform: 'translateY(calc(var(--po, 0) * 212px)) rotate(calc(var(--po, 0) * 1.1deg))',
          transformOrigin: '1160px 240px',
          transformBox: 'view-box',
        }}
      >
        <path
          d="M 330 210 L 330 258 C 520 265, 900 265, 1140 258 C 1240 251, 1300 234, 1342 214 L 1342 210 Z"
          fill="url(#skinDn)"
          stroke="#66768e"
          strokeWidth={1.4}
        />
        <path d="M 640 256 C 730 272, 880 276, 1010 259 Z" fill="#2b3441" stroke="#66768e" strokeWidth={1} opacity={0.9} />
        <path
          d="M 672 260 C 760 272, 890 268, 1010 250 L 1058 240 C 962 250, 830 258, 718 257 Z"
          fill="#212a37"
          stroke="#6b7c94"
          strokeWidth={1.2}
        />
        <path d="M 1054 241 L 1076 228 L 1080 235 L 1060 247 Z" fill="#28313f" stroke="#7b8ca6" strokeWidth={1} />
        <path d="M 736 264 C 830 270, 920 265, 1006 252" fill="none" stroke="#4d5b70" strokeWidth={1} opacity={0.8} />
        <path d="M 706 262 L 682 288 L 712 288 L 734 264 Z" fill="#1b2330" stroke="#5d6c82" strokeWidth={1.1} />
        <path d="M 812 265 L 790 288 L 818 288 L 840 266 Z" fill="#1b2330" stroke="#5d6c82" strokeWidth={1.1} />
        <g style={{ opacity: 'calc(var(--detail, 1) * 1)' }}>
          <path d="M 348 244 H 1120" stroke="#7b8ca6" strokeWidth={1.6} strokeDasharray="1.5 11" opacity={0.5} />
          <path d="M 352 226 H 1116" stroke="#7b8ca6" strokeWidth={1.6} strokeDasharray="1.5 11" opacity={0.32} />
          <path
            d="M 420 214 V 258 M 560 214 V 260 M 700 214 V 262 M 840 214 V 262 M 980 214 V 260 M 1090 214 V 256"
            stroke="#4d5b70"
            strokeWidth={1}
            opacity={0.7}
          />
        </g>
        <rect x={1010} y={228} width={96} height={26} rx={2} fill="none" stroke="var(--amber)" strokeWidth={1.1} opacity={0.8} />
        <text
          x={1058}
          y={246}
          fill="var(--amber)"
          textAnchor="middle"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.1em' }}
        >
          CARGO
        </text>
      </g>

      {/* Upper fuselage — avionics bay */}
      <g
        style={{
          transform: 'translateY(calc(var(--po, 0) * -212px)) rotate(calc(var(--po, 0) * -1.3deg))',
          transformOrigin: '1160px 180px',
          transformBox: 'view-box',
        }}
      >
        <path
          d="M 330 210 L 330 168 C 520 161, 900 161, 1140 166 C 1232 171, 1300 184, 1342 206 L 1342 210 Z"
          fill="url(#skinUp)"
          stroke="#7b8ca6"
          strokeWidth={1.4}
        />
        <path d="M 690 158 L 700 138 L 706 138 L 704 158 Z" fill="#28313f" stroke="#8698b0" strokeWidth={1} />
        <path d="M 468 160 L 476 150 L 480 160 Z" fill="#28313f" stroke="#8698b0" strokeWidth={1} />
        <path d="M 372 184 H 1108" stroke="#0d1420" strokeWidth={11} strokeDasharray="10 26" strokeLinecap="round" />
        <path d="M 372 184 H 1108" stroke="#8fa2bb" strokeWidth={13} strokeDasharray="0.8 35.2" strokeLinecap="round" opacity={0.45} />
        <g style={{ opacity: 'calc(var(--detail, 1) * 1)' }}>
          <path d="M 348 172 H 1120" stroke="#9fb0c8" strokeWidth={1.6} strokeDasharray="1.5 11" opacity={0.55} />
          <path d="M 352 200 H 1116" stroke="#9fb0c8" strokeWidth={1.6} strokeDasharray="1.5 11" opacity={0.3} />
          <path
            d="M 420 166 V 208 M 560 164 V 208 M 700 163 V 208 M 840 163 V 208 M 980 164 V 208 M 1090 167 V 208"
            stroke="#55647a"
            strokeWidth={1}
            opacity={0.7}
          />
        </g>
        <rect x={342} y={166} width={34} height={44} rx={3} fill="none" stroke="#a3b4cc" strokeWidth={1.2} opacity={0.85} />
        <rect x={1082} y={168} width={30} height={40} rx={3} fill="none" stroke="#8090a8" strokeWidth={1.1} opacity={0.6} />
        <rect x={470} y={174} width={96} height={24} rx={2} fill="none" stroke="var(--amber)" strokeWidth={1.1} opacity={0.8} />
        <text
          x={518}
          y={190}
          fill="var(--amber)"
          textAnchor="middle"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '.1em' }}
        >
          AVIONICS
        </text>
      </g>

      {/* Nose */}
      <g>
        <path
          d="M 58 230 C 76 206, 118 182, 186 171 L 332 166 L 332 264 L 214 261 C 132 255, 82 243, 58 230 Z"
          fill="url(#skinUp)"
          stroke="#7b8ca6"
          strokeWidth={1.4}
        />
        <path d="M 126 184 C 112 202, 110 238, 124 252" fill="none" stroke="#8fa2bb" strokeWidth={1.1} opacity={0.8} />
        <path d="M 146 183 C 172 175, 200 171, 226 170" fill="none" stroke="#9fb0c8" strokeWidth={1} opacity={0.55} />
        <path d="M 166 186 L 216 180 L 222 199 L 172 203 Z" fill="#0e1523" stroke="#a3b4cc" strokeWidth={1.1} />
        <path d="M 146 192 L 163 187 L 168 203 L 148 205 Z" fill="#0e1523" stroke="#a3b4cc" strokeWidth={1} />
        <path d="M 228 179 L 252 177 L 254 194 L 230 196 Z" fill="#101826" stroke="#8fa2bb" strokeWidth={1} opacity={0.9} />
        <path d="M 158 249 L 208 251 L 208 262 L 158 260 Z" fill="none" stroke="#6b7c94" strokeWidth={1} strokeDasharray="5 4" />
        <path d="M 104 214 L 86 210 M 104 233 L 84 234" stroke="#9fb0c8" strokeWidth={1.4} strokeLinecap="round" />
        <path d="M 112 216 H 300" stroke="#9fb0c8" strokeWidth={1.5} strokeDasharray="1.5 11" opacity="calc(var(--detail, 1) * .45)" />
        <path d="M 252 168 V 259 M 292 167 V 260" stroke="#55647a" strokeWidth={1} opacity={0.55} />
      </g>

      {/* Tail */}
      <g>
        <path
          d="M 1342 204 C 1404 196, 1464 178, 1520 158 L 1558 144 L 1564 155 L 1524 172 C 1462 200, 1398 214, 1342 214 Z"
          fill="url(#skinUp)"
          stroke="#7b8ca6"
          strokeWidth={1.3}
        />
        <path d="M 1558 144 L 1576 139 C 1582 141, 1582 150, 1576 152 L 1564 155 Z" fill="#151b26" stroke="#8698b0" strokeWidth={1} />
        <path
          d="M 1390 205 C 1420 190, 1442 168, 1456 146 L 1476 151 C 1458 178, 1428 200, 1398 211 Z"
          fill="#1f2734"
          stroke="#7b8ca6"
          strokeWidth={1}
        />
        <path d="M 1412 201 L 1506 52 L 1556 50 L 1502 203 Z" fill="#1e2532" stroke="#8698b0" strokeWidth={1.3} />
        <path d="M 1486 201 L 1542 54" fill="none" stroke="#6b7c94" strokeWidth={1} strokeDasharray="6 5" />
        <path d="M 1442 142 L 1524 140 M 1462 100 L 1536 98" stroke="#55647a" strokeWidth={1} opacity={0.6} />
        <path
          d="M 1462 56 L 1548 41 C 1562 39, 1568 43, 1560 48 L 1470 67 Z"
          fill="#232c3a"
          stroke="#8698b0"
          strokeWidth={1.2}
        />
        <path d="M 1504 50 L 1552 43" stroke="#6b7c94" strokeWidth={1} strokeDasharray="6 5" opacity={0.8} />
        <rect x={1492} y={38} width={66} height={22} rx={11} fill="#28313f" stroke="#8698b0" strokeWidth={1.1} />
        <path d="M 1396 213 L 1416 238 L 1444 238 L 1426 209 Z" fill="#212a37" stroke="#7b8ca6" strokeWidth={1} />
        <path
          d="M 1214 152 C 1214 133, 1236 124, 1264 124 L 1348 126 C 1372 128, 1384 139, 1384 154 C 1384 170, 1370 181, 1346 182 L 1258 182 C 1232 182, 1214 171, 1214 152 Z"
          fill="#28313f"
          stroke="#8698b0"
          strokeWidth={1.3}
        />
        <path d="M 1219 141 C 1228 130, 1245 125, 1264 124" fill="none" stroke="#b4c4d8" strokeWidth={1.4} />
        <path
          d="M 1264 124 L 1259 182 M 1312 126 L 1310 182 M 1338 127 L 1336 181"
          stroke="#6b7c94"
          strokeWidth={1}
          opacity={0.85}
        />
        <path d="M 1384 143 L 1412 148 L 1412 161 L 1384 166 Z" fill="#161d28" stroke="#8698b0" strokeWidth={1} />
        <path d="M 1280 182 L 1302 208 L 1342 208 L 1348 182 Z" fill="#242d3b" stroke="#7b8ca6" strokeWidth={1.1} />
      </g>
    </svg>
  );
}
