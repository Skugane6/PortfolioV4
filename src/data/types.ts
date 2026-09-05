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

export interface ProjectEntry {
  id: string;
  name: string;
  tagline: string;
  stack: string[];
  featured: boolean;
  image?: string;
  href?: string;
}

export interface FeaturedCaseStudy extends ProjectEntry {
  problem: string;
  approach: string[];
  decision: { title: string; body: string };
  scope: string[];
  outcome: string;
  screenshot: { src: string; webp: string; alt: string };
}

export interface SkillGroup {
  id: string;
  title: string;
  skills: string[];
}
