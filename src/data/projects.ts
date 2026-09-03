import type { FeaturedCaseStudy, ProjectEntry } from './types';

export const featuredProject: FeaturedCaseStudy = {
  id: 'crafttraq',
  name: 'CraftTraq',
  tagline: 'Multi-tenant SaaS platform for trade contractors',
  stack: ['React 19', 'TypeScript', 'FastAPI', 'PostgreSQL'],
  featured: true,
  problem:
    'Trade contractors run jobs across paper quotes, group texts, and spreadsheets — nothing tracks a single job from quote through crew assignment to invoice and payment.',
  approach: [
    'Built end-to-end job lifecycle management: shareable client quotes that auto-convert into jobs, drag-and-drop crew scheduling, and status-tracked job records.',
    'Built invoicing, time tracking, and inventory management across 28+ tables with a PDF generation pipeline.',
  ],
  decision: {
    title: 'Immutable task-assignment snapshots',
    body:
      "A job's scheduled crew assignment is preserved as a point-in-time snapshot even as the crew roster changes later, then reconciled against live crew membership — so a schedule never silently drifts out of sync with who's actually on the crew.",
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
  callouts: [
    { label: 'STATUS-TRACKED JOB RECORDS', top: '18%', left: '46%' },
    { label: 'CREW AVATARS', top: '32%', left: '78%' },
    { label: 'OVERDUE FLAGGING', top: '58%', left: '20%' },
  ],
};

export const secondaryProjects: ProjectEntry[] = [
  {
    id: 'portfolio-risk-dashboard',
    name: 'Portfolio Risk Dashboard',
    tagline:
      'Full-stack financial analytics app for Modern Portfolio Theory and Value-at-Risk analysis, with a Flask backend pulling live market data via yfinance and NumPy/Pandas/SciPy for efficient-frontier and risk-metric calculations.',
    stack: ['React', 'Vite', 'Flask', 'MongoDB', 'NumPy', 'Pandas', 'SciPy'],
    featured: false,
  },
  {
    id: 'text-classification-pipeline',
    name: 'Multi-Model Text Classification Pipeline',
    tagline:
      'Ensemble system combining BERT embeddings with CNN and BiLSTM architectures, MLflow experiment tracking, and a back-translation/synonym-replacement data augmentation pipeline.',
    stack: ['Python', 'TensorFlow', 'BERT', 'scikit-learn', 'PostgreSQL', 'MLflow'],
    featured: false,
  },
];
