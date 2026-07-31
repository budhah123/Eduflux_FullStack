import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { forgotPassword } from '../services/api/apiClient';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mousemove parallax effect matching Register & Login design
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await forgotPassword(email.trim());

      setSuccess('Check your email for the reset code');
      showToast('Check your email for the reset code', 'success');

      setTimeout(() => {
        navigate('/reset-password', { state: { email: email.trim() } });
      }, 1500);
    } catch (err) {
      if (err.status === 400 || (err.message && (err.message.toLowerCase().includes('not found') || err.message.toLowerCase().includes('exist')))) {
        setError('No account found with that email.');
        showToast('No account found with that email.', 'error');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
        showToast(err.message || 'Something went wrong. Please try again.', 'error');
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
        <div className="w-full max-w-[480px] z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              <h2 className="text-xl font-bold text-[#1E293B]">Forgot Password</h2>
              <p className="text-[#64748B] text-sm mt-2 text-center">
                Enter your registered email below to request a password reset code.
              </p>
            </div>

            {/* Error & Success Visual Feedback Box */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-[#ba1a1a] border border-red-200 rounded-xl text-sm flex items-center gap-2 animate-in fade-in duration-200">
                <span className="material-symbols-outlined text-lg">error</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-sm flex items-center gap-2 animate-in fade-in duration-200">
                <span className="material-symbols-outlined text-lg">
                  check_circle
                </span>
                <span>{success}</span>
              </div>
            )}

            {/* Request Form */}
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
                    disabled={loading || Boolean(success)}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                className="w-full py-3 bg-[#3525cd] text-white font-semibold text-sm rounded-lg shadow-lg shadow-[#3525cd]/20 hover:bg-[#3525cd]/90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                type="submit"
                disabled={loading || Boolean(success)}
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
                    <span>Sending Code...</span>
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>

            {/* Back to Login Link */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#3525cd] transition-colors"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back to Login
              </Link>
            </div>

            {/* Academic Notice */}
            <div className="mt-8 p-4 bg-[#3525cd]/5 border border-[#3525cd]/10 rounded-lg">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-[#3525cd] text-[20px]">
                  info
                </span>
                <div className="flex-1">
                  <p className="text-xs text-[#3525cd] leading-tight font-medium">
                    <span className="font-bold">Verification:</span> A 6-digit verification code will be sent to confirm your identity.
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
