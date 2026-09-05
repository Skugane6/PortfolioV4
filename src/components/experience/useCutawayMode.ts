import { useState } from 'react';
import type { CutawayMode } from './cutawayMath';

export const CUTAWAY_TAP_BREAKPOINT = 768;

export function computeCutawayMode(): CutawayMode {
  if (typeof window === 'undefined') return 'static';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return 'static';
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.innerWidth < CUTAWAY_TAP_BREAKPOINT;
  return coarse || narrow ? 'tap' : 'scroll';
}

export function useCutawayMode(): CutawayMode {
  const [mode] = useState<CutawayMode>(computeCutawayMode);
  return mode;
}
