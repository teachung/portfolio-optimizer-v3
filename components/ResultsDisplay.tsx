
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Chart, registerables, Plugin, InteractionItem } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { OptimizationResult, OptimizationSettings, StockData, ScatterPoint, Metrics, StockMetrics, MonthlyReturn } from '../types';
import { calculatePortfolioPerformance, calculateMonthlyReturns, calculateAssetRotation, calculateCurrentCyclePositions, sliceStockData, calculateMetrics } from '../services/portfolioCalculator';

Chart.register(...registerables, zoomPlugin);

interface ResultsDisplayProps {
  result: OptimizationResult | null;
  settings: OptimizationSettings | null;
  stockData: StockData | null;
}

interface DisplayPortfolio {
    weights: Record<string, number>;
    metrics: Metrics;
    monthlyReturns?: MonthlyReturn[];
    cashPeriods?: { start: number; end: number }[];
    isUserSelected?: boolean;
    label?: string;
    portfolioValues?: (number|null)[];
}

// --- Constants & Helper Functions ---

const CHART_COLORS = [
  '#ef4444', // Red 500
  '#3b82f6', // Blue 500
  '#10b981', // Emerald 500
  '#f59e0b', // Amber 500
  '#8b5cf6', // Violet 500
  '#ec4899', // Pink 500
  '#06b6d4', // Cyan 500
  '#f97316', // Orange 500
  '#84cc16', // Lime 500
  '#6366f1', // Indigo 500
  '#d946ef', // Fuchsia 500
  '#14b8a6', // Teal 500
  '#eab308', // Yellow 500
  '#f43f5e', // Rose 500
  '#a855f7', // Purple 500
  '#22c55e', // Green 500
  '#0ea5e9', // Sky 500
  '#e11d48', // Rose 600
  '#7c3aed', // Violet 600
  '#db2777', // Pink 600
];

const getUniqueColor = (index: number) => CHART_COLORS[index % CHART_COLORS.length];

const getDownsampledIndices = (total: number, limit = 600): number[] | null => {
    if (total <= limit) return null;
    const step = Math.ceil(total / limit);
    const indices = [];
    for (let i = 0; i < total; i += step) {
        indices.push(i);
    }
    if (indices[indices.length - 1] !== total - 1) {
        indices.push(total - 1);
    }
    return indices;
};

const interpolateColor = (value: number, min: number, max: number, invert: boolean = false) => {
    let normalized = (value - min) / (max - min);
    if (max === min) normalized = 0.5;
    if (normalized < 0) normalized = 0;
    if (normalized > 1) normalized = 1;

    if (invert) {
        normalized = 1 - normalized;
    }

    const r = Math.round(59 + (180 * normalized));
    const g = Math.round(130 - (62 * normalized));
    const b = Math.round(246 - (178 * normalized));

    return `rgba(${r}, ${g}, ${b}, 0.7)`;
};

// --- Components ---

const MetricBox: React.FC<{ label: string; value: string; subValue?: string; positive?: boolean; negative?: boolean; icon?: string }> = ({ label, value, subValue, positive, negative, icon }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl text-center border border-gray-700 shadow-lg hover:border-teal-500/30 transition-all duration-300">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-2">
           {icon && <i className={`fas ${icon}`}></i>} {label}
        </div>
        <div className={`text-2xl font-bold ${positive ? 'text-green-400' : negative ? 'text-red-400' : 'text-sky-400'}`}>{value}</div>
        {subValue && <div className="text-xs text-gray-500 mt-1">{subValue}</div>}
    </div>
);

const SectionHeader: React.FC<{ title: string; icon: string; colorClass?: string; rightElement?: React.ReactNode }> = ({ title, icon, colorClass = "text-teal-400", rightElement }) => (
    <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
        <div className="flex items-center gap-2">
            <i className={`fas ${icon} ${colorClass}`}></i>
            <h3 className="text-lg font-bold text-gray-200">{title}</h3>
        </div>
        {rightElement}
    </div>
);

const CollapsibleSection: React.FC<{ title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean; colorClass?: string }> = ({ title, icon, children, defaultOpen = false, colorClass = "text-teal-400" }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden transition-all duration-300 mb-6">
             <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-800 hover:bg-gray-700/50 transition-colors text-left"
             >
                <div className="flex items-center gap-2">
                    <i className={`fas ${icon} ${isOpen ? colorClass : 'text-gray-500'}`}></i>
                    <h3 className="text-lg font-bold text-gray-200">{title}</h3>
                </div>
                <i className={`fas fa-chevron-down transition-transform duration-300 ${isOpen ? `rotate-180 ${colorClass}` : 'text-gray-600'}`}></i>
             </button>
             {isOpen && (
                 <div className="p-6 border-t border-gray-700 animate-fade-in">
                     {children}
                 </div>
             )}
        </div>
    );
};

interface PriceInfo {
    price: number;
    change: number;
    changePercent: number;
    time: string;
    currency: string;
    error?: boolean;
    source?: string;
}

// ============================================
// 多數據源報價系統
// 優先順序: Yahoo Finance → Finnhub → Alpha Vantage → 最終失敗
// ============================================

// 數據源 1: Yahoo Finance (主要)
const fetchFromYahoo = async (ticker: string): Promise<PriceInfo | null> => {
    try {
        const symbol = ticker.toUpperCase().replace(/\./g, '-');
        const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

        const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error("Yahoo API error");

        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;

        if (meta && meta.regularMarketPrice) {
            return {
                price: meta.regularMarketPrice,
                change: meta.regularMarketPrice - meta.chartPreviousClose,
                changePercent: (meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose * 100,
                time: new Date(meta.regularMarketTime * 1000).toLocaleTimeString(),
                currency: meta.currency || 'USD',
                source: 'Yahoo'
            };
        }
        return null;
    } catch (e) {
        console.warn(`Yahoo failed for ${ticker}:`, e);
        return null;
    }
};

// 數據源 2: Finnhub (免費 API，需要註冊但有免費配額)
const fetchFromFinnhub = async (ticker: string): Promise<PriceInfo | null> => {
    try {
        const symbol = ticker.toUpperCase();
        // 使用免費的 demo token，實際使用建議註冊獲取自己的 key
        const targetUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=demo`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

        const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error("Finnhub API error");

        const data = await res.json();

        if (data && data.c && data.c > 0) {
            return {
                price: data.c, // current price
                change: data.d || 0, // change
                changePercent: data.dp || 0, // change percent
                time: new Date().toLocaleTimeString(),
                currency: 'USD',
                source: 'Finnhub'
            };
        }
        return null;
    } catch (e) {
        console.warn(`Finnhub failed for ${ticker}:`, e);
        return null;
    }
};

// 數據源 3: Twelve Data (免費 API)
const fetchFromTwelveData = async (ticker: string): Promise<PriceInfo | null> => {
    try {
        const symbol = ticker.toUpperCase();
        const targetUrl = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=demo`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

        const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error("TwelveData API error");

        const data = await res.json();

        if (data && data.price && parseFloat(data.price) > 0) {
            return {
                price: parseFloat(data.price),
                change: 0,
                changePercent: 0,
                time: new Date().toLocaleTimeString(),
                currency: 'USD',
                source: 'TwelveData'
            };
        }
        return null;
    } catch (e) {
        console.warn(`TwelveData failed for ${ticker}:`, e);
        return null;
    }
};

// 數據源 4: Marketstack (免費 API)
const fetchFromMarketstack = async (ticker: string): Promise<PriceInfo | null> => {
    try {
        const symbol = ticker.toUpperCase();
        // 使用 demo 模式
        const targetUrl = `http://api.marketstack.com/v1/eod/latest?symbols=${symbol}&access_key=demo`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

        const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error("Marketstack API error");

        const data = await res.json();

        if (data && data.data && data.data[0] && data.data[0].close) {
            const stock = data.data[0];
            return {
                price: stock.close,
                change: stock.close - stock.open,
                changePercent: ((stock.close - stock.open) / stock.open) * 100,
                time: new Date().toLocaleTimeString(),
                currency: 'USD',
                source: 'Marketstack'
            };
        }
        return null;
    } catch (e) {
        console.warn(`Marketstack failed for ${ticker}:`, e);
        return null;
    }
};

// 主獲取函數 - 嘗試多個數據源
const fetchPriceWithFallback = async (ticker: string): Promise<PriceInfo> => {
    // 按優先順序嘗試各數據源
    const sources = [
        fetchFromYahoo,
        fetchFromFinnhub,
        fetchFromTwelveData,
        fetchFromMarketstack
    ];

    for (const fetchFn of sources) {
        const result = await fetchFn(ticker);
        if (result && result.price > 0) {
            return result;
        }
    }

    // 所有數據源都失敗
    return {
        price: 0,
        change: 0,
        changePercent: 0,
        time: '-',
        currency: '',
        error: true,
        source: 'None'
    };
};

const RealTimePriceChecker: React.FC<{ weights: Record<string, number> }> = ({ weights }) => {
    // Limit to top 20 active tickers to prevent flooding API and blocking UI
    const activeTickers = useMemo(() =>
        Object.keys(weights)
            .filter(t => weights[t] > 0.001)
            .sort((a,b) => weights[b] - weights[a])
            .slice(0, 20)
    , [weights]);

    const [prices, setPrices] = useState<Record<string, PriceInfo | null>>({});
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [investmentAmount, setInvestmentAmount] = useState<string>("100000");

    const fetchAllPrices = async () => {
        if (activeTickers.length === 0) return;
        setLoading(true);
        const newPrices: Record<string, PriceInfo | null> = {};

        // 使用多數據源獲取報價
        const fetchOne = async (ticker: string) => {
            newPrices[ticker] = await fetchPriceWithFallback(ticker);
        };

        // Batch requests to avoid browser limit, though activeTickers is already capped
        await Promise.all(activeTickers.map(t => fetchOne(t)));

        setPrices(newPrices);
        setLastUpdated(new Date().toLocaleTimeString());
        setLoading(false);
    };

    useEffect(() => {
        fetchAllPrices();
    }, [activeTickers]);

    // Calculate Shares and Formula
    const { formula, calculations, tradingViewUrl } = useMemo(() => {
        const parts: string[] = [];
        const calcs: Record<string, { shares: number, cost: number }> = {};
        const amount = parseFloat(investmentAmount) || 0;
        
        activeTickers.forEach(t => {
            const priceInfo = prices[t];
            const weight = weights[t];
            
            if (priceInfo && priceInfo.price > 0 && !priceInfo.error) {
                const targetVal = amount * weight;
                const shares = Math.round(targetVal / priceInfo.price);
                calcs[t] = { shares, cost: targetVal };
                parts.push(`${t}*${shares}`);
            } else {
                calcs[t] = { shares: 0, cost: 0 };
            }
        });
        
        const formulaStr = parts.join('+');
        // Construct TradingView URL: symbol=(A*1+B*2)
        const tvUrl = formulaStr ? `https://www.tradingview.com/chart/?symbol=${encodeURIComponent('(' + formulaStr + ')')}` : '';

        return { formula: formulaStr, calculations: calcs, tradingViewUrl: tvUrl };
    }, [weights, prices, activeTickers, investmentAmount]);

    const copyToClipboard = () => {
        if (!formula) return;
        navigator.clipboard.writeText(formula);
        const btn = document.getElementById('copyBtn');
        if(btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> 已複製';
            setTimeout(() => { btn.innerHTML = original; }, 2000);
        }
    };

    return (
        <CollapsibleSection title={`組合成分股 即時報價與下單計算 (Top ${activeTickers.length})`} icon="fa-calculator" colorClass="text-green-400" defaultOpen={true}>
            <div className="flex flex-col gap-4">
                {/* Controls Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-gray-700 gap-4">
                     <div className="flex items-center gap-3 w-full md:w-auto">
                         <label className="text-sm text-gray-400 whitespace-nowrap"><i className="fas fa-coins mr-1"></i>總投資金額 (USD):</label>
                         <input 
                            type="number" 
                            value={investmentAmount} 
                            onChange={(e) => setInvestmentAmount(e.target.value)}
                            className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1.5 text-sm w-32 focus:ring-1 focus:ring-green-500 outline-none font-bold text-right"
                         />
                     </div>
                     
                     <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                         <div className="text-xs text-gray-500 hidden md:block">
                             <i className="fas fa-clock mr-1"></i>更新: {lastUpdated || '-'}
                         </div>
                         <button 
                            onClick={fetchAllPrices}
                            disabled={loading}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                         >
                            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
                            刷新報價
                         </button>
                     </div>
                </div>

                {/* Formula Box */}
                {formula && (
                    <div className="bg-gray-900 border border-teal-500/30 rounded-lg p-3 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col overflow-hidden w-full">
                            <span className="text-[10px] text-teal-400 uppercase tracking-wider font-bold mb-1">Trading Formula (Top Holdings)</span>
                            <code className="text-sm text-gray-300 font-mono truncate">{formula}</code>
                        </div>
                        <div className="flex gap-2 shrink-0">
                             <a 
                                href={tradingViewUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-[#2962FF] hover:bg-[#1E53E5] text-white px-3 py-1.5 rounded text-xs flex items-center gap-1 font-bold transition-all whitespace-nowrap border border-transparent shadow-lg shadow-blue-900/50"
                                title="在 TradingView 查看組合走勢"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path d="M21 7a.75.75 0 01-.75.75H18v9.75A2.25 2.25 0 0115.75 19.5h-1.5A2.25 2.25 0 0112 17.25V9.75H9.75A2.25 2.25 0 017.5 12h-1.5A2.25 2.25 0 013.75 9.75V5.25A.75.75 0 014.5 4.5h15A.75.75 0 0121 7z" /> 
                                    <path d="M3.75 11.25a.75.75 0 01.75.75v5.25c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75v-3.75h2.25v6a.75.75 0 00.75.75h1.5a.75.75 0 00.75-.75v-8.25h2.25v2.25a.75.75 0 00.75-.75h1.5a.75.75 0 00.75-.75v-3.75h.75a.75.75 0 010 1.5H2.25a.75.75 0 010-1.5h.75z" />
                                </svg>
                                TradingView
                            </a>
                            <button 
                                id="copyBtn"
                                onClick={copyToClipboard}
                                className="bg-gray-800 hover:bg-gray-700 text-teal-400 border border-gray-600 px-3 py-1.5 rounded text-xs flex items-center gap-1 whitespace-nowrap transition-all"
                            >
                                <i className="fas fa-copy"></i> 複製
                            </button>
                        </div>
                    </div>
                )}

                {/* Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {activeTickers.map(ticker => {
                        const info = prices[ticker];
                        const calc = calculations[ticker];
                        const isUp = info && info.change >= 0;
                        const isError = info && info.error;

                        return (
                            <div key={ticker} className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 relative overflow-hidden group hover:border-green-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-gray-200 text-lg">{ticker}</span>
                                    {info && !isError && <span className="text-[10px] text-gray-500">{info.currency}</span>}
                                </div>
                                
                                {loading && !info ? (
                                    <div className="h-16 flex items-center justify-center">
                                        <i className="fas fa-circle-notch fa-spin text-green-500"></i>
                                    </div>
                                ) : isError ? (
                                    <div className="text-xs text-red-400 py-4 text-center">
                                        <i className="fas fa-exclamation-triangle mr-1"></i>
                                        所有數據源失敗
                                    </div>
                                ) : info ? (
                                    <div className="space-y-2">
                                        <div>
                                            <div className={`text-xl font-bold leading-none ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                                                {info.price.toFixed(2)}
                                            </div>
                                            <div className={`text-[10px] flex items-center gap-1 mt-1 ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                                                <i className={`fas ${isUp ? 'fa-caret-up' : 'fa-caret-down'}`}></i>
                                                {Math.abs(info.change).toFixed(2)} ({Math.abs(info.changePercent).toFixed(2)}%)
                                            </div>
                                            {info.source && (
                                                <div className="text-[9px] text-gray-500 mt-0.5">
                                                    via {info.source}
                                                </div>
                                            )}
                                        </div>
                                        {calc && (
                                            <div className="pt-2 border-t border-gray-700/50">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xs text-gray-400">數量</span>
                                                    <span className="text-base font-bold text-yellow-400">{calc.shares}</span>
                                                </div>
                                                <div className="text-[10px] text-gray-500 text-right">
                                                    ≈ ${(calc.cost).toLocaleString(undefined, {maximumFractionDigits:0})}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-500 py-4 text-center">等待數據...</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </CollapsibleSection>
    );
};

const MarketCycleClock: React.FC<{ weights: Record<string, number>, stockData: StockData, portfolioValues: (number|null)[], colorMap: Record<string, string> }> = ({ weights, stockData, portfolioValues, colorMap }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Limit to top 20 for rotation analysis to improve performance
    const cycleData = useMemo(() => {
        if (!stockData || !portfolioValues) return [];
        // Only consider top 20 weighted assets for cycle calculation
        const topTickers = Object.keys(weights)
            .sort((a,b) => weights[b] - weights[a])
            .slice(0, 20);
        
        const filteredWeights: Record<string, number> = {};
        topTickers.forEach(t => filteredWeights[t] = weights[t]);

        return calculateCurrentCyclePositions(filteredWeights, stockData, portfolioValues);
    }, [weights, stockData, portfolioValues]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = 320;
        canvas.width = size;
        canvas.height = size;
        const center = size / 2;
        const radius = size * 0.4;

        ctx.clearRect(0, 0, size, size);

        // Draw Quadrants
        ctx.fillStyle = 'rgba(74, 222, 128, 0.05)'; ctx.fillRect(center, 0, center, center);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.05)'; ctx.fillRect(center, center, center, center);
        ctx.fillStyle = 'rgba(248, 113, 113, 0.05)'; ctx.fillRect(0, center, center, center);
        ctx.fillStyle = 'rgba(96, 165, 250, 0.05)'; ctx.fillRect(0, 0, center, center);

        // Draw Circle
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Axes
        ctx.beginPath();
        ctx.moveTo(center, 0); ctx.lineTo(center, size);
        ctx.moveTo(0, center); ctx.lineTo(size, center);
        ctx.strokeStyle = '#374151';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);

        // Labels
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#4ade80'; ctx.fillText('領先 (Leading)', center + radius/2, center - radius/2);
        ctx.fillStyle = '#facc15'; ctx.fillText('轉弱 (Weakening)', center + radius/2, center + radius/2);
        ctx.fillStyle = '#f87171'; ctx.fillText('落後 (Lagging)', center - radius/2, center + radius/2);
        ctx.fillStyle = '#60a5fa'; ctx.fillText('改善 (Improving)', center - radius/2, center - radius/2);

        // Clockwise Arrow
        ctx.beginPath();
        ctx.arc(center, center, radius + 15, -Math.PI/2 + 0.2, Math.PI/2 - 0.2); 
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Plot Stocks
        cycleData.forEach((item, index) => {
            const r = Math.min(item.radius * 2, radius * 0.9); 
            const angleRad = item.angle * (Math.PI / 180);
            const x = center + r * Math.cos(angleRad);
            const y = center - r * Math.sin(angleRad);
            
            const color = colorMap[item.ticker] || '#ccc';
            
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.fillStyle = '#e5e7eb';
            ctx.font = '10px Arial';
            const offsetX = x > center ? 10 : -10;
            const offsetY = y > center ? 10 : -10;
            ctx.textAlign = x > center ? 'left' : 'right';
            ctx.fillText(item.ticker, x + offsetX, y + offsetY);
        });

    }, [cycleData, colorMap]);

    return (
        <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
            <div className="relative">
                <canvas ref={canvasRef} className="max-w-full"></canvas>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 max-w-sm">
                <h4 className="text-teal-400 font-bold mb-2 border-b border-gray-700 pb-1">
                    <i className="fas fa-sync-alt mr-2"></i>輪動順序 (Top {cycleData.length})
                </h4>
                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {cycleData.map((item, idx) => (
                        <div key={item.ticker} className="flex items-center justify-between text-xs p-1 hover:bg-gray-800 rounded">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{backgroundColor: colorMap[item.ticker] || '#ccc'}}>
                                    {idx + 1}
                                </span>
                                <span className="text-gray-300 font-bold">{item.ticker}</span>
                            </div>
                            <span className="text-gray-500">
                                {item.angle >= 0 && item.angle < 90 ? '領先' : 
                                 item.angle >= 90 && item.angle < 180 ? '改善' :
                                 item.angle >= 180 && item.angle < 270 ? '落後' : '轉弱'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const cashPeriodsPlugin = (cashPeriods?: { start: number; end: number }[], highlightRanges?: { start: string, end: string }[], dates?: string[]): Plugin => ({
    id: 'cashPeriodsPlugin',
    beforeDraw: (chart) => {
        const { ctx, chartArea: { top, bottom, left, right }, scales: { x } } = chart;
        
        // 1. Draw Cash Periods
        if (cashPeriods && cashPeriods.length > 0) {
            ctx.save();
            ctx.fillStyle = 'rgba(107, 114, 128, 0.15)';
            cashPeriods.forEach(period => {
                const start = x.getPixelForValue(period.start);
                const end = x.getPixelForValue(period.end);
                if (!isNaN(start) && !isNaN(end) && end > start) {
                    ctx.fillRect(start, top, end - start, bottom - top);
                }
            });
            ctx.restore();
        }

        // 2. Draw Highlight Ranges (Stress Test Box)
        if (highlightRanges && highlightRanges.length > 0 && dates && dates.length > 0) {
            ctx.save();
            highlightRanges.forEach((range, idx) => {
                // Find indices matching the date range.
                // Using findIndex and iteration to be robust against downsampled chart dates.
                let startIndex = dates.findIndex(d => d >= range.start);
                // If range starts before the first data point, clamp to 0
                if (startIndex === -1 && range.start < dates[0]) startIndex = 0;
                
                let endIndex = -1;
                // Find last date <= range.end
                for (let i = dates.length - 1; i >= 0; i--) {
                    if (dates[i] <= range.end) {
                        endIndex = i;
                        break;
                    }
                }
                // If range ends after the last data point, clamp to end
                if (endIndex === -1 && range.end > dates[dates.length - 1]) endIndex = dates.length - 1;

                if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
                    const startPixel = x.getPixelForValue(startIndex);
                    const endPixel = x.getPixelForValue(endIndex);
                    
                    // Constrain to chart area
                    const drawStart = Math.max(left, startPixel);
                    const drawEnd = Math.min(right, endPixel);
                    const drawWidth = drawEnd - drawStart;
                    
                    if (drawWidth > 0) {
                        // Yellow Box Background
                        ctx.fillStyle = 'rgba(234, 179, 8, 0.15)'; 
                        ctx.fillRect(drawStart, top, drawWidth, bottom - top);
                        
                        // Yellow Border
                        ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(drawStart, top, drawWidth, bottom - top);
                        
                        // Label
                        ctx.fillStyle = '#eab308';
                        ctx.font = 'bold 12px Arial';
                        // Adjust Y position for multiple ranges
                        ctx.fillText(`Stress Test ${idx + 1}`, drawStart + 5, top + 15 + (idx * 15));
                    }
                }
            });
            ctx.restore();
        }
    }
});

const MonthlyReturnsTable: React.FC<{ returns?: MonthlyReturn[] }> = ({ returns }) => {
    const yearData = useMemo(() => {
        if (!returns || returns.length === 0) return {};
        const data: Record<number, Record<number, number>> = {};
        returns.forEach(r => {
            if (!data[r.year]) data[r.year] = {};
            data[r.year][r.month] = r.value;
        });
        return data;
    }, [returns]);

    const years = Object.keys(yearData).map(Number).sort((a, b) => b - a);

    const getBgColor = (val: number | undefined) => {
        if (val === undefined) return 'bg-transparent';
        if (val === 0) return 'bg-gray-700/30 text-gray-400';
        
        // Opacity based on magnitude, cap at 15%
        const intensity = Math.min(Math.abs(val) / 0.15, 1); 
        // 0.1 to 0.9 opacity range
        const opacity = 0.1 + (intensity * 0.8);
        
        if (val > 0) {
            return `bg-[rgba(16,185,129,${opacity})] text-white`;
        } else {
            return `bg-[rgba(239,68,68,${opacity})] text-white`;
        }
    };

    if (years.length === 0) return null;

    return (
        <div className="overflow-x-auto custom-scrollbar mt-6">
            <table className="w-full text-xs text-center border-collapse">
                <thead>
                    <tr>
                        <th className="p-2 text-gray-400 border-b border-gray-700 text-left">Year</th>
                        {Array.from({length: 12}).map((_, i) => (
                            <th key={i} className="p-2 text-gray-400 border-b border-gray-700 w-12">{i+1}月</th>
                        ))}
                        <th className="p-2 text-white font-bold border-b border-gray-700">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {years.map(year => {
                        const months = yearData[year];
                        let totalReturn = 1;
                        let hasData = false;
                        for(let m=1; m<=12; m++) {
                            if (months[m] !== undefined) {
                                totalReturn *= (1 + months[m]);
                                hasData = true;
                            }
                        }
                        const yearTotal = hasData ? totalReturn - 1 : 0;

                        return (
                            <tr key={year} className="hover:bg-gray-800/50 transition-colors">
                                <td className="p-2 text-gray-300 font-medium border-b border-gray-800 text-left">{year}</td>
                                {Array.from({length: 12}).map((_, i) => {
                                    const val = months[i+1];
                                    return (
                                        <td key={i} className={`p-2 border-b border-gray-800 border-l border-gray-800/50 ${getBgColor(val)}`}>
                                            {val !== undefined ? (val * 100).toFixed(1) + '%' : '-'}
                                        </td>
                                    );
                                })}
                                <td className={`p-2 border-b border-gray-800 font-bold ${yearTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {(yearTotal * 100).toFixed(1)}%
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const MonthlyReturnsChart: React.FC<{ returns?: MonthlyReturn[], metrics?: Metrics }> = ({ returns, metrics }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (!returns || returns.length === 0 || !chartRef.current) return;
        
        if (chartInstance.current) chartInstance.current.destroy();

        const sortedReturns = [...returns].sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        const labels = sortedReturns.map(r => `${r.year}-${String(r.month).padStart(2, '0')}`);
        const data = sortedReturns.map(r => r.value * 100);
        const backgroundColors = data.map(v => v >= 0 ? 'rgba(74, 222, 128, 0.7)' : 'rgba(248, 113, 113, 0.7)');

        chartInstance.current = new Chart(chartRef.current, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: '月度回報 (%)',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 0,
                    borderRadius: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#9ca3af', font: { size: 10 } }, grid: { display: false } },
                    y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });

        return () => { if(chartInstance.current) chartInstance.current.destroy(); };
    }, [returns]);

    if (!returns || returns.length === 0) return null;

    const stats = useMemo(() => {
        if (!returns) return null;
        const values = returns.map(r => r.value);
        const winRate = (values.filter(v => v > 0).length / values.length) * 100;
        const stdDev = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - (values.reduce((a,b)=>a+b,0)/values.length), 2), 0) / values.length) * 100;
        return { winRate, stdDev };
    }, [returns]);

    return (
        <div>
            <div className="grid grid-cols-3 gap-4 mb-4">
                 <div className="text-center p-2 bg-gray-900/30 rounded border border-gray-700">
                     <div className="text-xs text-gray-500">增長線性度 (R²)</div>
                     <div className="text-lg font-bold text-teal-400">{metrics?.smoothness?.toFixed(4) || '-'}</div>
                 </div>
                 <div className="text-center p-2 bg-gray-900/30 rounded border border-gray-700">
                     <div className="text-xs text-gray-500">月度波動率 (StdDev)</div>
                     <div className="text-lg font-bold text-yellow-400">{stats?.stdDev.toFixed(2) || '-'}%</div>
                 </div>
                 <div className="text-center p-2 bg-gray-900/30 rounded border border-gray-700">
                     <div className="text-xs text-gray-500">月度勝率 (Positive)</div>
                     <div className="text-lg font-bold text-green-400">{stats?.winRate.toFixed(1) || '-'}%</div>
                 </div>
            </div>
            <div className="h-64"><canvas ref={chartRef}></canvas></div>
            <MonthlyReturnsTable returns={returns} />
        </div>
    );
};

const AssetRotationChart: React.FC<{ weights: Record<string, number>, stockData: StockData, portfolioValues: (number|null)[], downsampleStep: number, colorMap: Record<string, string> }> = ({ weights, stockData, portfolioValues, downsampleStep, colorMap }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    // Limit to Top 20 for rotation chart
    useEffect(() => {
        if (!portfolioValues || portfolioValues.length === 0 || !chartRef.current) return;
        if (chartInstance.current) chartInstance.current.destroy();

        const topTickers = Object.keys(weights)
            .sort((a,b) => weights[b] - weights[a])
            .slice(0, 20);
            
        const filteredWeights: Record<string, number> = {};
        topTickers.forEach(t => filteredWeights[t] = weights[t]);

        const rotationData = calculateAssetRotation(filteredWeights, stockData, portfolioValues, 20, downsampleStep);
        const rotationDatasets: any[] = [];
        
        Object.entries(rotationData).forEach(([ticker, data]) => {
            const color = colorMap[ticker as string] || '#ccc';
            const points = data.x.map((xVal, i) => ({ x: xVal, y: data.y[i] }));
            
            rotationDatasets.push({
                label: ticker,
                data: points,
                borderColor: color,
                backgroundColor: color,
                showLine: true,
                borderWidth: 1.5,
                pointRadius: (ctx: any) => {
                    const index = ctx.dataIndex;
                    const count = ctx.dataset.data.length;
                    return index === count - 1 ? 4 : 0; 
                },
                pointHoverRadius: 6,
            });
        });

        chartInstance.current = new Chart(chartRef.current, {
            type: 'scatter',
            data: { datasets: rotationDatasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, labels: { color: '#9ca3af', boxWidth: 10, usePointStyle: true } },
                },
                scales: {
                    x: { 
                        title: { display: true, text: '相對強弱 (Trend)', color: '#9ca3af' },
                        ticks: { color: '#9ca3af' }, 
                        grid: { color: (ctx) => ctx.tick.value === 100 ? '#ffffff' : 'rgba(255,255,255,0.1)', lineWidth: (ctx) => ctx.tick.value === 100 ? 2 : 1 },
                        suggestedMin: 95, suggestedMax: 105
                    },
                    y: { 
                        title: { display: true, text: '動能 (Momentum)', color: '#9ca3af' },
                        ticks: { color: '#9ca3af' }, 
                        grid: { color: (ctx) => ctx.tick.value === 100 ? '#ffffff' : 'rgba(255,255,255,0.1)', lineWidth: (ctx) => ctx.tick.value === 100 ? 2 : 1 },
                        suggestedMin: 95, suggestedMax: 105
                    }
                }
            },
            plugins: [{
                id: 'quadrantLabels',
                afterDraw: (chart) => {
                    const { ctx, chartArea: { left, right, top, bottom }, scales: { x, y } } = chart;
                    const centerX = x.getPixelForValue(100);
                    const centerY = y.getPixelForValue(100);
                    ctx.save();
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    if(right > centerX && top < centerY) { ctx.fillStyle = 'rgba(74, 222, 128, 0.8)'; ctx.fillText('領先 (Leading)', (centerX + right)/2, (centerY + top)/2); }
                    if(right > centerX && bottom > centerY) { ctx.fillStyle = 'rgba(250, 204, 21, 0.8)'; ctx.fillText('轉弱 (Weakening)', (centerX + right)/2, (centerY + bottom)/2); }
                    if(left < centerX && bottom > centerY) { ctx.fillStyle = 'rgba(248, 113, 113, 0.8)'; ctx.fillText('落後 (Lagging)', (centerX + left)/2, (centerY + bottom)/2); }
                    if(left < centerX && top < centerY) { ctx.fillStyle = 'rgba(96, 165, 250, 0.8)'; ctx.fillText('改善 (Improving)', (centerX + left)/2, (centerY + top)/2); }
                    ctx.restore();
                }
            }]
        });

        return () => { if(chartInstance.current) chartInstance.current.destroy(); };
    }, [weights, stockData, portfolioValues, colorMap]);

    return <div className="h-96"><canvas ref={chartRef}></canvas></div>;
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, settings, stockData }) => {
    const performanceChartRef = useRef<HTMLCanvasElement>(null);
    const drawdownChartRef = useRef<HTMLCanvasElement>(null);
    const scatterChartRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const performanceChartInstance = useRef<Chart | null>(null);
    const drawdownChartInstance = useRef<Chart | null>(null);
    const scatterChartInstance = useRef<Chart | null>(null);
    
    const [isLogScale, setIsLogScale] = useState(false);
    const [chartMode, setChartMode] = useState<'maxDD' | 'winRate' | 'calmar' | 'stdDev'>('calmar'); 
    const [scatterData, setScatterData] = useState<ScatterPoint[]>([]);
    const [selectedPoint, setSelectedPoint] = useState<ScatterPoint | null>(null);
    const [comparisonTickers, setComparisonTickers] = useState<Set<string>>(new Set());

    // Imported Portfolio State
    const [importedPortfolio, setImportedPortfolio] = useState<{weights: Record<string, number>, metrics: Metrics} | null>(null);

    // Period Optimization State
    const [periodStart, setPeriodStart] = useState<string>('');
    const [periodEnd, setPeriodEnd] = useState<string>('');
    const [periodStart2, setPeriodStart2] = useState<string>('');
    const [periodEnd2, setPeriodEnd2] = useState<string>('');
    const [showSecondPeriod, setShowSecondPeriod] = useState(false);
    
    const [rangeOptimizedPoint, setRangeOptimizedPoint] = useState<ScatterPoint | null>(null);
    const [isSearchingRange, setIsSearchingRange] = useState(false);

    // Portfolio Mixer State
    const [mixRatio, setMixRatio] = useState<number>(0.5); // 0.5 = 50% Best AI, 50% Range Winner
    const [showMixerTool, setShowMixerTool] = useState<boolean>(false); // Control overall visibility of Mixer UI

    // Reset dates when stock data changes, do not auto-fill to avoid "Stress Test Box" appearing by default
    useEffect(() => {
        setPeriodStart('');
        setPeriodEnd('');
        setPeriodStart2('');
        setPeriodEnd2('');
        setRangeOptimizedPoint(null);
    }, [stockData]);

    const fillLastYearDates = () => {
        if (stockData && stockData.dates.length > 0) {
            const lastDate = stockData.dates[stockData.dates.length - 1];
            const oneYearAgoIndex = Math.max(0, stockData.dates.length - 252);
            const oneYearAgo = stockData.dates[oneYearAgoIndex];
            setPeriodStart(oneYearAgo);
            setPeriodEnd(lastDate);
        }
    };

    const toggleComparison = (ticker: string) => {
        setComparisonTickers(prev => {
            const next = new Set<string>(prev); // Explicit generic type for Set
            if (next.has(ticker)) next.delete(ticker);
            else next.add(ticker);
            return next;
        });
    };

    const handleImportPortfolio = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !stockData) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split(/\r?\n/);
            const newWeights: Record<string, number> = {};
            
            // Ticker map for case insensitivity
            const tickerMap = new Map(stockData.tickers.map(t => [t.toLowerCase(), t]));

            lines.forEach((line, idx) => {
                if(idx === 0 && line.toLowerCase().includes('symbol')) return; // skip header
                const parts = line.split(',');
                if(parts.length < 2) return;
                
                const symbolRaw = parts[0].trim().toLowerCase();
                const weightRaw = parts[1].trim().replace('%', '');
                
                const realTicker = tickerMap.get(symbolRaw);
                const weightVal = parseFloat(weightRaw);

                if(realTicker && !isNaN(weightVal)) {
                    newWeights[realTicker] = weightVal / 100; // Assuming input is 23.43 for 23.43%
                }
            });

            // Calculate Metrics for the imported portfolio using historical data
            // Default to quarterly rebalance for static imports unless settings exist, no hedging
            const perf = calculatePortfolioPerformance(newWeights, stockData, settings?.rebalanceMode || 'quarterly', settings?.hedgeConfig, settings?.dynamicRebalanceThreshold || 0, 0);
            const metrics = calculateMetrics(perf.portfolioValues, stockData.dates);
            
            if(metrics) {
                // Add calculation for smoothness/winrate if missing from standard calc
                metrics.winRate = perf.winRate;
                metrics.smoothness = perf.smoothness;
                
                setImportedPortfolio({ weights: newWeights, metrics });
                setSelectedPoint(null); // Clear selected point to show imported
                setRangeOptimizedPoint(null); // Clear range point
            } else {
                alert('無法計算導入組合的績效 (數據不足)');
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    };

    const handlePeriodAnalyze = async () => {
        if (!stockData || !result?.scatterPoints || !periodStart || !periodEnd || isSearchingRange) return;

        setIsSearchingRange(true);
        const ranges = [{ start: periodStart, end: periodEnd }];
        if (showSecondPeriod && periodStart2 && periodEnd2) {
            ranges.push({ start: periodStart2, end: periodEnd2 });
        }

        setTimeout(() => {
            try {
                const slices = ranges.map(r => sliceStockData(stockData, r.start, r.end));
                if (slices.some(s => s.dates.length < 5)) {
                     alert("選定的日期範圍數據不足 (至少需要 5 天)");
                     setIsSearchingRange(false);
                     return;
                }

                let bestWeights = null;
                let bestScore = -Infinity;
                let bestRangeMetric: Metrics | null = null;
                const rebalanceMode = 'quarterly'; 

                for (const point of result.scatterPoints) {
                    let totalCompReturn = 1;
                    let maxCompDD = 0;
                    for (const sData of slices) {
                        const perf = calculatePortfolioPerformance(point.weights, sData, rebalanceMode, { enabled: false, shortMAPeriod: 0, longMAPeriod: 0, reentryStrategy: 'golden_cross' }, 0, 0);
                        const values = perf.portfolioValues.filter(v => v !== null) as number[];
                        if (values.length < 2) continue;
                        const ret = (values[values.length - 1] - values[0]) / values[0];
                        const ddValues = perf.drawdowns.filter(d => d !== null) as number[];
                        const dd = ddValues.length > 0 ? Math.abs(Math.min(...ddValues)) / 100 : 0;
                        totalCompReturn *= (1 + ret);
                        maxCompDD = Math.max(maxCompDD, dd);
                    }
                    const compositeReturn = totalCompReturn - 1;
                    const score = compositeReturn / (maxCompDD + 0.02);
                    if (score > bestScore) {
                        bestScore = score;
                        bestWeights = point.weights;
                        bestRangeMetric = {
                            cagr: compositeReturn,
                            maxDD: maxCompDD,
                            sharpe: 0, volatility: 0, sortino: 0, calmar: score
                        };
                    }
                }

                if (bestWeights && bestRangeMetric) {
                    const fullHistoryPerf = calculatePortfolioPerformance(bestWeights, stockData, 'quarterly', { enabled: false, shortMAPeriod: 0, longMAPeriod: 0, reentryStrategy: 'golden_cross' }, 0, 0);
                    const fullBaseMetrics = calculateMetrics(fullHistoryPerf.portfolioValues, stockData.dates);
                    if (fullBaseMetrics) {
                        const fullMetrics: Metrics = {
                            ...fullBaseMetrics,
                            winRate: fullHistoryPerf.winRate,
                            smoothness: fullHistoryPerf.smoothness
                        };
                        const rangePt = {
                            x: 0, y: 0,
                            weights: bestWeights,
                            metrics: fullMetrics,
                            score: bestRangeMetric.calmar,
                            label: showSecondPeriod ? '區間王者 (雙時段)' : `區間王者 (${periodStart} ~ ${periodEnd})`,
                            portfolioValues: fullHistoryPerf.portfolioValues 
                        };
                        setRangeOptimizedPoint(rangePt);
                    }
                }
            } catch (e) {
                console.error(e);
                alert("區間分析時發生錯誤");
            } finally {
                setIsSearchingRange(false);
            }
        }, 100);
    };

    const tickerColorMap = useMemo(() => {
        const map: Record<string, string> = {};
        if (stockData) {
            stockData.tickers.forEach((t: string, i: number) => {
                map[t] = getUniqueColor(i);
            });
        }
        return map;
    }, [stockData]);
    
    const currentData: (DisplayPortfolio & { originalPortfolioValues?: (number|null)[] }) | null = useMemo(() => {
        if (!stockData || !settings || !result) return null;
        let baseData: { weights: Record<string, number>, metrics: Metrics, label: string, isUserSelected: boolean };
        
        if (selectedPoint) {
            baseData = { weights: selectedPoint.weights, metrics: selectedPoint.metrics, label: selectedPoint.label || '目前選擇', isUserSelected: true };
        } else if (importedPortfolio) {
            baseData = { weights: importedPortfolio.weights, metrics: importedPortfolio.metrics, label: '導入組合 (Imported)', isUserSelected: true };
        } else {
            baseData = { weights: result.weights, metrics: result.metrics, label: '最佳 AI 配置', isUserSelected: false };
        }

        const isBaseline = baseData.label === 'Original';
        const calcRebalance = isBaseline ? 'quarterly' : settings.rebalanceMode;
        const calcHedge = isBaseline ? { enabled: false, shortMAPeriod: 0, longMAPeriod: 0, reentryStrategy: 'golden_cross' as const } : settings.hedgeConfig;
        const calcThreshold = isBaseline ? 0 : settings.dynamicRebalanceThreshold;

        // Optimization: Pass 0 as step to skip daily weight tracking (asset allocation history removed)
        const perf = calculatePortfolioPerformance(baseData.weights, stockData, calcRebalance, calcHedge, calcThreshold, 0);
        const monthly = calculateMonthlyReturns(perf.portfolioValues, stockData.dates);
             
        return {
            weights: baseData.weights, metrics: baseData.metrics, monthlyReturns: monthly, cashPeriods: perf.cashPeriods,
            isUserSelected: baseData.isUserSelected, label: baseData.label, portfolioValues: perf.portfolioValues
        };
    }, [result, selectedPoint, importedPortfolio, stockData, settings]);

    // Calculate Mixed Portfolio
    const mixedPortfolioResult = useMemo(() => {
        if (!result || !rangeOptimizedPoint || !currentData) return null;
        
        // Use AI Portfolio from result and Range Winner
        const aiWeights = result.weights;
        const rangeWeights = rangeOptimizedPoint.weights;
        const aiValues = currentData.portfolioValues || [];
        // We need Range Winner performance calculated on full range
        const rangeValues = rangeOptimizedPoint.portfolioValues || [];

        const aiRatio = mixRatio;
        const rangeRatio = 1 - mixRatio;

        const mixedWeights: Record<string, number> = {};
        const allTickers = new Set<string>([...Object.keys(aiWeights), ...Object.keys(rangeWeights)]);
        allTickers.forEach(t => {
            mixedWeights[t] = (aiWeights[t] || 0) * aiRatio + (rangeWeights[t] || 0) * rangeRatio;
        });

        const mixedValues = aiValues.map((v, i) => {
            const rv = rangeValues[i];
            if (v === null || rv === null || rv === undefined) return null;
            return v * aiRatio + rv * rangeRatio;
        });

        return { weights: mixedWeights, portfolioValues: mixedValues };
    }, [result, rangeOptimizedPoint, currentData, mixRatio]);

    useEffect(() => { if (result?.scatterPoints) setScatterData(result.scatterPoints); }, [result]);
    useEffect(() => { 
        setSelectedPoint(null); 
        setRangeOptimizedPoint(null); 
        setShowMixerTool(false); 
        setImportedPortfolio(null); // Clear imported on new result
    }, [result]);

    const activeTickers = useMemo<string[]>(() => {
        if (!currentData) return [];
        return Object.keys(currentData.weights)
            .filter(t => currentData.weights[t] > 0.001)
            .sort((a, b) => (currentData.weights[b] || 0) - (currentData.weights[a] || 0));
    }, [currentData]);

    useEffect(() => {
        if (currentData && stockData && performanceChartRef.current && drawdownChartRef.current && settings) {
             if (performanceChartInstance.current) performanceChartInstance.current.destroy();
             if (drawdownChartInstance.current) drawdownChartInstance.current.destroy();

            const isBaseline = currentData.label === 'Original';
            const perf = calculatePortfolioPerformance(
                currentData.weights, stockData, isBaseline ? 'quarterly' : settings.rebalanceMode,
                isBaseline ? { enabled: false, shortMAPeriod: 0, longMAPeriod: 0, reentryStrategy: 'golden_cross' } : settings.hedgeConfig,
                isBaseline ? 0 : settings.dynamicRebalanceThreshold, 0
            );

            const indices = getDownsampledIndices(stockData.dates.length, 600);
            const chartDates = indices ? indices.map(i => stockData.dates[i]) : stockData.dates;
            const downsampleData = (data: (number|null)[]) => indices ? indices.map(i => data[i]) : data;

            const portfolioVals = downsampleData(perf.portfolioValues);
            const chartData = isLogScale ? portfolioVals : downsampleData(perf.portfolioValues.map(v => v === null ? null : (v - 100)));

            const datasets: any[] = [{
                label: currentData.label || '投資組合價值',
                data: chartData,
                borderColor: currentData.isUserSelected ? (currentData.label === 'Original' ? '#60a5fa' : '#f472b6') : '#2dd4bf', 
                backgroundColor: 'rgba(45, 212, 191, 0.1)',
                borderWidth: 2, fill: true, tension: 0.1, pointRadius: 0, order: 2
            }];

            if (result?.userPortfolioResult && currentData.label !== 'Original') {
                 const userPerf = calculatePortfolioPerformance(result.userPortfolioResult.weights, stockData, 'quarterly', { enabled: false, shortMAPeriod: 0, longMAPeriod: 0, reentryStrategy: 'golden_cross' }, 0, 0);
                 const userChartData = isLogScale ? downsampleData(userPerf.portfolioValues) : downsampleData(userPerf.portfolioValues.map(v => v === null ? null : (v - 100)));
                 datasets.push({
                    label: '原始持倉 (基準)', data: userChartData,
                    borderColor: 'rgba(255, 255, 255, 0.6)', backgroundColor: 'transparent',
                    borderWidth: 2, borderDash: [6, 4], fill: false, pointRadius: 0, order: 1 
                });
            }

            if (rangeOptimizedPoint) {
                const rangePerf = calculatePortfolioPerformance(rangeOptimizedPoint.weights, stockData, 'quarterly', { enabled: false, shortMAPeriod: 0, longMAPeriod: 0, reentryStrategy: 'golden_cross' }, 0, 0);
                const rangeChartData = isLogScale ? downsampleData(rangePerf.portfolioValues) : downsampleData(rangePerf.portfolioValues.map(v => v === null ? null : (v - 100)));
                datasets.push({
                    label: rangeOptimizedPoint.label, 
                    data: rangeChartData,
                    borderColor: '#d946ef',
                    backgroundColor: 'transparent',
                    borderWidth: 2.5, 
                    pointRadius: 0, 
                    order: 0,
                    tension: 0.1
                });
            }

            // ADD MIXED PORTFOLIO LINE
            if (mixedPortfolioResult && showMixerTool) {
                const mixedVals = mixedPortfolioResult.portfolioValues;
                const mixedChartData = isLogScale 
                    ? downsampleData(mixedVals)
                    : downsampleData(mixedVals.map(v => v === null ? null : (v - 100)));

                datasets.push({
                    label: `混合組合 (${(mixRatio*100).toFixed(0)}/${((1-mixRatio)*100).toFixed(0)})`,
                    data: mixedChartData,
                    borderColor: '#fbbf24', // Amber/Yellow
                    backgroundColor: 'transparent',
                    borderWidth: 4, 
                    pointRadius: 0,
                    order: 0,
                    tension: 0.1
                });
            }

            Array.from(comparisonTickers).forEach((ticker) => {
                const prices = stockData.priceData[ticker as string];
                if (prices && prices.length > 0) {
                    const startPrice = prices[0];
                    if (startPrice) {
                         const normalizedData = prices.map(p => p ? (p / (startPrice as number)) * 100 - 100 : null);
                         const color = tickerColorMap[ticker as string] || '#ccc';
                         datasets.push({
                            label: `${ticker} (個股)`, data: downsampleData(normalizedData),
                            borderColor: color, backgroundColor: 'transparent',
                            borderWidth: 1.5, borderDash: [5, 5], pointRadius: 0, order: 3
                        });
                    }
                }
            });

            const highlightRanges = [];
            if (periodStart && periodEnd) highlightRanges.push({start: periodStart, end: periodEnd});
            if (showSecondPeriod && periodStart2 && periodEnd2) highlightRanges.push({start: periodStart2, end: periodEnd2});

            performanceChartInstance.current = new Chart(performanceChartRef.current, {
                type: 'line',
                data: { labels: chartDates, datasets },
                // Use updated highlightRanges immediately without condition to show box during selection
                plugins: [cashPeriodsPlugin(currentData.cashPeriods, highlightRanges, chartDates)],
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    animation: { duration: 0 }, 
                    scales: {
                        x: { ticks: { color: '#9ca3af', maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { type: isLogScale ? 'logarithmic' : 'linear', ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    },
                    plugins: { legend: { display: datasets.length > 1, labels: { color: '#9ca3af' } } }
                }
            });

            drawdownChartInstance.current = new Chart(drawdownChartRef.current, {
                type: 'line',
                data: {
                    labels: chartDates,
                    datasets: [{
                        label: '回撤 (%)', data: downsampleData(perf.drawdowns),
                        borderColor: '#f87171', backgroundColor: 'rgba(248, 113, 113, 0.2)',
                        borderWidth: 1.5, fill: true, pointRadius: 0,
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: { ticks: { color: '#9ca3af', maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#9ca3af', callback: (v) => `${v}%` }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
    }, [currentData, stockData, settings, isLogScale, result, comparisonTickers, tickerColorMap, rangeOptimizedPoint, periodStart, periodEnd, periodStart2, periodEnd2, showSecondPeriod, mixRatio, mixedPortfolioResult, showMixerTool]);

    // Scatter Chart
    useEffect(() => {
        if(result && scatterChartRef.current && scatterData.length > 0) {
             if (scatterChartInstance.current) scatterChartInstance.current.destroy();
             
             const getXValue = (m: Metrics) => (chartMode === 'calmar' || chartMode === 'maxDD') ? m.maxDD * 100 : chartMode === 'winRate' ? (m.winRate || 0) * 100 : (m.volatility / Math.sqrt(12)) * 100;
             const getYValue = (m: Metrics) => (chartMode === 'calmar' || chartMode === 'stdDev') ? m.calmar : m.cagr * 100;
             const getColorValue = (m: Metrics) => chartMode === 'maxDD' ? (m.winRate || 0) : chartMode === 'winRate' ? m.maxDD : chartMode === 'calmar' ? m.sharpe : m.maxDD;

             const colorValues = scatterData.map(p => getColorValue(p.metrics));
             const minColVal = Math.min(...colorValues);
             const maxColVal = Math.max(...colorValues);
             const invertColor = chartMode === 'winRate' || chartMode === 'stdDev'; 

             const pointBackgroundColors = scatterData.map(p => interpolateColor(getColorValue(p.metrics), minColVal, maxColVal, invertColor));

             const datasets = [
                {
                    label: '模擬組合', data: scatterData.map(p => ({ x: getXValue(p.metrics), y: getYValue(p.metrics) })), 
                    backgroundColor: pointBackgroundColors, pointRadius: 3, pointHoverRadius: 6, order: 4
                },
                {
                    label: importedPortfolio ? '導入組合 (★)' : '最佳組合 (★)', 
                    data: [{ x: getXValue(importedPortfolio ? importedPortfolio.metrics : result.metrics), y: getYValue(importedPortfolio ? importedPortfolio.metrics : result.metrics) }],
                    backgroundColor: '#fbbf24', borderColor: '#fff', borderWidth: 2, pointRadius: 12, pointStyle: 'star', order: 1
                }
            ];
            
            if (result.userPortfolioResult) {
                datasets.push({
                    label: '原始持倉', data: [{ x: getXValue(result.userPortfolioResult.metrics), y: getYValue(result.userPortfolioResult.metrics) }],
                    backgroundColor: '#ffffff', borderColor: '#3b82f6', borderWidth: 2, pointRadius: 10, pointStyle: 'rectRot', order: 2
                });
            }
            if (selectedPoint) {
                datasets.push({
                    label: selectedPoint.label || '目前選擇', data: [{ x: getXValue(selectedPoint.metrics), y: getYValue(selectedPoint.metrics) }],
                    backgroundColor: '#f472b6', borderColor: '#fff', borderWidth: 3, pointRadius: 9, pointStyle: 'circle', order: 0 
                });
            }

            if (rangeOptimizedPoint) {
                datasets.push({
                    label: rangeOptimizedPoint.label || '區間王者', 
                    data: [{ x: getXValue(rangeOptimizedPoint.metrics), y: getYValue(rangeOptimizedPoint.metrics) }],
                    backgroundColor: '#d946ef', 
                    borderColor: '#fff', 
                    borderWidth: 2, 
                    pointRadius: 10, 
                    pointStyle: 'crossRot', 
                    order: 0 
                });
            }
            
             scatterChartInstance.current = new Chart(scatterChartRef.current, {
                type: 'scatter',
                data: { datasets },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    onClick: (event, elements, chart) => {
                        if (elements.length > 0) {
                            const element = elements[0] as InteractionItem;
                            const index = element.index;
                            const dsIndex = element.datasetIndex;
                            const dataset = chart.data.datasets[dsIndex];
                            if (dataset && dataset.label === '模擬組合') {
                                setSelectedPoint(scatterData[index]);
                            } else if (dataset && (dataset.label?.includes('最佳') || dataset.label?.includes('導入組合'))) {
                                setSelectedPoint(null);
                            } else if (dataset && dataset.label?.includes('區間王者') && rangeOptimizedPoint) {
                                setSelectedPoint(rangeOptimizedPoint);
                            } else if (dataset && dataset.label?.includes('原始持倉') && result.userPortfolioResult) {
                                setSelectedPoint(result.userPortfolioResult);
                            }
                        }
                    },
                    plugins: {
                        legend: { display: true, labels: { color: '#9ca3af', usePointStyle: true } },
                        zoom: { zoom: { wheel: { enabled: true }, mode: 'xy' }, pan: { enabled: true, mode: 'xy' } },
                        tooltip: {
                            callbacks: {
                                label: (ctx: any) => {
                                    const dataset = ctx.dataset;
                                    let m: Metrics | undefined;
                                    if (dataset.label === '模擬組合') m = scatterData[ctx.dataIndex]?.metrics;
                                    else if (dataset.label?.includes('最佳')) m = result.metrics;
                                    else if (dataset.label?.includes('導入組合')) m = importedPortfolio?.metrics;
                                    else if (dataset.label?.includes('區間王者')) m = rangeOptimizedPoint?.metrics;
                                    else if (dataset.label?.includes('目前選擇')) m = selectedPoint?.metrics;
                                    else if (dataset.label?.includes('原始持倉')) m = result.userPortfolioResult?.metrics;
                                    if (!m) return '';
                                    return [`CAGR: ${(m.cagr * 100).toFixed(2)}%`, `MaxDD: ${(m.maxDD * 100).toFixed(2)}%`, `Sharpe: ${m.sharpe.toFixed(2)}`];
                                }
                            }
                        }
                    },
                    scales: {
                        x: { title: { display: true, text: 'Max Drawdown (%)', color: '#9ca3af' }, ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { title: { display: true, text: (chartMode === 'calmar' || chartMode === 'stdDev') ? 'Calmar Ratio' : 'CAGR (%)', color: '#9ca3af' }, ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }
    }, [result, scatterData, selectedPoint, chartMode, rangeOptimizedPoint, importedPortfolio]);

    const handleExportCSV = () => {
        if (!currentData) return;
        const sortedExportWeights = (Object.entries(currentData.weights) as [string, number][])
            .sort(([, a], [, b]) => b - a)
            .filter(([, w]) => w > 0.001);
        const csvContent = "Symbol,Weight\n" + sortedExportWeights.map(([ticker, weight]) => `${ticker},${(weight * 100).toFixed(2)}%`).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `portfolio_${new Date().getTime()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };
    
    const handleExportMixedCSV = () => {
        if (!mixedPortfolioResult) return;
        const sortedExportWeights = (Object.entries(mixedPortfolioResult.weights) as [string, number][])
            .sort(([, a], [, b]) => b - a)
            .filter(([, w]) => w > 0.001);
        const csvContent = "Symbol,Weight\n" + sortedExportWeights.map(([ticker, weight]) => `${ticker},${(weight * 100).toFixed(2)}%`).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mixed_portfolio_${(mixRatio*100).toFixed(0)}_${((1-mixRatio)*100).toFixed(0)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (!currentData || !stockData || !settings) return <div className="text-center py-10 bg-gray-800 rounded-lg"><p className="text-gray-400">等待優化結果...</p></div>;

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                 <MetricBox label="年化回報 (CAGR)" value={`${(currentData.metrics.cagr * 100).toFixed(2)}%`} positive={currentData.metrics.cagr > 0} icon="fa-chart-line" />
                 <MetricBox label="夏普比率 (Sharpe)" value={currentData.metrics.sharpe.toFixed(2)} icon="fa-balance-scale" />
                 <MetricBox label="最大回撤 (MaxDD)" value={`${(currentData.metrics.maxDD * 100).toFixed(2)}%`} negative icon="fa-chart-area" />
                 <MetricBox label="勝率 (Win Rate)" value={`${(currentData.metrics.winRate ? (currentData.metrics.winRate * 100).toFixed(1) : 0)}%`} icon="fa-trophy" />
                 <MetricBox label="波動率 (Vol)" value={`${(currentData.metrics.volatility * 100).toFixed(2)}%`} icon="fa-wave-square" />
                 <MetricBox label="卡爾瑪 (Calmar)" value={currentData.metrics.calmar.toFixed(2)} icon="fa-ruler-combined" />
                 <MetricBox label="總回報 (Abs Rtn)" value={`${((currentData.metrics.totalReturn || 0) * 100).toFixed(1)}%`} positive={(currentData.metrics.totalReturn || 0) > 0} icon="fa-money-bill-wave" />
                 <MetricBox label="數據跨度 (Duration)" value={`${(currentData.metrics.duration || 0).toFixed(1)} 年`} icon="fa-hourglass-half" />
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex flex-wrap items-center justify-between mb-4 border-b border-gray-700 pb-2 gap-2">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <i className="fas fa-atom text-teal-400"></i>
                                <h3 className="text-lg font-bold text-gray-200">效率前緣分析</h3>
                            </div>
                            <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                顏色含義 (夏普比率 Sharpe):
                                <span className="px-1.5 rounded bg-blue-500 text-white text-[10px]">藍=差</span>
                                <i className="fas fa-arrow-right text-[10px]"></i>
                                <span className="px-1.5 rounded bg-red-500 text-white text-[10px]">紅=好</span>
                            </div>
                        </div>
                        <div className="flex bg-gray-900/50 p-1 rounded-lg gap-1">
                             {([
                                { id: 'stdDev', label: 'StdDev', icon: 'fa-bolt' },
                                { id: 'maxDD', label: 'MaxDD', icon: 'fa-chart-area' },
                                { id: 'winRate', label: 'WinRate', icon: 'fa-trophy' },
                                { id: 'calmar', label: 'Calmar', icon: 'fa-shield-alt' }
                             ] as const).map((opt) => (
                                 <button
                                    key={opt.id}
                                    onClick={() => setChartMode(opt.id)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1.5 ${chartMode === opt.id ? 'bg-teal-500 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                                 >
                                     <i className={`fas ${opt.icon}`}></i> {opt.label}
                                 </button>
                             ))}
                        </div>
                    </div>
                    <div className="h-80 w-full relative bg-gray-900/50 rounded-lg p-2">
                        {result && result.scatterPoints ? <canvas ref={scatterChartRef}></canvas> : <div className="flex items-center justify-center h-full text-gray-500">無數據</div>}
                    </div>
                </div>

                <div className="lg:col-span-1 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col">
                    <SectionHeader title={`權重配置 ${activeTickers.length > 50 ? '(Top 50 Only)' : ''}`} icon="fa-chart-pie" rightElement={
                         <div className="flex gap-2">
                             <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-gray-700 hover:bg-teal-600 px-2 py-1 rounded text-white flex items-center gap-1 transition-colors">
                                 <i className="fas fa-file-import"></i> Import CSV
                             </button>
                             <input type="file" ref={fileInputRef} onChange={handleImportPortfolio} accept=".csv" className="hidden" />
                             <button onClick={handleExportCSV} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white flex items-center gap-1 transition-colors">
                                 <i className="fas fa-file-csv"></i> Export
                             </button>
                         </div>
                    } />
                    <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[320px]">
                          {(Object.entries(currentData.weights) as [string, number][])
                            .sort(([,a], [,b]) => b - a)
                            .filter(([,w]) => w > 0.001)
                            .slice(0, 50) // Limit list to top 50 to prevent UI lag with massive portfolios
                            .map(([ticker, weight]) => (
                              <div key={ticker} className="relative group">
                                  <div className="flex justify-between text-sm mb-1">
                                      <span className="font-bold text-gray-300">{ticker}</span>
                                      <span className="font-mono text-teal-400">{(weight * 100).toFixed(2)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                      <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${weight * 100}%`, backgroundColor: tickerColorMap[ticker as string] || '#2dd4bf' }}></div>
                                  </div>
                              </div>
                          ))}
                          {Object.keys(currentData.weights).length > 50 && (
                              <div className="text-xs text-center text-gray-500 pt-2 italic">
                                  ... 還有 {Object.keys(currentData.weights).length - 50} 隻股票被隱藏
                              </div>
                          )}
                    </div>
                </div>
             </div>
             
             {/* Period Optimization Panel */}
             <div className="bg-gray-800 p-6 rounded-xl border border-yellow-600/30 shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                                <i className="fas fa-history"></i> 歷史區間壓力測試 (Period Stress Test)
                            </h3>
                            <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-yellow-900/30 rounded-full border border-yellow-700/50">
                                <span className="text-[10px] text-yellow-300 font-bold uppercase tracking-wider">開啟混合優化器</span>
                                <label className="relative inline-flex items-center cursor-pointer scale-90">
                                    <input type="checkbox" checked={showMixerTool} onChange={e => setShowMixerTool(e.target.checked)} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-yellow-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-600"></div>
                                </label>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400">選擇一段或多段歷史區間 (如熊市年份)，找出在該期間綜合表現最好的組合。</p>
                    </div>
                    
                    <div className="flex flex-col gap-2 items-end">
                        <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded-lg border border-gray-700">
                             <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 w-4">1:</span>
                                    <input 
                                        type="date" 
                                        className="bg-gray-800 text-white text-xs p-1 rounded border border-gray-600 focus:border-yellow-500"
                                        value={periodStart}
                                        onChange={(e) => setPeriodStart(e.target.value)}
                                    />
                                    <span className="text-gray-500">-</span>
                                    <input 
                                        type="date" 
                                        className="bg-gray-800 text-white text-xs p-1 rounded border border-gray-600 focus:border-yellow-500"
                                        value={periodEnd}
                                        onChange={(e) => setPeriodEnd(e.target.value)}
                                    />
                                    <button 
                                        onClick={fillLastYearDates}
                                        className="ml-1 text-[10px] bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded border border-gray-600 transition-colors"
                                        title="自動帶入最近一年"
                                    >
                                        1Y
                                    </button>
                                </div>
                                {showSecondPeriod && (
                                    <div className="flex items-center gap-2 animate-fade-in">
                                        <span className="text-xs text-gray-500 w-4">2:</span>
                                        <input 
                                            type="date" 
                                            className="bg-gray-800 text-white text-xs p-1 rounded border border-gray-600 focus:border-yellow-500"
                                            value={periodStart2}
                                            onChange={(e) => setPeriodStart2(e.target.value)}
                                        />
                                        <span className="text-gray-500">-</span>
                                        <input 
                                            type="date" 
                                            className="bg-gray-800 text-white text-xs p-1 rounded border border-gray-600 focus:border-yellow-500"
                                            value={periodEnd2}
                                            onChange={(e) => setPeriodEnd2(e.target.value)}
                                        />
                                    </div>
                                )}
                             </div>
                            
                            <div className="flex flex-col gap-1">
                                <button 
                                    onClick={() => setShowSecondPeriod(!showSecondPeriod)}
                                    className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700 border border-transparent hover:border-gray-600"
                                    title={showSecondPeriod ? "移除第二區間" : "添加第二區間"}
                                >
                                    <i className={`fas ${showSecondPeriod ? 'fa-minus' : 'fa-plus'}`}></i>
                                </button>
                                <button 
                                    onClick={handlePeriodAnalyze}
                                    disabled={isSearchingRange}
                                    className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-1 ${isSearchingRange ? 'bg-gray-600 text-gray-400' : 'bg-yellow-600 hover:bg-yellow-500 text-white'}`}
                                >
                                    {isSearchingRange ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>} 分析
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {rangeOptimizedPoint && (
                    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded p-3 mb-2 relative">
                         <button 
                             onClick={() => setRangeOptimizedPoint(null)}
                             className="absolute top-2 right-2 text-gray-500 hover:text-white hover:bg-gray-700/50 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                             title="清除比較"
                         >
                             <i className="fas fa-times"></i>
                         </button>
                         <div className="flex justify-between items-start mb-2 pr-8">
                            <div className="flex gap-6">
                                <div>
                                    <span className="text-gray-400 block text-xs">區間總回報 (Combined Return)</span>
                                    <span className={`font-bold text-base ${rangeOptimizedPoint.metrics.cagr > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {((rangeOptimizedPoint.metrics.cagr || 0) * 100).toFixed(2)}%
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-xs">區間最大回撤 (Combined MaxDD)</span>
                                    <span className="text-red-400 font-bold text-base">{((rangeOptimizedPoint.metrics.maxDD || 0) * 100).toFixed(2)}%</span>
                                </div>
                            </div>
                            <div className="text-right text-xs">
                                <div className="text-gray-300">該組合同時已疊加至上方散點圖</div>
                                <div className="text-fuchsia-400 font-bold">Fuchsia Cross (紫色十字)</div>
                            </div>
                         </div>
                    </div>
                )}
             </div>

             {/* 7. Portfolio Mixer (組合混合優化器) - Now always enabled when visible */}
             {showMixerTool && (
                 <div className="bg-gray-800 p-6 rounded-xl border border-teal-500/30 shadow-lg animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-teal-400 flex items-center gap-2">
                                <i className="fas fa-blender"></i> 組合混合優化器 (Portfolio Mixer)
                            </h3>
                            <p className="text-xs text-gray-400">混合「最佳 AI 配置」與「區間王者」，找出平衡兩者優勢的新組合。</p>
                        </div>
                    </div>

                    <div className="space-y-6 transition-all">
                        {(!result || !rangeOptimizedPoint) ? (
                            <p className="text-sm text-yellow-500 text-center py-4 bg-gray-900/30 rounded border border-dashed border-gray-700">
                                 <i className="fas fa-exclamation-triangle mr-1"></i> 請先執行「歷史區間壓力測試」以獲得混合對象。
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                 {/* Mixer Controls */}
                                 <div className="lg:col-span-1 space-y-4">
                                     <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                         <div className="flex justify-between text-xs mb-4">
                                             <span className="text-teal-400 font-bold">最佳 AI 配置 ({(mixRatio*100).toFixed(0)}%)</span>
                                             <span className="text-fuchsia-400 font-bold">區間王者 ({((1-mixRatio)*100).toFixed(0)}%)</span>
                                         </div>
                                         <input 
                                             type="range" 
                                             min="0" max="1" step="0.05"
                                             value={mixRatio}
                                             onChange={(e) => setMixRatio(parseFloat(e.target.value))}
                                             className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                                         />
                                         <div className="mt-4 flex justify-between">
                                             <button onClick={() => setMixRatio(1)} className="text-[10px] text-gray-500 hover:text-teal-400">100% AI</button>
                                             <button onClick={() => setMixRatio(0.5)} className="text-[10px] text-gray-500 hover:text-white">50/50</button>
                                             <button onClick={() => setMixRatio(0)} className="text-[10px] text-gray-500 hover:text-fuchsia-400">100% Range</button>
                                         </div>
                                     </div>
                                     <button 
                                        onClick={handleExportMixedCSV}
                                        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded transition-colors text-sm flex items-center justify-center gap-2"
                                     >
                                         <i className="fas fa-file-export"></i> 匯出混合組合
                                     </button>
                                 </div>
                                 
                                 {/* Mixed Weights Preview */}
                                 <div className="lg:col-span-2 bg-gray-900/50 p-4 rounded-lg border border-gray-700 max-h-60 overflow-y-auto custom-scrollbar">
                                     <h4 className="text-sm font-bold text-gray-300 mb-3 border-b border-gray-700 pb-1">混合後權重預覽</h4>
                                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                         {mixedPortfolioResult && (Object.entries(mixedPortfolioResult.weights) as [string, number][])
                                            .sort(([, a], [, b]) => b - a)
                                            .filter(([, w]) => w > 0.001)
                                            .map(([ticker, weight]) => (
                                             <div key={ticker} className="flex justify-between items-center text-xs bg-gray-800 p-2 rounded">
                                                 <span className="font-bold text-gray-400">{ticker}</span>
                                                 <span className="text-amber-400 font-mono">{(weight * 100).toFixed(2)}%</span>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                            </div>
                        )}
                    </div>
                 </div>
             )}
             
             {/* Charts */}
             <div className="space-y-6">
                <CollapsibleSection title="歷史走勢比較 (History Trend)" icon="fa-chart-line" defaultOpen={true}>
                     <div className="flex flex-col gap-2 mb-2">
                         <div className="flex justify-between items-center flex-wrap gap-2">
                             {/* Ticker Toggles */}
                             <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-xs text-gray-500 flex items-center"><i className="fas fa-layer-group mr-1"></i> 疊加個股 (Top 10):</span>
                                {activeTickers.slice(0, 10).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => toggleComparison(t)}
                                        className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                                            comparisonTickers.has(t) 
                                            ? 'bg-gray-800 font-bold' 
                                            : 'bg-transparent text-gray-600 border-gray-800 hover:border-gray-600'
                                        }`}
                                        style={{ 
                                            borderColor: comparisonTickers.has(t) ? tickerColorMap[t] : undefined,
                                            color: comparisonTickers.has(t) ? tickerColorMap[t] : undefined
                                        }}
                                    >
                                        {t}
                                    </button>
                                ))}
                             </div>

                             <button 
                                 onClick={() => setIsLogScale(!isLogScale)}
                                 className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors whitespace-nowrap"
                             >
                                 {isLogScale ? '切換線性座標' : '切換對數座標'}
                             </button>
                         </div>
                     </div>
                     <div className="h-96 w-full relative">
                         <canvas ref={performanceChartRef}></canvas>
                     </div>
                </CollapsibleSection>

                <CollapsibleSection title="回撤分析 (Drawdown)" icon="fa-water" colorClass="text-red-400" defaultOpen={true}>
                     <div className="h-64 w-full relative">
                         <canvas ref={drawdownChartRef}></canvas>
                     </div>
                </CollapsibleSection>
             </div>

             <CollapsibleSection title="月度回報熱力圖 (Monthly Returns)" icon="fa-calendar-alt" defaultOpen={true}>
                 <MonthlyReturnsChart returns={currentData.monthlyReturns} metrics={currentData.metrics} />
             </CollapsibleSection>

             <CollapsibleSection title="資產輪動週期 (RRG Analysis)" icon="fa-sync-alt" colorClass="text-purple-400" defaultOpen={false}>
                 <div className="space-y-6">
                    <p className="text-sm text-gray-400 bg-gray-900/30 p-3 rounded border border-gray-700">
                        <strong>相對旋轉圖 (RRG):</strong> 展示資產相對於投資組合整體的相對強弱 (X軸) 與動能 (Y軸)。
                        順時針方向移動：領先 (Leading) → 轉弱 (Weakening) → 落後 (Lagging) → 改善 (Improving)。
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700">
                             <h4 className="text-center text-gray-300 text-sm font-bold mb-2">完整軌跡 (History Trail)</h4>
                             <AssetRotationChart weights={currentData.weights} stockData={stockData} portfolioValues={currentData.portfolioValues || []} downsampleStep={5} colorMap={tickerColorMap} />
                        </div>
                        <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700 flex items-center justify-center">
                             <div className="w-full">
                                <h4 className="text-center text-gray-300 text-sm font-bold mb-2">當前週期時鐘 (Current Cycle)</h4>
                                <MarketCycleClock weights={currentData.weights} stockData={stockData} portfolioValues={currentData.portfolioValues || []} colorMap={tickerColorMap} />
                             </div>
                        </div>
                    </div>
                 </div>
             </CollapsibleSection>

             <RealTimePriceChecker weights={currentData.weights} />

             <div className="text-center text-xs text-gray-500 pt-8 pb-4">
                 AI Portfolio Optimizer v3.4 | Powered by Genetic Algorithms & Web Workers
             </div>
        </div>
    );
};

export default ResultsDisplay;
