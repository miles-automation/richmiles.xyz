import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Services from './Services'

describe('Services', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the consulting offers and intake fields', () => {
    render(<Services />)

    expect(screen.getByText('Hire me.')).toBeInTheDocument()
    expect(screen.getByText('Scoped build')).toBeInTheDocument()
    expect(screen.getByText('Build + run')).toBeInTheDocument()
    expect(screen.getByText('Build + hand-off')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Company')).toBeInTheDocument()
    expect(screen.getByLabelText("What's eating your time?")).toBeInTheDocument()

    const honeypot = document.querySelector('input[name="website"]')
    expect(honeypot).toHaveAttribute('tabindex', '-1')
    expect(honeypot).toHaveAttribute('autocomplete', 'off')
    expect(honeypot).toHaveAttribute('aria-hidden', 'true')
  })

  it('marks only name and email as required', () => {
    render(<Services />)

    expect(screen.getByLabelText('Name')).toBeRequired()
    expect(screen.getByLabelText('Email')).toBeRequired()
    expect(screen.getByLabelText('Company')).not.toBeRequired()
    expect(screen.getByLabelText("What's eating your time?")).not.toBeRequired()
  })

  it('does not submit when required fields are empty', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<Services />)

    await user.click(screen.getByRole('button', { name: 'Send inquiry' }))

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the success message after a successful submit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202 })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<Services />)

    await user.type(screen.getByLabelText('Name'), 'Rich Miles')
    await user.type(screen.getByLabelText('Email'), 'rich@example.com')
    await user.type(screen.getByLabelText('Company'), 'Acme')
    await user.type(screen.getByLabelText("What's eating your time?"), 'Too much spreadsheet work.')
    await user.click(screen.getByRole('button', { name: 'Send inquiry' }))

    await waitFor(() => {
      expect(
        screen.getByText(
          "Thanks — I read every one of these myself. You'll hear from me within 2 business days.",
        ),
      ).toBeInTheDocument()
    })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/lead',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Rich Miles',
          email: 'rich@example.com',
          company: 'Acme',
          message: 'Too much spreadsheet work.',
          website: '',
        }),
      }),
    )
    expect(screen.queryByRole('button', { name: 'Send inquiry' })).not.toBeInTheDocument()
  })

  it('keeps the form editable and shows the API error', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: vi.fn().mockResolvedValue({ detail: 'Too many submissions, please try again later.' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<Services />)

    await user.type(screen.getByLabelText('Name'), 'Rich Miles')
    await user.type(screen.getByLabelText('Email'), 'rich@example.com')
    await user.click(screen.getByRole('button', { name: 'Send inquiry' }))

    await waitFor(() => {
      expect(screen.getByText('Too many submissions, please try again later.')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('Name')).toHaveValue('Rich Miles')
    expect(screen.getByRole('button', { name: 'Send inquiry' })).toBeEnabled()
  })
})
