import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const apiBaseUrl = (
    import.meta.env.VITE_API_URL || 'http://localhost:3000'
  ).replace(/\/$/, '');

  const initialEmail = location.state?.email || '';
  const initialMessage = location.state?.message || '';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (initialMessage) {
      showToast(initialMessage, 'success');
      // Clear location state so refreshing or navigating back won't re-trigger
      navigate(location.pathname, { replace: true, state: { email: initialEmail } });
    }
  }, [initialMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email.trim(), password }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        const errMsg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || 'Login failed';

        // Handle unverified email specific error
        if (
          errMsg.toLowerCase().includes('verify your email') ||
          errMsg.toLowerCase().includes('email before logging in') ||
          (response.status === 400 && errMsg.includes('verify'))
        ) {
          showToast('Please verify your email before logging in.', 'info');
          navigate('/verify-email', {
            state: { email: email.trim(), fromLogin: true },
          });
          return;
        }

        throw new Error(errMsg);
      }

      showToast('Login completed successfully');
      setSuccess('Login successful! Redirecting to dashboard...');
      sessionStorage.setItem('accessToken', data.accessToken);
      sessionStorage.setItem('refreshToken', data.refreshToken);

      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${apiBaseUrl}/auth/google/login`;
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
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#3525cd]/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#712ae2]/20 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Login Container */}
        <div className="w-full max-w-[480px] z-10">
          <div className="glass-card shadow-2xl rounded-2xl p-8 md:p-10 transition-all duration-300">
            {/* Brand Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-2 mb-6 select-none">
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
              <h2 className="text-xl font-bold text-[#1E293B]">Welcome Back</h2>
              <p className="text-[#64748B] text-sm mt-2 text-center">
                Manage your academic resources with precision.
              </p>
            </div>

            {/* Error & Success Visual Feedback Box */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-[#ba1a1a] border border-red-200 rounded-xl text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">
                  check_circle
                </span>
                <span>{success}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label
                  className="text-xs font-semibold text-slate-600 block"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    mail
                  </span>
                  <input
                    className="w-full pl-11 pr-4 py-3 bg-white border border-[#c7c4d8]/40 rounded-lg text-sm focus:border-[#3525cd] focus:ring-0 outline-none transition-all input-focus-ring"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@university.edu"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    className="text-xs font-semibold text-slate-600 block"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <a
                    className="text-xs text-[#3525cd] hover:underline transition-all font-medium"
                    href="#"
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    lock
                  </span>
                  <input
                    className="w-full pl-11 pr-12 py-3 bg-white border border-[#c7c4d8]/40 rounded-lg text-sm focus:border-[#3525cd] focus:ring-0 outline-none transition-all input-focus-ring"
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
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

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  className="w-4 h-4 text-[#3525cd] border-[#c7c4d8]/50 rounded focus:ring-[#3525cd]/20"
                  id="remember"
                  name="remember"
                  type="checkbox"
                />
                <label
                  className="ml-2 text-xs text-slate-500 select-none font-medium"
                  htmlFor="remember"
                >
                  Remember this device for 30 days
                </label>
              </div>

              {/* Submit Button */}
              <button
                className="w-full py-3 bg-[#3525cd] text-white font-semibold text-sm rounded-lg shadow-lg shadow-[#3525cd]/20 hover:bg-[#3525cd]/90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                type="submit"
                disabled={loading}
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
                    Authenticating...
                  </>
                ) : (
                  'Login to Dashboard'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#c7c4d8]/40"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-[#64748B] font-medium">
                  — OR —
                </span>
              </div>
            </div>

            {/* OAuth Section */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 border border-[#0F2C59]/15 bg-white text-[#0F2C59] font-semibold text-sm rounded-lg hover:bg-[#0F2C59]/5 active:scale-[0.98] transition-all duration-200 shadow-sm"
              >
                <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.9h5.5c-.2 1.1-1.4 3.3-5.5 3.3-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 4 1.5l2.7-2.6C16.9 2.7 14.7 1.7 12 1.7 6.8 1.7 2.5 5.9 2.5 11s4.3 9.3 9.5 9.3c5.5 0 9.2-3.9 9.2-9.1 0-.6-.1-1.1-.2-1.6H12z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.6 7.3l3.1 2.3C7.5 7.3 9.5 6 12 6c1.9 0 3.2.8 4 1.5l2.7-2.6C16.9 2.7 14.7 1.7 12 1.7 8 1.7 4.6 4 3.6 7.3z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 20.3c2.6 0 4.8-.9 6.5-2.4l-3-2.4c-.8.5-1.9 1-3.5 1-2.6 0-4.8-1.7-5.6-4.1l-3.1 2.4C4.4 17.9 7.8 20.3 12 20.3z"
                  />
                  <path
                    fill="#4285F4"
                    d="M21.2 11.3c0-.6-.1-1.1-.2-1.6H12v3.9h5.5c-.3 1.3-1.1 2.4-2 3.1l3 2.4c1.8-1.6 2.7-3.9 2.7-6.8z"
                  />
                </svg>
                Sign in with Google
              </button>
            </div>

            {/* Academic Notice */}
            <div className="mt-8 p-4 bg-[#3525cd]/5 border border-[#3525cd]/10 rounded-lg">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-[#3525cd] text-[20px]">
                  info
                </span>
                <div className="flex-1">
                  <p className="text-xs text-[#3525cd] leading-tight font-medium">
                    <span className="font-bold">Techspire Students:</span>{' '}
                    Please use your official university email{' '}
                    <span className="font-mono">@cps.edu.np</span> to access
                    research datasets.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white/70 text-xs">
            <p>© 2024 Eduflux Enterprise.</p>
            <div className="flex gap-6">
              <a className="hover:text-white transition-colors" href="#">
                Privacy Policy
              </a>
              <a className="hover:text-white transition-colors" href="#">
                Academic Terms
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
