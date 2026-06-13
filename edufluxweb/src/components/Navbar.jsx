import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when changing location
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location])

  const scrollToSection = (e, id) => {
    e.preventDefault()
    if (location.pathname !== '/') {
      navigate('/')
      // Let the page render first, then scroll
      setTimeout(() => {
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } else {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <nav className={`bg-surface/90 dark:bg-surface-container-highest/90 backdrop-blur-md fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-md border-b border-outline-variant/30' : 'shadow-sm'}`}>
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 w-full max-w-container-max mx-auto">
        {/* Logo */}
        <Link 
          to="/" 
          className="font-headline-sm text-headline-sm font-bold text-primary dark:text-inverse-primary flex items-center gap-2 select-none"
        >
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
          Eduflux
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 h-full">
          <Link 
            to="/" 
            className={`font-label-md text-label-md transition-colors h-16 flex items-center ${location.pathname === '/' ? 'text-primary dark:text-inverse-primary font-bold border-b-2 border-primary' : 'text-on-surface-variant dark:text-surface-variant hover:text-primary'}`}
          >
            Home
          </Link>
          <a 
            href="#features" 
            onClick={(e) => scrollToSection(e, 'features')}
            className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-inverse-primary font-label-md text-label-md transition-colors h-16 flex items-center"
          >
            Features
          </a>
          <a 
            href="#pricing" 
            onClick={(e) => scrollToSection(e, 'pricing')}
            className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-inverse-primary font-label-md text-label-md transition-colors h-16 flex items-center"
          >
            Pricing
          </a>
          <a 
            href="#about" 
            onClick={(e) => scrollToSection(e, 'footer')}
            className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-inverse-primary font-label-md text-label-md transition-colors h-16 flex items-center"
          >
            About
          </a>
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link 
            to="/login"
            className="text-on-surface-variant font-label-md text-label-md hover:text-primary transition-all active:scale-95 duration-150 py-2 px-3"
          >
            Login
          </Link>
          <Link 
            to="/register"
            className="bg-primary text-on-primary px-6 py-2 rounded-lg font-label-md text-label-md hover:bg-primary-container transition-all active:scale-95 duration-150 academic-shadow"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-on-surface-variant focus:outline-none p-1.5"
            aria-label="Toggle Menu"
          >
            <span className="material-symbols-outlined text-2xl select-none">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-outline-variant/30 bg-surface dark:bg-surface-container-highest w-full absolute top-16 left-0 shadow-lg z-40 animate-fade-in">
          <div className="flex flex-col px-margin-mobile py-6 gap-5">
            <Link 
              to="/" 
              className={`font-label-md text-label-md transition-colors ${location.pathname === '/' ? 'text-primary dark:text-inverse-primary font-bold' : 'text-on-surface-variant dark:text-surface-variant'}`}
            >
              Home
            </Link>
            <a 
              href="#features" 
              onClick={(e) => { scrollToSection(e, 'features'); setIsMobileMenuOpen(false); }}
              className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-inverse-primary font-label-md text-label-md transition-colors"
            >
              Features
            </a>
            <a 
              href="#pricing" 
              onClick={(e) => { scrollToSection(e, 'pricing'); setIsMobileMenuOpen(false); }}
              className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-inverse-primary font-label-md text-label-md transition-colors"
            >
              Pricing
            </a>
            <a 
              href="#about" 
              onClick={(e) => { scrollToSection(e, 'footer'); setIsMobileMenuOpen(false); }}
              className="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-inverse-primary font-label-md text-label-md transition-colors"
            >
              About
            </a>
            <div className="h-px bg-outline-variant/30 my-2"></div>
            <div className="flex flex-col gap-3">
              <Link 
                to="/login"
                className="text-center text-on-surface-variant font-label-md text-label-md hover:text-primary transition-all active:scale-95 duration-150 py-3 border border-outline-variant/50 rounded-lg"
              >
                Login
              </Link>
              <Link 
                to="/register"
                className="text-center bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md hover:bg-primary-container transition-all active:scale-95 duration-150 academic-shadow"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
