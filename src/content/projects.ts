import type { Project } from './types';

const RESUME = 'Résumé, August 2026 (public/skuganesan_resume.pdf)';

/**
 * Projects in figure order. Names, taglines and stacks are the site's
 * existing text. Case-study "How it's built" lines come from the résumé,
 * tightened only (docs/overhaul/CONTENT.md §5). Nothing about users or
 * results is stated where the sources state nothing.
 */
export const projects: Project[] = [
  {
    id: 'crafttraq',
    fig: 1,
    name: 'CraftTraq',
    tagline:
      'Multi-tenant SaaS platform for trade contractors. Quotes convert straight into jobs, crews get scheduled against them, and invoicing, time tracking, and payroll sync follow the same record through.',
    live: true,
    stack: ['React 19', 'TypeScript', 'FastAPI', 'PostgreSQL', 'Stripe', 'Supabase'],
    links: [{ label: 'Visit crafttraq.com', href: 'https://crafttraq.com' }],
    demo: null,
    screens: [
      {
        kind: 'desktop',
        srcSet:
          '/img/crafttraq-board-480.webp 480w, /img/crafttraq-board-800.webp 800w, /img/crafttraq-board-1200.webp 1200w, /img/crafttraq-board-1600.webp 1600w',
        png: '/crafttraq-board.png',
        width: 1902,
        height: 938,
        alt: "CraftTraq's Field Ops Console: a jobs board for Apex Plumbing with Created, In Progress, Complete, and Approved columns, each card showing a job ID, title, client, due date, and the initials of the assigned crew.",
      },
      {
        kind: 'phone',
        srcSet: '/img/crafttraq-calendar-190.webp 190w, /img/crafttraq-calendar-375.webp 375w',
        png: '/crafttraq-calendar.png',
        width: 375,
        height: 835,
        alt: "The same platform on a phone: CraftTraq's week calendar for July 27 to August 2, listing each day's scheduled tasks as colour-coded time blocks.",
      },
    ],
    caseStudy: {
      does:
        'A multi-tenant SaaS platform for trade contractors: quotes convert straight into jobs, crews get scheduled against them, and invoicing, time tracking, and payroll sync follow the same record through.',
      built: [
        'End-to-end job lifecycle management: shareable client quotes that auto-convert into jobs, drag-and-drop crew scheduling, and status-tracked job records.',
        'Scheduling with immutable task-assignment snapshots, reconciled against live crew membership.',
        'Invoicing, time tracking, and inventory management across 28+ tables, with a PDF generation pipeline.',
        'Stripe, QuickBooks OAuth2 payroll sync, Twilio SMS, and Supabase Realtime for live job-status updates across the Progressive Web App.',
      ],
      standing: 'Live in production with tiered Stripe billing.',
      architecture: {
        caption:
          'Components named in the project description. Integration leaders end at the product boundary because the source does not say which tier calls them.',
        nodes: [
          { id: 'pwa', label: 'Progressive Web App', detail: 'React 19, TypeScript', col: 0, row: 1, inside: true },
          { id: 'api', label: 'API', detail: 'FastAPI', col: 1, row: 1, inside: true },
          { id: 'db', label: 'Database', detail: 'PostgreSQL, 28+ tables', col: 2, row: 1, inside: true },
          { id: 'pdf', label: 'PDF generation pipeline', col: 1, row: 2, inside: true },
          { id: 'realtime', label: 'Supabase Realtime', detail: 'live job status', col: 0, row: 0, inside: false },
          { id: 'stripe', label: 'Stripe', detail: 'tiered billing', col: 1, row: 0, inside: false },
          { id: 'quickbooks', label: 'QuickBooks', detail: 'OAuth2 payroll sync', col: 2, row: 0, inside: false },
          { id: 'twilio', label: 'Twilio', detail: 'SMS', col: 3, row: 0, inside: false },
        ],
        edges: [
          { from: 'pwa', to: 'api' },
          { from: 'api', to: 'db' },
          { from: 'api', to: 'pdf' },
          { from: 'realtime', to: 'pwa', label: 'job-status updates' },
          { from: 'stripe', to: 'boundary' },
          { from: 'quickbooks', to: 'boundary' },
          { from: 'twilio', to: 'boundary' },
        ],
      },
      source: RESUME,
    },
  },
  {
    id: 'genshillion',
    fig: 2,
    name: 'Genshillion',
    tagline:
      'A daily Genshin Impact trivia game. Seven open-ended prompts, twenty-five seconds each: type freely and the rarer the valid answer, the deeper you dive.',
    live: true,
    stack: ['React 19', 'TypeScript', 'Vite', 'Fastify', 'PostgreSQL', 'Drizzle', 'Zod'],
    links: [{ label: 'Visit genshillion.com', href: 'https://genshillion.com' }],
    demo: null,
    screens: [
      {
        kind: 'desktop',
        srcSet:
          '/img/genshillion-desktop-480.webp 480w, /img/genshillion-desktop-800.webp 800w, /img/genshillion-desktop-1200.webp 1200w, /img/genshillion-desktop-1600.webp 1600w',
        png: '/genshillion-desktop.png',
        width: 1902,
        height: 938,
        alt: 'Genshillion’s start screen in pixel art: the gold logo over a Mondstadt-style skyline, a card reading Dive #3 with seven prompts of twenty-five seconds each, a Start button, and streak, best, dives and last-score counters.',
      },
      {
        kind: 'phone',
        srcSet: '/img/genshillion-phone-190.webp 190w, /img/genshillion-phone-375.webp 375w',
        png: '/genshillion-phone.png',
        width: 375,
        height: 835,
        alt: 'The same start screen on a phone: logo, the Dive #3 card, a full-width Start button and the streak counters stacked above the fan-game disclaimer.',
      },
    ],
    caseStudy: {
      does:
        'A daily trivia game modeled on krillion.io. Every day brings seven open-ended prompts (“Name a sword”), twenty-five seconds each and one attempt. Answers are typed freely and scored by curated rarity.',
      built: [
        'React and Vite web client with a Fastify API behind it, in a TypeScript monorepo.',
        'PostgreSQL through Drizzle, with Zod-validated contracts between client and API.',
        'Curated seed content imported and scheduled one dive per day. Progress stays in the browser; the server stores only final scores.',
        'Sound effects synthesized in the browser, with text names only: no official art, logos, audio or fonts.',
      ],
      standing: 'Live at genshillion.com. An unofficial fan game, not affiliated with HoYoverse.',
      architecture: {
        caption: 'Components named in the project README and its package manifests.',
        nodes: [
          { id: 'web', label: 'Web client', detail: 'React 19, Vite', col: 0, row: 1, inside: true },
          { id: 'api', label: 'API', detail: 'Fastify, Zod', col: 1, row: 1, inside: true },
          { id: 'db', label: 'Database', detail: 'PostgreSQL, Drizzle', col: 2, row: 1, inside: true },
          { id: 'content', label: 'Curated content', detail: 'seed import, daily schedule', col: 1, row: 2, inside: true },
          { id: 'local', label: 'Browser storage', detail: 'progress stays local', col: 0, row: 0, inside: false },
        ],
        edges: [
          { from: 'web', to: 'api' },
          { from: 'api', to: 'db' },
          { from: 'content', to: 'db' },
          { from: 'local', to: 'web', label: 'progress' },
        ],
      },
      source: 'Project README (github.com/Skugane6/teyvat-dive) and the live site',
    },
  },
  {
    id: 'portfolio-risk-dashboard',
    fig: 3,
    name: 'Portfolio Risk Dashboard',
    tagline: 'MPT and Value-at-Risk analytics on live market data, with efficient-frontier optimization.',
    live: false,
    stack: ['React', 'Vite', 'Flask', 'MongoDB', 'NumPy', 'Pandas', 'SciPy'],
    links: [{ label: 'Source on GitHub', href: 'https://github.com/Skugane6/Portfolio-Risk-Dashboard' }],
    demo: 'risk',
    caseStudy: {
      does:
        'A full-stack financial analytics application for Modern Portfolio Theory analysis and Value at Risk calculations, with interactive dashboards.',
      built: [
        'React and Vite front end with Flask behind it.',
        'Python back end with yfinance API integration and NumPy, Pandas, and SciPy for market data, visualized with recharts.',
        'Statistical portfolio optimization algorithms for efficient-frontier analysis and risk metrics.',
      ],
      standing: null,
      architecture: {
        caption: 'Components named in the project description and stack.',
        nodes: [
          { id: 'ui', label: 'Dashboards', detail: 'React, Vite, recharts', col: 0, row: 1, inside: true },
          { id: 'api', label: 'Analytics API', detail: 'Flask', col: 1, row: 1, inside: true },
          { id: 'math', label: 'MPT, VaR, frontier', detail: 'NumPy, Pandas, SciPy', col: 1, row: 2, inside: true },
          { id: 'store', label: 'Storage', detail: 'MongoDB', col: 2, row: 1, inside: true },
          { id: 'market', label: 'Market data', detail: 'yfinance', col: 1, row: 0, inside: false },
        ],
        edges: [
          { from: 'ui', to: 'api' },
          { from: 'api', to: 'math' },
          { from: 'market', to: 'api' },
          { from: 'api', to: 'store' },
        ],
      },
      source: RESUME,
    },
  },
  {
    id: 'text-classification-pipeline',
    fig: 4,
    name: 'Text Classification Pipeline',
    tagline: 'BERT + CNN/BiLSTM ensemble for text classification, with MLflow tracking and data augmentation.',
    live: false,
    stack: ['Python', 'TensorFlow', 'BERT', 'scikit-learn', 'PostgreSQL', 'MLflow'],
    links: [],
    demo: 'text',
    caseStudy: {
      does: 'An ensemble system that categorizes text by combining BERT embeddings with CNN and BiLSTM architectures.',
      built: [
        'Ensemble combining BERT embeddings with CNN and BiLSTM architectures for categorization.',
        'Experiment tracking with MLflow, logging model configurations and hyperparameter combinations.',
        'Data augmentation pipeline using back-translation and synonym replacement to expand the training set.',
      ],
      standing: null,
      architecture: {
        caption: 'Stages named in the project description. Storage is listed in the stack; its role is not described.',
        nodes: [
          { id: 'data', label: 'Training text', detail: 'PostgreSQL in stack', col: 0, row: 1, inside: true },
          { id: 'augment', label: 'Augmentation', detail: 'back-translation, synonyms', col: 1, row: 1, inside: true },
          { id: 'bert', label: 'BERT embeddings', col: 2, row: 1, inside: true },
          { id: 'cnn', label: 'CNN', col: 3, row: 1, inside: true },
          { id: 'bilstm', label: 'BiLSTM', col: 3, row: 2, inside: true },
          { id: 'ensemble', label: 'Ensemble', detail: 'category', col: 4, row: 1, inside: true },
          { id: 'mlflow', label: 'MLflow', detail: 'configs, hyperparameters', col: 2, row: 0, inside: false },
        ],
        edges: [
          { from: 'data', to: 'augment' },
          { from: 'augment', to: 'bert' },
          { from: 'bert', to: 'cnn' },
          { from: 'bert', to: 'bilstm' },
          { from: 'cnn', to: 'ensemble' },
          { from: 'bilstm', to: 'ensemble' },
          { from: 'mlflow', to: 'boundary', label: 'tracks runs' },
        ],
      },
      source: RESUME,
    },
  },
];
