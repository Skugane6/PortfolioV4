export type CutawayMode = 'scroll' | 'tap' | 'static';

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function smoothstep(x: number): number {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
}

export interface CutawayValues {
  p: number;
  pi: number;
  pp: number;
  pr: number;
}

export function computeCutawayValues(rawP: number, mode: CutawayMode): CutawayValues {
  const p = clamp(rawP);
  const pp = smoothstep(clamp((p - 0.13) / 0.42));
  const pr = clamp((p - 0.48) / 0.28);
  const pi = mode === 'scroll' ? clamp(p / 0.13) : 1;
  return { p, pi, pp, pr };
}

export function phaseLabel(p: number): string {
  if (p < 0.12) return 'ON APPROACH';
  if (p < 0.3) return 'PANEL RELEASED';
  if (p < 0.55) return 'PANEL EXTENDING';
  if (p < 0.9) return 'RECORD ON DISPLAY';
  return 'SEQUENCE COMPLETE';
}

export function progressFromRect(top: number, height: number, viewportHeight: number): number {
  const span = height - viewportHeight;
  if (span <= 0) return 0;
  return clamp(-top / span);
}
