// CraftTraq's panel shows the real product rather than a rebuilt facsimile:
// two production screenshots dropped into a laptop and a phone shell. Both
// screens use their screenshot's native aspect ratio (not the tidy 16/10 and
// 9/19 a mockup would normally take) so `object-cover` never has anything to
// crop — the job board keeps its fourth column and the calendar keeps its week.
const LAPTOP_RATIO = '1902 / 938';
const PHONE_RATIO = '375 / 835';

const BEZEL = '1px solid #22304a';
const SHELL = 'linear-gradient(180deg,#161d2c,#0d121c)';

export function CraftTraqVisual() {
  return (
    <div
      className="proj-anim relative flex w-full items-end justify-center pb-1.5 pt-5"
      style={{ animation: 'proj-fade .7s both' }}
    >
      {/* ── Laptop ───────────────────────────────────────────────────── */}
      <div
        className="proj-anim relative min-w-0 flex-auto"
        style={{ maxWidth: 660, animation: 'proj-rise .9s cubic-bezier(.2,.8,.2,1) both .08s' }}
      >
        <div
          className="relative rounded-t-[11px] px-[9px] pt-[9px]"
          style={{ border: BEZEL, borderBottom: 0, background: SHELL, boxShadow: '0 44px 90px -34px rgba(0,0,0,.95)' }}
        >
          {/* Camera strip along the top of the lid. */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 h-[3px] w-10 -translate-x-1/2 rounded-sm"
            style={{ top: 3.5, background: '#1e2839' }}
          />
          <div
            className="relative overflow-hidden rounded-t-[5px]"
            style={{ background: '#0c0c0e', aspectRatio: LAPTOP_RATIO }}
          >
            <picture>
              <source srcSet="/crafttraq-board.webp" type="image/webp" />
              <img
                src="/crafttraq-board.png"
                alt="CraftTraq's Field Ops Console: a jobs board for Apex Plumbing with Created, In Progress, Complete, and Approved columns, each card showing a job ID, title, client, due date, and the initials of the assigned crew."
                loading="lazy"
                width={1902}
                height={938}
                className="block h-full w-full object-cover object-top"
              />
            </picture>
            {/* Reflection sweeping across the glass. */}
            <div
              aria-hidden="true"
              className="proj-anim pointer-events-none absolute inset-y-0 left-0 z-[4] w-[34%]"
              style={{
                background: 'linear-gradient(100deg, transparent, rgba(255,255,255,.055), transparent)',
                opacity: 0,
                animation: 'proj-scan 7s cubic-bezier(.4,0,.6,1) infinite 1s',
              }}
            />
          </div>
        </div>
        {/* Hinge deck and the foot it sits on. */}
        <div
          aria-hidden="true"
          className="h-[11px] rounded-b-[14px]"
          style={{
            background: 'linear-gradient(180deg,#1a2233,#0b0f18)',
            border: BEZEL,
            borderTop: 0,
            boxShadow: '0 22px 40px -18px rgba(0,0,0,.9)',
          }}
        />
        <div
          aria-hidden="true"
          className="mx-auto h-1 w-[74%] rounded-b-[6px]"
          style={{ background: 'linear-gradient(180deg,#111825,#080c14)' }}
        />
      </div>

      {/* ── Phone, overlapping the laptop's right edge ───────────────── */}
      <div
        className="proj-anim relative z-[3] mb-3.5 flex-none"
        // Sized as a share of the mockup row, not of the viewport: against a
        // vw the phone kept its full height while the laptop shrank with the
        // panel, so on a phone-width screen it towered over the machine it is
        // meant to sit beside. A percentage keeps the two in proportion at
        // every width; the clamp stops it collapsing or outgrowing the lid.
        style={{
          width: 'clamp(56px,19%,126px)',
          marginLeft: '-2.5%',
          animation: 'proj-rise 1s cubic-bezier(.2,.8,.2,1) both .28s',
        }}
      >
        <div className="proj-anim" style={{ animation: 'proj-float 6.5s ease-in-out infinite' }}>
          <div
            className="relative rounded-[14px] p-1"
            style={{ border: BEZEL, background: SHELL, boxShadow: '0 30px 60px -20px rgba(0,0,0,.95)' }}
          >
            <div
              className="relative overflow-hidden rounded-[11px]"
              style={{ background: '#0c0c0e', aspectRatio: PHONE_RATIO }}
            >
              <picture>
                <source srcSet="/crafttraq-calendar.webp" type="image/webp" />
                <img
                  src="/crafttraq-calendar.png"
                  alt="The same platform on a phone: CraftTraq's week calendar for July 27 to August 2, listing each day's scheduled tasks as colour-coded time blocks."
                  loading="lazy"
                  width={375}
                  height={835}
                  className="block h-full w-full object-cover object-top"
                />
              </picture>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
