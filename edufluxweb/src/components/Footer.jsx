import { Link } from 'react-router-dom'

const footerLinks = {
  Platform: [
    { label: 'Browse Documents', to: '/dashboard' },
    { label: 'AI Features',      href: '#features' },
    { label: 'Upload Guide',     href: '#' },
    { label: 'Safety Rules',     href: '#' },
  ],
  Company: [
    { label: 'About Us',        href: '#' },
    { label: 'Success Stories', href: '#' },
    { label: 'Careers',         href: '#' },
    { label: 'Contact',         href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy',  href: '#' },
    { label: 'Terms of Service',href: '#' },
    { label: 'Cookie Policy',   href: '#' },
    { label: 'DMCA Policy',     href: '#' },
  ],
}

const socials = [
  { icon: 'public',           label: 'Website' },
  { icon: 'share',            label: 'Share' },
  { icon: 'alternate_email',  label: 'Email' },
]

export default function Footer() {
  return (
    <footer id="footer" className="relative overflow-hidden" style={{ background: '#0f0f1a' }}>
      {/* Top gradient accent strip */}
      <div className="h-1 w-full bg-brand-gradient" />

      {/* Decorative blobs */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[400px] pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 80% 0%, rgba(79,70,229,0.12) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[300px] pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 20% 100%, rgba(113,42,226,0.10) 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-16 pb-10">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

          {/* Brand column */}
          <div className="col-span-1">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-5 select-none">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #712ae2)' }}
              >
                <span
                  className="material-symbols-outlined text-xl text-white"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_stories
                </span>
              </div>
              <span className="font-headline-sm text-headline-sm font-bold text-white">
                Eduflux
              </span>
            </div>

            <p className="font-body-sm text-body-sm leading-relaxed mb-6" style={{ color: '#94a3b8' }}>
              Revolutionizing academic resource sharing for modern students. Built with care
              for the Techspire community.
            </p>

            {/* Social icons */}
            <div className="flex gap-3">
              {socials.map((s, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label={s.label}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      'linear-gradient(135deg, #3525cd, #712ae2)'
                    e.currentTarget.style.color = '#ffffff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                    e.currentTarget.style.color = '#94a3b8'
                  }}
                >
                  <span className="material-symbols-outlined text-xl">{s.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h5 className="font-label-md text-label-md text-white font-bold mb-6 uppercase tracking-wider">
                {heading}
              </h5>
              <ul className="space-y-4">
                {links.map((link, i) => (
                  <li key={i}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="font-body-sm text-body-sm transition-colors duration-200"
                        style={{ color: '#94a3b8' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="font-body-sm text-body-sm transition-colors duration-200"
                        style={{ color: '#94a3b8' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px mb-8" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-label-sm text-label-sm text-center md:text-left" style={{ color: '#64748b' }}>
            © {new Date().getFullYear()} Eduflux Academic Hub. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span
              className="flex items-center gap-1.5 font-label-sm text-label-sm select-none"
              style={{ color: '#64748b' }}
            >
              <span className="material-symbols-outlined text-sm">language</span>
              English (Nepal)
            </span>
            <span
              className="flex items-center gap-1.5 font-label-sm text-label-sm select-none"
              style={{ color: '#64748b' }}
            >
              <span className="material-symbols-outlined text-sm">verified_user</span>
              Techspire Secure
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
