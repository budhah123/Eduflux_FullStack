export default function DocumentCard({
  title,
  category,
  uploader,
  uploaderBg,
  categoryBg,
  categoryText,
  icon,
  downloads,
  views,
}) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-100 overflow-hidden academic-shadow hover:academic-shadow-lg hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 flex flex-col">
      {/* Preview area */}
      <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center relative select-none overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle, #c7c4d8 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <span
          className="material-symbols-outlined text-[72px] text-slate-300 group-hover:text-indigo-300 group-hover:scale-110 transition-all duration-300 relative z-10"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>

        {/* Category badge */}
        <div
          className={`absolute top-3 left-3 px-2.5 py-1 ${categoryBg} ${categoryText} rounded-full font-label-sm text-label-sm z-10 border border-current/10`}
        >
          {category}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h4
          className="font-headline-sm text-headline-sm text-text-main mb-2 line-clamp-2 group-hover:text-primary transition-colors"
          title={title}
        >
          {title}
        </h4>
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`w-6 h-6 rounded-full ${uploaderBg} flex items-center justify-center text-[10px] font-bold text-white uppercase flex-shrink-0`}
          >
            {uploader.charAt(0)}
          </div>
          <span className="text-label-sm font-label-sm text-text-muted truncate">
            {uploader}
          </span>
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center text-label-sm font-label-sm text-text-muted pt-4 border-t border-slate-100 mt-auto">
          <span className="flex items-center gap-1 select-none">
            <span className="material-symbols-outlined text-sm">download</span>
            {downloads}
          </span>
          <span className="flex items-center gap-1 select-none">
            <span className="material-symbols-outlined text-sm">visibility</span>
            {views}
          </span>
        </div>
      </div>
    </div>
  )
}
