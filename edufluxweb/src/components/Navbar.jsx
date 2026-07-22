import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../services/api/apiClient';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  const getStoredToken = () =>
    sessionStorage.getItem('accessToken') ||
    localStorage.getItem('accessToken');

  const decodeToken = (token) => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(
        decodeURIComponent(
          window
            .atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''),
        ),
      );
      const expiryMs = payload.exp ? payload.exp * 1000 : null;
      if (expiryMs && expiryMs <= Date.now()) return null;
      return payload;
    } catch {
      return null;
    }
  };

  const buildProfileFromPayload = (payload) => {
    if (!payload) return null;
    const firstName =
      payload.firstName ||
      payload.name?.split(' ')?.[0] ||
      payload.username ||
      payload.email?.split('@')?.[0] ||
      'User';
    const lastName = payload.lastName || '';
    return {
      firstName,
      lastName,
      fullName: `${firstName}${lastName ? ` ${lastName}` : ''}`.trim(),
      email: payload.email || '',
      avatarUrl: payload.avatarUrl || payload.profilePicture || null,
    };
  };

  const initials = useMemo(() => {
    if (!userProfile?.fullName) return 'U';
    return userProfile.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [userProfile]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const token = getStoredToken();
      const payload = decodeToken(token);

      if (!token || !payload) {
        if (isMounted) {
          setUserProfile(null);
          setAuthLoading(false);
        }
        return;
      }

      try {
        const me = await apiClient.get('/auth/me');
        if (isMounted) {
          setUserProfile({
            firstName:
              me?.firstName ||
              me?.fullName?.split(' ')?.[0] ||
              payload.firstName ||
              payload.name?.split(' ')?.[0] ||
              payload.email?.split('@')?.[0] ||
              'User',
            lastName: me?.lastName || '',
            fullName:
              me?.fullName ||
              [me?.firstName, me?.lastName].filter(Boolean).join(' ') ||
              buildProfileFromPayload(payload).fullName,
            email: me?.email || payload.email || '',
            avatarUrl: me?.avatarUrl || null,
          });
        }
      } catch {
        if (isMounted) {
          setUserProfile(buildProfileFromPayload(payload));
        }
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  const handleLogout = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setMenuOpen(false);
    setUserProfile(null);
    setAuthLoading(false);
    navigate('/');
  };

  const scrollToSection = (e, id) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Features', sectionId: 'features' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'About', sectionId: 'footer' },
  ];

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
            ),
          )}
        </div>

        {/* Auth buttons */}
        <div
          className="flex items-center gap-4 min-w-[180px] justify-end"
          ref={menuRef}
        >
          {authLoading ? (
            <div className="h-10 w-[176px] rounded-lg bg-surface-container/80 animate-pulse" />
          ) : userProfile ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-3"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.fullName}
                    className="w-10 h-10 rounded-full object-cover border border-outline-variant"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-gradient text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {initials}
                  </div>
                )}
                <span className="font-label-md text-label-md text-on-surface-variant max-w-[120px] truncate">
                  {userProfile.firstName}
                </span>
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                  expand_more
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] w-52 rounded-xl border border-outline-variant bg-white shadow-xl overflow-hidden">
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/my-upload"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                  >
                    My Uploads
                  </Link>
                  <Link
                    to="/subscription"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                  >
                    Subscription
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-error hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                id="navbar-login-btn"
                className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                id="navbar-signup-btn"
                className="bg-brand-gradient text-white px-5 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 hover:scale-[1.02] transition-all active:scale-95 duration-200 academic-shadow"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
