import { NavRail } from './components/NavRail';
import { Hero } from './components/Hero';
import { FeaturedProject } from './components/FeaturedProject';
import { Experience } from './components/Experience';
import { Skills } from './components/Skills';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

export function App() {
  return (
    <div className="bg-void">
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
  );
}
