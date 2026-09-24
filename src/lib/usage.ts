import type { ResumeLine } from '../content/resume';
import type { Project, Role, Skill } from '../content/types';

export interface UsageRef {
  kind: 'callout' | 'project' | 'resume';
  id: string;
  label: string;
  /** In-page anchor, or the résumé PDF for résumé lines. */
  href: string;
  /** The words that name the part, quoted for résumé lines. */
  quote?: string;
}

export interface PartUsage {
  refs: UsageRef[];
  /** True when the part is named in the résumé's technical-skills block. */
  listedOnResume: boolean;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/**
 * Whether `text` names `part` as a whole word (case-insensitive), so "React"
 * matches "React 19" and "React.js" but "Git" does not match "GitHub".
 */
export function mentions(text: string, part: string): boolean {
  return new RegExp(`(^|[^A-Za-z0-9])${escape(part)}(?![A-Za-z0-9])`, 'i').test(text);
}

/**
 * Where each part in the bill of materials is actually used, derived from
 * content that already exists: Experience callouts (tags and description),
 * projects (stack, tagline and how-it's-built lines), and résumé lines for
 * work the site doesn't show. Each place counts once. QTY is the number of
 * places; nothing is typed by hand.
 */
export function deriveUsage(
  skills: Skill[],
  roles: Role[],
  projects: Project[],
  resumeLines: ResumeLine[],
  resumeSkillsList: string[],
  resumeHref = '/skuganesan_resume.pdf',
): Map<string, PartUsage> {
  const result = new Map<string, PartUsage>();
  for (const skill of skills) {
    const names = [skill.name, ...(skill.aliases ?? [])];
    const hit = (text: string) => names.some((n) => mentions(text, n));
    const refs: UsageRef[] = [];

    for (const role of roles) {
      for (const c of role.callouts) {
        if (hit([c.description, ...c.tags].join(' \n '))) {
          refs.push({ kind: 'callout', id: c.id, label: c.title, href: `#callout-${c.id}` });
        }
      }
    }
    for (const p of projects) {
      if (hit([p.tagline, ...p.stack, ...p.caseStudy.built, p.caseStudy.standing ?? ''].join(' \n '))) {
        refs.push({ kind: 'project', id: p.id, label: p.name, href: `#fig-${p.fig}` });
      }
    }
    for (const line of resumeLines) {
      if (hit(line.text)) {
        refs.push({ kind: 'resume', id: line.id, label: `${line.context} (résumé)`, href: resumeHref, quote: line.text });
      }
    }

    result.set(skill.name, { refs, listedOnResume: resumeSkillsList.some((l) => hit(l)) });
  }
  return result;
}
