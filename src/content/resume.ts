/**
 * Lines from the résumé (public/skuganesan_resume.pdf, August 2026), quoted
 * verbatim. The bill of materials cites them as evidence of where a part was
 * used when nothing else on the site shows it. They are the owner's own
 * statements; nothing here is paraphrased.
 */
export interface ResumeLine {
  id: string;
  /** Where the line sits on the résumé. */
  context: string;
  text: string;
}

export const resumeLines: ResumeLine[] = [
  {
    id: 'mhi-component-tracking',
    context: 'Mitsubishi Heavy Industries',
    text: 'Engineered full-stack component tracking system leveraging React.js frontend and Python/Flask RESTful API backend serving 2,000+ aircraft across 100+ operators with interactive D3.js/Chart.js data visualizations',
  },
  {
    id: 'mhi-fleet-etl',
    context: 'Mitsubishi Heavy Industries',
    text: 'Engineered fleet prediction platform processing 400,000+ monthly records from SQL Server/Oracle databases using pandas/NumPy ETL pipelines with automated exception handling and validation',
  },
  {
    id: 'mhi-ml-trends',
    context: 'Mitsubishi Heavy Industries',
    text: 'Implemented machine learning trend analysis with scikit-learn regression models for utilization forecasting across 50+ operators and 6 regional markets with statistical validation',
  },
  {
    id: 'mhi-testing',
    context: 'Mitsubishi Heavy Industries',
    text: 'Developed comprehensive unit and integration test suites using pytest and Jest, achieving 85% code coverage and implementing CI/CD pipelines with automated testing to ensure reliability across production deployments',
  },
];

/**
 * The résumé's technical-skills block, verbatim. A part that appears only
 * here is shown as "listed on the résumé", not as used in anything.
 */
export const resumeSkillsList = [
  'Languages: Python, Java, C/C++, Kotlin, C#, TypeScript, SQL, MATLAB, HTML/CSS, Bash',
  'Frameworks: React, Node, Express, Spring Boot, Django, .NET, Flask, FastAPI, Vite, Tailwind CSS',
  'Technologies/Tools: Git, Docker, MySQL, MongoDB, PostgreSQL, Supabase, AWS (S3, Lambda, Transcribe), Google Cloud Platform, Cloudflare, Stripe, Twilio, Selenium, Postman, Jira, Articulate Storyline, Excel, Figma',
  'Production & Infrastructure: CI/CD, Unit-testing, Stress/Exhaustion Testing, Regression Testing, Git, Azure DevOps',
];
