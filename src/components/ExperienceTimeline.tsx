import type { ExperienceItem } from '../api'

type ExperienceTimelineProps = {
  items: ExperienceItem[]
}

export default function ExperienceTimeline({ items }: ExperienceTimelineProps) {
  return (
    <section className="experience" id="experience">
      <div className="container">
        <h2 className="section-title">Experience</h2>
        <div className="timeline">
          {items.length === 0 && <p className="section-loading">Loading experience...</p>}
          {items.map((exp) => (
            <div className="timeline-item" key={`${exp.company}-${exp.date}`}>
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <span className="timeline-date">{exp.date}</span>
                <h3 className="timeline-title">{exp.title}</h3>
                <h4 className="timeline-company">{exp.company}</h4>
                <p>{exp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
