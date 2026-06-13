import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (e, id) => {
    e.preventDefault()
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 120)
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const navLinks = [
    { label: 'Home',     to: '/' },
    { label: 'Features', sectionId: 'features' },
    { label: 'Pricing',  sectionId: 'pricing' },
    { label: 'About',    sectionId: 'footer' },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'shadow-md bg-white/95 backdrop-blur-sm'
          : 'shadow-none bg-white'
      }`}
    >
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 w-full max-w-container-max mx-auto">

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 select-none group"
          aria-label="Eduflux Home"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
            style={{ background: 'linear-gradient(135deg, #3525cd, #712ae2)' }}
          >
            <span
              className="material-symbols-outlined text-base text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_stories
            </span>
          </div>
          <span className="font-headline-sm text-headline-sm font-bold text-primary">
            Eduflux
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 h-full">
          {navLinks.map(({ label, to, sectionId }, idx) =>
            to ? (
              <Link
                key={idx}
                to={to}
                className={`font-label-md text-label-md h-16 flex items-center border-b-2 transition-colors duration-200 ${
                  location.pathname === '/'
                    ? 'text-primary border-primary font-semibold'
                    : 'text-on-surface-variant border-transparent hover:text-primary'
                }`}
              >
                {label}
              </Link>
            ) : (
              <a
                key={idx}
                href={`#${sectionId}`}
                onClick={(e) => scrollToSection(e, sectionId)}
                className="font-label-md text-label-md h-16 flex items-center border-b-2 border-transparent text-on-surface-variant hover:text-primary transition-colors duration-200"
              >
                {label}
              </a>
            )
          )}
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            id="navbar-login-btn"
            className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200"
          >
            Login
          </Link>
          <Link
            to="/register"
            id="navbar-signup-btn"
            className="bg-brand-gradient text-white px-5 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 hover:scale-[1.02] transition-all active:scale-95 duration-200 academic-shadow"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  )
}
