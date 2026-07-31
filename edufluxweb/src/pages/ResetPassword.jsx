import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { forgotPassword, resetPassword } from '../services/api/apiClient';
import OtpInput from '../components/auth/OtpInput';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  // Pre-fill email from state or query params
  const initialEmail = location.state?.email || searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [token, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendSuccess, setResendSuccess] = useState('');

  // Mousemove parallax effect matching Login/Register
  useEffect(() => {
    const handleMouseMove = (e) => {
      const floaters = document.querySelectorAll('.glass-morphism-bg');
      const mouseX = e.clientX / window.innerWidth - 0.5;
      const mouseY = e.clientY / window.innerHeight - 0.5;

      floaters.forEach((el, index) => {
        const depth = (index + 1) * 15;
        el.style.transform = `translate(${mouseX * depth}px, ${mouseY * depth}px)`;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    setResending(true);
    setError('');
    setResendSuccess('');

    try {
      await forgotPassword(email.trim());
      setResendSuccess(`Reset code resent successfully to ${email.trim()}`);
      showToast('Reset code resent successfully!', 'success');
      setOtp(''); // clear OTP field
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
      showToast(err.message || 'Failed to resend code.', 'error');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!token || token.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (!password) {
      setError('Please enter a new password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setResendSuccess('');

    try {
      const response = await resetPassword(email.trim(), token, password);
      
      const msg = response?.message || 'Password reset successfully';
      setSuccess(`${msg}! Redirecting to login...`);
      showToast('Password reset successfully. Please log in with your new password.', 'success');

      setTimeout(() => {
        navigate('/login', { state: { email: email.trim() } });
      }, 2000);
    } catch (err) {
      if (err.status === 400 || (err.message && (err.message.toLowerCase().includes('token') || err.message.toLowerCase().includes('expired') || err.message.toLowerCase().includes('invalid')))) {
        setError('Invalid or expired code. Please request a new one.');
        showToast('Invalid or expired reset code.', 'error');
      } else {
        setError(err.message || 'Failed to reset password. Please try again.');
        showToast(err.message || 'Failed to reset password.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .gradient-mesh {
          background-color: #3525cd;
          background-image: 
            radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0px, transparent 50%), 
            radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0px, transparent 50%), 
            radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0px, transparent 50%);
          background-size: cover;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .input-focus-ring:focus {
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15);
        }
      `}</style>

      <main className="min-h-screen w-full flex items-center justify-center gradient-mesh px-4 py-12 relative overflow-hidden font-sans text-[#1E293B]">
        {/* Background Atmospheric Elements */}
        <div className="glass-morphism-bg absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#3525cd]/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="glass-morphism-bg absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#712ae2]/20 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Card Container */}
        <div className="w-full max-w-[500px] z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="glass-card shadow-2xl rounded-2xl p-8 md:p-10 transition-all duration-300">
            
            {/* Brand Header */}
            <div className="flex flex-col items-center mb-6">
              <div className="flex items-center gap-2 mb-4 select-none">
                <span
                  className="material-symbols-outlined text-[#3525cd] text-[40px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  school
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-[#3525cd]">
                  Eduflux
                </h1>
              </div>
              <h2 className="text-xl font-bold text-[#1E293B]">Reset Password</h2>
              <p className="text-[#64748B] text-sm mt-2 text-center">
                Please enter the 6-digit code sent to your email and choose your new password.
              </p>
            </div>

            {/* Email pre-fill display badge */}
            {email && (
              <div className="mb-6 bg-slate-50 border border-[#c7c4d8]/40 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-slate-400 text-lg">mail</span>
                  <div className="truncate">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Resetting for</span>
                    <span className="font-bold text-[#3525cd] truncate block">{email}</span>
                  </div>
                </div>
                <Link
                  to="/forgot-password"
                  state={{ email }}
                  className="text-xs text-[#3525cd] hover:underline font-semibold shrink-0"
                >
                  Change
                </Link>
              </div>
            )}

            {/* Error Feedback Box */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-[#ba1a1a] border border-red-200 rounded-xl text-xs flex flex-col gap-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">error</span>
                  <span className="font-semibold">{error}</span>
                </div>
                {error.includes('expired') && (
                  <div className="mt-1 flex gap-4">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="text-[#3525cd] hover:underline font-bold text-xs"
                    >
                      {resending ? 'Resending...' : 'Resend Code'}
                    </button>
                    <Link
                      to="/forgot-password"
                      state={{ email }}
                      className="text-slate-500 hover:text-slate-700 font-medium text-xs"
                    >
                      Request a new code
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Success Feedback Box */}
            {success && (
              <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-sm flex items-center gap-2 animate-in fade-in duration-200">
                <span className="material-symbols-outlined text-lg">
                  check_circle
                </span>
                <span>{success}</span>
              </div>
            )}

            {/* Resend Success Feedback Box */}
            {resendSuccess && !error && !success && (
              <div className="mb-6 p-3.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <span className="material-symbols-outlined text-blue-500 text-base shrink-0">
                  send
                </span>
                <span className="font-medium">{resendSuccess}</span>
              </div>
            )}

            {/* Reset Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Fallback Email field if not pre-filled */}
              {!initialEmail && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 block" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                      mail
                    </span>
                    <input
                      className="w-full pl-11 pr-4 py-3 bg-white border border-[#c7c4d8]/40 rounded-lg text-sm focus:border-[#3525cd] focus:ring-0 outline-none transition-all input-focus-ring"
                      id="email"
                      type="email"
                      placeholder="name@university.edu"
                      required
                      disabled={loading || Boolean(success)}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* OTP Code */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center block">
                  6-Digit Reset Code
                </label>
                <OtpInput
                  length={6}
                  value={token}
                  onChange={(code) => {
                    setOtp(code);
                    if (error) setError('');
                  }}
                  disabled={loading || Boolean(success)}
                  hasError={Boolean(error)}
                />
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label
                  className="text-xs font-semibold text-slate-600 block"
                  htmlFor="password"
                >
                  New Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    lock
                  </span>
                  <input
                    className="w-full pl-11 pr-12 py-3 bg-white border border-[#c7c4d8]/40 rounded-lg text-sm focus:border-[#3525cd] focus:ring-0 outline-none transition-all input-focus-ring"
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    disabled={loading || Boolean(success)}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#3525cd] transition-colors flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <label
                  className="text-xs font-semibold text-slate-600 block"
                  htmlFor="confirmPassword"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    lock
                  </span>
                  <input
                    className="w-full pl-11 pr-12 py-3 bg-white border border-[#c7c4d8]/40 rounded-lg text-sm focus:border-[#3525cd] focus:ring-0 outline-none transition-all input-focus-ring"
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    disabled={loading || Boolean(success)}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#3525cd] transition-colors flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                className="w-full py-3 bg-[#3525cd] text-white font-semibold text-sm rounded-lg shadow-lg shadow-[#3525cd]/20 hover:bg-[#3525cd]/90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                type="submit"
                disabled={loading || token.length !== 6 || Boolean(success)}
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
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            {/* Alternate Resend / Nav triggers */}
            <div className="mt-6 pt-5 border-t border-slate-200/80 flex flex-col items-center justify-center gap-2 text-center text-xs">
              <p className="text-slate-500 font-medium">
                Didn't receive the password reset code?
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || loading || Boolean(success) || !email}
                className="mt-1 flex items-center gap-1.5 font-bold text-[#3525cd] hover:text-[#3525cd]/80 disabled:text-slate-400 disabled:pointer-events-none transition-colors"
              >
                {resending ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-[#3525cd]"
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
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    <span>Resend Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Back to Forgot Password */}
            <div className="mt-6 text-center">
              <Link
                to="/forgot-password"
                state={{ email }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#3525cd] transition-colors"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Request new code
              </Link>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="mt-8 text-center text-xs text-slate-400">
            <p>© {new Date().getFullYear()} Eduflux Enterprise. Academic Portal.</p>
          </div>
        </div>
      </main>
    </>
  );
}
