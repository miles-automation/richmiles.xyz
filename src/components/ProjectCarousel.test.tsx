import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectCarousel from './ProjectCarousel'
import { projects } from '../data/projects'

describe('ProjectCarousel', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the Projects heading', () => {
    render(<ProjectCarousel />)
    expect(screen.getByText('Projects')).toBeInTheDocument()
  })

  it('renders the curated projects in order', () => {
    render(<ProjectCarousel />)
    const titles = screen.getAllByRole('heading', { level: 3 }).map((el) => el.textContent)
    expect(titles).toEqual([
      'Slopticus',
      'Sluice',
      'platform-ci',
      'Human Index',
      'In the Event of My Death',
      'Spark Swarm',
    ])
  })

  it('links every project to its url', () => {
    render(<ProjectCarousel />)
    const hrefs = screen
      .getAllByRole('link', { name: /Visit/ })
      .map((el) => el.getAttribute('href'))
    expect(hrefs).toEqual(projects.map((project) => project.url))
  })

  it('shows no health, stage or deploy badges', () => {
    render(<ProjectCarousel />)
    expect(document.querySelector('.health-dot')).toBeNull()
    expect(document.querySelector('.carousel-card-stage')).toBeNull()
    expect(screen.queryByText(/deployed/)).toBeNull()
    expect(screen.queryByText(/needs_love|Noodle/)).toBeNull()
  })

  it('navigates to next project when next arrow is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<ProjectCarousel />)

    await user.click(screen.getByLabelText('Next project'))

    const cards = document.querySelectorAll('.carousel-card')
    expect(cards[1]).toHaveClass('active')
  })

  it('renders the carousel with correct aria attributes', () => {
    render(<ProjectCarousel />)
    expect(screen.getByRole('region', { name: 'Project carousel' })).toBeInTheDocument()
  })
})
