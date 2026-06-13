export default function HowItWorks() {
  const steps = [
    {
      num: '1',
      title: 'Register',
      desc: 'Sign up with your Techspire student ID to join the academic network.',
      bgClass: 'bg-primary text-on-primary'
    },
    {
      num: '2',
      title: 'Upload/Browse',
      desc: 'Contribute your documents or browse our extensive library of resources.',
      bgClass: 'bg-secondary text-on-secondary'
    },
    {
      num: '3',
      title: 'Chat',
      desc: 'Ask questions directly to the AI to master your subjects in record time.',
      bgClass: 'bg-tertiary-fixed text-on-tertiary-fixed'
    }
  ]

  return (
    <section className="py-24 bg-surface-container-low dark:bg-surface-container/30 border-y border-outline-variant/50">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <h2 className="font-headline-lg text-headline-lg text-center text-text-main dark:text-on-surface mb-16">
          The Journey to Better Grades
        </h2>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start gap-12">
          {/* Progress Line (Desktop Only) */}
          <div className="hidden md:block absolute top-12 left-24 right-24 h-0.5 bg-outline-variant/40 z-0"></div>
          
          {/* Steps */}
          {steps.map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center flex-1 w-full">
              <div className={`w-24 h-24 rounded-full ${step.bgClass} flex items-center justify-center font-display text-headline-lg academic-shadow mb-6 select-none hover:scale-105 transition-transform duration-300`}>
                {step.num}
              </div>
              <h4 className="font-headline-sm text-headline-sm text-text-main dark:text-on-surface mb-2 font-semibold">
                {step.title}
              </h4>
              <p className="font-body-sm text-body-sm text-text-muted dark:text-on-surface-variant max-w-[240px]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
