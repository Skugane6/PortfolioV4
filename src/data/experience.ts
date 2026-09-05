import type { ExperienceEntry, Education } from './types';

export const experience: ExperienceEntry[] = [
  {
    company: 'Mitsubishi Heavy Industries',
    role: 'Software Engineering Intern',
    location: 'Mississauga, Canada',
    start: '05/2024',
    end: '08/2025',
    logo: '/MHIRJ_Logo.png',
    highlights: [
      'Component tracking system (React, Flask REST API) for 2,000+ aircraft across 100+ operators, with D3.js/Chart.js visualizations.',
      'Fleet prediction platform: 400,000+ monthly records from SQL Server/Oracle, via pandas/NumPy ETL pipelines.',
      'scikit-learn regression models for utilization forecasting across 50+ operators and 6 regional markets.',
      'Automated utilization and reliability reporting, cutting manual processing time by 85%.',
      'Oracle database architecture and a scheduling engine coordinating maintenance across 2,000+ entities.',
      'pytest/Jest suites at 85% coverage, with CI/CD for production deployments.',
    ],
  },
];

export const education: Education = {
  school: 'Western University',
  program: 'B.E.Sc. Software Engineering',
  location: 'London, Canada',
  graduation: '06/2026',
};
