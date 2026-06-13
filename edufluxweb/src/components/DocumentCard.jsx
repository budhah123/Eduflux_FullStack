export default function DocumentCard({ title, category, uploader, uploaderBg, categoryBg, categoryText, icon, downloads, views }) {
  return (
    <div className="group bg-white dark:bg-surface-container rounded-2xl border border-outline-variant/50 overflow-hidden academic-shadow hover:scale-[1.02] hover:border-primary/50 transition-all duration-300 flex flex-col justify-between">
      <div>
        <div className="aspect-[4/3] bg-surface-container-low dark:bg-surface-container-high flex items-center justify-center relative select-none">
          <span className="material-symbols-outlined text-6xl text-primary/30 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </span>
          <div className={`absolute top-3 left-3 px-3 py-1 ${categoryBg} ${categoryText} rounded-full font-label-sm text-label-sm`}>
            {category}
          </div>
        </div>
        <div className="p-6">
          <h4 className="font-headline-sm text-headline-sm text-text-main dark:text-on-surface mb-2 truncate group-hover:text-primary transition-colors" title={title}>
            {title}
          </h4>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-6 h-6 rounded-full ${uploaderBg} flex items-center justify-center text-[10px] font-bold text-white uppercase`}>
              {uploader.split(' ').pop().charAt(0)}
            </div>
            <span className="text-label-sm font-label-sm text-text-muted dark:text-on-surface-variant">
              Uploaded by {uploader}
            </span>
          </div>
        </div>
      </div>
      <div className="p-6 pt-0">
        <div className="flex justify-between items-center text-label-sm font-label-sm text-text-muted dark:text-on-surface-variant pt-4 border-t border-outline-variant/30">
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
