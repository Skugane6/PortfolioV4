import { roles } from '../../content/experience';
import { projects } from '../../content/projects';
import { resumeLines, resumeSkillsList } from '../../content/resume';
import { skillGroupOrder, skills } from '../../content/skills';
import type { Skill, SkillGroup } from '../../content/types';
import { deriveUsage, type PartUsage } from '../../lib/usage';

export interface Part {
  item: number;
  skill: Skill;
  usage: PartUsage;
  qty: number;
}

const usage = deriveUsage(skills, roles, projects, resumeLines, resumeSkillsList);

/** The bill of materials: item numbers are positions in the parts list. */
export const parts: Part[] = skills.map((skill, i) => {
  const u = usage.get(skill.name)!;
  return { item: i + 1, skill, usage: u, qty: u.refs.length };
});

export const partsByGroup: Record<SkillGroup, Part[]> = Object.fromEntries(
  skillGroupOrder.map((g) => [g, parts.filter((p) => p.skill.group === g)]),
) as Record<SkillGroup, Part[]>;

/** The five parts used in the most places, ties broken by item order. */
export const mostUsed: Part[] = [...parts].sort((a, b) => b.qty - a.qty || a.item - b.item).slice(0, 5);

export const itemLabel = (n: number) => String(n).padStart(2, '0');
