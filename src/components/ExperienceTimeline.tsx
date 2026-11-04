const experiences = [
  {
    date: 'May 2025 - Present',
    title: 'Senior Software Engineer',
    company: 'Sturdy',
    description:
      "Work across the AI assistant, LLM services, inference pipeline, data engineering tools and frontend on a small team. Designed and built most of the AI report and email-digest platform (21,000+ reports, digests to 600+ customer users a month), built the LLM classification and conversation-summary pipelines (4 to 6 billion tokens a month), and rebuilt the assistant's people search from 45 seconds to 7 milliseconds worst case.",
  },
  {
    date: 'April 2024 - Present',
    title: 'Founder & Lead Developer',
    company: 'Miles Automation',
    url: 'https://milesautomation.com',
    description:
      'A product studio: I build and run about ten production services, including Slopticus (a Mac and iPhone workspace for coding agents), Sluice (an open-source MCP proxy on PyPI) and platform-ci (on-demand CI/CD with automatic rollback).',
  },
  {
    date: 'Aug 2023 - April 2024',
    title: 'Game Designer, Co-Founder',
    company: 'Edventure Studios',
    description:
      'Built Edventure Trek, an educational game using Unity/C#/SQLite on the frontend and Python/FastAPI/MySQL on the backend. Launched a successful Kickstarter campaign that validated core concepts.',
  },
  {
    date: 'Nov 2015 - Aug 2023',
    title: 'CTO / Co-Founder',
    company: 'Neowire',
    description:
      'Built a full Azure CI/CD pipeline with blue/green deployments. Scaled operations to 250,000+ users in European markets while managing diverse data regulations.',
  },
  {
    date: 'Dec 2011 - Mar 2016',
    title: 'Lead Software Developer',
    company: 'Propel Labs',
    description:
      'Engineered a next-generation flow cytometry platform in C#/WPF, capable of real-time analysis of up to 100,000 events/sec. Pioneered automated drop delay calibration, replacing manual steps with a patented system.',
  },
]

export default function ExperienceTimeline() {
  return (
    <section className="experience" id="experience">
      <div className="container">
        <h2 className="section-title">Experience</h2>
        <div className="timeline">
          {experiences.map((exp, i) => (
            <div className="timeline-item" key={i}>
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <span className="timeline-date">{exp.date}</span>
                <h3 className="timeline-title">{exp.title}</h3>
                <h4 className="timeline-company">
                  {'url' in exp && exp.url ? (
                    <a href={exp.url} target="_blank" rel="noopener noreferrer">
                      {exp.company}
                    </a>
                  ) : (
                    exp.company
                  )}
                </h4>
                <p>{exp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
