import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { contactMarks, type ContactMarkSlug } from '../data/contactIcons';
import { Reveal, Stagger, staggerItem } from './Reveal';
import { SectionHeading } from './SectionHeading';

const EMAIL = 'searan.kuganesan4@gmail.com';
// Split for the <wbr> in the card below. An address is one unbreakable token to
// the line breaker, so on a 375px screen it either overflows or gets chopped
// wherever it happens to run out of room ("…gmail.co / m"). This gives it the
// one break point a reader would choose anyway.
const [EMAIL_LOCAL, EMAIL_DOMAIN] = EMAIL.split('@');

interface Channel {
  icon: ContactMarkSlug;
  /** Visible name, and the first half of the link's accessible name. */
  label: string;
  /** What the account is actually called over there. */
  handle: string;
  href: string;
  /** Blueprint index, continuing the station numbering the other sections use. */
  station: string;
}

// Email is not in this list: it is the one channel with two things to do with
// it (open a client, or copy the address into one), so it gets its own card
// above rather than being flattened into a row of identical links.
const CHANNELS: Channel[] = [
  {
    icon: 'github',
    label: 'GitHub',
    handle: 'skugane6',
    href: 'https://github.com/skugane6',
    station: 'CH 02',
  },
  {
    icon: 'linkedin',
    label: 'LinkedIn',
    handle: 'searan-kuganesan',
    href: 'https://linkedin.com/in/searan-kuganesan',
    station: 'CH 03',
  },
  {
    icon: 'crafttraq',
    label: 'CraftTraq',
    handle: 'crafttraq.com',
    href: 'https://crafttraq.com',
    station: 'CH 04',
  },
];

// The four corner brackets from the Skills chips, at the 100x100 box those
// were drawn in. Static here rather than pathLength-animated: a channel card is
// four times the size of a logo chip, and a pen-stroke draw at that scale reads
// as decoration rather than as the quiet registration mark it is meant to be.
const CORNERS = ['M2 12V2h10', 'M88 2h10v10', 'M98 88v10H88', 'M12 98H2V88'];

/** Brand hex as CSS custom properties, the same pair the Skills chips set. */
function brandVars(slug: ContactMarkSlug): CSSProperties {
  const { hex } = contactMarks[slug];
  return { '--brand': hex, '--brand-soft': `${hex}59` } as CSSProperties;
}

/**
 * One channel mark, plus the plate it sits on: corner ticks, a brand-tinted
 * bloom, and the logo itself. Shared by the email card and the three links so
 * every mark lands on the same 44px grid regardless of its source viewBox.
 */
function MarkPlate({ slug, size = 'md' }: { slug: ContactMarkSlug; size?: 'md' | 'lg' }) {
  const mark = contactMarks[slug];
  const box = size === 'lg' ? 'h-14 w-14' : 'h-11 w-11';
  const glyph = size === 'lg' ? 'h-7 w-7' : 'h-5 w-5';

  return (
    <span
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center rounded-lg border border-[rgba(90,130,200,.16)] bg-[rgba(12,17,26,.55)] ${box}`}
    >
      <span
        className="contact-bloom pointer-events-none absolute inset-0 rounded-lg"
        style={{ background: `radial-gradient(circle at 50% 42%, ${mark.hex}30, transparent 70%)` }}
      />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="contact-ticks pointer-events-none absolute inset-0 h-full w-full"
      >
        {CORNERS.map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {/* Static path data generated at build time by
          scripts/generate-skill-icons.mjs from vendored icon packages;
          nothing here originates from user input. */}
      <svg
        viewBox={mark.viewBox}
        role="presentation"
        className={`contact-mark relative ${glyph}`}
        dangerouslySetInnerHTML={{ __html: mark.body }}
      />
    </span>
  );
}

/* Interface glyphs, drawn here rather than pulled from an icon package: three
   16px strokes are cheaper inline than another generated module, and they need
   to match each other's pen weight more than they need to match a library. */

function ArrowOut({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5.5 10.5 10.5 5.5M6 5.5h4.5V10" />
    </svg>
  );
}

function CopyGlyph({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.6" />
      <path d="M10.5 3.2A1.7 1.7 0 0 0 8.8 2.5H4.2A1.7 1.7 0 0 0 2.5 4.2v4.6c0 .7.4 1.3 1 1.6" />
    </svg>
  );
}

function CheckGlyph({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}

function SendGlyph({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14 2 7.2 8.8M14 2l-4.4 12-2.4-5.2L2 6.4z" />
    </svg>
  );
}

/**
 * Copy-to-clipboard control for the address.
 *
 * The address stays visible and selectable next to it. This is a shortcut, not
 * the only way to get the text, so a browser that refuses clipboard access
 * (no permission, or no secure context) costs the visitor nothing. That case
 * silently leaves the label alone rather than raising an error state for a
 * failure the visitor cannot act on.
 */
function CopyButton() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(() => {
    void navigator.clipboard?.writeText(EMAIL).then(
      () => {
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2000);
      },
      () => {},
    );
  }, []);

  return (
    <motion.button
      type="button"
      onClick={copy}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-[rgba(12,17,26,.55)] px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-ink-dim transition-colors duration-200 hover:border-accent-text/50 hover:text-ink sm:flex-none"
    >
      {copied ? <CheckGlyph className="h-4 w-4 text-accent-text" /> : <CopyGlyph className="h-4 w-4" />}
      {copied ? 'Copied' : 'Copy address'}
      {/* The label swap above is visual; this is what actually announces the
          result, since a button's own name changing mid-press is not reliably
          read out. */}
      <span aria-live="polite" className="sr-only">
        {copied ? 'Email address copied to clipboard' : ''}
      </span>
    </motion.button>
  );
}

export function Contact() {
  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-bg px-5 py-24 sm:px-6 sm:py-28 lg:px-40 lg:py-section"
    >
      {/* Same drifting blueprint grid and corner wash as Projects and Skills,
          so the closing sheet belongs to the same drawing set. */}
      <div
        aria-hidden="true"
        className="proj-anim pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(rgba(91,143,240,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(91,143,240,.05) 1px, transparent 1px)',
          backgroundSize: '64px 64px, 64px 64px',
          animation: 'proj-drift 38s linear infinite',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[200px] -top-24 h-[520px] w-[520px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(43,92,168,.16), transparent 68%)' }}
      />

      <Reveal>
        <div className="relative mx-auto max-w-[1120px]">
          {/* Route count is derived, so adding a channel updates the strip. */}
          <SectionHeading
            word="CONTACT"
            label="§ 04 · CONTACT"
            caption={`OPEN CHANNELS · ${String(CHANNELS.length + 1).padStart(2, '0')} ROUTES`}
          />

          <Stagger className="mt-9 sm:mt-11">
            {/* ── CH 01 · email ────────────────────────────────────────
                The primary card is wider and taller than the three below it
                because it is the one channel worth a decision: everything else
                on this page is a profile to look at, this is the way to start a
                conversation. It is a plain div rather than a link: it holds
                two controls, and nesting them inside an anchor would make the
                whole card a single ambiguous target. */}
            <motion.div
              variants={staggerItem}
              style={brandVars('email')}
              className="contact-card relative overflow-hidden rounded-xl border border-[rgba(90,130,200,.16)] bg-[rgba(12,17,26,.55)] p-5 sm:p-6"
            >
              {/* Side by side only from xl. The two controls and a 27-character
                  address need about 800px between them, and this section keeps
                  a 160px gutter for the nav rail from lg up, so the row is
                  actually *tightest* just after lg, not on a phone. Below xl the
                  address takes the full width and the controls sit under it. */}
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:gap-6">
                <div className="flex items-center gap-4">
                  <MarkPlate slug="email" size="lg" />
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] tracking-[.22em] text-accent-text">
                      CH 01 · PRIMARY
                    </p>
                    {/* select-all so a click-drag grabs the whole address
                        rather than stopping at a dot. The <wbr> is inert to
                        selection and to textContent, so what gets copied is
                        still the address exactly. */}
                    <p className="mt-1.5 select-all font-mono text-sm text-ink sm:text-base">
                      {EMAIL_LOCAL}@<wbr />
                      {EMAIL_DOMAIN}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center xl:ml-auto">
                  <motion.a
                    href={`mailto:${EMAIL}`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-white transition-colors duration-150 hover:bg-accent-hover hover:shadow-accent-lift"
                  >
                    <SendGlyph className="h-4 w-4" />
                    Send email
                  </motion.a>
                  <CopyButton />
                </div>
              </div>
            </motion.div>

            {/* ── CH 02–04 · profiles ──────────────────────────────────
                One row layout at every width (mark, then name over handle,
                then the departure arrow) so the three read as a set instead
                of reflowing into a different card at each breakpoint. Only the
                column count changes, and it changes at xl rather than md for
                the reason the email card above splits there: from lg this
                section gives up 160px to the nav rail, so three columns are
                narrower at 1024 than at 768. Below xl each channel is a full
                width row matching the email card, which also means no handle
                ever has to be shortened to fit. */}
            <ul className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:gap-4 xl:grid-cols-3">
              {CHANNELS.map((channel) => (
                <motion.li key={channel.label} variants={staggerItem} style={brandVars(channel.icon)}>
                  <motion.a
                    href={channel.href}
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    className="contact-card group flex h-full min-h-[44px] items-center gap-3.5 overflow-hidden rounded-xl border border-[rgba(90,130,200,.16)] bg-[rgba(12,17,26,.55)] p-4"
                  >
                    <MarkPlate slug={channel.icon} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[9px] tracking-[.22em] text-accent-text/70">
                        {channel.station}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-ink">{channel.label}</span>
                      {/* Wraps rather than truncates: three cards across a
                          704px lg column leaves ~130px for this line, and an
                          ellipsised handle is a username the reader can no
                          longer type. A second line costs nothing here. */}
                      <span className="contact-handle mt-0.5 block break-all font-mono text-[11px]">
                        {channel.handle}
                      </span>
                    </span>
                    <ArrowOut className="contact-arrow h-4 w-4 shrink-0" />
                  </motion.a>
                </motion.li>
              ))}
            </ul>
          </Stagger>
        </div>
      </Reveal>
    </section>
  );
}
