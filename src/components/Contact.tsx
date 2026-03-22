import type { ContactLink } from '../api'

type ContactProps = {
  links: ContactLink[]
}

export default function Contact({ links }: ContactProps) {
  return (
    <section className="contact" id="contact">
      <div className="container">
        <h2 className="section-title">Say hello.</h2>
        <div className="contact-links">
          {links.length === 0 && <p className="section-loading">Loading contact links...</p>}
          {links.map((link) => (
            <a
              href={link.href}
              key={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
            >
              <i className={link.icon}></i> {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
