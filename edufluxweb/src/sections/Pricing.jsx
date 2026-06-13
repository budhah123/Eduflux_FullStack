export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-surface-bright dark:bg-background relative scroll-mt-16">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center mb-16">
          <h2 className="font-headline-lg text-headline-lg text-text-main dark:text-on-surface mb-4">
            Simple, Student-Friendly Pricing
          </h2>
          <p className="font-body-md text-body-md text-text-muted dark:text-on-surface-variant max-w-2xl mx-auto">
            Get basic access for free or unlock the full power of AI-assisted learning with our premium plan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Free Plan */}
          <div className="p-10 rounded-3xl bg-white dark:bg-surface-container border border-outline-variant/50 academic-shadow flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
            <div>
              <h3 className="font-headline-md text-headline-md text-text-main dark:text-on-surface mb-2">
                Free Plan
              </h3>
              <p className="text-label-sm font-label-sm text-text-muted dark:text-on-surface-variant mb-6">
                Institutional Free
              </p>
              <div className="font-display text-display text-text-main dark:text-on-surface mb-8 select-none">
                NPR 0
                <span className="text-headline-sm font-body-md text-text-muted dark:text-on-surface-variant">/mo</span>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-body-sm font-body-sm text-text-main dark:text-on-surface">
                  <span className="material-symbols-outlined text-primary text-xl">check_circle</span> 
                  Unlimited Browsing
                </li>
                <li className="flex items-center gap-3 text-body-sm font-body-sm text-text-main dark:text-on-surface">
                  <span className="material-symbols-outlined text-primary text-xl">check_circle</span> 
                  5 Monthly Uploads
                </li>
                <li className="flex items-center gap-3 text-body-sm font-body-sm text-text-main dark:text-on-surface">
                  <span className="material-symbols-outlined text-primary text-xl">check_circle</span> 
                  Standard AI Support (Limited)
                </li>
              </ul>
            </div>
            <button className="w-full py-4 rounded-xl border border-primary text-primary dark:text-inverse-primary dark:border-inverse-primary/50 font-headline-sm text-headline-sm hover:bg-primary/5 dark:hover:bg-primary/10 transition-all active:scale-95 duration-150 cursor-pointer">
              Current Plan
            </button>
          </div>

          {/* Premium Plan */}
          <div className="p-10 rounded-3xl bg-primary text-on-primary dark:bg-surface-container-high dark:border dark:border-primary/30 academic-shadow flex flex-col justify-between relative transform md:scale-105 z-10 ring-4 ring-primary-container/20 hover:scale-[1.03] transition-transform duration-300">
            {/* Ribbon/Badge */}
            <div className="absolute top-0 right-10 -translate-y-1/2 bg-academic-gold text-on-tertiary-fixed px-4 py-1.5 rounded-full font-label-sm text-label-sm font-bold shadow-md select-none">
              MOST POPULAR
            </div>
            
            <div>
              <h3 className="font-headline-md text-headline-md mb-2">
                Premium Plan
              </h3>
              <p className="text-label-sm font-label-sm opacity-80 mb-6">
                Unleash Full Potential
              </p>
              <div className="font-display text-display mb-8 select-none">
                NPR 299
                <span className="text-headline-sm font-body-md opacity-80">/mo</span>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-body-sm font-body-sm">
                  <span className="material-symbols-outlined text-xl">verified</span> 
                  Unlimited Everything
                </li>
                <li className="flex items-center gap-3 text-body-sm font-body-sm">
                  <span className="material-symbols-outlined text-xl">verified</span> 
                  Full AI Document Interaction
                </li>
                <li className="flex items-center gap-3 text-body-sm font-body-sm">
                  <span className="material-symbols-outlined text-xl">verified</span> 
                  Priority Search Results
                </li>
                <li className="flex items-center gap-3 text-body-sm font-body-sm">
                  <span className="material-symbols-outlined text-xl">verified</span> 
                  Early Access to New Features
                </li>
              </ul>
            </div>

            <div>
              <button className="w-full py-4 rounded-xl bg-white text-primary font-headline-sm text-headline-sm hover:bg-surface-bright hover:shadow-lg transition-all active:scale-95 duration-150 academic-shadow mb-6 cursor-pointer">
                Upgrade to Premium
              </button>
              
              {/* Payment Partners */}
              <div className="flex items-center justify-center gap-4 grayscale opacity-70 select-none">
                <div className="flex items-center gap-1 font-bold text-xs">
                  <div className="w-6 h-6 bg-academic-red rounded-sm flex items-center justify-center text-[10px] text-white">e</div> 
                  eSewa
                </div>
                <div className="flex items-center gap-1 font-bold text-xs">
                  <div className="w-6 h-6 bg-secondary dark:bg-primary-container rounded-sm flex items-center justify-center text-[10px] text-white">K</div> 
                  Khalti
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
