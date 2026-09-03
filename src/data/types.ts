export interface ExperienceEntry {
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  highlights: string[];
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
}

export interface ScreenshotCalloutData {
  label: string;
  top: string;
  left: string;
}

export interface FeaturedCaseStudy extends ProjectEntry {
  problem: string;
  approach: string[];
  decision: { title: string; body: string };
  scope: string[];
  outcome: string;
  screenshot: { src: string; webp: string; alt: string };
  callouts: ScreenshotCalloutData[];
}

export interface SkillGroup {
  id: string;
  title: string;
  skills: string[];
}
