import { useSyncExternalStore } from 'react';

/**
 * Tiny global UI state shared by the command palette, the crosshair and the
 * cat: whether the palette is open, whether the crosshair is on, and a
 * counter the cat watches to be woken from anywhere.
 */
interface UiState {
  paletteOpen: boolean;
  crosshair: boolean;
  catWake: number;
  /** A request from outside Projects to open a detail sheet; seq makes repeats distinct. */
  projectRequest: { id: string; seq: number } | null;
}

const listeners = new Set<() => void>();

function readCrosshair(): boolean {
  try {
    return localStorage.getItem('crosshair') !== 'off';
  } catch {
    return true;
  }
}

let state: UiState = {
  paletteOpen: false,
  crosshair: typeof window === 'undefined' ? true : readCrosshair(),
  catWake: 0,
  projectRequest: null,
};

function set(patch: Partial<UiState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const SERVER: UiState = { paletteOpen: false, crosshair: true, catWake: 0, projectRequest: null };

export function useUi<T>(select: (s: UiState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(SERVER),
  );
}

export const ui = {
  openPalette: () => set({ paletteOpen: true }),
  closePalette: () => set({ paletteOpen: false }),
  setCrosshair: (on: boolean) => {
    try {
      localStorage.setItem('crosshair', on ? 'on' : 'off');
    } catch {
      // Storage blocked: the setting lasts for this page view.
    }
    set({ crosshair: on });
  },
  wakeCat: () => set({ catWake: state.catWake + 1 }),
  requestProject: (id: string) => set({ projectRequest: { id, seq: (state.projectRequest?.seq ?? 0) + 1 } }),
  get: () => state,
};
