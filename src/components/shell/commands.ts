import { profile } from '../../content/profile';
import { projects } from '../../content/projects';
import { pad2, sheets } from '../../content/sheets';

export interface Command {
  id: string;
  group: 'Sheets' | 'Projects' | 'Actions' | 'Links' | 'Settings';
  label: string;
  /** Extra words that should find this command. */
  keywords?: string;
  /** Right-aligned hint, e.g. a sheet number. */
  hint?: string;
  run: (ctx: CommandContext) => void | Promise<void>;
}

export interface CommandContext {
  goToSheet: (id: string) => void;
  openProject: (id: string) => void;
  copyEmail: () => Promise<boolean>;
  download: (href: string) => void;
  openExternal: (href: string) => void;
  setReduced: (reduced: boolean) => void;
  setCrosshair: (on: boolean) => void;
  wakeCat: () => void;
  reduced: boolean;
  crosshair: boolean;
  finePointer: boolean;
}

export function buildCommands(ctx: Pick<CommandContext, 'reduced' | 'crosshair' | 'finePointer'>): Command[] {
  const list: Command[] = [
    ...sheets.map<Command>((s) => ({
      id: `sheet-${s.id}`,
      group: 'Sheets',
      label: s.title,
      keywords: `${s.drawingTitle} sheet ${s.number}`,
      hint: pad2(s.number),
      run: (c) => c.goToSheet(s.id),
    })),
    ...projects.map<Command>((p) => ({
      id: `project-${p.id}`,
      group: 'Projects',
      label: `Open ${p.name}`,
      keywords: `project detail case study fig ${p.fig} ${p.stack.join(' ')}`,
      hint: `Fig. ${p.fig}`,
      run: (c) => c.openProject(p.id),
    })),
    {
      id: 'copy-email',
      group: 'Actions',
      label: 'Copy email address',
      keywords: `contact mail ${profile.email}`,
      run: async (c) => {
        await c.copyEmail();
      },
    },
    {
      id: 'resume',
      group: 'Actions',
      label: 'Download résumé (PDF)',
      keywords: 'resume cv pdf',
      run: (c) => c.download(profile.resume.href),
    },
    { id: 'github', group: 'Links', label: 'Open GitHub', keywords: profile.links.github.handle, run: (c) => c.openExternal(profile.links.github.href) },
    { id: 'linkedin', group: 'Links', label: 'Open LinkedIn', keywords: profile.links.linkedin.handle, run: (c) => c.openExternal(profile.links.linkedin.href) },
    { id: 'crafttraq', group: 'Links', label: 'Open CraftTraq', keywords: 'crafttraq.com live saas', run: (c) => c.openExternal(profile.links.crafttraq.href) },
    {
      id: 'motion',
      group: 'Settings',
      label: ctx.reduced ? 'Turn motion on' : 'Reduce motion',
      keywords: 'animation accessibility reduced motion',
      run: (c) => c.setReduced(!c.reduced),
    },
    { id: 'cat', group: 'Settings', label: 'Wake the cat', keywords: 'checker pet oneko', run: (c) => c.wakeCat() },
  ];
  if (ctx.finePointer && !ctx.reduced) {
    list.push({
      id: 'crosshair',
      group: 'Settings',
      label: ctx.crosshair ? 'Hide the drafting crosshair' : 'Show the drafting crosshair',
      keywords: 'cursor coordinates zone',
      run: (c) => c.setCrosshair(!c.crosshair),
    });
  }
  return list;
}

/**
 * Scores a command against a query: every word of the query must appear in
 * the label or keywords (prefix matches in the label score highest). Returns
 * -1 for no match.
 */
export function score(cmd: Command, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const label = cmd.label.toLowerCase();
  const hay = `${label} ${(cmd.keywords ?? '').toLowerCase()} ${cmd.group.toLowerCase()}`;
  let total = 0;
  for (const word of q.split(/\s+/)) {
    const normalized = word.normalize('NFKD').replace(/[̀-ͯ]/g, '');
    const hayN = hay.normalize('NFKD').replace(/[̀-ͯ]/g, '');
    const at = hayN.indexOf(normalized);
    if (at === -1) return -1;
    total += label.startsWith(normalized) ? 3 : new RegExp(`\\b${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(hayN) ? 2 : 1;
  }
  return total;
}

export function filterCommands(cmds: Command[], query: string): Command[] {
  if (!query.trim()) return cmds;
  return cmds
    .map((c, i) => ({ c, i, s: score(c, query) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.c);
}
