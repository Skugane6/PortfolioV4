/**
 * Types for every piece of editable content on the site. Components read
 * content only through src/content/*; nothing factual lives in JSX.
 */
import type { SkillMarkSlug } from '../data/skillIcons';

export type SheetId = 'cover' | 'experience' | 'projects' | 'skills' | 'contact';

export interface SheetMeta {
  id: SheetId;
  /** 1-based sheet number, printed as "01". Must match the index order. */
  number: number;
  /** Plain name a visitor recognises: used in the nav and as the h2. */
  title: string;
  /** The drawing-set name of the sheet, printed in its title block. */
  drawingTitle: string;
}

export interface ExternalLink {
  label: string;
  href: string;
  /** What the account is called over there, if it differs from the label. */
  handle?: string;
}

/**
 * A proof item on the cover. `target` is the labelled thing on the page that
 * proves it; null means there is nothing on the page to point at (it is shown
 * as text, not a link, rather than pointing somewhere that doesn't prove it).
 */
export interface ProofRef {
  id: string;
  figure: string;
  label: string;
  target: {
    href: `#${string}`;
    /** Sheet the target lives on, printed below the bubble's rule. */
    sheet: number;
    /** The target's own label on that sheet (station, figure or note number), printed above the rule. */
    ref: string;
    /** How a screen reader names the target, e.g. "station 145". */
    name: string;
  } | null;
  mark?: { src: string; srcSet?: string; alt: string; width: number; height: number };
}

export interface Profile {
  name: string;
  /** Initial-and-surname form used in the DRAWN field. */
  drafter: string;
  role: string;
  positioning: { lead: string; specifics: string };
  metaDescription: string;
  siteUrl: string;
  email: string;
  resume: { href: string; bytes: number };
  links: { github: ExternalLink; linkedin: ExternalLink; crafttraq: ExternalLink; source: ExternalLink };
  availability: {
    status: string;
    /** Role type sought. null renders a HOLD note (NEEDS-FROM-SEARAN #1). */
    seeking: string | null;
    /** Earliest start. null renders a HOLD note. */
    from: string | null;
  };
  location: { summary: string; city: string; timeZone: string };
  datum: { code: string; name: string; lat: string; lon: string };
  education: { school: string; program: string; location: string; graduated: string };
  proof: ProofRef[];
}

export interface Callout {
  /** Stable id; the card's anchor is `#callout-<id>`. */
  id: string;
  /** Inches aft of the nose on the drawing (lib/stations). Ascending fore to aft. */
  station: number;
  /** Airframe zone the station sits in. */
  zone: string;
  title: string;
  /** One-line summary, shown as the card subtitle. */
  caption: string;
  /** The scannable line, drawn verbatim from the description or tags. */
  impact: string;
  description: string;
  tags: string[];
  /** 'metric' marks a tag as a measured result. */
  tagVariant?: 'metric';
}

export interface Role {
  id: string;
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  logo?: { src: string; srcSet?: string; width: number; height: number };
  /** Which drawing the callouts pin to. null renders the role without one. */
  drawing: 'crj700-side' | null;
  callouts: Callout[];
}

export interface Screen {
  kind: 'desktop' | 'phone';
  /** Responsive WebP candidates, "url widthw" pairs (scripts/generate-images.mjs). */
  srcSet: string;
  /** Full-size original, the fallback for browsers without WebP. */
  png: string;
  width: number;
  height: number;
  alt: string;
}

export interface ArchNode {
  id: string;
  label: string;
  /** Second line, e.g. the technology. */
  detail?: string;
  /** Grid placement in the diagram, 0-based. */
  col: number;
  row: number;
  /** Nodes inside the product boundary. */
  inside: boolean;
}

export interface ArchEdge {
  from: string;
  /** A node id, or 'boundary' to point at the product boundary itself. */
  to: string;
  label?: string;
}

export interface CaseStudy {
  /** "What it does": the tagline or a résumé sentence. */
  does: string;
  /** "How it's built": résumé bullets, tightened only. */
  built: string[];
  /** "Where it stands": a stated fact, or null when none is known. */
  standing: string | null;
  architecture: { nodes: ArchNode[]; edges: ArchEdge[]; caption: string };
  /** Where the case-study text comes from. */
  source: string;
}

export type DemoKind = 'risk' | 'text';

export interface Project {
  id: string;
  fig: number;
  name: string;
  tagline: string;
  live: boolean;
  stack: string[];
  links: ExternalLink[];
  demo: DemoKind | null;
  screens?: Screen[];
  caseStudy: CaseStudy;
}

export type SkillGroup = 'build' | 'platform' | 'data' | 'verify';

export interface Skill {
  name: string;
  icon: SkillMarkSlug;
  group: SkillGroup;
  note?: string;
  /**
   * Other spellings of this part as they appear in experience tags and
   * project stacks ("React 19", "Python / Flask"). Used to count where it is
   * used; never shown.
   */
  aliases?: string[];
}

export interface SpecRow {
  label: string;
  crj700: string;
  crj900: string;
}
