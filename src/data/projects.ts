import type { ProjectEntry } from './types';

// One flat list, ordered as the carousel presents it: CraftTraq is the featured
// build at station 000 and the rest follow down the line. Station references
// borrow the aircraft-fuselage convention used in the Experience section so the
// two sections read as parts of the same technical drawing.
export const projects: ProjectEntry[] = [
  {
    id: 'crafttraq',
    tag: '01 · FEATURED',
    station: 'STA 000 · PRODUCTION',
    name: 'CraftTraq',
    tagline:
      'Multi-tenant SaaS platform for trade contractors. Quotes convert straight into jobs, crews get scheduled against them, and invoicing, time tracking, and payroll sync follow the same record through.',
    stack: ['React 19', 'TypeScript', 'FastAPI', 'PostgreSQL', 'Stripe', 'Supabase'],
    links: [{ label: 'VISIT LIVE SITE', href: 'https://crafttraq.com' }],
    live: true,
    visual: 'crafttraq',
  },
  {
    id: 'portfolio-risk-dashboard',
    tag: '02 · ALSO BUILT',
    station: 'STA 145 · ANALYTICS',
    name: 'Portfolio Risk Dashboard',
    tagline:
      'MPT and Value-at-Risk analytics on live market data, with efficient-frontier optimization.',
    stack: ['React', 'Vite', 'Flask', 'MongoDB', 'NumPy', 'Pandas', 'SciPy'],
    links: [
      { label: 'GITHUB REPO', href: 'https://github.com/Skugane6/Portfolio-Risk-Dashboard' },
    ],
    live: false,
    visual: 'risk',
  },
  {
    id: 'text-classification-pipeline',
    tag: '03 · ALSO BUILT',
    station: 'STA 410 · ML PIPELINE',
    name: 'Text Classification Pipeline',
    tagline:
      'BERT + CNN/BiLSTM ensemble for text classification, with MLflow tracking and data augmentation.',
    stack: ['Python', 'TensorFlow', 'BERT', 'scikit-learn', 'PostgreSQL', 'MLflow'],
    links: [],
    live: false,
    visual: 'nlp',
  },
  {
    id: 'eye-mouse',
    tag: '04 · ALSO BUILT',
    station: 'STA 760 · INPUT SYSTEMS',
    name: 'Eye Tracking Mouse',
    tagline: 'Hands-free cursor control from a webcam. Look to move, blink to click.',
    stack: ['Python', 'OpenCV', 'MediaPipe', 'PyAutoGUI', 'NumPy'],
    links: [{ label: 'GITHUB REPO', href: 'https://github.com/Skugane6/eye-mouse' }],
    live: false,
    visual: 'eye',
  },
];
