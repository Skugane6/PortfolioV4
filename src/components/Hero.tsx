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

export function Hero() {
  const canRender3D = useCanRender3D();

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1322]"
    >
      <div aria-hidden="true" className={blueprintGrid} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_8%,rgba(46,86,158,0.35),rgba(11,19,34,0)_62%)]"
      />
      <div className="absolute inset-0">
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
        className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 text-center"
      >
        <motion.img
          variants={staggerItem}
          src={heroImage}
          alt="Searan Kuganesan"
          className="h-24 w-24 rounded-full border border-border object-cover"
        />
        <motion.h1 variants={staggerItem} className="font-display text-display-lg text-ink">
          Searan Kuganesan
        </motion.h1>
        <motion.p variants={staggerItem} className="max-w-xl font-serif text-lg italic text-ink-dim">
          I build the systems operators run their business on.
        </motion.p>
        <motion.div variants={staggerItem} className="flex flex-wrap items-center justify-center gap-6">
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
          <a href="#projects" className={`font-mono text-xs tracking-widest text-accent-text ${underlineLink}`}>
            SEE THE WORK
          </a>
        </motion.div>
      </motion.div>
      <div
        aria-hidden="true"
        className="absolute bottom-7 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.2em] text-ink-dim"
      >
        SCROLL
      </div>
    </section>
  );
}
