import { Reveal } from './Reveal';

const EMAIL = 'searan.kuganesan4@gmail.com';

const LINKS = [
  { label: 'Email', href: `mailto:${EMAIL}` },
  { label: 'GitHub', href: 'https://github.com/skugane6' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/searan-kuganesan' },
  { label: 'CraftTraq', href: 'https://crafttraq.com' },
];

export function Contact() {
  return (
    <section id="contact" className="bg-void px-6 py-section">
      <Reveal>
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-xs tracking-widest text-accent-text">§ 04 — CONTACT</p>
          <h2 className="mt-4 font-display text-display-md text-ink">
            Email is the fastest way to reach me. I read everything that comes in.
          </h2>
          <div className="mt-8 flex flex-wrap gap-6 font-mono text-sm tracking-widest">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-ink-dim hover:text-accent-text"
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
              >
                {link.label.toUpperCase()}
              </a>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
