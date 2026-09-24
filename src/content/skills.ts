import type { Skill, SkillGroup } from './types';

/**
 * The four groups of the bill of materials, in the order a colleague would
 * hear them: what the product is built with, what it plugs into, what it
 * computes, what keeps it honest. Labels and captions are the site's existing
 * wording in sentence case.
 */
export const skillGroups: Record<SkillGroup, { label: string; caption: string }> = {
  build: { label: 'Build surface', caption: 'What the product is written in' },
  platform: { label: 'Integrations', caption: 'What it plugs into' },
  data: { label: 'Data and models', caption: 'What it computes' },
  verify: { label: 'Quality and delivery', caption: 'What keeps it honest' },
};

export const skillGroupOrder: SkillGroup[] = ['build', 'platform', 'data', 'verify'];

/**
 * The parts list. Item numbers are 1-based positions in this array, so the
 * order is part of the drawing: add new parts at the end of their group.
 * Names and notes are unchanged from the previous site; the specifics that
 * the résumé doesn't state are flagged in NEEDS-FROM-SEARAN.md #10.
 */
export const skills: Skill[] = [
  // Build surface
  { name: 'React', icon: 'react', group: 'build', note: 'Hooks · SPA' },
  { name: 'TypeScript', icon: 'typescript', group: 'build', note: 'Strict mode' },
  { name: 'Python', icon: 'python', group: 'build', note: 'Primary language' },
  { name: 'FastAPI', icon: 'fastapi', group: 'build', note: 'Async REST' },
  { name: 'Flask', icon: 'flask', group: 'build', note: 'Services' },
  { name: 'Tailwind', icon: 'tailwindcss', group: 'build', note: 'Design tokens' },

  // Integrations
  { name: 'Stripe', icon: 'stripe', group: 'platform', note: 'Billing · webhooks' },
  { name: 'Twilio', icon: 'twilio', group: 'platform', note: 'SMS · voice' },
  { name: 'QuickBooks', icon: 'quickbooks', group: 'platform', note: 'OAuth2' },
  { name: 'Supabase', icon: 'supabase', group: 'platform', note: 'Realtime · auth' },
  { name: 'AWS', icon: 'aws', group: 'platform', note: 'S3 · Lambda · Transcribe' },
  { name: 'Google Cloud', icon: 'googlecloud', group: 'platform', note: 'Run · storage' },
  { name: 'Cloudflare', icon: 'cloudflare', group: 'platform', note: 'DNS · Workers' },

  // Data and models
  { name: 'pandas', icon: 'pandas', group: 'data', note: 'Wrangling' },
  { name: 'NumPy', icon: 'numpy', group: 'data', note: 'Vectorised math' },
  { name: 'SciPy', icon: 'scipy', group: 'data', note: 'Stats · optimise' },
  { name: 'scikit-learn', icon: 'scikitlearn', group: 'data', note: 'Ensembles' },
  { name: 'TensorFlow', icon: 'tensorflow', group: 'data', note: 'BERT fine-tuning' },
  { name: 'PostgreSQL', icon: 'postgresql', group: 'data', note: 'Schema · RLS' },
  { name: 'SQL Server', icon: 'sqlserver', group: 'data', note: 'T-SQL · SSMS' },
  { name: 'Oracle', icon: 'oracle', group: 'data', note: 'PL/SQL' },
  { name: 'MongoDB', icon: 'mongodb', group: 'data', note: 'Documents' },

  // Quality and delivery
  { name: 'pytest', icon: 'pytest', group: 'verify', note: 'Fixtures' },
  { name: 'Jest', icon: 'jest', group: 'verify', note: 'Component tests' },
  { name: 'CI/CD', icon: 'cicd', group: 'verify', note: 'Gated deploys' },
  { name: 'Azure DevOps', icon: 'azuredevops', group: 'verify', note: 'Pipelines · boards' },
  { name: 'Docker', icon: 'docker', group: 'verify', note: 'Parity' },
  { name: 'Git', icon: 'git', group: 'verify', note: 'Trunk · review' },
];
