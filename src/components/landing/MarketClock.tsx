import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useTranslation } from '../../contexts/LanguageContext';

export const MarketClock: React.FC = () => {
  const { t } = useTranslation();

  const data = [
    { subject: t('clock.factors.growth'), A: 120, fullMark: 150 },
    { subject: t('clock.factors.value'), A: 98, fullMark: 150 },
    { subject: t('clock.factors.momentum'), A: 86, fullMark: 150 },
    { subject: t('clock.factors.quality'), A: 99, fullMark: 150 },
    { subject: t('clock.factors.volatility'), A: 45, fullMark: 150 },
    { subject: t('clock.factors.yield'), A: 65, fullMark: 150 },
  ];

  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-800/30 rounded-3xl p-8 md:p-12 border border-white/5 relative overflow-hidden">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
             <div>
               <h3 className="text-3xl font-bold text-white mb-4">{t('clock.title')}</h3>
               <p className="text-slate-400 mb-6">
                 {t('clock.desc')}
               </p>
               <div className="flex gap-4">
                  <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                    <div className="text-2xl font-mono text-emerald-400">{t('clock.factors.growth')}</div>
                    <div className="text-xs text-slate-500">{t('clock.dominant')}</div>
                  </div>
                   <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                    <div className="text-2xl font-mono text-slate-300">{t('clock.factors.volatility')}</div>
                    <div className="text-xs text-slate-500">{t('clock.secondary')}</div>
                  </div>
               </div>
             </div>

             <div className="h-[300px] w-full flex items-center justify-center relative">
               <div className="absolute inset-0 bg-emerald-500/5 blur-[50px] rounded-full"></div>
               <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                   <PolarGrid stroke="#334155" />
                   <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                   <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                   <Radar
                     name="Portfolio"
                     dataKey="A"
                     stroke="#34d399"
                     strokeWidth={2}
                     fill="#34d399"
                     fillOpacity={0.3}
                   />
                 </RadarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};