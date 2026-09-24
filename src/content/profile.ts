import type { Profile } from './types';

export const profile: Profile = {
  name: 'Searan Kuganesan',
  drafter: 'S. Kuganesan',
  role: 'Software engineer',
  positioning: {
    lead: 'I build the systems operators run on:',
    specifics:
      'a component tracker supporting 2,000+ aircraft across 100+ operators at Mitsubishi Heavy Industries, and CraftTraq, a live SaaS for trade contractors.',
  },
  metaDescription:
    'Software engineer (Western University, B.E.Sc. 2026). Built a component tracker supporting 2,000+ aircraft at Mitsubishi Heavy Industries and CraftTraq, a live SaaS for trade contractors.',
  siteUrl: 'https://searan.vercel.app/',
  email: 'searan.kuganesan4@gmail.com',
  resume: { href: '/skuganesan_resume.pdf', bytes: 68_095 },
  links: {
    github: { label: 'GitHub', handle: 'skugane6', href: 'https://github.com/skugane6' },
    linkedin: { label: 'LinkedIn', handle: 'searan-kuganesan', href: 'https://linkedin.com/in/searan-kuganesan' },
    crafttraq: { label: 'CraftTraq', handle: 'crafttraq.com', href: 'https://crafttraq.com' },
    source: { label: 'Source on GitHub', handle: 'Skugane6/PortfolioV4', href: 'https://github.com/Skugane6/PortfolioV4' },
  },
  availability: {
    status: 'Open to opportunities',
    // HOLD until Searan supplies them (NEEDS-FROM-SEARAN.md #1).
    seeking: null,
    from: null,
  },
  location: { summary: 'Based in Canada', city: 'Toronto', timeZone: 'America/Toronto' },
  // Toronto Pearson. The airport's place coordinate, about 0.5 km from the
  // published reference point (audit/content-inventory.md §5.2).
  datum: { code: 'CYYZ', name: 'Toronto Pearson', lat: 'N 43.6777°', lon: 'W 79.6248°' },
  education: {
    school: 'Western University',
    program: 'B.E.Sc. Software Engineering',
    location: 'London, Canada',
    graduated: '06/2026',
  },
  proof: [
    {
      id: 'aircraft',
      figure: '2,000+',
      label: 'aircraft across 100+ operators',
      target: '#callout-component-tracker',
      sheet: 2,
    },
    {
      id: 'crafttraq',
      figure: 'Live',
      label: 'CraftTraq, SaaS for trade contractors',
      target: '#fig-1',
      sheet: 3,
    },
    {
      id: 'education',
      figure: '2026',
      label: 'B.E.Sc. Software Engineering, Western University',
      target: '#education',
      sheet: 2,
      mark: { src: '/western-mark.png', alt: '', width: 1025, height: 243 },
    },
    {
      // Kept verbatim and flagged: 4 projects are shown (NEEDS-FROM-SEARAN.md #2).
      id: 'projects-shipped',
      figure: '10',
      label: 'projects shipped',
      target: null,
      sheet: null,
    },
  ],
};
