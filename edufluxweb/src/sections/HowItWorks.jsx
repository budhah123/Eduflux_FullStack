const steps = [
  {
    num: '01',
    icon: 'person_add',
    title: 'Register',
    desc: 'Sign up with your Techspire student ID to join the academic network.',
    gradient: 'linear-gradient(135deg, #3525cd 0%, #4f46e5 100%)',
    bgLight: 'bg-indigo-50',
    ring: 'ring-indigo-200',
  },
  {
    num: '02',
    icon: 'cloud_upload',
    title: 'Upload / Browse',
    desc: 'Contribute your documents or browse our extensive library of resources.',
    gradient: 'linear-gradient(135deg, #712ae2 0%, #8a4cfc 100%)',
    bgLight: 'bg-violet-50',
    ring: 'ring-violet-200',
  },
  {
    num: '03',
    icon: 'auto_awesome',
    title: 'Chat with AI',
    desc: 'Ask questions directly to the AI to master your subjects in record time.',
    gradient: 'linear-gradient(135deg, #005338 0%, #006e4b 100%)',
    bgLight: 'bg-emerald-50',
    ring: 'ring-emerald-200',
  },
]

export default function HowItWorks() {
  return (
    <section
      className="py-24 px-margin-mobile md:px-margin-desktop"
      style={{ background: '#ffffff' }}
    >
      <div className="max-w-container-max mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-label-sm text-label-sm mb-5 select-none">
            <span
              className="material-symbols-outlined text-sm text-indigo-500"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              route
            </span>
            3 Easy Steps
          </div>
          <h2 className="font-headline-lg text-headline-lg text-text-main">
            The Journey to{' '}
            <span className="gradient-text">Better Grades</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="relative flex flex-col md:flex-row justify-between items-start gap-8 md:gap-6">
          {/* Connector line (desktop only) */}
          <div
            className="hidden md:block absolute top-[52px] left-[16.66%] right-[16.66%] h-0.5 z-0"
            style={{
              background:
                'linear-gradient(90deg, #4f46e5 0%, #8a4cfc 50%, #006e4b 100%)',
              opacity: 0.25,
            }}
          />

          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative z-10 flex flex-col items-center text-center flex-1 w-full group"
            >
              {/* Step circle */}
              <div
                className={`w-[104px] h-[104px] rounded-full flex items-center justify-center mb-6 academic-shadow ring-4 ${step.ring} group-hover:scale-110 transition-transform duration-300 select-none`}
                style={{ background: step.gradient }}
              >
                <span
                  className="material-symbols-outlined text-4xl text-white"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {step.icon}
                </span>
              </div>

              {/* Step number chip */}
              <div
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full ${step.bgLight} font-label-sm text-label-sm mb-3 select-none`}
                style={{ color: 'currentColor' }}
              >
                Step {step.num}
              </div>

              <h4 className="font-headline-sm text-headline-sm text-text-main mb-2">
                {step.title}
              </h4>
              <p className="font-body-sm text-body-sm text-text-muted max-w-[240px]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
