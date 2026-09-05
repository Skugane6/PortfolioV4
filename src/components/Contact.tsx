import { motion } from 'framer-motion';
import { Reveal, Stagger, staggerItem } from './Reveal';
import { blueprintGrid, underlineLink } from '../styles/shared';

const EMAIL = 'searan.kuganesan4@gmail.com';

const LINKS = [
  { label: 'Email', href: `mailto:${EMAIL}` },
  { label: 'GitHub', href: 'https://github.com/skugane6' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/searan-kuganesan' },
  { label: 'CraftTraq', href: 'https://crafttraq.com' },
];

export function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden bg-bg px-6 py-section">
      <div aria-hidden="true" className={blueprintGrid} />
      <Reveal>
        <div className="relative mx-auto max-w-2xl">
          <p className="font-mono text-xs tracking-widest text-accent-text">§ 04 · CONTACT</p>
          <h2 className="mt-4 font-display text-display-md text-ink">
            Email&apos;s the fastest way to reach me.
          </h2>
          <Stagger className="mt-8 flex flex-wrap gap-6 font-mono text-sm tracking-widest">
            {LINKS.map((link) => (
              <motion.a
                key={link.label}
                href={link.href}
                variants={staggerItem}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`text-ink-dim hover:text-accent-text ${underlineLink}`}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
              >
                {link.label.toUpperCase()}
              </motion.a>
            ))}
          </Stagger>
        </div>
      </Reveal>
    </section>
  );
}
