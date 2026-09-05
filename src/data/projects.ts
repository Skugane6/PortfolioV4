import type { FeaturedCaseStudy, ProjectEntry } from './types';

export const featuredProject: FeaturedCaseStudy = {
  id: 'crafttraq',
  name: 'CraftTraq',
  tagline: 'Multi-tenant SaaS platform for trade contractors',
  stack: ['React 19', 'TypeScript', 'FastAPI', 'PostgreSQL'],
  featured: true,
  problem:
    'Jobs tracked across paper quotes, texts, and spreadsheets; nothing follows one from quote to payment.',
  approach: [
    'End-to-end job lifecycle: shareable quotes that auto-convert into jobs, drag-and-drop crew scheduling, status-tracked records.',
    'Invoicing, time tracking, and inventory across 28+ tables, with PDF generation.',
  ],
  decision: {
    title: 'Immutable task-assignment snapshots',
    body:
      'Crew assignments snapshot at schedule time, then reconcile against the live roster, so a schedule never silently drifts from who\'s actually on the crew.',
  },
  scope: [
    'Tiered Stripe billing',
    'QuickBooks OAuth2 payroll sync',
    'Twilio SMS notifications',
    'Supabase Realtime for live job-status updates',
    'Delivered as a Progressive Web App',
  ],
  outcome: 'Live in production at crafttraq.com.',
  screenshot: {
    src: '/crafttraq.png',
    webp: '/crafttraq.webp',
    alt: "CraftTraq's Field Ops Console showing a job board with columns for Created, In Progress, Complete, and Approved jobs, each card listing a job ID, title, client, and assigned crew initials.",
  },
};

export const secondaryProjects: ProjectEntry[] = [
  {
    id: 'portfolio-risk-dashboard',
    name: 'Portfolio Risk Dashboard',
    tagline: 'MPT & Value-at-Risk analytics on live market data, with efficient-frontier optimization.',
    stack: ['React', 'Vite', 'Flask', 'MongoDB', 'NumPy', 'Pandas', 'SciPy'],
    featured: false,
    image: '/placeholder-risk.svg',
    href: 'https://github.com/Skugane6/Portfolio-Risk-Dashboard',
  },
  {
    id: 'text-classification-pipeline',
    name: 'Multi-Model Text Classification Pipeline',
    tagline: 'BERT + CNN/BiLSTM ensemble for text classification, with MLflow tracking and data augmentation.',
    stack: ['Python', 'TensorFlow', 'BERT', 'scikit-learn', 'PostgreSQL', 'MLflow'],
    featured: false,
    image: '/placeholder-text.svg',
  },
  {
    id: 'eye-mouse',
    name: 'Eye-Mouse',
    tagline: 'Hands-free cursor control via webcam eye tracking.',
    stack: ['Python', 'OpenCV', 'MediaPipe', 'PyAutoGUI'],
    featured: false,
    image: '/placeholder-eye.svg',
    href: 'https://github.com/Skugane6/eye-mouse',
  },
];
