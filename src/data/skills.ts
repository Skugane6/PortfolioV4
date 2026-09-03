import type { SkillGroup } from './types';

export const skillGroups: SkillGroup[] = [
  {
    id: 'ship-it',
    title: 'Ship it',
    skills: ['React', 'TypeScript', 'FastAPI', 'Flask', 'PostgreSQL', 'Tailwind CSS'],
  },
  {
    id: 'talk-to-other-systems',
    title: 'Talk to other systems',
    skills: [
      'Stripe',
      'Twilio',
      'QuickBooks OAuth2',
      'Supabase Realtime',
      'AWS (S3, Lambda, Transcribe)',
      'Google Cloud Platform',
      'Cloudflare',
    ],
  },
  {
    id: 'move-and-shape-data',
    title: 'Move and shape data',
    skills: [
      'Python',
      'pandas',
      'NumPy',
      'SciPy',
      'scikit-learn',
      'TensorFlow / BERT',
      'SQL Server',
      'Oracle',
      'MongoDB',
    ],
  },
  {
    id: 'keep-it-from-breaking',
    title: 'Keep it from breaking',
    skills: ['pytest', 'Jest', 'CI/CD', 'Azure DevOps', 'Docker', 'Git'],
  },
];
