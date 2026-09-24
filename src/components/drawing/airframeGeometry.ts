/**
 * Side elevation of a CRJ700-series regional jet, traced from the previous
 * site's render (public/crj-xray.png, 2108×424) and redrawn as line art in
 * its pixel space. Nose left, flight direction to the left.
 *
 * Paths are grouped by what they are on a drawing (DESIGN.md §4.3), because
 * that is what decides their weight, dash and the order they are plotted in.
 */

export const VIEWBOX = { x: -40, y: -24, w: 2186, h: 470 } as const;

/** Visible outline of the airframe: plotted first, drawn heaviest. */
export const OBJECT = {
  fuselage:
    'M 2 342 C 20 322 70 296 125 263 C 160 232 205 205 300 200 L 1640 200 C 1720 206 1830 232 1903 247 C 1938 252 1962 258 1964 269 C 1962 281 1938 290 1903 297 C 1830 322 1700 358 1560 374 C 1470 380 1380 384 1300 384 L 200 384 C 140 383 70 372 30 358 C 12 352 2 346 2 342 Z',
  windshield: 'M 119 270 L 176 242 L 226 239 L 224 276 L 150 275 Z M 150 275 L 179 242',
  wing: 'M 856 372 C 856 361 868 355 902 355 L 1100 358 C 1185 360 1240 364 1262 368 L 1262 374 C 1200 378 1100 381 902 382 C 868 382 856 380 856 372 Z',
  winglet: 'M 1256 370 L 1358 268 C 1364 264 1374 264 1378 268 L 1346 364',
  nacelle:
    'M 1470 186 C 1462 190 1460 210 1460 242 C 1460 276 1462 295 1470 299 L 1634 299 C 1640 290 1642 270 1642 242 C 1642 214 1640 194 1634 186 Z',
  nozzle: 'M 1642 207 L 1688 222 L 1690 262 L 1642 277',
  // Dorsal fillet rising into the fin's leading edge, up to the underside of
  // the T-tail; trailing edge from the stabiliser down to the fuselage.
  fin: 'M 1700 204 C 1703 195 1713 190 1729 189 C 1750 188 1767 181 1779 170 L 1887 46 M 2010 38 L 1912 246',
  stabiliser:
    'M 1876 38 C 1872 22 1884 13 1905 12 L 2045 7 C 2075 6 2095 12 2104 24 C 2085 30 2060 32 2045 33 L 1905 47 C 1887 48 1879 45 1876 38 Z',
} as const;

function rect(x: number, y: number, w: number, h: number, r: number) {
  return `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
}

/** Cabin windows, 21 per side, left edges as traced. */
const WINDOW_X = [357, 403, 451, 501, 556, 611, 661, 711, 760, 810, 860, 910, 959, 1064, 1111, 1158, 1203, 1246, 1291, 1341, 1388];

/** Detail features: doors, windows, fairings, hinges. Thin lines. */
export const THIN = {
  tailcone: 'M 1903 247 C 1897 262 1897 283 1903 297',
  crewWindow: rect(248, 252, 10, 17, 5),
  mainDoor: rect(283, 219, 54, 122, 7),
  overwingExit: rect(1004, 234, 36, 83, 6),
  windows: WINDOW_X.map((x) => rect(x, 250, 21, 27, 6)).join(' '),
  fairing:
    'M 717 367 C 732 345 850 336 1000 335 C 1200 335 1340 346 1355 368 C 1340 391 1200 405 1000 407 C 850 407 732 391 717 367 Z',
  flaps: 'M 1110 378 L 1128 401 M 1136 378 L 1156 401 M 1162 378 L 1183 401 M 1188 377 L 1208 400 M 1104 401 L 1222 401',
  nacelleLines: 'M 1486 188 L 1486 297 M 1562 186 L 1562 299',
  plug: 'M 1690 250 L 1742 262 L 1690 272',
  aftBay: rect(1514, 303, 75, 39, 3),
  rudderHinge: 'M 1960 44 L 1866 232',
  elevatorHinge: 'M 1985 36 L 2098 25',
  antennas:
    'M 386 200 L 398 184 L 407 184 L 401 200 M 587 200 L 600 182 L 612 182 L 605 200 M 918 200 L 931 182 L 943 182 L 936 200 M 168 384 L 176 396 L 182 396 L 181 384 M 700 384 L 700 392 L 720 392 L 720 384 M 1480 382 L 1492 396 L 1500 396 L 1498 380',
} as const;

/** Structure behind the skin: cabin floor, wing box. Dashed. */
export const HIDDEN = {
  floor: 'M 262 323 L 1455 323',
  wingBox: 'M 880 342 L 1150 342 L 1150 380 L 880 380 Z',
} as const;

/** The fuselage datum: long-short centre line, run past both ends. */
export const CENTER = {
  datum: 'M -24 292 L 2000 292',
} as const;

/** Skin panel seams: faint, the last thing plotted. */
export const PANEL = {
  seams: 'M 300 235 L 1460 235 M 1640 212 L 1880 245 M 42 314 C 35 330 35 348 44 362 M 262 205 L 262 383 M 1455 200 L 1455 383',
} as const;

/**
 * Fuselage top and bottom edges, sampled from the outline above, so a
 * station plane can be drawn skin to skin at any station without hand-placed
 * coordinates. Piecewise linear between samples.
 */
const TOP: [number, number][] = [
  [2, 342], [41, 312], [83, 287], [125, 263], [167, 235], [200, 219], [233, 208], [267, 203], [300, 200],
  [1640, 200], [1763, 221], [1903, 247], [1964, 269],
];
const BOTTOM: [number, number][] = [
  [2, 342], [30, 358], [83, 371], [125, 378], [167, 382], [200, 384], [1300, 384], [1467, 378], [1560, 374],
  [1633, 367], [1744, 342], [1856, 314], [1903, 297], [1964, 269],
];

function sample(points: [number, number][], x: number) {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    if (x <= x1) {
      const [x0, y0] = points[i - 1];
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return points[points.length - 1][1];
}

/** The highest drawn point at each x, fin and T-tail included. */
const SKYLINE: [number, number][] = [...TOP.filter(([x]) => x <= 1700), [1700, 204], [1779, 170], [1887, 46], [1905, 12], [2104, 24]];

export function fuselageExtent(x: number): { top: number; bottom: number; clear: number } {
  return { top: sample(TOP, x), bottom: sample(BOTTOM, x), clear: Math.min(sample(SKYLINE, x), sample(TOP, x)) };
}

/** Where the drawn airframe starts and ends inside the viewBox, as fractions of its width. */
export const EXTENT = {
  left: (2 - VIEWBOX.x) / VIEWBOX.w,
  right: (2106 - VIEWBOX.x) / VIEWBOX.w,
} as const;
