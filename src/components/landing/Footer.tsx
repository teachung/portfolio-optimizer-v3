import React from 'react';
import { Logo } from './Logo';
import { useTranslation } from '../../contexts/LanguageContext';
import { Mail, Instagram, AtSign } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-black py-16 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
        
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-8">
            <Logo className="w-10 h-10" />
            <span className="text-2xl font-bold tracking-tight text-white">
              Portfolio<span className="text-emerald-400">Blender</span>
            </span>
        </div>

        {/* Social Links - Simplified as requested */}
        <div className="flex items-center gap-8 mb-10">
            <a 
                href="mailto:hello@portfolioblender.com" 
                className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-emerald-500 hover:bg-emerald-500/10 transition-all duration-300 group"
                title="Email Us"
            >
                <Mail size={20} />
            </a>
            <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-pink-500 hover:bg-pink-500/10 transition-all duration-300 group"
                title="Instagram"
            >
                <Instagram size={20} />
            </a>
            <a 
                href="https://threads.net" 
                target="_blank" 
                rel="noreferrer"
                className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-white hover:bg-white/10 transition-all duration-300 group"
                title="Threads"
            >
                <AtSign size={20} />
            </a>
        </div>

        {/* Copyright */}
        <div className="text-slate-600 text-sm">
            {t('footer.rights')}
        </div>

      </div>
    </footer>
  );
};