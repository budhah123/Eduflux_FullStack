export default function FeatureCard({ icon, title, description, bullets, iconColorClass, iconBgClass }) {
  return (
    <div className="group p-8 rounded-3xl bg-white dark:bg-surface-container border border-outline-variant/50 academic-shadow hover:border-primary hover:scale-[1.01] transition-all duration-300">
      <div className={`w-14 h-14 rounded-2xl ${iconBgClass} flex items-center justify-center ${iconColorClass} mb-6 group-hover:scale-110 transition-transform`}>
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-text-main dark:text-on-surface mb-3">
        {title}
      </h3>
      <p className="font-body-md text-body-md text-text-muted dark:text-on-surface-variant mb-6">
        {description}
      </p>
      <ul className="space-y-3">
        {bullets.map((bullet, idx) => (
          <li key={idx} className="flex items-center gap-2 text-label-sm font-label-sm text-text-main dark:text-on-surface">
            <span className="material-symbols-outlined text-secondary text-lg">check_circle</span> 
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  )
}
