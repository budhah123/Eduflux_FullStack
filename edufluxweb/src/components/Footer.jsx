import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer id="footer" className="bg-surface-dim dark:bg-surface-container-highest/60 pt-20 pb-10 border-t border-outline-variant/30">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Logo & Info */}
          <div className="col-span-1">
            <div className="font-headline-sm text-headline-sm font-bold text-primary dark:text-inverse-primary mb-6 flex items-center gap-2 select-none">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
              Eduflux
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-6">
              Revolutionizing academic resource sharing for modern students. Built with care for the Techspire community.
            </p>
            <div className="flex gap-4">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white dark:bg-surface-container-lowest flex items-center justify-center text-primary dark:text-inverse-primary academic-shadow hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all active:scale-95 duration-150"
                aria-label="Website"
              >
                <span className="material-symbols-outlined text-xl">public</span>
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white dark:bg-surface-container-lowest flex items-center justify-center text-primary dark:text-inverse-primary academic-shadow hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all active:scale-95 duration-150"
                aria-label="Share"
              >
                <span className="material-symbols-outlined text-xl">share</span>
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-white dark:bg-surface-container-lowest flex items-center justify-center text-primary dark:text-inverse-primary academic-shadow hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all active:scale-95 duration-150"
                aria-label="Email"
              >
                <span className="material-symbols-outlined text-xl">alternate_email</span>
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h5 className="font-label-md text-label-md text-text-main dark:text-on-surface font-bold mb-6">Platform</h5>
            <ul className="space-y-4">
              <li>
                <Link to="/dashboard" className="text-body-sm font-body-sm text-on-surface-variant hover:text-primary transition-colors">
                  Browse Documents
                </Link>
              </li>
              <li>
                <a href="#" className="text-body-sm font-body-sm text-on-surface-variant hover:text-primary transition-colors">
                  AI Features
                </a>
              </li>
              <li>
                <a href="#" className="text-body-sm font-body-sm text-on-surface-variant hover:text-primary transition-colors">
                  Upload Guide
                </a>
              </li>
              <li>
                <a href="#" className="text-body-sm font-body-sm text-on-surface-variant hover:text-primary transition-colors">
                  Safety Rules
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h5 className="font-label-md text-label-md text-text-main dark:text-on-surface font-bold mb-6">Company</h5>
            <ul className="space-y-4">
              <li>
                <a href="#" className="text-body-sm font-body-sm text-on-surface-variant hover:text-primary transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-body-sm font-body-sm text-on-surface-variant hover:text-primary transition-colors">
                  Success Stories
                </a>
              </li>
              <li>
                <a href="#" className="text-body-sm font-body-sm text-on-surface-variant hover:text-primary transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-body-sm font-body-sm text-on-surface-variant hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h5 className="font-label-md text-label-md text-text-main dark:text-on-surface font-bold mb-6">Legal</h5>
            <ul className="space-y-4">
              <li>
                <a href="#" className="text-body-sm font-body-sm text-on-surface-variant hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-body-sm font-body-sm text-on-surface-variant hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-body-sm font-body-sm text-on-surface-variant hover:text-primary transition-colors">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-body-sm font-body-sm text-on-surface-variant hover:text-primary transition-colors">
                  DMCA Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-outline-variant/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-label-sm font-label-sm text-on-surface-variant text-center md:text-left">
            © 2024 Eduflux Academic Hub. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 text-label-sm font-label-sm text-on-surface-variant select-none">
              <span className="material-symbols-outlined text-sm">language</span> English (Nepal)
            </span>
            <span className="flex items-center gap-1 text-label-sm font-label-sm text-on-surface-variant select-none">
              <span className="material-symbols-outlined text-sm">verified_user</span> Techspire Secure
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
