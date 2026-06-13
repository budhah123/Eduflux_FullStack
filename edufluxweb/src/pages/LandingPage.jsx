import Navbar from '../components/Navbar'
import Hero from '../sections/Hero'
import Features from '../sections/Features'
import HowItWorks from '../sections/HowItWorks'
import DocumentShowcase from '../sections/DocumentShowcase'
import Pricing from '../sections/Pricing'
import Footer from '../components/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-between">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Features />
        <HowItWorks />
        <DocumentShowcase />
        <Pricing />
      </main>
      <Footer />
    </div>
  )
}
