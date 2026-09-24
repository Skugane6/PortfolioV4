import { useEffect, useState } from 'react';
import type { SkillMark, SkillMarkSlug } from '../../data/skillIcons';

type Marks = Record<SkillMarkSlug, SkillMark>;
let cache: Marks | null = null;
let pending: Promise<Marks> | null = null;

/**
 * The 28 part logos are about 35 KB of SVG path data, needed only on sheet 04,
 * so they load in their own chunk once the app is running instead of riding
 * in the initial bundle and the prerendered HTML. Until then parts render
 * without their mark (the name carries the meaning).
 */
export function useSkillMarks(): Marks | null {
  const [marks, setMarks] = useState<Marks | null>(cache);
  useEffect(() => {
    if (cache) return;
    let live = true;
    pending ??= import('../../data/skillIcons').then((m) => (cache = m.skillMarks));
    pending.then((m) => live && setMarks(m));
    return () => {
      live = false;
    };
  }, []);
  return marks;
}
