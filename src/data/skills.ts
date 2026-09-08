import type { Skill } from './types';

// One flat parts list, rendered as a single grid. The order is still the order a
// colleague would hear it described — what the product is built with, what it
// plugs into, what it computes, what keeps it honest — the grid just doesn't
// draw lines between those runs any more.
//
// `name` stays short because the logo does the recognising; anything that used
// to live in parentheses ("AWS (S3, Lambda, Transcribe)") moved to `note`, which
// the tile prints under the name.
export const skills: Skill[] = [
  // Built with
  { name: 'React', icon: 'react', note: 'Hooks · SPA' },
  { name: 'TypeScript', icon: 'typescript', note: 'Strict mode' },
  { name: 'Python', icon: 'python', note: 'Primary language' },
  { name: 'FastAPI', icon: 'fastapi', note: 'Async REST' },
  { name: 'Flask', icon: 'flask', note: 'Services' },
  { name: 'Tailwind', icon: 'tailwindcss', note: 'Design tokens' },

  // Plugged into
  { name: 'Stripe', icon: 'stripe', note: 'Billing · webhooks' },
  { name: 'Twilio', icon: 'twilio', note: 'SMS · voice' },
  { name: 'QuickBooks', icon: 'quickbooks', note: 'OAuth2' },
  { name: 'Supabase', icon: 'supabase', note: 'Realtime · auth' },
  { name: 'AWS', icon: 'aws', note: 'S3 · Lambda · Transcribe' },
  { name: 'Google Cloud', icon: 'googlecloud', note: 'Run · storage' },
  { name: 'Cloudflare', icon: 'cloudflare', note: 'DNS · Workers' },

  // Data in, answers out
  { name: 'pandas', icon: 'pandas', note: 'Wrangling' },
  { name: 'NumPy', icon: 'numpy', note: 'Vectorised math' },
  { name: 'SciPy', icon: 'scipy', note: 'Stats · optimise' },
  { name: 'scikit-learn', icon: 'scikitlearn', note: 'Ensembles' },
  { name: 'TensorFlow', icon: 'tensorflow', note: 'BERT fine-tuning' },
  { name: 'PostgreSQL', icon: 'postgresql', note: 'Schema · RLS' },
  { name: 'SQL Server', icon: 'sqlserver', note: 'T-SQL · SSMS' },
  { name: 'Oracle', icon: 'oracle', note: 'PL/SQL' },
  { name: 'MongoDB', icon: 'mongodb', note: 'Documents' },

  // Kept from breaking
  { name: 'pytest', icon: 'pytest', note: 'Fixtures' },
  { name: 'Jest', icon: 'jest', note: 'Component tests' },
  { name: 'CI/CD', icon: 'cicd', note: 'Gated deploys' },
  { name: 'Azure DevOps', icon: 'azuredevops', note: 'Pipelines · boards' },
  { name: 'Docker', icon: 'docker', note: 'Parity' },
  { name: 'Git', icon: 'git', note: 'Trunk · review' },
];
