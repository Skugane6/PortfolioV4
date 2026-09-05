import type { ExperienceEntry, Education } from './types';

export const experience: ExperienceEntry[] = [
  {
    company: 'Mitsubishi Heavy Industries',
    role: 'Software Engineering Intern',
    location: 'Mississauga, Canada',
    start: '05/2024',
    end: '08/2025',
    logo: '/MHIRJ_Logo.png',
    callouts: [
      {
        station: 'STA 145 · FWD',
        title: 'Component Tracker',
        description:
          'Led cross-functional requirements gathering with reliability engineers and analysts to deliver a full-stack Component Tracker application (React, Python/Flask) supporting 2,000+ aircraft across 100+ operators.',
        tags: ['React', 'Python / Flask', '2,000+ aircraft'],
        caption: 'Component lifecycle visibility',
        icon: 'tracker',
      },
      {
        station: 'STA 410 · WING BOX',
        title: 'Aircraft Utilization Forecasting',
        description:
          'Managed the end-to-end monthly Aircraft Utilization (AU) forecasting and reporting process, partnering with business and customer-facing teams on deliverables that directly shaped business decisions and customer relationships, and automated reporting to cut turnaround time by 85%.',
        tags: ['85% faster turnaround'],
        tagVariant: 'metric',
        caption: 'Data-driven operational efficiency',
        icon: 'chart',
      },
      {
        station: 'STA 760 · AFT',
        title: '10-Year Fleet Prediction Model',
        description:
          'Drove requirements definition and stakeholder alignment, translating evolving retirement, operator-transfer, and maintenance-scheduling rules from reliability and business stakeholders into a system spanning CRJ700/900 fleets and 50+ operators.',
        tags: ['CRJ700 / 900', '50+ operators'],
        caption: 'Long-term fleet planning',
        icon: 'plane',
      },
      {
        station: 'STA 940 · EMPENNAGE',
        title: 'Maintenance Scheduling Engine',
        description:
          'Designed the Oracle database architecture underneath it — indexing and query performance tuning included — then built a scheduling optimization engine coordinating maintenance workflows across 2,000+ entities.',
        tags: ['Oracle', 'Query tuning', '2,000+ entities'],
        caption: 'Coordinated maintenance workflows',
        icon: 'schedule',
      },
    ],
  },
];

export const education: Education = {
  school: 'Western University',
  program: 'B.E.Sc. Software Engineering',
  location: 'London, Canada',
  graduation: '06/2026',
};
