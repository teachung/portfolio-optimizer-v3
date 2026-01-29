import React from 'react';
import { Logo } from './Logo';
import { Menu, X, Globe } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { t, language, toggleLanguage } = useTranslation();

  // Custom easing function (easeInOutCubic) for a very smooth feel
  const easeInOutCubic = (t: number, b: number, c: number, d: number) => {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t * t + b;
    t -= 2;
    return c / 2 * (t * t * t + 2) + b;
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;

    setIsOpen(false); // Close mobile menu if open

    const headerOffset = 80;
    const elementPosition = target.getBoundingClientRect().top;
    const startPosition = window.pageYOffset;
    // Calculate final position
    const offsetPosition = elementPosition + startPosition - headerOffset;
    const distance = offsetPosition - startPosition;
    
    // Calculate duration based on distance, but generally slower. 
    // Target approx 1600ms for a typical viewport scroll.
    // Base 800ms + (distance * 0.8) capped at 2500ms for very long pages.
    const duration = Math.min(2500, Math.max(1200, Math.abs(distance) * 0.8));
    
    let startTime: number | null = null;

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      
      const run = easeInOutCubic(timeElapsed, startPosition, distance, duration);
      
      window.scrollTo(0, run);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  return (
    <nav className="fixed w-full z-50 top-0 left-0 border-b border-white/5 bg-[#0B1120]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8 hover:scale-110 transition-transform duration-300" />
            <span className="text-xl font-bold tracking-tight text-white">
              Portfolio<span className="text-emerald-400">Blender</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-baseline space-x-8">
              <a 
                href="#redbox" 
                onClick={(e) => scrollToSection(e, 'redbox')}
                className="hover:text-emerald-400 transition-colors px-3 py-2 text-sm font-medium text-slate-300 hover:-translate-y-0.5 inline-block cursor-pointer"
              >
                {t('nav.core')}
              </a>
              <a 
                href="#library" 
                onClick={(e) => scrollToSection(e, 'library')}
                className="hover:text-emerald-400 transition-colors px-3 py-2 text-sm font-medium text-slate-300 hover:-translate-y-0.5 inline-block cursor-pointer"
              >
                {t('nav.library')}
              </a>
              <a 
                href="#pricing" 
                onClick={(e) => scrollToSection(e, 'pricing')}
                className="hover:text-emerald-400 transition-colors px-3 py-2 text-sm font-medium text-slate-300 hover:-translate-y-0.5 inline-block cursor-pointer"
              >
                {t('nav.lab')}
              </a>
              <a 
                href="#testimonials" 
                onClick={(e) => scrollToSection(e, 'testimonials')}
                className="hover:text-emerald-400 transition-colors px-3 py-2 text-sm font-medium text-slate-300 hover:-translate-y-0.5 inline-block cursor-pointer"
              >
                {t('nav.pricing')}
              </a>
            </div>

            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm font-medium hover:-translate-y-0.5"
            >
              <Globe size={16} />
              <span>{language === 'en' ? 'EN' : '繁中'}</span>
            </button>

            <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-2 rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:-translate-y-1">
              {t('nav.launch')}
            </button>
          </div>
          
          <div className="-mr-2 flex md:hidden items-center gap-4">
             <button 
              onClick={toggleLanguage}
              className="flex items-center gap-1 text-slate-400 hover:text-white"
            >
              <Globe size={18} />
              <span className="text-xs font-bold">{language === 'en' ? 'EN' : '繁'}</span>
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-300 hover:text-white p-2">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden glass-panel border-t border-white/10 bg-[#0B1120]">
          <div className="px-4 pt-4 pb-6 space-y-2">
            <a 
              href="#redbox" 
              onClick={(e) => scrollToSection(e, 'redbox')}
              className="text-gray-300 hover:text-emerald-400 block px-3 py-2 rounded-md text-base font-medium cursor-pointer"
            >
              {t('nav.core')}
            </a>
            <a 
              href="#library" 
              onClick={(e) => scrollToSection(e, 'library')}
              className="text-gray-300 hover:text-emerald-400 block px-3 py-2 rounded-md text-base font-medium cursor-pointer"
            >
              {t('nav.library')}
            </a>
            <a 
              href="#pricing" 
              onClick={(e) => scrollToSection(e, 'pricing')}
              className="text-gray-300 hover:text-emerald-400 block px-3 py-2 rounded-md text-base font-medium cursor-pointer"
            >
               {t('nav.lab')}
            </a>
             <a 
               href="#testimonials" 
               onClick={(e) => scrollToSection(e, 'testimonials')}
               className="text-gray-300 hover:text-emerald-400 block px-3 py-2 rounded-md text-base font-medium cursor-pointer"
            >
               {t('nav.pricing')}
            </a>
            <button className="w-full mt-6 bg-emerald-500 text-slate-900 px-4 py-3 rounded-md text-base font-bold">
               {t('nav.launch')}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};