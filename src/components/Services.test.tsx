import { render, screen } from '@testing-library/react'
import Services from './Services'

describe('Services', () => {
  it('renders the personal Work with me section', () => {
    render(<Services />)

    expect(screen.getByRole('heading', { name: 'Work with me.' })).toBeInTheDocument()
    expect(document.querySelector('#services')).toBeInTheDocument()
    expect(screen.getByText(/lead engineer with about 20 years/)).toBeInTheDocument()
    expect(screen.getByText(/LLM infrastructure at Sturdy AI/)).toBeInTheDocument()
    expect(screen.getByText(/fleet of production side projects/)).toBeInTheDocument()
  })

  it('points consulting and contract work to Miles Automation without a local form', () => {
    render(<Services />)

    const link = screen.getByRole('link', { name: 'Miles Automation' })
    expect(link).toHaveAttribute('href', 'https://milesautomation.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener')
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByText('Scoped build')).not.toBeInTheDocument()
    expect(screen.queryByText('Build + run')).not.toBeInTheDocument()
    expect(screen.queryByText('Build + hand-off')).not.toBeInTheDocument()
    expect(screen.queryByText(/Good fits/)).not.toBeInTheDocument()
    expect(screen.queryByText(/\$4k|\$250/)).not.toBeInTheDocument()
  })
})
