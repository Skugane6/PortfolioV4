import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { experience, education } from '../data/experience';
import { HudCard, RING_INSET } from './experience/HudCard';
import {
  AirframeNotes,
  SheetMarks,
  SpecBlock,
  type SheetDetail,
} from './experience/BlueprintAnnotations';

const role = experience[0];

// Below this rendered plate width the two-up card row can no longer hold a
// readable column, so the callouts switch to a single slot shown one at a
// time. Measured against the width the plate *would* take in the wide layout
// (78vw, capped) rather than its current width — the stacked plate is capped
// well below this, so reading the live width would make the switch one-way.
const STACK_BREAKPOINT = 850;
// The four-up layout also needs vertical room: on a short viewport fit() has
// to shrink it far enough that the body copy stops being readable.
const SHORT_VIEWPORT = 700;

// Clear air between the airframe and the nearest card edge. Fixed px, not a
// share of the plate: the plate is only ~60px tall on a phone, so the old
// percentage offset put the card on top of the fuselage.
const WIDE_GAP = 22;
const STACK_GAP = 30;

// Stacked cards are sized off the stage, not the plate — the plate is a
// 5:1 letterbox, so matching it makes for either 90-character lines on a
// tablet or a needlessly pinched column on a phone.
const STACK_CARD_MAX = 500;
// From md up the NavRail is a vertical strip on the right edge; keep the
// stacked card clear of it. Below md the rail is a bottom bar, so the card
// only owes the screen edge a gutter.
const RAIL_GUTTER = 170;
const EDGE_GUTTER = 16;
// PARALLAX_TRANSFORM grows the assembly to this by the end of the scroll, so
// the card has to be budgeted at its largest or it rides out through the
// gutter it was sized to sit inside.
const PARALLAX_MAX_SCALE = 1.06;

// How far down the stage the spec block reaches, measured from the HUD band it
// hangs off. On a short viewport the assembly rides up past this and the table
// would print over the tail, so it only appears when the airframe clears it.
const SPEC_BLOCK_BOTTOM = 196;

// Per-frame easing shared by both reveal schedules below.
function ease(t: number) {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
}

// Wide-layout reveal: a simple ease-in ramp, since all three callouts can be
// on screen at once.
function seg(p: number, start: number, span: number) {
  return ease((p - start) / span);
}

// Stacked-layout reveal: rises to 1 by riseEnd, holds, falls to 0 by fallEnd.
// One slot is reused, so each card must clear it before the next arrives.
function win(p: number, riseStart: number, riseEnd: number, fallStart: number, fallEnd: number) {
  if (p <= riseStart) return 0;
  if (p < riseEnd) return ease((p - riseStart) / (riseEnd - riseStart));
  if (p <= fallStart) return 1;
  if (p < fallEnd) return 1 - ease((p - fallStart) / (fallEnd - fallStart));
  return 0;
}

// Per-callout reveal alphas, written on the stage as custom properties.
const ALPHAS = ['--a1', '--a2', '--a3', '--a4'];

// The drafting furniture clears as the survey starts: full strength while the
// sheet is at rest, gone by the time the second callout is on its way in.
const ANNOTATION_FADE = [0.02, 0.28];

const WIDE_STARTS = [0.08, 0.26, 0.44, 0.62];
const WIDE_SPAN = 0.18;
const STACKED_WINDOWS: Array<[number, number, number, number]> = [
  [0.1, 0.18, 0.28, 0.33],
  [0.34, 0.42, 0.52, 0.57],
  [0.58, 0.66, 0.76, 0.81],
  [0.82, 0.9, 1.01, 1.02],
];

// Per-callout dot placement. `above` is a wide-layout property only: cards 0
// and 3 sit above the airframe there, and drop below it — like the others —
// once stacked.
const CARD_META = [
  { dotLeft: 11.4, dotTop: 66, slide: { x: -30, y: 16 }, above: true },
  { dotLeft: 42.4, dotTop: 88, slide: { x: -26, y: -16 }, above: false },
  { dotLeft: 73.2, dotTop: 58, slide: { x: 26, y: -16 }, above: false },
  {
    // The fin's leading edge, the only structure this far aft that a leader
    // line can land on without crossing the stabiliser.
    dotLeft: 87,
    dotTop: 32,
    slide: { x: 30, y: 16 },
    above: true,
  },
];

// The leader line always grows out of the station dot toward its card, so the
// drawing reads as annotating itself: `origin` is the end that stays put under
// the scaleY reveal, and the gradient puts the bright end on the dot.
function leaderLine(meta: (typeof CARD_META)[number], stacked: boolean) {
  const gap = stacked ? STACK_GAP : WIDE_GAP;
  if (!stacked && meta.above) {
    return {
      origin: 'bottom' as const,
      top: `-${gap}px`,
      height: `calc(${meta.dotTop}% + ${gap}px)`,
    };
  }
  return {
    origin: 'top' as const,
    top: `${meta.dotTop}%`,
    height: `calc(${100 - meta.dotTop}% + ${gap}px)`,
  };
}

// "STA 145 · FWD" -> "Sta 145 · fwd", for the HUD phase readout.
function toPhaseLabel(station: string) {
  return station.charAt(0) + station.slice(1).toLowerCase();
}

// Shared by the image, its leader-line/dot overlay, and the callout cards so
// all four ride together as one rigid sheet. Applying this to some layers
// and not others is what let the lines drift away from their cards as p grew
// — the image can shift ~45px at the scroll extremes, and anything not
// sharing this transform stays put while it does.
// --kx gates the sideways drift alone. Stacked cards are sized against the
// screen rather than the plate, so a ±12px sideways ride would push them
// through their gutters; they keep the vertical drift and the scale.
const PARALLAX_TRANSFORM =
  'translate3d(calc((0.5 - var(--p, 0)) * 6.2vw * var(--k, 1) * var(--kx, 1)), calc(var(--p, 0) * -22px * var(--k, 1)), 0) scale(calc(1.005 + var(--p, 0) * 0.055))';

// Each card box is its plate plus the RING_INSET band the offset outline lives
// in, so every anchor below backs off by that band to leave the plate — and
// therefore the leader line meeting its corner — exactly where it was.
const R = `${RING_INSET}px`;
const pad = (v: string) => `calc(${v} - ${R})`;
const grow = (v: string) => `calc(${v} + ${RING_INSET * 2}px)`;

function cardPositionStyle(index: number, stacked: boolean): CSSProperties {
  if (stacked) {
    // --cardw is measured off the stage (see sync), so centre the card on the
    // stage rather than filling the plate. 50% resolves against the plate,
    // and the plate is centred, so this lands on the stage's midline too.
    return {
      left: `calc(50% - var(--cardw, 100%) / 2 - ${R})`,
      top: pad(`calc(100% + ${STACK_GAP}px)`),
      width: grow('var(--cardw, 100%)'),
    };
  }
  const clear = `calc(100% + ${WIDE_GAP}px)`;
  if (index === 0) return { left: pad('1%'), bottom: pad(clear), width: grow('min(440px, 37vw)') };
  // Card 1's dot sits at 42.4% of the plate. Anchoring from the left at 1.5%
  // (like the original reference) never reaches that far right at any
  // desktop width — the card's own width (min(404px, 31vw)) tops out at
  // 34-40% of the plate depending on viewport, so the dot always lands past
  // its right edge and the leader line misses the card entirely. Anchoring
  // further right at 10% keeps the dot inside the card at every width.
  if (index === 1) return { left: pad('10%'), top: pad(clear), width: grow('min(404px, 31vw)') };
  if (index === 2) return { right: pad('1.5%'), top: pad(clear), width: grow('min(404px, 31vw)') };
  // Card 3 mirrors card 0 across the airframe: above the plate, anchored to
  // the right edge so its leader line drops onto the fin.
  return { right: pad('1.5%'), bottom: pad(clear), width: grow('min(404px, 31vw)') };
}

export function Experience() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const titleBlockRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const runningRef = useRef(false);
  const stackedRef = useRef(false);
  const detailRef = useRef<SheetDetail>('full');
  const lastRef = useRef({ pct: -1, phase: '' });

  const [stacked, setStacked] = useState(false);
  const [detail, setDetail] = useState<SheetDetail>('full');
  const [showSpec, setShowSpec] = useState(false);
  const [readout, setReadout] = useState(0);
  const [phase, setPhase] = useState('Datum');

  // Writes --p/--a1../--a3 for the current frame and mirrors the percent and
  // phase readouts into state (only on change, so this doesn't re-render on
  // every frame). Reads stackedRef rather than the `stacked` state so it
  // always sees the latest layout even though this closure is only ever
  // created once (see the mount effect below).
  const apply = (p: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const s = stage.style;
    s.setProperty('--p', p.toFixed(4));

    const as = stackedRef.current
      ? STACKED_WINDOWS.map(([rs, re, fs, fe]) => win(p, rs, re, fs, fe))
      : WIDE_STARTS.map((start) => seg(p, start, WIDE_SPAN));
    as.forEach((a, i) => s.setProperty(`--a${i + 1}`, a.toFixed(4)));

    const [fadeFrom, fadeTo] = ANNOTATION_FADE;
    s.setProperty('--ann', (1 - ease((p - fadeFrom) / (fadeTo - fadeFrom))).toFixed(4));

    const pct = Math.round(p * 100);
    if (pct !== lastRef.current.pct) {
      lastRef.current.pct = pct;
      setReadout(pct);
    }

    // Read the label off whichever callout is actually lit, so it can never
    // name a station whose card isn't on screen. Highest lit index, not the
    // strongest: wide mode accumulates callouts and all of them sit at alpha
    // 1, so the readout must name the newest arrival.
    let lit = -1;
    as.forEach((a, i) => {
      if (a > 0.4) lit = i;
    });
    let nextPhase: string;
    if (lit === role.callouts.length - 1 && p >= 0.92) nextPhase = 'Survey complete';
    else if (lit >= 0) nextPhase = toPhaseLabel(role.callouts[lit].station);
    else if (p < 0.16 && as.every((v) => v <= 0.001)) nextPhase = 'Datum';
    // Mid-handover the slot is briefly empty; hold the last station rather
    // than snapping back to the datum.
    else nextPhase = lastRef.current.phase || 'Datum';

    if (nextPhase !== lastRef.current.phase) {
      lastRef.current.phase = nextPhase;
      setPhase(nextPhase);
    }
  };

  const read = () => {
    const el = sectionRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const travel = Math.max(1, r.height - window.innerHeight);
    apply(Math.max(0, Math.min(1, -r.top / travel)));
  };

  // A plain throttled scroll listener can swallow the last event of a jump
  // and leave progress stale, so read on every frame while in view.
  const tick = () => {
    if (!runningRef.current) return;
    read();
    rafRef.current = requestAnimationFrame(tick);
  };

  const start = () => {
    if (runningRef.current) return;
    runningRef.current = true;
    rafRef.current = requestAnimationFrame(tick);
  };

  const stop = () => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    read();
  };

  // Reduced motion just kills the parallax drift (--k); the callouts still
  // reveal on scroll, same as full motion.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    stageRef.current?.style.setProperty('--k', reduce ? '0' : '1');
  }, []);

  // Re-measures the plate width (for the stacked/wide breakpoint) and scales
  // + re-centers the whole assembly to fit between the HUD and footer bands,
  // since the callout cards can push the assembly taller than the viewport.
  useEffect(() => {
    const stage = stageRef.current;
    const plate = plateRef.current;
    if (!stage || !plate) return;

    const fit = () => {
      const s = stage.style;
      s.setProperty('--fit', '1');
      s.setProperty('--shift', '0px');

      // Measure with every callout pinned to its revealed position. Unrevealed
      // cards are still offset by their slide vectors, which pulls the top and
      // bottom of the assembly ~16px in on each side — enough for the fit to
      // come out at 1 on a layout that overruns once the cards land.
      const revealed = ALPHAS.map((v) => s.getPropertyValue(v));
      ALPHAS.forEach((v) => s.setProperty(v, '1'));

      // Measure the image and the cards directly rather than walking
      // plate.children: the cards now sit inside an `inset-0` wrapper (so it
      // shares the image's parallax transform) whose own box never grows
      // past the plate even though its card children are absolutely
      // positioned below it.
      let top = Infinity;
      let bottom = -Infinity;
      plate.querySelectorAll('img, [data-card-index]').forEach((el) => {
        const r = el.getBoundingClientRect();
        top = Math.min(top, r.top);
        bottom = Math.max(bottom, r.bottom);
      });

      ALPHAS.forEach((v, i) => {
        if (revealed[i]) s.setProperty(v, revealed[i]);
        else s.removeProperty(v);
      });
      const pr = plate.getBoundingClientRect();
      top = Math.min(top, pr.top);
      bottom = Math.max(bottom, pr.bottom);

      // The HUD title block and footer own fixed bands at the top and bottom
      // of the stage; the plate assembly gets what's left, centred in that
      // band rather than in the whole stage. Only the top-right progress
      // readout stays put — the title block and footer fade as the survey
      // starts — so the assembly may use nearly the whole stage.
      const sr = stage.getBoundingClientRect();
      const GAP = 18;
      const hr = hudRef.current?.getBoundingClientRect();
      const bandTop = (hr ? hr.top : sr.top + 30) + GAP;
      // The title block no longer fades out of the assembly's way, so measure
      // it rather than reserving a guessed band: it sits higher on narrow
      // viewports, where it has to clear the mobile nav bar too.
      const tr = titleBlockRef.current?.getBoundingClientRect();
      const bandBottom = (tr ? tr.top : sr.bottom - 74) - GAP;

      // PARALLAX_TRANSFORM grows the assembly from 1.005x to 1.06x across the
      // scroll, and fit() can run at any point in that range. Normalise the
      // measurement to the largest it will ever be, or the cards fit when
      // measured early and overrun the footer band by the time p reaches 1.
      const p = parseFloat(s.getPropertyValue('--p')) || 0;
      const need = (bottom - top) * (1.06 / (1.005 + p * 0.055));
      const room = bandBottom - bandTop;
      const scale = Math.max(0.66, Math.min(1, room / Math.max(1, need)));
      s.setProperty('--fit', scale.toFixed(3));

      // Re-centre: scaling happens about the plate group's own centre, so
      // work out where the assembly's midpoint lands and nudge it onto the
      // band's midpoint.
      const plateMid = (pr.top + pr.bottom) / 2;
      const assemblyMid = plateMid + ((top + bottom) / 2 - plateMid) * scale;
      const shift = (bandTop + bandBottom) / 2 - assemblyMid;
      s.setProperty('--shift', shift.toFixed(1) + 'px');

      // Where the fuselage ends up in the stage, for sheet furniture that has
      // to line up with the airframe rather than with the stage's midline.
      // The group scales about the plate's own centre, so only the shift moves
      // it.
      s.setProperty('--planey', (plateMid + shift - sr.top).toFixed(1) + 'px');
    };

    const sync = () => {
      // Derived from the viewport, not plate.clientWidth: the plate's own
      // width depends on which layout is active, so measuring it here would
      // latch the stacked layout on and never let it back off.
      const wideWidth = Math.min(1180, window.innerWidth * 0.78);
      const next = wideWidth < STACK_BREAKPOINT || window.innerHeight < SHORT_VIEWPORT;
      if (next !== stackedRef.current) {
        stackedRef.current = next;
        setStacked(next);
      }

      // md is where the NavRail leaves the bottom of the screen and the sheet
      // margins open up enough to carry notes beside the airframe.
      const nextDetail: SheetDetail = !next ? 'full' : window.innerWidth >= 768 ? 'mid' : 'compact';
      if (nextDetail !== detailRef.current) {
        detailRef.current = nextDetail;
        setDetail(nextDetail);
      }

      const s = stage.style;
      s.setProperty('--kx', next ? '0' : '1');
      // Measured as a half-width off the stage centre, since that is what the
      // card is centred on, then backed off by the scale and the ring band the
      // card's outline lives in.
      const gutter = window.innerWidth >= 768 ? RAIL_GUTTER : EDGE_GUTTER;
      const half = stage.clientWidth / 2 - gutter;
      const room = Math.round((half / PARALLAX_MAX_SCALE - RING_INSET) * 2);
      s.setProperty('--cardw', `${Math.max(260, Math.min(STACK_CARD_MAX, room))}px`);

      fit();

      // fit() has just placed the assembly, so this reads where the airframe
      // actually landed. The spec block's own presence does not move it —
      // the band is measured from the HUD's top edge — so this can't oscillate.
      const clearance = plate.getBoundingClientRect().top - stage.getBoundingClientRect().top;
      setShowSpec(nextDetail !== 'compact' && clearance > SPEC_BLOCK_BOTTOM);

      read();
    };

    sync();
    window.addEventListener('resize', sync);

    let ro: ResizeObserver | undefined;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(sync);
      ro.observe(stage);
      ro.observe(plate);
      // The callout cards drive the required height most: their text reflow
      // changes their own size without changing the stage or plate box.
      plate.querySelectorAll('[data-card-index]').forEach((el) => ro!.observe(el));
    }

    if (document.fonts?.ready) document.fonts.ready.then(sync);
    const t1 = window.setTimeout(sync, 400);
    const t2 = window.setTimeout(sync, 1200);

    const img = plate.querySelector('img');
    const onImgLoad = () => sync();
    if (img && !img.complete) img.addEventListener('load', onImgLoad, { once: true });

    return () => {
      window.removeEventListener('resize', sync);
      ro?.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      img?.removeEventListener('load', onImgLoad);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    read();
    if (!window.IntersectionObserver || !sectionRef.current) {
      start();
      return () => stop();
    }
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), {
      rootMargin: '120px 0px',
    });
    io.observe(sectionRef.current);
    return () => {
      io.disconnect();
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const footfade = stacked ? 8 : 3;

  return (
    <section id="experience" ref={sectionRef} className="relative bg-bg" style={{ height: '400vh' }}>
      <div ref={stageRef} className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[10%] bg-[linear-gradient(to_right,rgba(96,128,180,0.075)_1px,transparent_1px),linear-gradient(to_bottom,rgba(96,128,180,0.075)_1px,transparent_1px)] bg-[length:32px_32px] will-change-transform"
          style={{ transform: 'translate3d(calc((0.5 - var(--p, 0)) * -46px * var(--k, 1)), calc(var(--p, 0) * -26px * var(--k, 1)), 0)' }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 will-change-transform"
          style={{
            background: 'radial-gradient(120% 70% at 50% 42%, rgba(47,106,212,0.16), transparent 62%)',
            transform: 'translate3d(0, calc(var(--p, 0) * -40px * var(--k, 1)), 0)',
          }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[-6%] right-[-6%] top-1/2 h-0 will-change-transform"
          style={{
            transform: 'translate3d(calc((0.5 - var(--p, 0)) * 210px * var(--k, 1)), 0, 0)',
            opacity: 'calc(var(--p, 0) * 2.4)',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'repeating-linear-gradient(90deg, rgba(96,128,180,0.34) 0 8px, transparent 8px 18px)' }} />
          <div className="absolute inset-x-0 top-px h-[9px]" style={{ background: 'repeating-linear-gradient(90deg, rgba(96,128,180,0.26) 0 1px, transparent 1px 72px)' }} />
          <div className="absolute inset-x-0 h-px" style={{ top: '-170px', background: 'repeating-linear-gradient(90deg, rgba(96,128,180,0.14) 0 3px, transparent 3px 12px)' }} />
          <div className="absolute inset-x-0 h-px" style={{ top: '190px', background: 'repeating-linear-gradient(90deg, rgba(96,128,180,0.14) 0 3px, transparent 3px 12px)' }} />
        </div>

        <div style={{ transform: 'translateY(var(--shift, 0px)) scale(var(--fit, 1))', transformOrigin: 'center center' }}>
          {/* Stacked, the plate gets a bigger share of a narrow screen (the
              airframe is otherwise a 60px sliver on a phone) but is capped
              short of STACK_BREAKPOINT so widening it can never flip the
              layout back and forth. */}
          <div
            ref={plateRef}
            className="relative aspect-[2108/424]"
            style={{ width: stacked ? 'min(760px, 88vw)' : 'min(1180px, 78vw)' }}
          >
            <img
              src="/crj-xray.png"
              alt="CRJ700/900 x-ray side elevation"
              className="absolute inset-0 h-full w-full will-change-transform"
              style={{ mixBlendMode: 'screen', transform: PARALLAX_TRANSFORM }}
            />

            {/* Under the same transform as the image: the dimension has to
                keep measuring the thing it points at. */}
            <div className="absolute inset-0 will-change-transform" style={{ transform: PARALLAX_TRANSFORM }}>
              <AirframeNotes detail={detail} />
            </div>

            <div aria-hidden="true" className="absolute inset-0 will-change-transform" style={{ transform: PARALLAX_TRANSFORM }}>
              {CARD_META.map((meta, i) => {
                const a = `var(--a${i + 1}, 0)`;
                const line = leaderLine(meta, stacked);
                return (
                  <div key={role.callouts[i].station}>
                    <div
                      className="absolute w-px"
                      style={{
                        left: `${meta.dotLeft}%`,
                        top: line.top,
                        height: line.height,
                        transformOrigin: `${line.origin} center`,
                        background: `linear-gradient(${line.origin === 'top' ? 180 : 0}deg, #f0a02a, rgba(240,160,42,0.25))`,
                        transform: `scaleY(${a})`,
                      }}
                    />
                    <div
                      className="absolute -ml-1 -mt-1 h-[9px] w-[9px] rounded-full border border-amber-signal bg-[rgba(240,160,42,0.28)]"
                      style={{ left: `${meta.dotLeft}%`, top: `${meta.dotTop}%`, opacity: a, transform: `scale(calc(0.4 + ${a} * 0.6))` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Same transform as the image and its overlay above, so each card's
                corner stays exactly where its leader line ends regardless of
                scroll-driven parallax. */}
            <div className="absolute inset-0" style={{ transform: PARALLAX_TRANSFORM }}>
              {role.callouts.map((callout, i) => {
                const meta = CARD_META[i];
                const a = `var(--a${i + 1}, 0)`;
                return (
                  <div
                    key={callout.station}
                    data-card-index={i}
                    className="absolute z-[3] box-border"
                    style={{
                      ...cardPositionStyle(i, stacked),
                      opacity: a,
                      transform: `translate3d(calc((1 - ${a}) * ${meta.slide.x}px), calc((1 - ${a}) * ${meta.slide.y}px), 0)`,
                    }}
                  >
                    <HudCard callout={callout} index={i} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div
          ref={hudRef}
          className="pointer-events-none absolute left-8 right-8 top-[30px] flex items-start justify-between gap-6 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim md:text-[10px] md:tracking-[0.2em]"
        >
          <div className="flex flex-col gap-2" style={{ opacity: 'calc(1.1 - var(--p, 0) * 12)' }}>
            <div className="whitespace-nowrap text-accent-text">§ 01 · Experience</div>
            {/* The aircraft itself is named in the spec block opposite. */}
            <div className="whitespace-nowrap">Side elevation · sheet 01</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-ink">{phase}</div>
            <div className="flex items-center gap-2.5">
              <div className="h-0.5 w-20 overflow-hidden bg-border md:w-32">
                <div className="h-full origin-left bg-amber-signal" style={{ transform: `scaleX(${readout / 100})` }} />
              </div>
              <span className="inline-block w-9 text-right">{String(readout).padStart(2, '0')}%</span>
            </div>
            {showSpec && <SpecBlock />}
          </div>
        </div>

        <SheetMarks detail={detail} />

        {/* Below md the NavRail is a fixed bottom bar, so the band lifts clear
            of it, and the two halves are allowed to wrap onto their own rows
            rather than crushing each other. */}
        <div className="pointer-events-none absolute bottom-[52px] left-8 right-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 md:bottom-[26px]">
          {/* Holds its natural width from md up, where the education line
              beside it has room to give; below that it has to be able to
              shrink or the company name runs off the sheet. */}
          <div className="min-w-0 shrink md:shrink-0">
            <div
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim"
              style={{ opacity: `calc(1.15 - var(--p, 0) * ${footfade})` }}
            >
              {role.start} – {role.end} · {role.location}
            </div>
            {/* Title block. Like the one on a real drawing it names the owner
                and never leaves the sheet, so unlike the dates line above it
                this does not fade as the survey runs. */}
            <div ref={titleBlockRef} className="mt-[9px] flex items-center gap-3">
              {role.logo && (
                <img
                  src={role.logo}
                  alt=""
                  className="h-[26px] w-auto shrink-0 md:h-[30px]"
                  // The mark ships as dark navy on transparent, which is
                  // invisible here; flatten it to the sheet's ink instead.
                  style={{ filter: 'brightness(0) invert(1)', opacity: 0.88 }}
                />
              )}
              <span aria-hidden="true" className="h-[30px] w-px shrink-0 bg-[rgba(96,128,180,0.38)] md:h-[32px]" />
              <div className="min-w-0">
                {/* The company name is 27 characters; below sm it has to be
                    allowed to wrap or it runs off the sheet. */}
                <div className="font-display text-[18px] font-semibold leading-[1.12] text-ink sm:whitespace-nowrap sm:text-[22px] md:text-[26px]">
                  {role.company}
                </div>
                <div className="mt-[6px] text-[12.5px] leading-none text-ink-dim md:text-[13px]">{role.role}</div>
              </div>
            </div>
          </div>
          <div className="min-w-0 grow text-right font-mono text-[9px] uppercase tracking-[0.2em] text-ink-dim">
            <div style={{ opacity: `calc(1.15 - var(--p, 0) * ${footfade})` }}>
              <span className="text-amber-signal motion-safe:animate-pulse">↓ scroll to survey</span>
            </div>
            <div className="mt-[7px]">
              {education.program}, {education.school} · {education.graduation}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
