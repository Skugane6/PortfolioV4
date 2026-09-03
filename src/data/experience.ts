import type { ExperienceEntry, Education } from './types';

export const experience: ExperienceEntry[] = [
  {
    company: 'Mitsubishi Heavy Industries',
    role: 'Software Engineering Intern',
    location: 'Mississauga, Canada',
    start: '05/2024',
    end: '08/2025',
    highlights: [
      'Engineered a full-stack component tracking system (React frontend, Python/Flask REST API) serving 2,000+ aircraft across 100+ operators with D3.js/Chart.js visualizations.',
      'Built a fleet prediction platform processing 400,000+ monthly records from SQL Server/Oracle via pandas/NumPy ETL pipelines with automated exception handling.',
      'Implemented scikit-learn regression models for utilization forecasting across 50+ operators and 6 regional markets.',
      'Automated monthly aircraft utilization and reliability reporting, cutting manual processing time by 85%.',
      'Designed the Oracle database architecture and a scheduling optimization engine coordinating maintenance workflows across 2,000+ entities.',
      'Built pytest/Jest test suites at 85% coverage with CI/CD pipelines for production deployments.',
    ],
  },
];

export const education: Education = {
  school: 'Western University',
  program: 'B.E.Sc. Software Engineering',
  location: 'London, Canada',
  graduation: '06/2026',
};
