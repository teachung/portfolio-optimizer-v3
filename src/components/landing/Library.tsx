import React from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { Sparkles, Bell } from 'lucide-react';

export const Library: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="library" className="py-24 bg-[#0B1120] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            {t('library.title')}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-sky-500 mx-auto rounded-full mb-6 shadow-[0_0_15px_rgba(16,185,129,0.6)]"></div>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            {t('library.desc')}
          </p>
        </div>

        {/* Coming Soon Card */}
        <div className="max-w-2xl mx-auto">
          <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800/50 to-slate-900 border border-slate-700/50 p-12 text-center overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-sky-500/5 animate-pulse" />

            {/* Floating Sparkles */}
            <div className="absolute top-6 left-6 text-emerald-400/30 animate-bounce">
              <Sparkles size={24} />
            </div>
            <div className="absolute top-8 right-8 text-sky-400/30 animate-bounce delay-150">
              <Sparkles size={20} />
            </div>
            <div className="absolute bottom-8 left-12 text-fuchsia-400/30 animate-bounce delay-300">
              <Sparkles size={18} />
            </div>

            <div className="relative z-10">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Sparkles size={40} className="text-emerald-400" />
              </div>

              {/* Title */}
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {t('library.coming_soon.title')}
              </h3>

              {/* Subtitle Badge */}
              <div className="inline-block px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
                <span className="text-emerald-400 font-medium text-sm tracking-wide">
                  {t('library.subtitle')}
                </span>
              </div>

              {/* Description */}
              <p className="text-slate-400 text-lg max-w-md mx-auto mb-8 leading-relaxed">
                {t('library.coming_soon.desc')}
              </p>

              {/* Notify Button */}
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/20">
                <Bell size={18} />
                {t('library.coming_soon.notify')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
