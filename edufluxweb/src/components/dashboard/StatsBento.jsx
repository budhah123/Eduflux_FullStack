export default function StatsBento({ totalContributions, totalDownloads }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Total Contributions Card */}
      <div className="col-span-1 md:col-span-2 bg-primary text-on-primary p-6 rounded-2xl shadow-lg relative overflow-hidden group select-none">
        <div className="relative z-10">
          <p className="text-on-primary/80 font-label-md text-label-md mb-1">Total Contributions</p>
          <h2 className="font-display text-[40px] leading-none mb-4 font-bold">
            {totalContributions} <span className="text-headline-sm font-semibold">Documents</span>
          </h2>
          <div className="flex gap-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-label-sm font-label-sm font-semibold">
              Top 5% Contributor
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-label-sm font-label-sm font-semibold">
              Master Researcher
            </span>
          </div>
        </div>
        <span
          className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700 select-none"
          style={{ fontVariationSettings: "'FILL' 0" }}
        >
          upload_file
        </span>
      </div>

      {/* Total Downloads Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant flex flex-col justify-between select-none">
        <div>
          <span className="material-symbols-outlined text-academic-blue mb-4 text-2xl">download</span>
          <p className="text-text-muted font-label-md text-label-md">Total Downloads</p>
        </div>
        <p className="font-headline-lg text-headline-lg font-bold">{totalDownloads.toLocaleString()}</p>
      </div>

      {/* Avg. Rating Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant flex flex-col justify-between select-none">
        <div>
          <span className="material-symbols-outlined text-tertiary mb-4 text-2xl">star</span>
          <p className="text-text-muted font-label-md text-label-md">Avg. Rating</p>
        </div>
        <p className="font-headline-lg text-headline-lg font-bold">
          4.9<span className="text-body-sm text-text-muted ml-1">/5.0</span>
        </p>
      </div>
    </div>
  )
}
