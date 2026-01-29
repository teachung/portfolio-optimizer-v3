import React from 'react';
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { RedBoxSection } from '../components/landing/RedBoxSection';
import { Library } from '../components/landing/Library';
import { Pricing } from '../components/landing/Pricing';
import { Testimonials } from '../components/landing/Testimonials';
import { Footer } from '../components/landing/Footer';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200 font-sans">
      <Navbar />
      <main>
        <Hero />
        <RedBoxSection />
        <Library />
        <Pricing />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
