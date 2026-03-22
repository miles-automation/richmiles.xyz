import type { ProfileResponse } from '../api'

type HeroProps = {
  profile: ProfileResponse | null
  onCta: () => void
}

export default function Hero({ profile, onCta }: HeroProps) {
  return (
    <section className="hero" id="about">
      <div className="container hero-content">
        <img
          src={profile?.photo_url ?? '/img/profile.png'}
          alt={profile?.name ?? 'Rich Miles'}
          className="hero-photo"
        />
        <h1>{profile?.name ?? 'Rich Miles'}</h1>
        <p className="hero-tagline">{profile?.tagline ?? 'Loading portfolio...'}</p>
        <p className="hero-description">
          {profile?.description ?? 'Pulling profile and project data from the backend API.'}
        </p>
        {profile?.location && <p className="hero-location">{profile.location}</p>}
        <button
          className="btn"
          onClick={(e) => {
            e.preventDefault()
            onCta()
          }}
        >
          {profile?.cta_label ?? 'View my work'} &darr;
        </button>
      </div>
    </section>
  )
}
