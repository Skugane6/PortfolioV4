import { Suspense, lazy } from 'react';
import { useCanRender3D } from '../hooks/useCanRender3D';
import { ParticleFieldFallback } from './particleField/ParticleFieldFallback';
import heroImage from '../assets/hero.jpg';

const ParticleField = lazy(() =>
  import('./particleField/ParticleField').then((module) => ({ default: module.ParticleField }))
);

export function Hero() {
  const canRender3D = useCanRender3D();

  return (
    <section id="hero" className="relative flex min-h-screen items-center overflow-hidden bg-void">
      <div className="absolute inset-0">
        {canRender3D ? (
          <Suspense fallback={<ParticleFieldFallback />}>
            <ParticleField />
          </Suspense>
        ) : (
          <ParticleFieldFallback />
        )}
      </div>
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col gap-6 px-6">
        <img
          src={heroImage}
          alt="Searan Kuganesan"
          className="h-24 w-24 object-cover [filter:grayscale(1)_sepia(1)_hue-rotate(-20deg)_saturate(3.5)_brightness(0.8)]"
        />
        <h1 className="font-display text-display-lg text-ink">Searan Kuganesan</h1>
        <p className="max-w-xl text-lg text-ink-dim">
          I build the systems operators run their business on — aircraft fleets, trade-contractor
          crews, whatever&apos;s underneath.
        </p>
        <a href="#work" className="font-mono text-xs tracking-widest text-accent-text hover:text-ink">
          ↓ SEE THE WORK
        </a>
      </div>
    </section>
  );
}
