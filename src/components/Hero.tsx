import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { useCanRender3D } from '../hooks/useCanRender3D';
import { NetworkFieldFallback } from './networkField/NetworkFieldFallback';
import heroImage from '../assets/hero.jpg';
import { blueprintGrid, btnPrimary, underlineLink } from '../styles/shared';
import { staggerContainer, staggerItem } from './Reveal';

const NetworkField = lazy(() =>
  import('./networkField/NetworkField').then((module) => ({ default: module.NetworkField }))
);

// Fades the network out behind the copy column (left) so it reads as an
// accent visual instead of competing with the text, and stays vivid toward
// the open right two-thirds of the section.
const networkMaskStyle = {
  WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 34%, black 62%)',
  maskImage: 'linear-gradient(to right, transparent 0%, transparent 34%, black 62%)',
};

export function Hero() {
  const canRender3D = useCanRender3D();

  return (
    <section id="hero" className="relative flex min-h-screen items-center overflow-hidden bg-bg">
      <div aria-hidden="true" className={blueprintGrid} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(76,141,255,0.16),transparent_60%)]"
      />
      <div className="absolute inset-0" style={networkMaskStyle}>
        {canRender3D ? (
          <Suspense fallback={<NetworkFieldFallback />}>
            <NetworkField />
          </Suspense>
        ) : (
          <NetworkFieldFallback />
        )}
      </div>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative z-10 mx-auto flex max-w-4xl flex-col gap-6 px-6"
      >
        <motion.img
          variants={staggerItem}
          src={heroImage}
          alt="Searan Kuganesan"
          className="h-24 w-24 rounded-full object-cover"
        />
        <motion.h1 variants={staggerItem} className="font-display text-display-lg text-ink">
          Searan Kuganesan
        </motion.h1>
        <motion.p variants={staggerItem} className="max-w-xl font-serif text-lg italic text-ink-dim">
          I build the systems operators run their business on.
        </motion.p>
        <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-6">
          <motion.a
            href="/skuganesan_resume.pdf"
            download
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={btnPrimary}
          >
            ↓ Download Résumé
          </motion.a>
          <a href="#work" className={`font-mono text-xs tracking-widest text-accent-text ${underlineLink}`}>
            SEE THE WORK
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
