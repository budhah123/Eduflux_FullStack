import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import OtpInput from '../components/auth/OtpInput'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()

  // Retrieve initial email from location state or query parameter
  const initialEmail = location.state?.email || searchParams.get('email') || ''
  
  const [email, setEmail] = useState(initialEmail)
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendSuccess, setResendSuccess] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // Notice from login attempt if user was redirected from login
  const fromLoginNotice = location.state?.fromLogin

  // Cooldown timer countdown effect
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Mousemove parallax effect matching Register & Login design
  useEffect(() => {
    const handleMouseMove = (e) => {
      const floaters = document.querySelectorAll('.glass-morphism-bg')
      const mouseX = e.clientX / window.innerWidth - 0.5
      const mouseY = e.clientY / window.innerHeight - 0.5

      floaters.forEach((el, index) => {
        const depth = (index + 1) * 15
        el.style.transform = `translate(${mouseX * depth}px, ${mouseY * depth}px)`
      })
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleVerify = async (codeToVerify = otp) => {
    if (!email.trim()) {
      setError('Please provide a valid email address.')
      return
    }

    if (!codeToVerify || codeToVerify.length !== 6) {
      setError('Please enter all 6 digits of the verification code.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setResendSuccess('')

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/verify-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            token: codeToVerify,
            authTokenType: 'EMAIL_VERIFICATION_TOKEN',
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        const errMsg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || 'Invalid or expired verification code.'
        throw new Error(errMsg)
      }

      const successMsg = data.message || 'Email verified successfully!'
      setSuccess(`${successMsg} Redirecting to login...`)
      showToast('Email verified successfully! You can now log in.', 'success')

      setTimeout(() => {
        navigate('/login', { state: { email: email.trim(), message: 'Email verified! Please sign in to your account.' } })
      }, 1500)
    } catch (err) {
      setError(err.message)
      showToast(err.message, 'error')
      // Clear OTP digits on error so user can re-try cleanly
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email.trim()) {
      setError('Please enter a valid email address first.')
      return
    }

    if (cooldown > 0 || resending) return

    setResending(true)
    setError('')
    setResendSuccess('')

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/resend-verification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email.trim() }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        const errMsg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || 'Failed to resend verification code.'
        throw new Error(errMsg)
      }

      const resendMsg = data.message || 'Verification code resent successfully!'
      setResendSuccess(`Verification code sent to ${email.trim()}`)
      showToast(`Verification code sent to ${email.trim()}`, 'info')
      setCooldown(60) // 60 seconds cooldown
    } catch (err) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setResending(false)
    }
  }

  // Auto-submit when user finishes entering 6 digits
  const handleOtpComplete = (code) => {
    setOtp(code)
    handleVerify(code)
  }

  return (
    <>
      <style>{`
        .space-grotesk {
          font-family: 'Space Grotesk', sans-serif;
        }
        .eduflux-navy-bg {
          background-color: #0F2C59;
          background-image: 
            radial-gradient(at 10% 10%, rgba(245, 166, 35, 0.12) 0px, transparent 40%),
            radial-gradient(at 90% 90%, rgba(53, 37, 205, 0.25) 0px, transparent 50%),
            radial-gradient(at 50% 50%, rgba(15, 44, 89, 0.95) 0px, transparent 100%);
        }
        .glass-card-navy {
          background: rgba(255, 255, 255, 0.97);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
      `}</style>

      <main className="min-h-screen w-full flex items-center justify-center eduflux-navy-bg px-4 py-12 relative overflow-hidden font-sans text-slate-800">
        {/* Background Ambient Glow Elements */}
        <div className="glass-morphism-bg absolute top-[-10%] right-[-5%] w-[450px] h-[450px] bg-[#F5A623]/15 rounded-full blur-[130px] pointer-events-none transition-transform duration-700"></div>
        <div className="glass-morphism-bg absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#3525cd]/25 rounded-full blur-[140px] pointer-events-none transition-transform duration-700"></div>

        <div className="w-full max-w-[500px] z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Top Brand Link */}
          <div className="flex flex-col items-center mb-6 text-center">
            <Link
              to="/"
              className="mb-3 flex items-center justify-center w-14 h-14 bg-[#0F2C59] text-white rounded-2xl shadow-xl shadow-[#0F2C59]/30 hover:scale-105 active:scale-95 transition-all border border-[#F5A623]/30"
            >
              <span className="material-symbols-outlined text-[32px] text-[#F5A623]">
                mark_email_read
              </span>
            </Link>
            <h1 className="space-grotesk text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Eduflux
            </h1>
            <p className="text-slate-300 text-xs mt-1 font-medium">
              Academic Resource Access & Verification
            </p>
          </div>

          {/* Verification Card */}
          <div className="glass-card-navy shadow-2xl rounded-2xl p-8 md:p-10 border border-white/40">
            {/* Header info */}
            <div className="text-center mb-6">
              <h2 className="space-grotesk text-2xl font-bold text-[#0F2C59] tracking-tight">
                Verify Your Email
              </h2>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                We've sent a 6-digit confirmation code to your email address.
              </p>
            </div>

            {/* Notice if redirected from unverified login attempt */}
            {fromLoginNotice && !error && !success && (
              <div className="mb-6 p-4 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-xl text-xs flex items-start gap-2.5 shadow-sm">
                <span className="material-symbols-outlined text-amber-600 text-lg shrink-0 mt-0.5">
                  warning
                </span>
                <div>
                  <span className="font-bold block">Verification Required</span>
                  Please enter the OTP sent to your email to activate your account before logging in.
                </div>
              </div>
            )}

            {/* Email Address Display / Edit Box */}
            <div className="mb-6 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
              {isEditingEmail ? (
                <div className="flex-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-lg">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-[#0F2C59] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (email.trim()) setIsEditingEmail(false)
                    }}
                    className="text-xs bg-[#0F2C59] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#0F2C59]/90 transition-colors"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#0F2C59]/10 text-[#0F2C59] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-base">
                        mark_email_unread
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold uppercase text-slate-400 block tracking-wider">
                        Code sent to
                      </span>
                      <span className="text-xs font-bold text-[#0F2C59] truncate block">
                        {email || 'No email specified'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(true)}
                    className="text-xs text-[#0F2C59] hover:text-[#F5A623] font-semibold underline underline-offset-2 transition-colors shrink-0"
                  >
                    Change
                  </button>
                </>
              )}
            </div>

            {/* Inline Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                <span className="material-symbols-outlined text-red-500 text-lg shrink-0">
                  error
                </span>
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Inline Success Alert */}
            {success && (
              <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                <span className="material-symbols-outlined text-emerald-500 text-lg shrink-0">
                  check_circle
                </span>
                <span className="font-semibold">{success}</span>
              </div>
            )}

            {/* Inline Resend Success Alert */}
            {resendSuccess && !error && !success && (
              <div className="mb-6 p-3.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <span className="material-symbols-outlined text-blue-500 text-base shrink-0">
                  send
                </span>
                <span className="font-medium">{resendSuccess}</span>
              </div>
            )}

            {/* OTP Input Component */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleVerify()
              }}
            >
              <div className="my-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center block mb-1">
                  Enter 6-Digit Code
                </label>
                <OtpInput
                  length={6}
                  value={otp}
                  onChange={(code) => {
                    setOtp(code)
                    if (error) setError('')
                  }}
                  onComplete={handleOtpComplete}
                  disabled={loading || Boolean(success)}
                  hasError={Boolean(error)}
                />
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || otp.length !== 6 || Boolean(success)}
                className="w-full mt-4 py-3.5 bg-[#0F2C59] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#0F2C59]/25 hover:bg-[#0F2C59]/90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg text-[#F5A623]">
                      verified
                    </span>
                    <span>Verify Email</span>
                  </>
                )}
              </button>
            </form>

            {/* Resend Section */}
            <div className="mt-6 pt-5 border-t border-slate-200/80 flex flex-col items-center justify-center gap-2 text-center text-xs">
              <p className="text-slate-500 font-medium">
                Didn't receive the verification code? Check your spam folder or resend.
              </p>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={cooldown > 0 || resending || loading || Boolean(success)}
                className="mt-1 flex items-center gap-1.5 font-bold text-[#0F2C59] hover:text-[#F5A623] disabled:text-slate-400 disabled:pointer-events-none transition-colors"
              >
                {resending ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-[#0F2C59]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Resending code...</span>
                  </>
                ) : cooldown > 0 ? (
                  <>
                    <span className="material-symbols-outlined text-sm">timer</span>
                    <span>Resend code in {cooldown}s</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    <span>Resend Verification Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Back to Login Link */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0F2C59] transition-colors"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back to Login
              </Link>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="mt-8 text-center text-xs text-slate-400">
            <p>© {new Date().getFullYear()} Eduflux Enterprise. Academic Verification Hub.</p>
          </div>
        </div>
      </main>
    </>
  )
}
