import { useNavigate } from 'react-router-dom'

export default function Hero() {
  const navigate = useNavigate()

  const handleExploreClick = (e) => {
    e.preventDefault()
    const element = document.getElementById('showcase')
    if (element) element.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className="relative pt-32 pb-24 px-margin-mobile md:px-margin-desktop overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-[#f0eeff]" />
      {/* Decorative blobs */}
      <div
        className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #c3c0ff 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #d2bbff 0%, transparent 70%)' }}
      />

      <div className="relative max-w-container-max mx-auto flex flex-col items-center text-center">

        {/* Animated Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-label-sm text-label-sm mb-8 animate-fade-in select-none"
          style={{ animationDelay: '0ms' }}
        >
          <span
            className="material-symbols-outlined text-sm text-indigo-500"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          Empowering Techspire Students to Excel
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse-soft" />
        </div>

        {/* Display Title */}
        <h1
          className="font-display max-w-4xl text-text-main mb-6 tracking-tight leading-tight px-4 md:px-0 animate-slide-up"
          style={{
            fontSize: 'clamp(2rem, 5vw, 48px)',
            lineHeight: '1.15',
            animationDelay: '80ms',
          }}
        >
          Access, Share &amp; Chat with{' '}
          <span
            className="gradient-text"
            style={{ fontStyle: 'italic' }}
          >
            Academic Documents
          </span>{' '}
          — All in One Place
        </h1>

        {/* Description */}
        <p
          className="font-body-lg text-body-lg text-text-muted max-w-2xl mb-10 px-6 animate-slide-up"
          style={{ animationDelay: '160ms' }}
        >
          The ultimate companion for Techspire students. Manage notes, previous year
          questions, and research papers with an AI-powered assistant that knows your
          curriculum.
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 mb-20 px-4 w-full sm:w-auto animate-slide-up"
          style={{ animationDelay: '240ms' }}
        >
          <button
            id="hero-get-started-btn"
            onClick={() => navigate('/register')}
            className="group w-full sm:w-auto bg-brand-gradient text-white px-8 py-4 rounded-xl font-headline-sm text-headline-sm academic-shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all active:scale-95 duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            Get Started for Free
            <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
          <button
            id="hero-explore-btn"
            onClick={handleExploreClick}
            className="w-full sm:w-auto bg-white text-primary border-2 border-primary/30 px-8 py-4 rounded-xl font-headline-sm text-headline-sm academic-shadow hover:border-primary hover:bg-indigo-50 transition-all active:scale-95 duration-200 cursor-pointer"
          >
            Explore Documents
          </button>
        </div>

        {/* Stats Row */}
        <div
          className="flex flex-wrap items-center justify-center gap-8 mb-16 animate-fade-in"
          style={{ animationDelay: '320ms' }}
        >
          {[
            { value: '2,400+', label: 'Documents' },
            { value: '1,800+', label: 'Students' },
            { value: '95%',    label: 'Satisfaction' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center select-none">
              <span className="font-headline-md text-headline-md text-primary font-bold">
                {stat.value}
              </span>
              <span className="font-label-sm text-label-sm text-text-muted">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Hero Illustration */}
        <div
          className="relative w-full max-w-5xl rounded-2xl overflow-hidden border border-outline-variant/40 animate-fade-in"
          style={{
            animationDelay: '400ms',
            boxShadow: '0 24px 60px -12px rgba(53,37,205,0.20), 0 8px 24px -4px rgba(0,0,0,0.10)',
          }}
        >
          {/* Gradient overlay top */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-brand-gradient z-10" />

          {/* App screenshot / mockup */}
          <div
            className="w-full bg-[#1e1f2e] flex items-center justify-start px-4 py-3 gap-2"
            aria-hidden
          >
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="flex-1 mx-4 h-6 rounded-full bg-white/10 flex items-center px-3">
              <span className="text-white/50 text-xs font-mono">app.eduflux.np/dashboard</span>
            </div>
          </div>

          <img
            alt="Eduflux Student Dashboard"
            className="w-full h-auto object-cover block"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAf_ADgpVgFUQseGMLXuoD3pLgO2uVP4a8zUCv7OqsrZdq90AxempJiOWGIza5HpnUnXeot1ONRufN8KMzk7Rust3wTin3RKC33xHljJrjHjQ6OJk9RnKbrPmk11LVvlk4RPw835aSi3E2d_3xeeJjBnBPBQ7C71aGp4ADgwYEv0HIHYHfJQ-uZmVNLuRHhKKcVpgITCFZ1czjBwYbgdFkMWZB8ZWypRnvLnn3IlMffXktoM3iR7_gzBFoZDeVx4UgdyW59_yQSRT8b"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />

          {/* Floating card — PDF */}
          <div
            className="absolute top-16 left-6 glass-card rounded-xl p-3.5 flex items-center gap-3 animate-float academic-shadow hidden md:flex select-none z-20"
            style={{ animationDelay: '0ms' }}
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-2xl">picture_as_pdf</span>
            </div>
            <div>
              <p className="text-xs font-bold text-text-main leading-none">CS101_Notes.pdf</p>
              <p className="text-[10px] text-text-muted mt-1">Ready for study · 2.4 MB</p>
            </div>
          </div>

          {/* Floating card — AI */}
          <div
            className="absolute bottom-16 right-6 glass-card rounded-xl p-3.5 flex items-center gap-3 animate-float-slow academic-shadow hidden md:flex select-none z-20"
            style={{ animationDelay: '500ms' }}
          >
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
              <span
                className="material-symbols-outlined text-secondary text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-text-main leading-none">AI Summarizing...</p>
              <p className="text-[10px] text-text-muted mt-1">Extracting key concepts</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
