import { MotionConfig } from 'framer-motion';
import { NavRail } from './components/NavRail';
import { Hero } from './components/Hero';
import { FeaturedProject } from './components/FeaturedProject';
import { Experience } from './components/Experience';
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
        <NavRail />
        <main>
          <Hero />
          <FeaturedProject />
          <Experience />
          <Skills />
          <Contact />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
