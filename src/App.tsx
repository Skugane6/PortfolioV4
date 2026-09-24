import { useEffect } from 'react';
import { LazyMotion, MotionConfig } from 'motion/react';
import { useReducedMotionPref } from './lib/motion';
import { SkipLink } from './components/shell/SkipLink';
import { SheetIndex } from './components/shell/SheetIndex';
import { TitleStrip } from './components/shell/TitleStrip';
import { Cover } from './components/cover/Cover';
import { Experience } from './components/experience/Experience';
import { Projects } from './components/projects/Projects';
import { Skills } from './components/skills/Skills';
import { Contact } from './components/contact/Contact';
import { RevisionBlock } from './components/contact/RevisionBlock';
import { CommandPalette } from './components/shell/CommandPalette';
import { Crosshair } from './components/shell/Crosshair';
import { Intro } from './components/shell/Intro';
import { printConsoleNote } from './components/shell/consoleNote';

// Motion's animation features load in their own chunk after first paint.
// m.* components render their initial styles without them.
const loadFeatures = () => import('./lib/motionFeatures').then((mod) => mod.default);

export function App() {
  const reduced = useReducedMotionPref();
  useEffect(printConsoleNote, []);

  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>
        <SkipLink />
        <SheetIndex />
        <TitleStrip />
        <div className="drawing-set">
          <main id="main" tabIndex={-1} className="outline-none">
            <Cover />
            <Experience />
            <Projects />
            <Skills />
            <Contact />
          </main>
          <RevisionBlock />
        </div>
        <CommandPalette />
        <Crosshair />
        <Intro />
      </MotionConfig>
    </LazyMotion>
  );
}
