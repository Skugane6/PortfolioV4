import type { SkillMarkSlug } from './skillIcons';

export interface ExperienceCallout {
  /** Structural station reference shown in the card header, e.g. "STA 145 · FWD". */
  station: string;
  title: string;
  description: string;
  tags: string[];
  /** 'metric' highlights a standout stat (e.g. a % improvement) in amber instead of the default accent blue. */
  tagVariant?: 'accent' | 'metric';
  /** One-line summary printed in the card's footer strip, drawing-annotation style. */
  caption: string;
  /** Glyph shown in the card's header badge. */
  icon: 'tracker' | 'chart' | 'plane' | 'schedule';
}

export interface ExperienceEntry {
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  callouts: ExperienceCallout[];
  /** Path to the company/division logo, shown as a small badge next to the role. */
  logo?: string;
}

export interface Education {
  school: string;
  program: string;
  location: string;
  graduation: string;
}

/** Which visual panel the projects carousel renders on the right-hand side. */
export type ProjectVisual = 'crafttraq' | 'risk' | 'nlp' | 'eye';

export interface ProjectLink {
  /** Rendered as-is, so already upper-cased: "VISIT LIVE SITE". */
  label: string;
  href: string;
}

export interface ProjectEntry {
  id: string;
  /** Panel eyebrow, e.g. "01 · FEATURED". */
  tag: string;
  /** Station reference stamped in the visual panel's top-left corner. */
  station: string;
  name: string;
  tagline: string;
  stack: string[];
  links: ProjectLink[];
  /** Shows the pulsing LIVE badge in the panel header. */
  live: boolean;
  visual: ProjectVisual;
}

/**
 * Which run of the parts list a skill belongs to. The grid deliberately draws
 * no lines between these — the key exists so the side detail panel can name
 * what a tile *is* ("DATA & MODELS") and tally the list, not so the layout can
 * break the plate into four smaller plates.
 */
export type SkillGroup = 'build' | 'platform' | 'data' | 'verify';

export interface Skill {
  /** Short display name — the logo carries the recognition, so this stays terse. */
  name: string;
  /** Which mark in skillIcons.ts to draw. */
  icon: SkillMarkSlug;
  /** Run of the list this belongs to; read by the detail panel, not the grid. */
  group: SkillGroup;
  /**
   * The specifics that used to be crammed into the name ("QuickBooks OAuth2",
   * "AWS (S3, Lambda, Transcribe)"). Shown as a second line on the tile so the
   * grid reads as logos at a glance without losing what was actually used.
   */
  note?: string;
}
