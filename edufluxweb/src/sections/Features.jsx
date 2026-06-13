import FeatureCard from '../components/FeatureCard'

export default function Features() {
  const featureList = [
    {
      icon: 'cloud_upload',
      title: 'Upload & Share',
      description: 'Easily contribute to the community. Share your notes, previous exam questions, and helpful resources with peers in seconds.',
      bullets: ['Bulk file support', 'Category tagging'],
      iconBgClass: 'bg-primary/10',
      iconColorClass: 'text-primary'
    },
    {
      icon: 'auto_awesome',
      title: 'AI Document Chat',
      description: "Don't just read—converse. Our AI analyzes your documents to answer complex questions and summarize long chapters instantly.",
      bullets: ['Intelligent summaries', 'Context-aware Q&A'],
      iconBgClass: 'bg-secondary/10',
      iconColorClass: 'text-secondary'
    },
    {
      icon: 'account_balance',
      title: 'Institutional Access',
      description: 'Tailored for Techspire. Access specialized departmental folders and university-wide resources with official login.',
      bullets: ['Secure SSO login', 'Dept. specific library'],
      iconBgClass: 'bg-tertiary/10',
      iconColorClass: 'text-tertiary'
    }
  ]

  return (
    <section id="features" className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto scroll-mt-16">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
        <div className="max-w-xl">
          <h2 className="font-headline-lg text-headline-lg text-text-main dark:text-on-surface mb-4">
            Features built for academic success
          </h2>
          <p className="font-body-md text-body-md text-text-muted dark:text-on-surface-variant">
            Streamline your study workflow with tools designed specifically for institutional resource management.
          </p>
        </div>
        <button 
          onClick={() => alert('Browse documents feature is located in the Document Showcase section below.')}
          className="text-primary dark:text-inverse-primary font-label-md text-label-md flex items-center gap-1 hover:gap-2 transition-all cursor-pointer font-semibold"
        >
          View all features <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>
      
      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {featureList.map((feat, idx) => (
          <FeatureCard
            key={idx}
            icon={feat.icon}
            title={feat.title}
            description={feat.description}
            bullets={feat.bullets}
            iconBgClass={feat.iconBgClass}
            iconColorClass={feat.iconColorClass}
          />
        ))}
      </div>
    </section>
  )
}
