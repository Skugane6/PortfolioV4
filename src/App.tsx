import { MotionConfig } from 'framer-motion';
import { Cursor } from './components/Cursor';
import { NavRail } from './components/NavRail';
import { Hero } from './components/Hero';
import { Experience } from './components/Experience';
import { Projects } from './components/Projects';
import { Skills } from './components/Skills';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

export function App() {
  return (
    // reducedMotion="user" is the global safety net: every motion.* element
    // below automatically drops its x/y/scale/rotate animation (keeping
    // opacity fades) for anyone with prefers-reduced-motion set.
    <MotionConfig reducedMotion="user">
      <div className="bg-bg">
        {/* Outside <main> and aria-hidden: it is a replacement for the native
            cursor, not content. Renders nothing without a fine pointer. */}
        <Cursor />
        <NavRail />
        <main>
          <Hero />
          <Experience />
          <Projects />
          <Skills />
          <Contact />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
