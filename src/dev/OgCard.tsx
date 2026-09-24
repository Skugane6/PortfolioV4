import { Airframe } from '../components/drawing/Airframe';
import { aircraft } from '../content/aircraft';
import { profile } from '../content/profile';

/**
 * The link-preview image (1200 × 630), rendered from the site's own parts by
 * scripts/generate-og.mjs through the dev fixture route ?fixture=og.
 */
export function OgCard() {
  return (
    <div
      className="relative overflow-hidden bg-cyanotype"
      style={{
        width: 1200,
        height: 630,
        backgroundImage:
          'linear-gradient(rgb(var(--c-construction) / 0.13) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-construction) / 0.13) 1px, transparent 1px), linear-gradient(rgb(var(--c-construction) / 0.07) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-construction) / 0.07) 1px, transparent 1px)',
        backgroundSize: '120px 120px, 120px 120px, 24px 24px, 24px 24px',
      }}
    >
      <div className="absolute inset-[20px] border-2 border-construction" />
      <div className="absolute left-[64px] right-[64px] top-[60px]">
        <p className="w-cond font-bold leading-[0.9] text-blueprint" style={{ fontSize: 112 }}>
          {profile.name}
        </p>
        <p className="mt-6 max-w-[900px] text-blueprint" style={{ fontSize: 30, lineHeight: 1.3 }}>
          Software engineer. A component tracker supporting 2,000+ aircraft at Mitsubishi Heavy Industries, and CraftTraq,
          a live SaaS for trade contractors.
        </p>
      </div>
      <div className="absolute bottom-[140px] left-[64px] right-[300px]">
        <Airframe detail="key" title={`Side elevation, ${aircraft.family}`} decorative />
      </div>
      <div className="absolute bottom-[40px] left-[64px] right-[64px] grid grid-cols-4 border-l border-t border-faded/70 bg-cyanotype">
        {[
          ['Drawn', profile.drafter],
          ['Education', 'Western, B.E.Sc. 2026'],
          ['Sheet', '01 of 05'],
          ['Set', profile.siteUrl.replace(/^https:\/\//, '').replace(/\/$/, '')],
        ].map(([label, value]) => (
          <div key={label} className="border-b border-r border-faded/70 px-4 py-3">
            <p className="lettering w-narrow text-faded" style={{ fontSize: 15 }}>
              {label}
            </p>
            <p className="mt-1 text-blueprint" style={{ fontSize: 20 }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
