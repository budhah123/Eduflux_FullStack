import { useNavigate } from 'react-router-dom'

export default function Pricing() {
  const navigate = useNavigate()

  const freePlan = [
    'Unlimited Document Browsing',
    '5 Monthly Uploads',
    'Standard AI Support (Limited)',
    'Community Access',
  ]

  const premiumPlan = [
    'Unlimited Everything',
    'Full AI Document Interaction',
    'Priority Search Results',
    'Early Access to New Features',
    'Dedicated Support',
  ]

  return (
    <section
      id="pricing"
      className="py-24 px-margin-mobile md:px-margin-desktop scroll-mt-16 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #f5f4ff 0%, #ffffff 100%)' }}
    >
      {/* Decorative blob */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 80% 20%, rgba(79,70,229,0.08) 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-container-max mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-label-sm text-label-sm mb-5 select-none">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              payments
            </span>
            Transparent Pricing
          </div>
          <h2 className="font-headline-lg text-headline-lg text-text-main mb-4">
            Simple, Student-Friendly{' '}
            <span className="gradient-text">Pricing</span>
          </h2>
          <p className="font-body-md text-body-md text-text-muted max-w-2xl mx-auto">
            Get basic access for free or unlock the full power of AI-assisted learning
            with our premium plan.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">

          {/* ── Free Plan ── */}
          <div className="flex flex-col p-10 rounded-3xl bg-white border border-slate-200 academic-shadow hover:academic-shadow-lg hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300">
            <div>
              {/* Plan label */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-text-muted font-label-sm text-label-sm mb-4 select-none">
                <span className="material-symbols-outlined text-sm">school</span>
                Institutional Free
              </div>

              <h3 className="font-headline-md text-headline-md text-text-main mb-1">
                Free Plan
              </h3>
              <p className="font-body-sm text-body-sm text-text-muted mb-8">
                Everything you need to get started
              </p>

              {/* Price */}
              <div className="flex items-end gap-1 mb-8 select-none">
                <span className="font-display text-display text-text-main leading-none">
                  NPR 0
                </span>
                <span className="font-body-md text-body-md text-text-muted mb-1">
                  /mo
                </span>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-10">
                {freePlan.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-body-sm text-body-sm text-text-main">
                    <span
                      className="material-symbols-outlined text-xl text-indigo-500 flex-shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <button
              id="pricing-free-btn"
              className="w-full py-4 rounded-xl border-2 border-primary text-primary font-headline-sm text-headline-sm hover:bg-indigo-50 transition-all active:scale-95 duration-150 cursor-pointer mt-auto"
            >
              Current Plan
            </button>
          </div>

          {/* ── Premium Plan ── */}
          <div
            className="flex flex-col p-10 rounded-3xl relative overflow-hidden academic-shadow-lg hover:-translate-y-1 transition-all duration-300"
            style={{
              background:
                'linear-gradient(145deg, #3525cd 0%, #4f46e5 45%, #712ae2 100%)',
            }}
          >
            {/* "MOST POPULAR" badge */}
            <div
              className="absolute top-0 right-10 -translate-y-1/2 px-4 py-1.5 rounded-full font-label-sm text-label-sm font-bold shadow-lg select-none text-white z-10"
              style={{ background: '#EAA03F' }}
            >
              ✦ MOST POPULAR
            </div>

            {/* Decorative circles */}
            <div
              className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
            <div
              className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />

            <div className="relative z-10">
              {/* Plan label */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white font-label-sm text-label-sm mb-4 select-none">
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  workspace_premium
                </span>
                Unleash Full Potential
              </div>

              <h3 className="font-headline-md text-headline-md text-white mb-1">
                Premium Plan
              </h3>
              <p className="font-body-sm text-body-sm text-white/70 mb-8">
                For serious academic achievers
              </p>

              {/* Price */}
              <div className="flex items-end gap-1 mb-8 select-none">
                <span className="font-display text-display text-white leading-none">
                  NPR 299
                </span>
                <span className="font-body-md text-body-md text-white/70 mb-1">
                  /mo
                </span>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-10">
                {premiumPlan.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-body-sm text-body-sm text-white">
                    <span
                      className="material-symbols-outlined text-xl text-emerald-300 flex-shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="relative z-10 mt-auto">
              <button
                id="pricing-premium-btn"
                onClick={() => navigate('/register')}
                className="w-full py-4 rounded-xl bg-white text-primary font-headline-sm text-headline-sm hover:bg-indigo-50 hover:shadow-lg transition-all active:scale-95 duration-150 cursor-pointer mb-6 academic-shadow"
              >
                Upgrade to Premium
              </button>

              {/* Payment partners */}
              <div className="flex items-center justify-center gap-5 select-none">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center text-[11px] font-bold text-red-600">
                    e
                  </div>
                  <span className="text-white/80 font-label-sm text-label-sm">eSewa</span>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center text-[11px] font-bold text-purple-600">
                    K
                  </div>
                  <span className="text-white/80 font-label-sm text-label-sm">Khalti</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
