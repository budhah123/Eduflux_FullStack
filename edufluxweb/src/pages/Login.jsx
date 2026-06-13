import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle array of validation error messages or a single message string
        const errMsg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Login failed')
        throw new Error(errMsg)
      }

      showToast('Login completed successfully')
      setSuccess('Login successful! Redirecting to dashboard...')
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)

      setTimeout(() => {
        navigate('/dashboard')
      }, 1200)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-surface dark:from-surface-container-highest dark:to-background flex flex-col justify-center items-center px-4 py-12">
      {/* Logo */}
      <Link to="/" className="font-headline-sm text-headline-sm font-bold text-primary dark:text-inverse-primary flex items-center gap-2 mb-8 select-none">
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
        Eduflux
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-white dark:bg-surface-container p-8 rounded-3xl border border-outline-variant/50 academic-shadow">
        <h2 className="font-headline-md text-headline-md text-text-main dark:text-on-surface text-center mb-2">Welcome Back</h2>
        <p className="font-body-sm text-body-sm text-text-muted dark:text-on-surface-variant text-center mb-8">
          Sign in with your Techspire student account
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl text-body-sm flex items-center gap-2">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-label-sm font-label-sm text-text-main dark:text-on-surface mb-2" htmlFor="email">
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
              className="w-full px-4 py-3 rounded-lg border border-outline-variant/60 bg-transparent text-body-md focus:border-primary focus:outline-none dark:text-on-surface"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-label-sm font-label-sm text-text-main dark:text-on-surface" htmlFor="password">
                Password
              </label>
              <a href="#" className="text-label-sm text-primary dark:text-inverse-primary hover:underline">
                Forgot password?
              </a>
            </div>
            <input 
              id="password"
              type="password" 
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg border border-outline-variant/60 bg-transparent text-body-md focus:border-primary focus:outline-none dark:text-on-surface"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-on-primary rounded-xl font-headline-sm text-headline-sm hover:bg-primary-container transition-all active:scale-95 duration-150 shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing In...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-body-sm text-text-muted dark:text-on-surface-variant">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary dark:text-inverse-primary font-bold hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  )
}
