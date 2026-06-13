import { useNavigate } from 'react-router-dom'

export default function Hero() {
  const navigate = useNavigate()

  const handleExploreClick = (e) => {
    e.preventDefault()
    const element = document.getElementById('showcase')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="pt-32 pb-20 px-margin-mobile md:px-margin-desktop bg-gradient-to-b from-white to-surface dark:from-surface-container-highest dark:to-background overflow-hidden">
      <div className="max-w-container-max mx-auto flex flex-col items-center text-center">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-container/10 border border-primary-container/20 text-primary dark:text-inverse-primary font-label-sm text-label-sm mb-6 animate-fade-in select-none">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
            colors_spark
          </span>
          Empowering Techspire Students to Excel
        </div>

        {/* Display Title */}
        <h1 className="font-display text-display max-w-4xl text-text-main dark:text-on-surface mb-6 tracking-tight leading-tight px-4 md:px-0">
          Access, Share & Chat with <span className="text-primary dark:text-inverse-primary italic">Academic Documents</span> — All in One Place
        </h1>

        {/* Description */}
        <p className="font-body-lg text-body-lg text-text-muted dark:text-on-surface-variant max-w-2xl mb-10 px-6">
          The ultimate companion for Techspire students. Manage notes, previous year questions, and research papers with an AI-powered assistant that knows your curriculum.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 px-6 w-full sm:w-auto">
          <button 
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto bg-primary text-on-primary px-8 py-4 rounded-xl font-headline-sm text-headline-sm academic-shadow hover:bg-primary-container hover:shadow-lg transition-all active:scale-95 duration-150 cursor-pointer"
          >
            Get Started for Free
          </button>
          <button 
            onClick={handleExploreClick}
            className="w-full sm:w-auto bg-white dark:bg-surface-container text-primary dark:text-inverse-primary border border-primary/20 px-8 py-4 rounded-xl font-headline-sm text-headline-sm academic-shadow hover:bg-surface-bright hover:shadow-lg transition-all active:scale-95 duration-150 cursor-pointer"
          >
            Explore Documents
          </button>
        </div>

        {/* Hero Illustration */}
        <div className="relative w-full max-w-5xl aspect-video mt-10 rounded-2xl overflow-hidden academic-shadow border border-outline-variant/50 group select-none">
          <img 
            alt="Eduflux Student Hub" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[8000ms]" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAf_ADgpVgFUQseGMLXuoD3pLgO2uVP4a8zUCv7OqsrZdq90AxempJiOWGIza5HpnUnXeot1ONRufN8KMzk7Rust3wTin3RKC33xHljJrjHjQ6OJk9RnKbrPmk11LVvlk4RPw835aSi3E2d_3xeeJjBnBPBQ7C71aGp4ADgwYEv0HIHYHfJQ-uZmVNLuRHhKKcVpgITCFZ1czjBwYbgdFkMWZB8ZWypRnvLnn3IlMffXktoM3iR7_gzBFoZDeVx4UgdyW59_yQSRT8b"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
          
          {/* Floating Elements */}
          <div className="absolute top-1/4 left-10 p-4 glass-card dark:bg-surface-container-lowest/80 rounded-xl animate-bounce shadow-xl hidden md:flex items-center gap-3 select-none text-text-main dark:text-on-surface">
            <span className="material-symbols-outlined text-primary dark:text-inverse-primary text-3xl">picture_as_pdf</span>
            <div>
              <p className="text-xs font-bold leading-none">CS101_Notes.pdf</p>
              <p className="text-[10px] text-text-muted mt-1">Ready for study</p>
            </div>
          </div>
          
          <div className="absolute bottom-1/4 right-10 p-4 glass-card dark:bg-surface-container-lowest/80 rounded-xl animate-pulse shadow-xl hidden md:flex items-center gap-3 select-none text-text-main dark:text-on-surface">
            <span className="material-symbols-outlined text-secondary text-3xl">auto_awesome</span>
            <div>
              <p className="text-xs font-bold leading-none">AI Summarizing...</p>
              <p className="text-[10px] text-text-muted mt-1 font-label-sm">Extracting key concepts</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
