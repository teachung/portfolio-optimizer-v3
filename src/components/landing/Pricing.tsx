import React, { useEffect, useState } from 'react';
import { Check, Bot, Zap, Shield, Sparkles, Building2, Users, Code, LineChart, Lock, Target, Star, Briefcase } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { TrialQuota } from './TrialQuota';

const FeatureIcon: React.FC<{ index: number; variant: 'trial' | 'pro' | 'enterprise' }> = ({ index, variant }) => {
  if (variant === 'trial') {
    return <Check size={18} strokeWidth={3} className="text-emerald-400" />;
  }

  if (variant === 'enterprise') {
    const icons = [Sparkles, Users, Building2, Shield, Code, LineChart];
    const Icon = icons[index % icons.length] || Check;
    return <Icon size={18} className="text-amber-400" />;
  }

  // Pro icons
  const icons = [Check, Zap, Shield, Sparkles, LineChart, Bot, Lock];
  const Icon = icons[index % icons.length] || Check;
  return <Icon size={18} className="text-fuchsia-400" />;
};

interface PricingCardProps {
  tier: string;
  title: string;
  price: string;
  period: string;
  subtitle: string;
  features: string[];
  cta: string;
  variant: 'trial' | 'pro' | 'enterprise';
  onCtaClick: () => void;
  contactEmail?: string;
  children?: React.ReactNode;
}

const PricingCard: React.FC<PricingCardProps> = ({
  tier, title, price, period, subtitle, features, cta, variant, onCtaClick, contactEmail, children
}) => {
  const isPro = variant === 'pro';
  const isEnterprise = variant === 'enterprise';
  const isTrial = variant === 'trial';

  let borderColor = 'border-slate-800';
  let bgColor = 'bg-slate-900';
  let badgeColor = 'bg-slate-800 text-slate-300 border-slate-600';
  let btnStyle = 'bg-slate-800 hover:bg-slate-700 text-white';

  // Trial: Calm Nature/Mountain (Green theme)
  let image = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800";
  let imageOverlay = "from-slate-900 via-slate-900/90 to-slate-900/10";

  if (isPro) {
    borderColor = 'border-fuchsia-500';
    bgColor = 'bg-[#150a1f]';
    badgeColor = 'bg-fuchsia-950/50 text-fuchsia-300 border-fuchsia-500/50';
    btnStyle = 'bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white shadow-lg shadow-fuchsia-500/20 border-0';
    image = "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&q=80&w=800";
    imageOverlay = "from-[#150a1f] via-[#150a1f]/80 to-fuchsia-900/20";
  } else if (isEnterprise) {
    borderColor = 'border-amber-500/50';
    bgColor = 'bg-[#1a150a]';
    badgeColor = 'bg-amber-950/50 text-amber-300 border-amber-500/50';
    btnStyle = 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/20 border-0';
    image = "https://images.unsplash.com/photo-1544085311-11a028465b03?auto=format&fit=crop&q=80&w=800";
    imageOverlay = "from-[#1a150a] via-[#1a150a]/80 to-amber-900/20";
  }

  const handleClick = () => {
    if (isEnterprise && contactEmail) {
      window.location.href = `mailto:${contactEmail}?subject=Enterprise Inquiry - PortfolioBlender`;
    } else {
      onCtaClick();
    }
  };

  return (
    <div className={`group relative flex flex-col rounded-[2rem] overflow-hidden transition-all duration-300 h-full border hover:-translate-y-2 hover:shadow-2xl ${borderColor} ${bgColor} ${isPro ? 'shadow-[0_0_40px_-10px_rgba(217,70,239,0.3)] z-10 md:scale-105' : ''}`}>

      {/* Visual Header with Landscape Image */}
      <div className="h-44 relative shrink-0 overflow-hidden">
        <img
            src={image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${imageOverlay}`} />

        {/* Most Popular Badge */}
        {isPro && (
          <div className="absolute top-4 right-4 bg-fuchsia-600 text-white px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-lg z-20 animate-pulse">
            Most Popular
          </div>
        )}

        {/* Floating Icon */}
        <div className="absolute top-6 left-6 z-20">
             <div className={`w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-md border shadow-lg ${isPro ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300' : isEnterprise ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'}`}>
                {isTrial ? <Target size={24} /> : isPro ? <Star size={24} /> : <Briefcase size={24} />}
             </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-6 md:p-8 pt-0 relative z-10">
        <div className="mb-6">
          <div className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase mb-3 border ${badgeColor}`}>
              {tier}
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight mb-2">{title}</h3>

          {/* Price Display */}
          <div className="flex items-baseline gap-1 mb-2">
            <span className={`text-4xl font-bold ${isPro ? 'text-fuchsia-400' : isEnterprise ? 'text-amber-400' : 'text-emerald-400'}`}>
              {price}
            </span>
            {period && <span className="text-slate-400 text-lg">{period}</span>}
          </div>

          {/* Subtitle (e.g., "First month 50% off") */}
          {subtitle && (
            <p className={`text-sm ${isPro ? 'text-fuchsia-300' : isEnterprise ? 'text-amber-300' : 'text-emerald-300'}`}>
              {subtitle}
            </p>
          )}
        </div>

        <ul className="flex-1 space-y-4 mb-8">
          {features.map((feat, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm group/item">
              <div className={`mt-0.5 shrink-0 transition-transform group-hover/item:scale-110`}>
                <FeatureIcon index={idx} variant={variant} />
              </div>
              <span className={`leading-relaxed ${isPro ? 'text-slate-200 font-medium' : 'text-slate-400 group-hover/item:text-slate-300 transition-colors'}`}>{feat}</span>
            </li>
          ))}
        </ul>

        {/* Optional children (e.g., quota display) */}
        {children}

        <button
          onClick={handleClick}
          className={`w-full py-4 rounded-xl font-bold transition-all hover:-translate-y-1 ${btnStyle}`}
        >
          {cta}
        </button>
      </div>
    </div>
  );
};

export const Pricing: React.FC = () => {
  const { t } = useTranslation();
  const [contactEmail, setContactEmail] = useState('contact@portfolioblender.com');

  // Fetch contact email from Airtable Settings
  useEffect(() => {
    fetch('/api/get-settings?key=contact_email')
      .then(res => res.json())
      .then(data => {
        if (data.value) {
          setContactEmail(data.value);
        }
      })
      .catch(err => console.error('Failed to fetch settings:', err));
  }, []);

  const handleCtaClick = () => {
    // Navigate to login page
    window.location.href = '/login';
  };

  return (
    <section id="pricing" className="py-32 bg-[#0B1120] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">
                    {t('pricing.title')}
                </h2>
                <div className="text-4xl md:text-6xl font-serif italic text-slate-200 mb-8">
                    {t('pricing.subtitle')}
                </div>
            </div>
            <div className="max-w-md text-slate-400 text-lg md:text-right leading-relaxed">
                {t('pricing.desc')}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch pt-4">
          <PricingCard
            tier={t('pricing.trial.tier')}
            title={t('pricing.trial.title')}
            price={t('pricing.trial.price')}
            period={t('pricing.trial.period')}
            subtitle={t('pricing.trial.subtitle')}
            features={t('pricing.trial.features')}
            cta={t('pricing.trial.cta')}
            variant="trial"
            onCtaClick={handleCtaClick}
          >
            {/* Trial Quota integrated into card */}
            <TrialQuota variant="card" showWaitlistForm={false} />
          </PricingCard>
          <PricingCard
            tier={t('pricing.pro.tier')}
            title={t('pricing.pro.title')}
            price={t('pricing.pro.price')}
            period={t('pricing.pro.period')}
            subtitle={t('pricing.pro.subtitle')}
            features={t('pricing.pro.features')}
            cta={t('pricing.pro.cta')}
            variant="pro"
            onCtaClick={handleCtaClick}
          />
          <PricingCard
            tier={t('pricing.enterprise.tier')}
            title={t('pricing.enterprise.title')}
            price={t('pricing.enterprise.price')}
            period={t('pricing.enterprise.period')}
            subtitle={t('pricing.enterprise.subtitle')}
            features={t('pricing.enterprise.features')}
            cta={t('pricing.enterprise.cta')}
            variant="enterprise"
            onCtaClick={handleCtaClick}
            contactEmail={contactEmail}
          />
        </div>
      </div>
    </section>
  );
};
