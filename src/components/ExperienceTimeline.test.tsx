import { render, screen } from '@testing-library/react'
import ExperienceTimeline from './ExperienceTimeline'

describe('ExperienceTimeline', () => {
  it('renders the Experience heading', () => {
    render(<ExperienceTimeline />)
    expect(screen.getByText('Experience')).toBeInTheDocument()
  })

  it('renders experience items', () => {
    render(<ExperienceTimeline />)
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Sturdy')).toBeInTheDocument()
  })

  it('renders dates for experience items', () => {
    render(<ExperienceTimeline />)
    expect(screen.getByText('May 2025 - Present')).toBeInTheDocument()
  })

  it('renders timeline structure', () => {
    render(<ExperienceTimeline />)
    const items = document.querySelectorAll('.timeline-item')
    expect(items.length).toBeGreaterThan(0)
  })
})
