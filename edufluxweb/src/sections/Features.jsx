import FeatureCard from '../components/FeatureCard'

const featureList = [
  {
    icon: 'cloud_upload',
    title: 'Upload & Share',
    description:
      'Easily contribute to the community. Share your notes, previous exam questions, and helpful resources with peers in seconds.',
    bullets: ['Bulk file support', 'Category tagging'],
    accentColor: '#3525cd',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
  {
    icon: 'auto_awesome',
    title: 'AI Document Chat',
    description:
      "Don't just read—converse. Our AI analyzes your documents to answer complex questions and summarize long chapters instantly.",
    bullets: ['Intelligent summaries', 'Context-aware Q&A'],
    accentColor: '#712ae2',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    icon: 'account_balance',
    title: 'Institutional Access',
    description:
      'Tailored for Techspire. Access specialized departmental folders and university-wide resources with official login.',
    bullets: ['Secure SSO login', 'Dept. specific library'],
    accentColor: '#005338',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-700',
  },
]

export default function Features() {
  return (
    <section
      id="features"
      className="py-24 px-margin-mobile md:px-margin-desktop scroll-mt-16"
      style={{ background: 'linear-gradient(180deg, #f5f4ff 0%, #ffffff 100%)' }}
    >
      <div className="max-w-container-max mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-14 gap-6">
          <div className="max-w-xl">
            {/* Section badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-label-sm text-label-sm mb-5 select-none">
              <span
                className="material-symbols-outlined text-sm text-indigo-500"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              Designed for Students
            </div>

            <h2 className="font-headline-lg text-headline-lg text-text-main mb-4">
              Features built for{' '}
              <span className="gradient-text">academic success</span>
            </h2>
            <p className="font-body-md text-body-md text-text-muted">
              Streamline your study workflow with tools designed specifically for
              institutional resource management.
            </p>
          </div>

          <button
            id="features-view-all-btn"
            onClick={() =>
              alert(
                'Browse documents feature is located in the Document Showcase section below.'
              )
            }
            className="flex-shrink-0 text-primary font-label-md text-label-md flex items-center gap-1.5 hover:gap-3 transition-all duration-200 cursor-pointer font-semibold group"
          >
            View all features
            <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featureList.map((feat, idx) => (
            <FeatureCard
              key={idx}
              icon={feat.icon}
              title={feat.title}
              description={feat.description}
              bullets={feat.bullets}
              accentColor={feat.accentColor}
              iconBg={feat.iconBg}
              iconColor={feat.iconColor}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
