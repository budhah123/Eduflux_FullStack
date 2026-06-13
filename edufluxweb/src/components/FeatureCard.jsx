export default function FeatureCard({ icon, title, description, bullets, accentColor, iconBg, iconColor }) {
  return (
    <div className="group relative p-8 rounded-2xl bg-white border border-slate-100 academic-shadow hover:academic-shadow-lg hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 overflow-hidden flex flex-col">
      {/* Hover gradient tint */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 rounded-2xl`}
        style={{ background: accentColor || '#3525cd' }}
      />

      {/* Icon */}
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ${iconBg}`}
      >
        <span
          className={`material-symbols-outlined text-3xl ${iconColor}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>

      {/* Text */}
      <h3 className="font-headline-sm text-headline-sm text-text-main mb-3">
        {title}
      </h3>
      <p className="font-body-md text-body-md text-text-muted mb-6 flex-grow">
        {description}
      </p>

      {/* Bullets */}
      <ul className="space-y-3">
        {bullets.map((bullet, idx) => (
          <li key={idx} className="flex items-center gap-2.5 text-label-sm font-label-sm text-text-main">
            <span
              className={`material-symbols-outlined text-lg flex-shrink-0 ${iconColor}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            {bullet}
          </li>
        ))}
      </ul>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: accentColor || '#3525cd' }}
      />
    </div>
  )
}
