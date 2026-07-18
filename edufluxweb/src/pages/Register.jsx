import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { checkIsInstitutional } from '../utils/validation'

export default function Register() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isInstitutional, setIsInstitutional] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setIsInstitutional(checkIsInstitutional(email))
  }, [email])

  // Mousemove parallax effect for desktop floating cards
  useEffect(() => {
    const handleMouseMove = (e) => {
      const floaters = document.querySelectorAll('.glass-morphism');
      const mouseX = (e.clientX / window.innerWidth) - 0.5;
      const mouseY = (e.clientY / window.innerHeight) - 0.5;
      
      floaters.forEach((el, index) => {
        const depth = (index + 1) * 15;
        el.style.transform = `translate(${mouseX * depth}px, ${mouseY * depth}px)`;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, email, password, isInstitutional }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errMsg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Registration failed')
        throw new Error(errMsg)
      }

      showToast('Registration completed successfully')
      setSuccess('Account created successfully! Redirecting to login...')
      
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-bright min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Atmospheric Effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] rounded-full bg-primary-fixed opacity-20 blur-[100px]"></div>
        <div className="absolute -bottom-[10%] -left-[5%] w-[30%] h-[30%] rounded-full bg-secondary-fixed opacity-20 blur-[80px]"></div>
      </div>

      {/* Registration Container */}
      <main className="w-full max-w-[560px] animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link to="/" className="mb-4 flex items-center justify-center w-14 h-14 bg-primary rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-white text-[32px]">auto_stories</span>
          </Link>
          <h1 className="font-headline-md text-headline-md text-primary tracking-tight">Eduflux</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Accelerating Academic Resource Discovery</p>
        </div>

        {/* Registration Card */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl p-8 md:p-10 transition-all hover:shadow-2xl">
          <div className="mb-8">
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2">Create Your Account</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Join the next generation of academic researchers and students.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-container text-error border border-error/20 rounded-xl text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 group">
                <label className="font-label-md text-label-md text-on-surface-variant group-focus-within:text-primary transition-colors" htmlFor="firstName">
                  First Name
                </label>
                <input 
                  id="firstName"
                  type="text" 
                  placeholder="John"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                  className="h-12 px-4 rounded-lg border border-outline focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none bg-surface-bright text-on-surface"
                />
              </div>
              <div className="flex flex-col gap-1 group">
                <label className="font-label-md text-label-md text-on-surface-variant group-focus-within:text-primary transition-colors" htmlFor="lastName">
                  Last Name
                </label>
                <input 
                  id="lastName"
                  type="text" 
                  placeholder="Doe"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                  className="h-12 px-4 rounded-lg border border-outline focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none bg-surface-bright text-on-surface"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-1 group">
              <label className="font-label-md text-label-md text-on-surface-variant group-focus-within:text-primary transition-colors" htmlFor="email">
                Student Email Address
              </label>
              <input 
                id="email"
                type="email" 
                placeholder="username@techspire.edu.np"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-12 px-4 rounded-lg border border-outline focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none bg-surface-bright text-on-surface"
              />
              
              {email.trim() && (
                <div className="mt-2 text-xs font-semibold flex items-center gap-1.5 transition-all duration-300">
                  {isInstitutional ? (
                    <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-lg border border-emerald-200/30 dark:border-emerald-900/30 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                      ✓ Institutional email detected — Free access enabled
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-lg border border-amber-200/30 dark:border-amber-900/30 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm font-bold">info</span>
                      External user — subscription required for full access
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1 group">
              <label className="font-label-md text-label-md text-on-surface-variant group-focus-within:text-primary transition-colors" htmlFor="password">
                Create Password
              </label>
              <input 
                id="password"
                type="password" 
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="h-12 px-4 rounded-lg border border-outline focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none bg-surface-bright text-on-surface"
              />
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start gap-3 py-2">
              <input 
                id="terms" 
                type="checkbox" 
                required
                disabled={loading}
                className="mt-1 w-5 h-5 rounded border-outline text-primary focus:ring-primary cursor-pointer accent-primary"
              />
              <label htmlFor="terms" className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer">
                I agree to the{' '}
                <a href="#" className="text-primary hover:underline font-medium">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary hover:underline font-medium">
                  Privacy Policy
                </a>, including the processing of my academic data.
              </label>
            </div>

            {/* Action Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  Register Account
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-outline-variant text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </section>

        {/* Footer Help */}
        <footer className="mt-8 flex justify-center gap-6 text-on-surface-variant">
          <a className="font-label-sm text-label-sm hover:text-primary transition-colors flex items-center gap-1" href="#">
            <span className="material-symbols-outlined text-[16px]">help</span> Help Center
          </a>
          <a className="font-label-sm text-label-sm hover:text-primary transition-colors flex items-center gap-1" href="#">
            <span className="material-symbols-outlined text-[16px]">language</span> Nepal (English)
          </a>
        </footer>
      </main>

      {/* Side Graphic (Desktop Only Floating Badge) */}
      <div className="hidden lg:flex fixed top-10 right-10 flex-col gap-4 animate-in slide-in-from-right-10 duration-1000 delay-300">
        <div className="glass-morphism border border-white/40 p-4 rounded-xl shadow-lg max-w-[280px] transition-transform duration-300 ease-out bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <span className="font-label-md text-label-md text-on-surface font-bold">Secure Access</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Your research and personal data are protected by enterprise-grade encryption standards.
          </p>
        </div>
        <div className="glass-morphism border border-white/40 p-4 rounded-xl shadow-lg max-w-[280px] transition-transform duration-300 ease-out bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <span className="material-symbols-outlined text-[18px]">school</span>
            </div>
            <span className="font-label-md text-label-md text-on-surface font-bold">Academic Network</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Connect with over 450+ global institutions and 2M+ peer-reviewed papers.
          </p>
        </div>
      </div>
    </div>
  )
}
