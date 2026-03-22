import { useEffect, useState } from 'react'
import {
  fetchExperience,
  fetchProfile,
  fetchProjects,
  type ExperienceItem,
  type ProfileResponse,
  type Project,
} from './api'
import Nav from './components/Nav'
import Hero from './components/Hero'
import ExperienceTimeline from './components/ExperienceTimeline'
import ProjectCarousel from './components/ProjectCarousel'
import Contact from './components/Contact'
import Footer from './components/Footer'

const NAV_OFFSET_PX = 70
const NAV_ITEMS = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
]

type PortfolioState = {
  profile: ProfileResponse | null
  experience: ExperienceItem[]
  projects: Project[]
  projectSource: string
  projectWarning: string | null
  loadError: string | null
}

function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET_PX
  window.scrollTo({ top, behavior: 'smooth' })
}

export default function App() {
  const [activeId, setActiveId] = useState<string>('about')
  const [portfolio, setPortfolio] = useState<PortfolioState>({
    profile: null,
    experience: [],
    projects: [],
    projectSource: 'loading',
    projectWarning: null,
    loadError: null,
  })

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY
      for (const item of NAV_ITEMS) {
        const section = document.getElementById(item.id)
        if (!section) continue
        const top = section.offsetTop - 100
        const bottom = top + section.offsetHeight
        if (scrollY >= top && scrollY < bottom) {
          setActiveId(item.id)
          return
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadPortfolio() {
      try {
        const [profile, experience, projectList] = await Promise.all([
          fetchProfile(),
          fetchExperience(),
          fetchProjects(),
        ])
        if (cancelled) return

        setPortfolio({
          profile,
          experience: experience.items,
          projects: projectList.projects,
          projectSource: projectList.source,
          projectWarning: projectList.warning,
          loadError: null,
        })
      } catch (error) {
        if (cancelled) return
        setPortfolio((current) => ({
          ...current,
          loadError: error instanceof Error ? error.message : 'Failed to load portfolio data.',
        }))
      }
    }

    loadPortfolio()
    return () => {
      cancelled = true
    }
  }, [])

  const handleNav = (id: string) => {
    scrollToId(id)
    setActiveId(id)
  }

  return (
    <>
      <Nav navItems={NAV_ITEMS} activeId={activeId} onNav={handleNav} />
      <Hero profile={portfolio.profile} onCta={() => handleNav('projects')} />
      <ExperienceTimeline items={portfolio.experience} />
      <ProjectCarousel
        projects={portfolio.projects}
        source={portfolio.projectSource}
        warning={portfolio.projectWarning ?? portfolio.loadError}
      />
      <Contact links={portfolio.profile?.contact_links ?? []} />
      <Footer />
    </>
  )
}
