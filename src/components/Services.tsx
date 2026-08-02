import { type FormEvent, useState } from 'react'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

type LeadForm = {
  name: string
  email: string
  company: string
  message: string
  website: string
}

const initialForm: LeadForm = {
  name: '',
  email: '',
  company: '',
  message: '',
  website: '',
}

const fallbackError = 'Could not submit right now — email me instead: me@richmiles.xyz'

export default function Services() {
  const [form, setForm] = useState<LeadForm>(initialForm)
  const [status, setStatus] = useState<SubmitState>('idle')
  const [error, setError] = useState('')

  const handleChange = (field: keyof LeadForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('submitting')
    setError('')

    try {
      const response = await fetch('/api/v1/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company || null,
          message: form.message || null,
          website: form.website,
        }),
      })

      if (!response.ok) {
        let detail = fallbackError
        try {
          const data = (await response.json()) as { detail?: unknown }
          if (typeof data.detail === 'string' && data.detail) detail = data.detail
        } catch {
          // Keep the fallback message when the API response is not JSON.
        }
        throw new Error(detail)
      }

      setStatus('success')
    } catch (submitError) {
      setStatus('error')
      setError(submitError instanceof Error ? submitError.message : fallbackError)
    }
  }

  return (
    <section className="services" id="services">
      <div className="container">
        <h2 className="section-title">Hire me.</h2>
        <p className="services-intro">
          I design, build, deploy, and operate custom software — soup to nuts, in weeks. Everything
          in the projects above is live right now, built and run by one person with a production
          platform behind it: automated deploys, monitoring, alerting, rollbacks.
        </p>

        <div className="services-offers">
          <article className="service-card">
            <h3>Scoped build</h3>
            <p>
              A working, deployed tool for your business in 2–4 weeks. Fixed scope, fixed price —
              typically $4k–$8k. You see it running on the web before you pay the balance.
            </p>
          </article>
          <article className="service-card">
            <h3>Build + run</h3>
            <p>
              I build it, then I operate it: hosting, monitoring, backups, fixes, and small
              improvements. Build fee plus a flat monthly rate from $250/mo. You get software that
              stays alive without hiring anyone.
            </p>
          </article>
          <article className="service-card">
            <h3>Build + hand-off</h3>
            <p>
              Prefer to own it? I deliver the container images, infrastructure config, secrets,
              runbook, and DNS instructions — a complete package your team (or your next contractor)
              can run anywhere. No lock-in, ever.
            </p>
          </article>
        </div>

        <p className="services-fit">
          Good fits: replacing a spreadsheet-and-email workflow, internal tools, customer portals,
          integrations between systems that don't talk. If you're not sure, describe the problem —
          I'll tell you honestly if it's not a fit.
        </p>

        <div className="lead-form-wrapper">
          {status === 'success' ? (
            <p className="lead-status lead-status-success" aria-live="polite">
              Thanks — I read every one of these myself. You'll hear from me within 2 business days.
            </p>
          ) : (
            <form className="lead-form" onSubmit={handleSubmit}>
              <div className="lead-field">
                <label htmlFor="lead-name">Name</label>
                <input
                  id="lead-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  required
                />
              </div>

              <div className="lead-field">
                <label htmlFor="lead-email">Email</label>
                <input
                  id="lead-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  required
                />
              </div>

              <div className="lead-field">
                <label htmlFor="lead-company">Company</label>
                <input
                  id="lead-company"
                  name="company"
                  type="text"
                  autoComplete="organization"
                  value={form.company}
                  onChange={(event) => handleChange('company', event.target.value)}
                />
              </div>

              <div className="lead-field">
                <label htmlFor="lead-message">What's eating your time?</label>
                <textarea
                  id="lead-message"
                  name="message"
                  rows={5}
                  value={form.message}
                  onChange={(event) => handleChange('message', event.target.value)}
                />
              </div>

              <div className="honeypot" aria-hidden="true">
                <label htmlFor="lead-website">Website</label>
                <input
                  id="lead-website"
                  name="website"
                  type="text"
                  value={form.website}
                  onChange={(event) => handleChange('website', event.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
              </div>

              {status === 'submitting' && (
                <p className="lead-status" aria-live="polite">
                  Sending...
                </p>
              )}
              {status === 'error' && (
                <p className="lead-status lead-status-error" role="alert" aria-live="polite">
                  {error}
                </p>
              )}

              <button className="btn lead-submit" type="submit" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Sending...' : 'Send inquiry'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
