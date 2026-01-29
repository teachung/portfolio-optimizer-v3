import React from 'react';
import { Cpu, Dna, Activity, Lock, TrendingUp, Zap } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

const FeatureCard: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  isPro?: boolean;
}> = ({ icon, title, description, isPro }) => (
  <div className={`p-6 rounded-xl border transition-all duration-300 hover:-translate-y-1 ${
    isPro 
      ? 'bg-fuchsia-950/10 border-fuchsia-500/20 hover:border-fuchsia-500/40 hover:shadow-[0_0_20px_rgba(217,70,239,0.1)]' 
      : 'bg-slate-800/30 border-slate-700 hover:border-emerald-500/30 hover:bg-slate-800/50'
  }`}>
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
      isPro ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-emerald-500/10 text-emerald-400'
    }`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
      {title}
      {isPro && <span className="text-[10px] bg-fuchsia-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Pro</span>}
    </h3>
    <p className="text-slate-400 leading-relaxed text-sm">
      {description}
    </p>
  </div>
);

export const Features: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-24 bg-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            {t('features.title_1')} <span className="text-emerald-400">{t('features.title_2')}</span>.
            <br />
            {t('features.title_3')} <span className="text-fuchsia-500">{t('features.title_4')}</span>.
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            {t('features.desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Dna size={24} />}
            title={t('features.cards.dna.title')}
            description={t('features.cards.dna.desc')}
          />
          <FeatureCard 
            icon={<Zap size={24} />}
            title={t('features.cards.worker.title')}
            description={t('features.cards.worker.desc')}
          />
          <FeatureCard 
            icon={<TrendingUp size={24} />}
            title={t('features.cards.log.title')}
            description={t('features.cards.log.desc')}
          />
          <FeatureCard 
            icon={<Activity size={24} />}
            title={t('features.cards.geo.title')}
            description={t('features.cards.geo.desc')}
            isPro
          />
          <FeatureCard 
            icon={<Cpu size={24} />}
            title={t('features.cards.hex.title')}
            description={t('features.cards.hex.desc')}
            isPro
          />
          <FeatureCard 
            icon={<Lock size={24} />}
            title={t('features.cards.priv.title')}
            description={t('features.cards.priv.desc')}
          />
        </div>
      </div>
    </section>
  );
};