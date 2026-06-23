import { useState, useEffect, useRef } from 'react'

export default function AIChatPanel({ showToast }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello Academic User! I've finished processing Quantum_Computing_V2.pdf. You can ask me to summarize key findings, explain specific equations, or compare it with your previous uploads. What would you like to start with?",
      chips: ['Summarize Paper', 'Extract Equations']
    },
    {
      sender: 'user',
      text: 'Can you explain the difference between superconducting qubits and trapped-ion qubits mentioned on page 14?'
    },
    {
      sender: 'ai',
      text: 'On page 14, the author distinguishes these two technologies based on their coherence times and scalability:',
      bullets: [
        'Superconducting Qubits: Faster gate speeds but shorter coherence times. They are easier to fabricate using established lithography but require ultra-cold dilution refrigerators.',
        'Trapped-Ion Qubits: Much longer coherence times and high-fidelity gates, but currently face significant challenges in scaling to thousands of interconnected ions.'
      ]
    }
  ])

  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activePage, setActivePage] = useState(14)
  const totalPages = 42

  const chatEndRef = useRef(null)

  useEffect(() => {
    // Scroll chat feed to bottom on load or new message
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  const handleSend = (textToSend) => {
    if (!textToSend.trim()) return

    // 1. Add User Message
    const userMsg = { sender: 'user', text: textToSend }
    setMessages((prev) => [...prev, userMsg])
    setInputValue('')

    // 2. Trigger typing indicator
    setIsTyping(true)

    // 3. Simulated AI Response after 1.5 seconds
    setTimeout(() => {
      setIsTyping(false)

      let aiResponseText = `I've analyzed your query regarding "${textToSend}". `
      let aiBullets = null

      if (textToSend.toLowerCase().includes('summarize')) {
        aiResponseText += 'Here is a quick summary of the document:'
        aiBullets = [
          'Core Concept: Explores scaling constraints in intermediate scale quantum hardware.',
          'Key Findings: Trapped-ion architectures exhibit 10x coherence durations compared to superconducting chips, but scale-up interconnects add major latency.',
          'Recommendation: Hybrid photonic-ion systems are proposed as a path forward to overcome wiring bottlenecks.'
        ]
      } else if (textToSend.toLowerCase().includes('equation')) {
        aiResponseText += 'I found the following core equations on page 14 and 17:'
        aiBullets = [
          'Coherence decay function: P(t) = exp(-(t/T_2)^alpha) where alpha parameterizes the noise spectrum.',
          'Interconnection gate error rate scaling relation: E_gate = C_0 * N_qubits^2 log(N_qubits).'
        ]
      } else {
        aiResponseText += "Based on Quantum_Computing_V2.pdf, page 14 notes that coherence is highly dependent on ambient noise shielding, and dilution refrigerator temperatures must remain below 15mK for superconducting components to maintain phase stability."
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: aiResponseText, bullets: aiBullets }])
    }, 1500)
  }

  const handleCopyCitation = () => {
    const citationText = `@article{zhu2023hardware,
  title={Hardware constraints for intermediate scale quantum processors},
  author={Zhu, X. and Vane, J. and Richard, D.},
  journal={Global Journal of Quantum Science},
  volume={14},
  number={2},
  pages={112--128},
  year={2023}
}`
    navigator.clipboard.writeText(citationText)
      .then(() => {
        if (showToast) showToast('BibTeX citation copied to clipboard!')
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err)
      })
  }

  return (
    <div className="flex-1 flex overflow-hidden h-[calc(100vh-64px)] select-none">

      {/* Left Panel: Chat History / Document Selector */}
      <aside className="w-[280px] bg-white border-r border-outline-variant flex flex-col h-full hidden lg:flex">
        <div className="p-4">
          <button
            onClick={() => {
              setMessages([
                {
                  sender: 'ai',
                  text: 'Hi there! I am ready to analyze a new document. Select a document or upload a new one to begin.',
                  chips: ['Summarize Paper']
                }
              ])
              if (showToast) showToast('New AI Chat session initialized')
            }}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-label-md text-label-md py-3 rounded-xl hover:shadow-lg active:scale-95 transition-all duration-150 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">add_comment</span>
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-1">
          <div className="px-3 py-2 text-label-sm font-label-sm text-text-muted uppercase tracking-wider font-bold">
            Recent Documents
          </div>
          <a className="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary-container text-on-primary-container font-semibold transition-all" href="#doc">
            <span className="material-symbols-outlined text-[20px]">description</span>
            <span className="font-label-md text-label-md truncate">Quantum_Computing_V2.pdf</span>
          </a>
          <a className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-all" href="#doc">
            <span className="material-symbols-outlined text-[20px]">article</span>
            <span className="font-label-md text-label-md truncate">Market_Analysis_2024.docx</span>
          </a>
          <a className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-all" href="#doc">
            <span className="material-symbols-outlined text-[20px]">biotech</span>
            <span className="font-label-md text-label-md truncate">Bio_Informatics_Final.pdf</span>
          </a>
          <a className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-all" href="#doc">
            <span className="material-symbols-outlined text-[20px]">history</span>
            <span className="font-label-md text-label-md truncate">Archived_Drafts_09.pdf</span>
          </a>
        </div>

        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center gap-3 p-2 bg-surface-container-low rounded-xl">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            <div className="flex-1">
              <p className="font-label-sm text-label-sm text-text-main font-bold">AI Quota Used</p>
              <div className="w-full h-1.5 bg-surface-container rounded-full mt-1.5 overflow-hidden">
                <div className="bg-primary h-full w-3/4"></div>
              </div>
            </div>
            <span className="text-xs text-text-muted font-bold">75%</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col bg-background relative h-full">
        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          <div className="flex justify-center">
            <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-outline-variant/30">
              Today
            </span>
          </div>

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-4 max-w-2xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {msg.sender === 'ai' ? (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-white select-none">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    auto_awesome
                  </span>
                </div>
              ) : (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-fixed border border-outline-variant overflow-hidden select-none">
                  <img
                    alt="User"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVD3sebnTeVCiiBnpQFzuL83E_d0KAlWb2kSLObc4G9b7Q_TPoyOPZX2_xN_kpZ4pOjMFV-ytVtToQSlWxfhEefnWLCoDqXrlcK1ys7fMrAcZj8IPJ4UE2ze4u7x17EAKqpp2DIzIIWmU3cd7KDL1qFsMUxNxjLEOv883jHj-5DWaYEkxYW409uCBHBTn5JsYnoh5QYzreV6YrWqQe7kY_Y-EeJd-4FdNbs4XVRqaJVc0MjPo2U6q_cjndrUE6Z3gKwd-sumSCxmlK"
                  />
                </div>
              )}

              <div
                className={`p-4 shadow-sm ${msg.sender === 'user'
                    ? 'bg-text-main text-white rounded-[16px_16px_4px_16px]'
                    : 'bg-[#f3f0ff] text-primary border border-[#e0d7ff] rounded-[16px_16px_16px_4px]'
                  }`}
              >
                <p className="font-body-md text-body-md whitespace-pre-line leading-relaxed">{msg.text}</p>

                {msg.bullets && (
                  <ul className="list-disc ml-5 mt-2 space-y-1.5 font-body-sm text-body-sm">
                    {msg.bullets.map((b, i) => (
                      <li key={i} dangerouslySetInnerHTML={{ __html: b.replace(/<strong>(.*?)<\/strong>/g, '<b>$1</b>') }} />
                    ))}
                  </ul>
                )}

                {msg.chips && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {msg.chips.map((chip, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(chip)}
                        className="bg-white border border-outline-variant px-3 py-1 rounded-full text-label-sm font-label-sm text-primary hover:border-primary transition-colors cursor-pointer shadow-sm font-semibold"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-4 max-w-2xl items-center">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
              </div>
              <div className="flex space-x-1.5 items-center bg-surface-container-low px-4 py-3 rounded-full border border-outline-variant/20 shadow-sm">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar Area */}
        <div className="p-6 bg-transparent border-t border-outline-variant/10">
          <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md border border-outline-variant rounded-2xl p-2 shadow-xl flex items-end gap-2">
            <button className="p-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-all cursor-pointer">
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(inputValue)
                }
              }}
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-2 font-body-md text-body-md max-h-32 custom-scrollbar outline-none"
              placeholder="Message Eduflux AI..."
              rows={1}
            />
            <button
              onClick={() => handleSend(inputValue)}
              className="p-3 bg-primary text-white rounded-xl hover:shadow-lg active:scale-95 transition-all duration-150 cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
          <p className="text-center font-label-sm text-label-sm text-text-muted mt-3 select-none">
            Eduflux AI can make mistakes. Verify important information with the original source.
          </p>
        </div>
      </section>

      {/* Right Panel: Document Context & Metadata */}
      <aside className="w-[320px] bg-white border-l border-outline-variant flex flex-col h-full hidden xl:flex overflow-y-auto custom-scrollbar p-6 justify-between">
        <div className="space-y-6">
          {/* Cover Preview Image */}
          <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-outline-variant shadow-lg group select-none">
            <img
              alt="Document Preview"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZ9G0e8awI4Ekd2YZFP5DiYBT-3O0965JMrAdjJe-tkNaGsM83a_VYsU4RPpeSsexE0UnfaGl_FqGatYIGonGgdhYALSnbChn0J8FAcoZxVFXEHYZjVvLyIYYpBiiuP2vAbHiCYRlq6p1lRJYYcNk_3w9Vw0l_fkjXGkzQvr0h9KAKwHhPrDhPxuZbSynVTZDrtyI6UCwIugkvq3b9vKAIhg3ukjGzyxc_DKKYj9dS55gGfcwmMcmmQHXprC8GbeSVwxCAD9n1WHi2"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 cursor-zoom-in">
              <span className="material-symbols-outlined text-white text-4xl">fullscreen</span>
            </div>
          </div>

          <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-[16px] text-text-main truncate font-bold flex-1 mr-2">
                Quantum_Computing_V2
              </h3>
              <span className="bg-academic-blue/10 text-academic-blue font-label-sm text-[11px] px-2 py-0.5 rounded uppercase font-bold select-none">
                PDF
              </span>
            </div>

            {/* Page Navigator */}
            <div className="flex items-center justify-between bg-surface-container-low p-2 rounded-lg select-none">
              <button
                onClick={() => activePage > 1 && setActivePage(activePage - 1)}
                className="p-1 hover:bg-surface-container-high rounded-md transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <div className="flex items-center gap-1 font-label-md text-label-md font-semibold">
                <span className="text-primary font-bold">{activePage}</span>
                <span className="text-text-muted">/</span>
                <span className="text-text-muted">{totalPages}</span>
              </div>
              <button
                onClick={() => activePage < totalPages && setActivePage(activePage + 1)}
                className="p-1 hover:bg-surface-container-high rounded-md transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>

            {/* Quick Document Actions */}
            <div className="space-y-2 select-none">
              <button className="w-full flex items-center justify-between px-4 py-3 bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md rounded-xl transition-all cursor-pointer border-none font-semibold">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">swap_horiz</span>
                  Switch Document
                </div>
                <span className="material-symbols-outlined">keyboard_arrow_right</span>
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3 bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md rounded-xl transition-all cursor-pointer border-none font-semibold">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">download</span>
                  Download PDF
                </div>
              </button>
            </div>

            {/* Key Topics Tag list */}
            <div className="pt-4 border-t border-outline-variant select-none">
              <p className="font-label-sm text-label-sm text-text-muted mb-2 font-bold">Key Topics in this Section</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 bg-academic-gold/10 text-academic-gold rounded text-[10px] font-extrabold uppercase tracking-wide border border-academic-gold/20">
                  Coherence
                </span>
                <span className="px-2.5 py-1 bg-academic-red/10 text-academic-red rounded text-[10px] font-extrabold uppercase tracking-wide border border-academic-red/20">
                  Scalability
                </span>
                <span className="px-2.5 py-1 bg-tertiary-container/10 text-tertiary rounded text-[10px] font-extrabold uppercase tracking-wide border border-tertiary/20">
                  Dilution
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Citation Box */}
        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 select-none">
          <p className="font-label-sm text-label-sm text-primary mb-2 font-extrabold uppercase tracking-widest">
            Research Citation
          </p>
          <p className="font-body-sm text-body-sm text-on-surface italic leading-relaxed">
            "Zhu, X. et al. (2023). Hardware constraints for intermediate scale quantum processors."
          </p>
          <button
            onClick={handleCopyCitation}
            className="mt-3 text-primary font-label-sm text-label-sm hover:underline flex items-center gap-1 cursor-pointer font-bold bg-transparent border-none"
          >
            Copy BibTeX <span className="material-symbols-outlined text-[16px]">content_copy</span>
          </button>
        </div>
      </aside>
    </div>
  )
}
