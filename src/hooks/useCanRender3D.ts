import { useEffect, useState } from 'react';

export const MOBILE_BREAKPOINT = 768;

export function computeCanRender3D(): boolean {
  if (typeof window === 'undefined') return false;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isNarrowViewport = window.innerWidth < MOBILE_BREAKPOINT;
  return !prefersReducedMotion && !isNarrowViewport;
}

export function useCanRender3D(): boolean {
  const [canRender, setCanRender] = useState<boolean>(computeCanRender3D);

  useEffect(() => {
    const update = () => setCanRender(computeCanRender3D());
    window.addEventListener('resize', update);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener('change', update);
    return () => {
      window.removeEventListener('resize', update);
      media.removeEventListener('change', update);
    };
  }, []);

  return canRender;
}
