type HeroProps = {
  onCta: () => void
}

export default function Hero({ onCta }: HeroProps) {
  return (
    <section className="hero" id="about">
      <div className="container hero-content">
        <img src="/img/profile.webp" alt="Rich Miles" className="hero-photo" />
        <h1>Rich Miles</h1>
        <p className="hero-tagline">I build tools that stay running.</p>
        <p className="hero-description">
          Twenty years of shipping software, from flow cytometry to fintech to AI-powered account
          intelligence. Lead engineer at Sturdy AI by day, building a fleet of side projects from
          Laramie, Wyoming by night.
        </p>
        <button
          className="btn"
          onClick={(e) => {
            e.preventDefault()
            onCta()
          }}
        >
          View my work &darr;
        </button>
      </div>
    </section>
  )
}
