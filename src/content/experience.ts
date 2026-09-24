import type { Role } from './types';

/**
 * Roles, newest first. Each callout pins to a station on the role's drawing;
 * adding a callout adds a station and a card, with no layout code to touch.
 *
 * Titles, captions, descriptions and tags are the site's existing wording,
 * unchanged. Where they differ from the résumé, that is flagged in
 * NEEDS-FROM-SEARAN.md #3 rather than edited here.
 */
export const roles: Role[] = [
  {
    id: 'mhi',
    company: 'Mitsubishi Heavy Industries',
    role: 'Software Engineering Intern',
    location: 'Mississauga, Canada',
    start: '05/2024',
    end: '08/2025',
    logo: {
      src: '/MHIRJ_Logo.png',
      srcSet: '/img/mhirj-80.webp 80w, /img/mhirj-160.webp 160w, /img/mhirj-240.webp 240w',
      width: 613,
      height: 270,
    },
    drawing: 'crj700-side',
    callouts: [
      {
        id: 'component-tracker',
        station: 145,
        zone: 'Fwd fuselage',
        title: 'Component Tracker',
        caption: 'Component lifecycle visibility',
        impact: '2,000+ aircraft across 100+ operators',
        description:
          'Led cross-functional requirements gathering with reliability engineers and analysts to deliver a full-stack Component Tracker application (React, Python/Flask) supporting 2,000+ aircraft across 100+ operators.',
        tags: ['React', 'Python / Flask', '2,000+ aircraft'],
      },
      {
        id: 'utilization-forecasting',
        station: 616,
        zone: 'Wing box',
        title: 'Aircraft Utilization Forecasting',
        caption: 'Data-driven operational efficiency',
        impact: 'Reporting automated, turnaround time cut by 85%',
        description:
          'Managed the end-to-end monthly Aircraft Utilization (AU) forecasting and reporting process, partnering with business and customer-facing teams on deliverables that directly shaped business decisions and customer relationships, and automated reporting to cut turnaround time by 85%.',
        tags: ['85% faster turnaround'],
        tagVariant: 'metric',
      },
      {
        id: 'fleet-prediction',
        station: 942,
        zone: 'Aft fuselage',
        title: '10-Year Fleet Prediction Model',
        caption: 'Long-term fleet planning',
        impact: 'CRJ700/900 fleets, 50+ operators',
        description:
          'Drove requirements definition and stakeholder alignment, translating evolving retirement, operator-transfer, and maintenance-scheduling rules from reliability and business stakeholders into a system spanning CRJ700/900 fleets and 50+ operators.',
        tags: ['CRJ700 / 900', '50+ operators'],
      },
      {
        id: 'maintenance-scheduling',
        station: 1116,
        zone: 'Empennage',
        title: 'Maintenance Scheduling Engine',
        caption: 'Coordinated maintenance workflows',
        impact: 'Maintenance workflows across 2,000+ entities',
        description:
          'Designed the Oracle database architecture underneath it, indexing and query performance tuning included, then built a scheduling optimization engine coordinating maintenance workflows across 2,000+ entities.',
        tags: ['Oracle', 'Query tuning', '2,000+ entities'],
      },
    ],
  },
];
