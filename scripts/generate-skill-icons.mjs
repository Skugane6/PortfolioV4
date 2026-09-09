// Bakes the brand marks used by the Skills and Contact sections into two static
// modules (src/data/skillIcons.ts, src/data/contactIcons.ts). The three icon packages this reads are devDeps and
// never reach the bundle: only the handful of <path d=""> strings below do,
// which keeps ~30 logos at a couple of kB instead of pulling a 3,000-icon
// index through the tree-shaker.  Re-run after editing MARKS or CONTACT_MARKS:
//   node scripts/generate-skill-icons.mjs
//
// Every mark is normalised to the same shape: a viewBox plus an inner-SVG body
// painted with `currentColor`. Nothing carries its own colour, so the section
// can tint the whole plate blueprint-blue at rest and let a single tile bloom
// to its real brand hex on hover. That rules out the multi-colour/gradient sets
// (devicon, logos) for anything a monochrome set already covers.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as simpleIcons from 'simple-icons';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const iconify = (set) =>
  JSON.parse(fs.readFileSync(path.join(root, 'node_modules', '@iconify-json', set, 'icons.json'), 'utf8'));

const sets = { cib: iconify('cib'), mdi: iconify('mdi') };

// slug -> [source, name, brand hex]. Simple Icons ships the official hex with
// the mark; the Iconify sets don't, so those carry a hand-checked brand colour.
// The Iconify entries exist because Simple Icons drops marks whose owners
// disallow redistribution (AWS, Twilio, Oracle, Azure, Microsoft). cib is the
// monochrome stand-in, and `mdi:infinity` is the generic devops loop for the
// one entry that is a practice rather than a product.
const MARKS = {
  react: ['si', 'React'],
  typescript: ['si', 'Typescript'],
  fastapi: ['si', 'Fastapi'],
  flask: ['si', 'Flask'],
  postgresql: ['si', 'Postgresql'],
  tailwindcss: ['si', 'Tailwindcss'],

  stripe: ['si', 'Stripe'],
  twilio: ['cib', 'twilio', '#F22F46'],
  quickbooks: ['si', 'Quickbooks'],
  supabase: ['si', 'Supabase'],
  aws: ['cib', 'amazon-aws', '#FF9900'],
  googlecloud: ['si', 'Googlecloud'],
  cloudflare: ['si', 'Cloudflare'],

  python: ['si', 'Python'],
  pandas: ['si', 'Pandas'],
  numpy: ['si', 'Numpy'],
  scipy: ['si', 'Scipy'],
  scikitlearn: ['si', 'Scikitlearn'],
  tensorflow: ['si', 'Tensorflow'],
  sqlserver: ['cib', 'microsoft', '#CC2927'],
  oracle: ['cib', 'oracle', '#C74634'],
  mongodb: ['si', 'Mongodb'],

  pytest: ['si', 'Pytest'],
  jest: ['si', 'Jest'],
  cicd: ['mdi', 'infinity', '#5B8FF0'],
  azuredevops: ['cib', 'azure-devops', '#0078D7'],
  docker: ['si', 'Docker'],
  git: ['si', 'Git'],
};

// The Contact section's channel marks, in the same [source, name, hex] shape so
// they run through the identical normalise + contrast pipeline below. Three are
// real brands; `email` is the exception, standing in for a channel rather than a
// company, and it carries the site accent because a mailbox has no brand hue of
// its own to preserve.
//
// Both brands come from cib rather than Simple Icons: LinkedIn is one of the
// marks Simple Icons drops over redistribution terms, and GitHub's official
// #181717 is a near-black the lifter below can only take to a dead mid-grey,
// dimmer than the blueprint tint it is supposed to bloom out of, so it carries
// GitHub's own dark-mode foreground instead.
// CraftTraq ships no mark in any of the icon sets above, and the site already
// carries its logo at public/mini_logo.png. This is that PNG traced back into
// geometry: the clipboard body and clip are rounded rectangles, the clip's
// bump and stud are circles, and the monogram is straight edges plus three
// arcs, measured off the bitmap rather than eyeballed, then kept at the
// original 512 box so the proportions survive. It goes through onDark() with
// the sampled brand orange like every other mark here.
const RAW_MARKS = {
  crafttraq: {
    viewBox: '0 0 512 512',
    // The board is one outline rather than a ring: the clip's interior bites
    // clean through the top stroke, which splits the ring into a single
    // simply-connected shape. The clip itself is the one path that does need
    // evenodd: its bump and body share an outline, and its hole is a subpath.
    body:
      '<path fill="currentColor" d="M193 73H137a60 60 0 0 0-60 60v311a60 60 0 0 0 60 60h236a60 60 0 0 0 60-60V133a60 60 0 0 0-60-60h-56v24h56a36 36 0 0 1 36 36v311a36 36 0 0 1-36 36H137a36 36 0 0 1-36-36V133a36 36 0 0 1 36-36h56z"/>' +
      '<path fill="currentColor" fill-rule="evenodd" d="M194 45h10.7a52 52 0 0 1 100.6 0H316a24 24 0 0 1 24 24v42a24 24 0 0 1-24 24H194a24 24 0 0 1-24-24V69a24 24 0 0 1 24-24zM199 69h30.25a28 28 0 1 1 51.5 0H311a6 6 0 0 1 6 6v31a6 6 0 0 1-6 6H199a6 6 0 0 1-6-6V75a6 6 0 0 1 6-6z"/>' +
      '<path fill="currentColor" d="M255 47a16 16 0 1 0 .1 0z"/>' +
      '<path fill="currentColor" d="M220 205h123v35h-55v89h-34v-89h-80a48 48 0 0 1 46-35z"/>' +
      '<path fill="currentColor" d="M170 272h37v55a39 39 0 0 0 39 39h64v38h-64a76 76 0 0 1-76-76z"/>',
  },
};

const CONTACT_MARKS = {
  email: ['mdi', 'email-outline', '#5B8FF0'],
  github: ['cib', 'github', '#E6EDF3'],
  linkedin: ['cib', 'linkedin', '#0A66C2'],
  crafttraq: ['raw', 'crafttraq', '#FC5B00'],
};

// A handful of official brand hexes are all but invisible on this site's dark
// plates: pandas is #150458, NumPy is #013243. Storing the raw hex would leave
// those two tiles looking broken on hover while every other one blooms.
//
// The floor is a *contrast ratio against the plate*, not a lightness value:
// lightness alone can't tell that a violet at L=0.52 still fails 3:1 while a
// yellow at the same L clears it easily. Each colour is pushed through HSL and
// its lightness stepped up only until it reaches WCAG 1.4.11's 3:1 for non-text
// graphics, so a colour that already passes is left exactly as its owner ships
// it. Hue, the part that actually reads as "that's pandas", is never touched.
const PLATE_BG = '#12161f';
const MIN_CONTRAST = 3.2;
// Lifting a fully-saturated dark colour such as FastAPI's #009688 to a usable
// lightness turns it neon, which reads as a different brand rather than a
// brighter one, so anything that needs lifting also gets its saturation capped.
const MIN_SATURATION = 0.42;
const MAX_SATURATION = 0.82;
const MAX_LIGHTNESS = 0.82;

const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

const relativeLuminance = (hex) =>
  toRgb(hex)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + [0.2126, 0.7152, 0.0722][i] * v, 0);

const contrast = (a, b) => {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const rgbToHsl = ([r, g, b]) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6 : max === g ? ((b - r) / d + 2) / 6 : ((r - g) / d + 4) / 6;
  return [h, s, l];
};

const hslToHex = (h, s, l) => {
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

const onDark = (hex) => {
  if (contrast(hex, PLATE_BG) >= MIN_CONTRAST) return hex.toUpperCase();

  const [h, s, l] = rgbToHsl(toRgb(hex));
  // A greyscale mark has no hue to preserve, so saturating it would invent a
  // colour the brand doesn't have, so lift only its lightness.
  const saturation = s === 0 ? 0 : Math.min(Math.max(s, MIN_SATURATION), MAX_SATURATION);

  for (let lifted = l; lifted <= MAX_LIGHTNESS; lifted += 0.01) {
    const candidate = hslToHex(h, saturation, lifted);
    if (contrast(candidate, PLATE_BG) >= MIN_CONTRAST) return candidate;
  }
  return hslToHex(h, saturation, MAX_LIGHTNESS);
};

const build = (table) => {
  const built = {};
  for (const [slug, [source, name, hex]] of Object.entries(table)) {
    if (source === 'raw') {
      const mark = RAW_MARKS[name];
      if (!mark) throw new Error(`RAW_MARKS has no mark "${name}" (for "${slug}")`);
      built[slug] = { viewBox: mark.viewBox, body: mark.body, hex: onDark(hex) };
    } else if (source === 'si') {
      const icon = simpleIcons['si' + name];
      if (!icon) throw new Error(`simple-icons has no icon "si${name}" (for "${slug}")`);
      built[slug] = {
        viewBox: '0 0 24 24',
        body: `<path fill="currentColor" d="${icon.path}"/>`,
        hex: onDark(`#${icon.hex}`),
      };
    } else {
      const set = sets[source];
      const icon = set.icons[name];
      if (!icon) throw new Error(`@iconify-json/${source} has no icon "${name}" (for "${slug}")`);
      const w = icon.width ?? set.width;
      const h = icon.height ?? set.height;
      built[slug] = { viewBox: `0 0 ${w} ${h}`, body: icon.body, hex: onDark(hex) };
    }
  }
  return built;
};

const marks = build(MARKS);
const contactMarks = build(CONTACT_MARKS);

const serialise = (built) =>
  Object.entries(built)
    .map(
      ([slug, m]) =>
        `  ${slug}: {\n    viewBox: '${m.viewBox}',\n    hex: '${m.hex}',\n    body:\n      '${m.body.replace(/'/g, "\'")}',\n  },`,
    )
    .join('\n');

const union = (built) =>
  Object.keys(built)
    .map((slug) => `'${slug}'`)
    .join(' | ');

const entries = serialise(marks);

const out = `// GENERATED FILE. Do not edit by hand.
// Run \`node scripts/generate-skill-icons.mjs\` to regenerate; the slug list and
// the reasoning behind each source live in that script.
//
// Each mark is normalised to one shape, a viewBox plus inner SVG painted with
// \`currentColor\`, so the Skills grid can tint every logo blueprint-blue at
// rest and bloom a single tile to \`hex\` on hover.

export interface SkillMark {
  viewBox: string;
  /**
   * Brand colour, revealed on hover/focus. The brand's own hue, lifted only as
   * far as it takes to clear 3:1 against the dark plate (WCAG 1.4.11).
   */
  hex: string;
  /** Inner SVG, already using currentColor. Static, generated content. */
  body: string;
}

export type SkillMarkSlug = ${union(marks)};

export const skillMarks: Record<SkillMarkSlug, SkillMark> = {
${entries}
};
`;

const dest = path.join(root, 'src', 'data', 'skillIcons.ts');
fs.writeFileSync(dest, out);
console.log(`Wrote ${dest}: ${Object.keys(marks).length} marks, ${(out.length / 1024).toFixed(1)} kB`);

const contactOut = `// GENERATED FILE. Do not edit by hand.
// Run \`node scripts/generate-skill-icons.mjs\` to regenerate; the slug list and
// the reasoning behind each source live in that script.
//
// Same normalised shape as the Skills marks next door: a viewBox plus inner SVG
// painted with \`currentColor\`, so the Contact cards can hold every mark at the
// blueprint tint at rest and bloom one to \`hex\` on hover or focus.
import type { SkillMark } from './skillIcons';

export type ContactMarkSlug = ${union(contactMarks)};

export const contactMarks: Record<ContactMarkSlug, SkillMark> = {
${serialise(contactMarks)}
};
`;

const contactDest = path.join(root, 'src', 'data', 'contactIcons.ts');
fs.writeFileSync(contactDest, contactOut);
console.log(
  `Wrote ${contactDest}: ${Object.keys(contactMarks).length} marks, ${(contactOut.length / 1024).toFixed(1)} kB`,
);
