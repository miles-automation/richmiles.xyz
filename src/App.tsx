import { useEffect, useMemo, useState } from 'react'
import Nav from './components/Nav'
import Hero from './components/Hero'
import ExperienceTimeline from './components/ExperienceTimeline'
import ProjectCarousel from './components/ProjectCarousel'
import Contact from './components/Contact'
import Footer from './components/Footer'

const NAV_OFFSET_PX = 70

function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET_PX
  window.scrollTo({ top, behavior: 'smooth' })
}

export default function App() {
  const navItems = useMemo(
    () => [
      { id: 'about', label: 'About' },
      { id: 'experience', label: 'Experience' },
      { id: 'projects', label: 'Projects' },
      { id: 'contact', label: 'Contact' },
    ],
    [],
  )

  const [activeId, setActiveId] = useState<string>('about')

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY
      for (const item of navItems) {
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
  }, [navItems])

  const handleNav = (id: string) => {
    scrollToId(id)
    setActiveId(id)
  }

  return (
    <>
      <Nav navItems={navItems} activeId={activeId} onNav={handleNav} />
      <main>
        <Hero onCta={() => handleNav('projects')} />
        <ExperienceTimeline />
        <ProjectCarousel />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
