import { useCallback, useEffect, useRef, useState } from 'react'
import type { Project } from '../api'

const AUTO_INTERVAL_MS = 5000
const SWIPE_THRESHOLD = 50

function healthColor(health: string): string {
  switch (health) {
    case 'healthy':
      return '#22c55e'
    case 'needs_love':
      return '#f59e0b'
    case 'degraded':
    case 'down':
      return '#ef4444'
    default:
      return '#94a3b8'
  }
}

function formatDeploy(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffH < 1) return 'deployed just now'
  if (diffH < 24) return `deployed ${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'deployed yesterday'
  return `deployed ${diffD}d ago`
}

type ProjectCarouselProps = {
  projects: Project[]
  source: string
  warning: string | null
}

function sourceLabel(source: string): string {
  if (source === 'live') return 'Live portfolio feed'
  if (source === 'fallback') return 'Fallback portfolio feed'
  return 'Loading portfolio feed'
}

export default function ProjectCarousel({ projects, source, warning }: ProjectCarouselProps) {
  const [current, setCurrent] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartRef = useRef<number | null>(null)
  const count = projects.length

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return
      setCurrent(((index % count) + count) % count)
    },
    [count],
  )

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  const startAutoPlay = useCallback(() => {
    if (count === 0) return
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % count)
    }, AUTO_INTERVAL_MS)
  }, [count])

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    startAutoPlay()
    return stopAutoPlay
  }, [startAutoPlay, stopAutoPlay])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prev()
      stopAutoPlay()
      startAutoPlay()
    } else if (e.key === 'ArrowRight') {
      next()
      stopAutoPlay()
      startAutoPlay()
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartRef.current
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) next()
      else prev()
      stopAutoPlay()
      startAutoPlay()
    }
    touchStartRef.current = null
  }

  if (projects.length === 0) {
    return (
      <section className="projects" id="projects">
        <div className="container">
          <h2 className="section-title">Projects</h2>
          <div className="section-intro">
            <span className={`source-badge source-${source}`}>{sourceLabel(source)}</span>
            {warning && <p className="section-warning">{warning}</p>}
          </div>
          <p className="section-loading">Loading projects...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="projects" id="projects">
      <div className="container">
        <h2 className="section-title">Projects</h2>
        <div className="section-intro">
          <span className={`source-badge source-${source}`}>{sourceLabel(source)}</span>
          {warning && <p className="section-warning">{warning}</p>}
        </div>

        <div
          className="carousel-wrapper"
          onMouseEnter={stopAutoPlay}
          onMouseLeave={startAutoPlay}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          tabIndex={0}
          role="region"
          aria-label="Project carousel"
        >
          <div className="carousel-viewport">
            <div className="carousel-track" style={{ transform: `translateX(-${current * 100}%)` }}>
              {projects.map((project, i) => (
                <div className={`carousel-card${i === current ? ' active' : ''}`} key={project.id}>
                  <div className="carousel-card-header">
                    <div className="carousel-card-header-left">
                      <img src={project.icon} alt={project.title} className="carousel-card-icon" />
                      <div className="carousel-card-titles">
                        <h3 className="carousel-card-title">{project.title}</h3>
                        <div className="carousel-card-meta">
                          <span
                            className="health-dot"
                            style={{ backgroundColor: healthColor(project.health) }}
                            title={project.health}
                          />
                          <span className="carousel-card-stage">{project.stage}</span>
                          {project.last_deploy_at && (
                            <span className="carousel-card-deploy">
                              {formatDeploy(project.last_deploy_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {project.domain && (
                      <a
                        href={`https://${project.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="carousel-card-visit"
                      >
                        Visit &rarr;
                      </a>
                    )}
                  </div>
                  <p className="carousel-card-description">{project.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="carousel-controls">
            <button className="carousel-arrow" onClick={prev} aria-label="Previous project">
              &lsaquo;
            </button>
            <div className="carousel-dots">
              {projects.map((_, i) => (
                <button
                  key={i}
                  className={`carousel-dot${i === current ? ' active' : ''}`}
                  onClick={() => {
                    goTo(i)
                    stopAutoPlay()
                    startAutoPlay()
                  }}
                  aria-label={`Go to project ${i + 1}`}
                />
              ))}
            </div>
            <button className="carousel-arrow" onClick={next} aria-label="Next project">
              &rsaquo;
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
