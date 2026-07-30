import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Pricing from '../sections/Pricing';
import Footer from '../components/Footer';

export default function PricingUnlock() {
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('documentId');

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-between">
      <Navbar />
      <main className="flex-grow pt-16">
        <Pricing documentId={documentId} />
      </main>
      <Footer />
    </div>
  );
}
