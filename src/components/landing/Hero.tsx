import React, { useEffect, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

// Color interpolation function
const interpolateColor = (value: number) => {
  const normalized = Math.max(0, Math.min(1, value));
  if (normalized < 0.5) {
    const t = normalized * 2;
    const r = Math.round(59 + (168 - 59) * t);
    const g = Math.round(130 + (85 - 130) * t);
    const b = Math.round(246 + (247 - 246) * t);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const t = (normalized - 0.5) * 2;
    const r = Math.round(168 + (239 - 168) * t);
    const g = Math.round(85 + (68 - 85) * t);
    const b = Math.round(247 + (68 - 247) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
};

const generateRealisticFrontierData = (count: number) => {
  const data = [];
  let bestSharpe = 0;

  for (let i = 0; i < count; i++) {
    const risk = 8 + Math.random() * 25; 
    const maxReturnForRisk = 4 + (Math.log(risk - 5) * 8); 
    const inefficiency = Math.abs(Math.random() * Math.random() * 8); 
    const returnVal = maxReturnForRisk - inefficiency;
    const sharpe = (returnVal - 2) / risk;
    const maxDD = risk * (1.5 + Math.random());

    const point = {
      x: Math.round(maxDD * 10) / 10, 
      y: Math.round(returnVal * 10) / 10,
      sharpe: sharpe,
      z: 10 + (sharpe * 10), 
    };

    if (sharpe > bestSharpe) {
      bestSharpe = sharpe;
    }

    data.push(point);
  }
  
  const minS = Math.min(...data.map(d => d.sharpe));
  const maxS = Math.max(...data.map(d => d.sharpe));
  
  return data.map(d => ({
    ...d,
    isBest: d.sharpe === bestSharpe,
    color: interpolateColor((d.sharpe - minS) / (maxS - minS)),
    fillOpacity: d.sharpe === bestSharpe ? 1 : (0.4 + (((d.sharpe - minS) / (maxS - minS)) * 0.4))
  })).sort((a, b) => a.sharpe - b.sharpe); 
};

const RenderShape = (props: any) => {
  const { cx, cy, fill, payload } = props;
  
  if (payload.isBest) {
    return (
      <g transform={`translate(${cx},${cy})`} style={{ pointerEvents: 'none' }}>
        <defs>
          <filter id="soft-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 1  0 1 0 0 1  0 0 1 0 1  0 0 0 1 0" result="whiteBlur" />
            <feMerge>
              <feMergeNode in="whiteBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
           <filter id="heavy-blur" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
          </filter>
           <filter id="edge-blur" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>

        {/* Floating Animation: Amplitude halved (3px), Duration doubled (8s) */}
        <g>
            <animateTransform 
                attributeName="transform" 
                type="translate" 
                values="0 -3; 0 3; 0 -3" 
                dur="8s" 
                repeatCount="indefinite" 
                calcMode="spline"
                keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
            />
            
            {/* Size reduced to 70% of previous */}
            <g transform="scale(0.7)">
                {/* 1. Radar Ping: Duration 4s, Heavy blur */}
                <circle r="0" fill="#ffffff" opacity="0.3" filter="url(#heavy-blur)">
                    <animate attributeName="r" values="10;60" dur="4s" repeatCount="indefinite" begin="0s" calcMode="spline" keySplines="0.1 0.5 0.2 1" />
                    <animate attributeName="opacity" values="0.4;0" dur="4s" repeatCount="indefinite" begin="0s" />
                </circle>

                {/* 2. Ambient Glow: Duration 6s, Soft glow */}
                <circle r="26" fill="#ffffff" opacity="0.1" filter="url(#soft-glow)">
                    <animate attributeName="r" values="24;32;24" dur="6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.1;0.25;0.1" dur="6s" repeatCount="indefinite" />
                </circle>

                {/* REMOVED: Tech Ring (Dotted Line) */}

                {/* 4. Core: Reduced radius (70% of 10 = 7), Added edge blur filter */}
                <circle r="7" fill="#ffffff" filter="url(#edge-blur)">
                     <animate attributeName="r" values="6;8;6" dur="3s" repeatCount="indefinite" />
                     <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite" />
                </circle>

                 {/* 5. Inner Core Dot: Reduced radius (70% of 5 = 3.5), Added edge blur */}
                 <circle r="3.5" fill="#ffffff" filter="url(#edge-blur)" />
            </g>
        </g>
      </g>
    );
  }
  return (
    <circle cx={cx} cy={cy} r={props.size ? Math.sqrt(props.size) / 2 : 2} fill={fill} fillOpacity={payload.fillOpacity} />
  );
};

export const Hero: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    setData(generateRealisticFrontierData(1000));
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded shadow-xl text-xs z-50">
          <div className="font-bold text-white mb-1">{d.isBest ? t('hero.chart_best') : t('hero.chart_sim')}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-400">
            <span>Max DD:</span> <span className="text-right text-white font-mono">{d.x}%</span>
            <span>Return:</span> <span className="text-right text-emerald-400 font-mono">+{d.y}%</span>
            <span>Sharpe:</span> <span className="text-right text-white font-mono">{d.sharpe.toFixed(2)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative pt-32 pb-24 lg:pt-48 lg:pb-40 overflow-hidden bg-grid">
      {/* Smooth Fade Transition to Next Section */}
      <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[#0B1120] to-transparent pointer-events-none z-10" />

      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left: Copy */}
          <div className="lg:col-span-5 space-y-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              {t('hero.title_line1')} <br />
              <span className="text-emerald-400">{t('hero.title_line2')}</span> <br />
              {t('hero.title_line3')}
            </h1>
            
            <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
               <span dangerouslySetInnerHTML={{ __html: t('hero.desc_sub') }} />
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-full transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:-translate-y-1 flex items-center justify-center gap-2">
                 {t('hero.cta_start')} <ArrowRight size={18} />
              </button>
              
              <button className="px-8 py-4 bg-transparent text-white font-semibold rounded-full border border-fuchsia-500/50 hover:border-fuchsia-500 hover:text-fuchsia-400 hover:bg-fuchsia-500/10 transition-all hover:-translate-y-1 flex items-center justify-center">
                 {t('hero.cta_demo')}
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/5">
               <div>
                  <div className="text-2xl font-bold text-white mb-1">100K+</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">{t('hero.stat_sims')}</div>
               </div>
               <div>
                  <div className="text-2xl font-bold text-emerald-400 mb-1">99.9%</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">{t('hero.stat_accuracy')}</div>
               </div>
               <div>
                  <div className="text-2xl font-bold text-fuchsia-400 mb-1">&lt;50ms</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">{t('hero.stat_latency')}</div>
               </div>
            </div>
          </div>

          {/* Right: Monitor Chart */}
          <div className="lg:col-span-7 relative">
             {/* Decorative labels floating */}
             <div className="absolute -top-6 -right-6 bg-emerald-500/20 backdrop-blur border border-emerald-500/40 text-emerald-300 px-4 py-1 rounded-full text-xs font-bold z-20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                {t('hero.chart_header')}
             </div>
             
             <div className="absolute -bottom-6 -left-6 bg-fuchsia-500 text-white px-6 py-2 rounded-full text-sm font-bold z-20 shadow-[0_0_20px_rgba(217,70,239,0.4)]">
                {t('hero.chart_live')}
             </div>

             {/* The "Monitor" Container */}
             <div className="relative rounded-2xl bg-slate-900/40 border border-slate-700/50 p-2 shadow-2xl backdrop-blur-sm transition-transform hover:scale-[1.01] duration-500">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-800/10 to-transparent rounded-2xl pointer-events-none" />
                
                {/* Screen Inner - Added Glow Here */}
                <div className="bg-[#0f1522] rounded-xl border border-emerald-500/30 shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)] aspect-[16/10] overflow-hidden relative">
                    {/* Grid Background inside chart */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                    
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                        <XAxis 
                            type="number" 
                            dataKey="x" 
                            name="Max Drawdown" 
                            unit="%" 
                            stroke="#475569" 
                            fontSize={10} 
                            tickLine={false}
                            axisLine={{ stroke: '#334155' }}
                            label={{ value: 'Max Drawdown (%)', position: 'insideBottom', offset: -10, fill: '#cbd5e1', fontSize: 10, fontWeight: 700 }}
                        />
                        <YAxis 
                            type="number" 
                            dataKey="y" 
                            name="Return" 
                            unit="%" 
                            stroke="#475569" 
                            fontSize={10} 
                            tickLine={false}
                            axisLine={{ stroke: '#334155' }}
                            label={{ value: 'Calmar Ratio', angle: -90, position: 'insideLeft', fill: '#cbd5e1', fontSize: 10, fontWeight: 700 }}
                        />
                        <ZAxis type="number" dataKey="z" range={[8, 30]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#fff', strokeOpacity: 0.1 }} />
                        <Scatter name="Portfolios" data={data} animationDuration={1000} shape={<RenderShape />}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>

                    {/* Scanner Effect */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent h-[10%] w-full animate-[scan_3s_linear_infinite]" />
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};