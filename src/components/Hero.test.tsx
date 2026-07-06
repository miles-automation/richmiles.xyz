import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Hero from './Hero'

describe('Hero', () => {
  it('renders the name', () => {
    render(<Hero onCta={() => {}} />)
    expect(screen.getByText('Rich Miles')).toBeInTheDocument()
  })

  it('renders the tagline', () => {
    render(<Hero onCta={() => {}} />)
    expect(screen.getByText('I build tools that stay running.')).toBeInTheDocument()
  })

  it('renders the CTA button', () => {
    render(<Hero onCta={() => {}} />)
    const btn = screen.getByRole('button')
    expect(btn).toBeInTheDocument()
  })

  it('calls onCta when the button is clicked', async () => {
    const user = userEvent.setup()
    const onCta = vi.fn()
    render(<Hero onCta={onCta} />)
    await user.click(screen.getByRole('button'))
    expect(onCta).toHaveBeenCalledOnce()
  })

  it('renders the profile photo with correct alt text', () => {
    render(<Hero onCta={() => {}} />)
    const img = screen.getByAltText('Rich Miles')
    expect(img).toHaveAttribute('src', '/img/profile.webp')
  })
})
