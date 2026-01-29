import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Cell, CartesianGrid, LabelList } from 'recharts';
import { useTranslation } from '../../contexts/LanguageContext';
import { Bot, Shield, Zap, Lock, Activity, TrendingUp } from 'lucide-react';

const FeatureItem: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  tag: string; 
  desc: string; 
  isActive?: boolean;
}> = ({ icon, title, tag, desc, isActive }) => (
  <div className={`p-5 rounded-xl border transition-all duration-300 cursor-pointer group hover:-translate-y-1 relative overflow-hidden ${
    isActive 
      ? 'bg-[#1a1625] border-fuchsia-500 shadow-[0_0_30px_-5px_rgba(217,70,239,0.3)]' 
      : 'bg-[#111827] border-slate-800 hover:border-slate-600 hover:bg-[#1f2937]'
  }`}>
    {isActive && (
       <div className="absolute left-0 top-0 bottom-0 w-1 bg-fuchsia-500 shadow-[0_0_10px_#d946ef]" />
    )}
    <div className="flex items-start gap-4">
      <div className={`mt-1 w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border transition-colors duration-300 ${
        isActive 
          ? 'bg-fuchsia-500/10 border-fuchsia-500/50 text-fuchsia-400' 
          : 'bg-slate-800 border-slate-700 text-slate-400 group-hover:text-slate-200'
      }`}>
        {icon}
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <h3 className={`text-base font-bold ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{title}</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
            isActive ? 'bg-fuchsia-500 text-white' : 'bg-slate-800 text-slate-500 border border-slate-700'
          }`}>
            {tag}
          </span>
        </div>
        <p className={`text-sm leading-relaxed ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
          {desc}
        </p>
      </div>
    </div>
  </div>
);

const ChartContainer: React.FC<{ 
  title: string; 
  children: React.ReactNode; 
  stats?: React.ReactNode;
}> = ({ title, children, stats }) => (
    <div className="bg-[#0f1420] border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col h-full shadow-lg">
        <div className="mb-4 shrink-0">
            <h4 className="text-slate-200 font-bold text-lg">{title}</h4>
        </div>
        
        <div className="flex-1 w-full min-h-[180px] relative">
            {children}
        </div>

        {stats && (
            <div className="mt-4 pt-4 border-t border-slate-800/50 shrink-0">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  {stats}
                </div>
            </div>
        )}
    </div>
);

export const RedBoxSection: React.FC = () => {
  const { t } = useTranslation();

  // Mock Data for curve chart - Adjusted for more dramatic difference
  const curveData = Array.from({length: 40}, (_, i) => {
    const x = i / 40; // 0 to 1
    return {
      name: i,
      // Standard: Slow, somewhat volatile linear growth
      std: 10 + (i * 0.8) + (Math.sin(i * 0.8) * 2), 
      // AI: Exponential smooth curve with minimal noise
      ai: 10 + (Math.pow(i, 1.4) * 0.8) 
    };
  });

  // Bar Data: Thicker, straight bars with glow effects
  const barData = [
    { 
        name: 'Standard', 
        value: 28, 
        label: '-28%', 
        fill: 'url(#gradRed)',
        stroke: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.6)'
    },
    { 
        name: 'AI v2.0', 
        value: 12, 
        label: '-12%', 
        fill: 'url(#gradTeal)',
        stroke: '#2dd4bf',
        glow: 'rgba(45, 212, 191, 0.6)'
    }
  ];

  return (
    <section id="redbox" className="py-24 bg-[#0B1120] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Glowing Border Container */}
        <div className="relative rounded-[2rem] p-1 bg-gradient-to-b from-fuchsia-500/50 via-purple-500/20 to-transparent shadow-[0_0_80px_-20px_rgba(217,70,239,0.3)]">
            <div className="bg-[#0B1120] rounded-[1.9rem] p-8 md:p-12 overflow-hidden relative">
                
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                {/* Header */}
                <div className="text-center mb-16 relative z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-sm">
                    {t('redbox.badge')}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                     <span dangerouslySetInnerHTML={{ __html: t('redbox.title_main') }} />
                  </h2>
                  <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                     {t('redbox.desc')}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left: Features List (5 Cols) - ALL ACTIVE */}
                    <div className="lg:col-span-5 space-y-4">
                        <FeatureItem 
                            icon={<Bot size={22} />}
                            title={t('redbox.cards.super_ai.title')}
                            tag={t('redbox.cards.super_ai.tag')}
                            desc={t('redbox.cards.super_ai.desc')}
                            isActive
                        />
                        <FeatureItem 
                            icon={<Bot size={22} />}
                            title={t('redbox.cards.super_ai_v2.title')}
                            tag={t('redbox.cards.super_ai_v2.tag')}
                            desc={t('redbox.cards.super_ai_v2.desc')}
                            isActive
                        />
                         <FeatureItem 
                            icon={<Activity size={22} />}
                            title={t('redbox.cards.extreme_stab_v2.title')}
                            tag={t('redbox.cards.extreme_stab_v2.tag')}
                            desc={t('redbox.cards.extreme_stab_v2.desc')}
                            isActive
                        />
                        <FeatureItem 
                            icon={<Shield size={22} />}
                            title={t('redbox.cards.extreme_stab_v1.title')}
                            tag={t('redbox.cards.extreme_stab_v1.tag')}
                            desc={t('redbox.cards.extreme_stab_v1.desc')}
                            isActive
                        />
                        <FeatureItem 
                            icon={<Zap size={22} />}
                            title={t('redbox.cards.preferred_asset.title')}
                            tag={t('redbox.cards.preferred_asset.tag')}
                            desc={t('redbox.cards.preferred_asset.desc')}
                            isActive
                        />
                        <FeatureItem 
                            icon={<Lock size={22} />}
                            title={t('redbox.cards.market_timing.title')}
                            tag={t('redbox.cards.market_timing.tag')}
                            desc={t('redbox.cards.market_timing.desc')}
                            isActive
                        />
                    </div>

                    {/* Right: Charts (7 Cols) */}
                    <div className="lg:col-span-7 space-y-6 lg:sticky lg:top-24">
                        
                        {/* Chart 1: Yield Curve */}
                        <div className="h-[320px]">
                          <ChartContainer 
                              title={t('redbox.chart_1_title')}
                              stats={
                                <>
                                  <div className="flex-1 min-w-[120px]">
                                      <div className="flex items-center gap-2 mb-1">
                                          <div className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                                          <div className="text-xs text-slate-500 whitespace-nowrap">Standard CAGR</div>
                                      </div>
                                      <div className="text-2xl font-bold text-slate-400">12.4%</div>
                                  </div>
                                  <div className="flex-1 min-w-[120px] text-right">
                                      <div className="flex items-center justify-end gap-2 mb-1">
                                          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_#34d399]" />
                                          <div className="text-xs text-emerald-400 font-bold whitespace-nowrap">AI v2.0 CAGR</div>
                                      </div>
                                      <div className="text-2xl font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">28.7%</div>
                                  </div>
                                </>
                              }
                          >
                              <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={curveData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                      <defs>
                                          <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="5%" stopColor="#34d399" stopOpacity={0.6}/>
                                              <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                                          </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.5} />
                                      <XAxis dataKey="name" hide />
                                      <YAxis hide />
                                      {/* Standard Line (Darker, thinner dashed) */}
                                      <Area 
                                        type="monotone" 
                                        dataKey="std" 
                                        stroke="#475569" 
                                        strokeWidth={2} 
                                        strokeDasharray="4 4" 
                                        fill="transparent" 
                                        isAnimationActive={true}
                                      />
                                      {/* AI Line (Thicker, brighter, heavy glow) */}
                                      <Area 
                                        type="monotone" 
                                        dataKey="ai" 
                                        stroke="#34d399" 
                                        strokeWidth={4} 
                                        fill="url(#colorAi)" 
                                        filter="drop-shadow(0 0 10px rgba(52, 211, 153, 0.7))"
                                        isAnimationActive={true}
                                        animationDuration={2000}
                                      />
                                  </AreaChart>
                              </ResponsiveContainer>
                          </ChartContainer>
                        </div>

                        {/* Chart 2: Max Drawdown (Vertical Bars) - Thicker & Glowing */}
                        <div className="h-[300px]">
                          <ChartContainer title={t('redbox.chart_2_title')}>
                               <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={barData} margin={{ top: 30, right: 30, left: 30, bottom: 5 }} barSize={80}>
                                      <defs>
                                          <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                                              <stop offset="100%" stopColor="#7f1d1d" stopOpacity={0.4}/>
                                          </linearGradient>
                                          <linearGradient id="gradTeal" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.9}/>
                                              <stop offset="100%" stopColor="#115e59" stopOpacity={0.4}/>
                                          </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                      <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 12 }} 
                                        dy={10}
                                      />
                                      <YAxis hide />
                                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {
                                          barData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.fill} 
                                                stroke={entry.stroke}
                                                strokeWidth={2}
                                                style={{ filter: `drop-shadow(0 0 10px ${entry.glow})` }}
                                            />
                                          ))
                                        }
                                        <LabelList 
                                          dataKey="label" 
                                          position="top" 
                                          fill="#fff" 
                                          fontSize={16} 
                                          fontWeight="bold"
                                          formatter={(value: any) => value}
                                          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                                        />
                                      </Bar>
                                  </BarChart>
                              </ResponsiveContainer>
                              
                              <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-slate-500">
                                AI 版本將回撤控制在 <span className="text-emerald-400 font-bold">-15%</span> 以內
                              </div>
                          </ChartContainer>
                        </div>

                        {/* Unlock Button */}
                        <button className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 p-[1px] shadow-lg transition-all hover:shadow-fuchsia-500/25 active:scale-[0.99]">
                            <div className="relative flex items-center justify-between rounded-[11px] bg-[#1a1625] px-6 py-4 transition-colors group-hover:bg-opacity-80">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-fuchsia-500/20 text-fuchsia-400">
                                        <Lock size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-bold text-white">解鎖紅框功能，獲得機構級量化能力</div>
                                        <div className="text-xs text-fuchsia-300/70">Powered by AlphaGenius Lab</div>
                                    </div>
                                </div>
                                <div className="rounded-lg bg-fuchsia-500 px-4 py-2 text-sm font-bold text-white transition-transform group-hover:translate-x-1">
                                    升級至專業版
                                </div>
                            </div>
                        </button>

                    </div>
                </div>
            </div>
        </div>

      </div>
    </section>
  );
};