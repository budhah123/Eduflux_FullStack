import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const REDIRECT_DELAY_MS = 900;
const ERROR_REDIRECT_DELAY_MS = 1800;

export default function GoogleAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Signing you in...');

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (!accessToken || !refreshToken) {
      setStatus('error');
      setMessage('Google sign-in failed. Redirecting you back to login...');

      const timer = window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, ERROR_REDIRECT_DELAY_MS);

      return () => window.clearTimeout(timer);
    }

    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('refreshToken', refreshToken);

    setStatus('success');
    setMessage('Google sign-in successful. Redirecting to your dashboard...');

    const timer = window.setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, REDIRECT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [navigate, searchParams]);

  const isError = status === 'error';

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#F4F7FB] px-4 py-12 font-sans text-[#0F2C59]">
      <div className="w-full max-w-md rounded-3xl border border-[#0F2C59]/10 bg-white shadow-[0_24px_80px_rgba(15,44,89,0.12)] p-8 md:p-10 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#0F2C59]/10 text-[#0F2C59]">
          {isError ? (
            <span className="material-symbols-outlined text-[34px]">error</span>
          ) : (
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F2C59]/20 border-t-[#0F2C59]" />
          )}
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#0F2C59]">
          {isError ? 'Authentication failed' : 'Signing you in'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>

        {!isError && (
          <div className="mt-8 rounded-2xl bg-[#0F2C59]/5 px-4 py-3 text-sm text-[#0F2C59]">
            Please wait while we finish setting up your session.
          </div>
        )}
      </div>
    </main>
  );
}
