import type { Skill, SkillGroup } from './types';

/**
 * The four runs of the parts list, in the order a colleague would hear them
 * described: what the product is built with, what it plugs into, what it
 * computes, what keeps it honest.
 *
 * These label the tiles in the side detail panel and drive its tally. The grid
 * itself stays one undivided plate: `group` is metadata, never a layout break.
 */
export const skillGroups: Record<SkillGroup, { label: string; caption: string }> = {
  build: { label: 'BUILD SURFACE', caption: 'What the product is written in' },
  platform: { label: 'INTEGRATIONS', caption: 'What it plugs into' },
  data: { label: 'DATA & MODELS', caption: 'What it computes' },
  verify: { label: 'QUALITY & DELIVERY', caption: 'What keeps it honest' },
};

/** Render order for the panel's tally, matching the order of the list below. */
export const skillGroupOrder: SkillGroup[] = ['build', 'platform', 'data', 'verify'];

// One flat parts list, rendered as a single grid.
//
// `name` stays short because the logo does the recognising; anything that used
// to live in parentheses ("AWS (S3, Lambda, Transcribe)") moved to `note`, which
// the tile prints under the name.
export const skills: Skill[] = [
  // Built with
  { name: 'React', icon: 'react', group: 'build', note: 'Hooks · SPA' },
  { name: 'TypeScript', icon: 'typescript', group: 'build', note: 'Strict mode' },
  { name: 'Python', icon: 'python', group: 'build', note: 'Primary language' },
  { name: 'FastAPI', icon: 'fastapi', group: 'build', note: 'Async REST' },
  { name: 'Flask', icon: 'flask', group: 'build', note: 'Services' },
  { name: 'Tailwind', icon: 'tailwindcss', group: 'build', note: 'Design tokens' },

  // Plugged into
  { name: 'Stripe', icon: 'stripe', group: 'platform', note: 'Billing · webhooks' },
  { name: 'Twilio', icon: 'twilio', group: 'platform', note: 'SMS · voice' },
  { name: 'QuickBooks', icon: 'quickbooks', group: 'platform', note: 'OAuth2' },
  { name: 'Supabase', icon: 'supabase', group: 'platform', note: 'Realtime · auth' },
  { name: 'AWS', icon: 'aws', group: 'platform', note: 'S3 · Lambda · Transcribe' },
  { name: 'Google Cloud', icon: 'googlecloud', group: 'platform', note: 'Run · storage' },
  { name: 'Cloudflare', icon: 'cloudflare', group: 'platform', note: 'DNS · Workers' },

  // Data in, answers out
  { name: 'pandas', icon: 'pandas', group: 'data', note: 'Wrangling' },
  { name: 'NumPy', icon: 'numpy', group: 'data', note: 'Vectorised math' },
  { name: 'SciPy', icon: 'scipy', group: 'data', note: 'Stats · optimise' },
  { name: 'scikit-learn', icon: 'scikitlearn', group: 'data', note: 'Ensembles' },
  { name: 'TensorFlow', icon: 'tensorflow', group: 'data', note: 'BERT fine-tuning' },
  { name: 'PostgreSQL', icon: 'postgresql', group: 'data', note: 'Schema · RLS' },
  { name: 'SQL Server', icon: 'sqlserver', group: 'data', note: 'T-SQL · SSMS' },
  { name: 'Oracle', icon: 'oracle', group: 'data', note: 'PL/SQL' },
  { name: 'MongoDB', icon: 'mongodb', group: 'data', note: 'Documents' },

  // Kept from breaking
  { name: 'pytest', icon: 'pytest', group: 'verify', note: 'Fixtures' },
  { name: 'Jest', icon: 'jest', group: 'verify', note: 'Component tests' },
  { name: 'CI/CD', icon: 'cicd', group: 'verify', note: 'Gated deploys' },
  { name: 'Azure DevOps', icon: 'azuredevops', group: 'verify', note: 'Pipelines · boards' },
  { name: 'Docker', icon: 'docker', group: 'verify', note: 'Parity' },
  { name: 'Git', icon: 'git', group: 'verify', note: 'Trunk · review' },
];
