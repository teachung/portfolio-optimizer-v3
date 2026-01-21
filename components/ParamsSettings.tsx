
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PortfolioParams, OptimizationSettings, PriorityStockConfig, HedgeConfig } from '../types';
import { initializeWasm, isWasmAvailable, setAlgorithmImplementation, type AlgorithmImplementation } from '../services/wasm';

interface ParamsSettingsProps {
  initialParams: PortfolioParams;
  stockTickers: string[];
  onStart: (settings: OptimizationSettings) => void;
}

const ParamCard: React.FC<{ title: string; description: React.ReactNode; children: React.ReactNode, special?: boolean, className?: string }> = ({ title, description, children, special = false, className = '' }) => (
    <div className={`bg-gray-800 p-4 rounded-lg border ${special ? 'border-teal-500/50' : 'border-gray-700'} ${className}`}>
        <label className="block text-sm font-medium text-gray-300 mb-1">{title}</label>
        <p className="text-xs text-gray-500 mb-3">{description}</p>
        {children}
    </div>
);

interface UserHolding {
    ticker: string;
    weight: number;
}

const ParamsSettings: React.FC<ParamsSettingsProps> = ({ initialParams, stockTickers, onStart }) => {
  // Updated defaults based on Attachment 3
  const [settings, setSettings] = useState<Omit<OptimizationSettings, 'priorityStockConfig' | 'hedgeConfig' | 'userPortfolio'>>({
    simulations: 50000,
    maxStocks: 10, // Default to 10
    maxWeight: 40, // Default Max 40
    minWeight: 5,  // Default Min 5
    strictMode: false, // Default General Mode
    cagrThreshold: 0, // Default 0
    sharpeThreshold: 0.0, // Default 0.0
    maxDDThreshold: 60, // Default 60
    targetCAGR: 25,
    rebalanceMode: 'quarterly', // Default Quarterly
    optimizeTarget: 'super_ai', // CHANGED DEFAULT HERE
    optimizationAlgorithm: 'genetic',
    dynamicRebalanceThreshold: 20,
  });

  const [priorityStock, setPriorityStock] = useState<PriorityStockConfig>({
      ticker: null,
      minWeight: 5,
      maxWeight: 20
  });

  const [hedgeConfig, setHedgeConfig] = useState<HedgeConfig>({
      enabled: false,
      shortMAPeriod: 20,
      longMAPeriod: 60,
      reentryStrategy: 'golden_cross',
      signalTicker: null,
  });

  const [userHoldings, setUserHoldings] = useState<UserHolding[]>([]);

  // WASM 狀態 - 純 WASM 版本，自動啟用
  const [wasmStatus, setWasmStatus] = useState<'loading' | 'available' | 'unavailable'>('loading');

  // 初始化 WASM - 純 WASM 模式，自動設置為 WASM
  useEffect(() => {
    initializeWasm('/algorithms.wasm').then((success) => {
      setWasmStatus(success ? 'available' : 'unavailable');
      if (success) {
        console.log('🔒 Pure WASM mode - algorithms protected');
        setAlgorithmImplementation('all', 'wasm');
      }
    });
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSettingsChange = (field: keyof typeof settings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePriorityChange = (field: keyof PriorityStockConfig, value: string | number | null) => {
      setPriorityStock(prev => ({ ...prev, [field]: value }));
  };

  const handleHedgeChange = (field: keyof HedgeConfig, value: string | number | boolean | null) => {
      setHedgeConfig(prev => ({...prev, [field]: value}));
  }

  // ... (User Portfolio Handlers kept same as before) ...
  const addUserHolding = () => {
      setUserHoldings([...userHoldings, { ticker: '', weight: 0 }]);
  };

  const removeUserHolding = (index: number) => {
      const newHoldings = [...userHoldings];
      newHoldings.splice(index, 1);
      setUserHoldings(newHoldings);
  };

  const updateUserHolding = (index: number, field: keyof UserHolding, value: string | number) => {
      const newHoldings = [...userHoldings];
      if (field === 'ticker') {
          newHoldings[index].ticker = value as string;
      } else {
          newHoldings[index].weight = value as number;
      }
      setUserHoldings(newHoldings);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const tickerMap = new Map<string, string>();
      stockTickers.forEach(t => tickerMap.set(t.toLowerCase(), t));

      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          if (!text) return;

          const lines = text.split(/\r?\n/);
          const newHoldings: UserHolding[] = [];
          
          lines.forEach((line, idx) => {
              if (!line.trim()) return;
              const parts = line.split(',');
              if (parts.length < 2) return;
              
              if (idx === 0 && (parts[0].toLowerCase().includes('symbol') || parts[1].toLowerCase().includes('weight'))) return;

              const rawTicker = parts[0].trim().replace(/['"]/g, '');
              const cleanTickerKey = rawTicker.toLowerCase();
              const weightStr = parts[1].trim().replace(/[^\d.-]/g, '');
              let weight = parseFloat(weightStr);

              if (!isNaN(weight) && weight <= 1 && weight > 0) {
                 if (!parts[1].includes('%') && Math.abs(weight) <= 1.0) {
                     weight = weight * 100;
                 }
              }

              const actualTicker = tickerMap.get(cleanTickerKey);

              if (actualTicker && !isNaN(weight)) {
                  newHoldings.push({ ticker: actualTicker, weight });
              }
          });

          if (newHoldings.length > 0) {
              setUserHoldings(newHoldings);
          } else {
              alert('導入失敗。沒有找到匹配的股票代號。');
          }
      };
      reader.readAsText(file);
      if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalUserWeight = useMemo(() => {
      return userHoldings.reduce((sum, h) => sum + (h.weight || 0), 0);
  }, [userHoldings]);

  const isTargetReturnMode = useMemo(() => {
    return settings.optimizeTarget.startsWith('target_return');
  }, [settings.optimizeTarget]);

  const handleSubmit = () => {
    const userPortfolioRecord: Record<string, number> = {};
    let hasUserPortfolio = false;
    
    userHoldings.forEach(h => {
        if(h.ticker && h.weight > 0) {
            userPortfolioRecord[h.ticker] = h.weight / 100;
            hasUserPortfolio = true;
        }
    });

    onStart({
      ...settings,
      maxWeight: settings.maxWeight / 100,
      minWeight: settings.minWeight / 100, // Pass minWeight
      cagrThreshold: settings.cagrThreshold / 100,
      maxDDThreshold: settings.maxDDThreshold / 100,
      targetCAGR: settings.targetCAGR / 100,
      dynamicRebalanceThreshold: settings.dynamicRebalanceThreshold / 100,
      priorityStockConfig: {
        ...priorityStock,
        minWeight: priorityStock.minWeight / 100,
        maxWeight: priorityStock.maxWeight / 100
      },
      hedgeConfig: hedgeConfig,
      userPortfolio: hasUserPortfolio ? userPortfolioRecord : undefined
    });
  };

  const inputStyles = "w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-sm focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ParamCard title="🎲 模擬次數" description="建議 10,000 - 100,000">
          <input type="number" value={settings.simulations} onChange={e => handleSettingsChange('simulations', parseInt(e.target.value))} className={inputStyles} />
        </ParamCard>
        <ParamCard title="📊 最大股票數量" description="投資組合中最多包含的股票數">
          <input type="number" value={settings.maxStocks} onChange={e => handleSettingsChange('maxStocks', parseInt(e.target.value))} className={inputStyles} />
        </ParamCard>
        
        {/* Weight Constraints */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <label className="block text-sm font-medium text-gray-300 mb-1">⚖️ 股票權重限制 (%)</label>
            <p className="text-xs text-gray-500 mb-3">單一股票的最小與最大投資比例</p>
            <div className="flex items-center gap-2">
                <input 
                    type="number" 
                    placeholder="Min"
                    value={settings.minWeight} 
                    onChange={e => handleSettingsChange('minWeight', parseFloat(e.target.value))} 
                    className={inputStyles} 
                    title="最小權重"
                />
                <span className="text-gray-500">-</span>
                <input 
                    type="number" 
                    placeholder="Max"
                    value={settings.maxWeight} 
                    onChange={e => handleSettingsChange('maxWeight', parseFloat(e.target.value))} 
                    className={inputStyles} 
                    title="最大權重"
                />
            </div>
        </div>

        <ParamCard title="🎯 模式選擇" description="嚴格:剛好N隻 | 一般:最多N隻">
          <select value={String(settings.strictMode)} onChange={e => handleSettingsChange('strictMode', e.target.value === 'true')} className={inputStyles}>
            <option value="false">一般模式</option>
            <option value="true">嚴格模式</option>
          </select>
        </ParamCard>
        <ParamCard title="📈 CAGR 門檻 (%)" description="年化回報率最低要求">
          <input type="number" value={settings.cagrThreshold} onChange={e => handleSettingsChange('cagrThreshold', parseFloat(e.target.value))} className={inputStyles} />
        </ParamCard>
        <ParamCard title="📊 Sharpe 門檻" description="夏普比率最低要求">
          <input type="number" step="0.1" value={settings.sharpeThreshold} onChange={e => handleSettingsChange('sharpeThreshold', parseFloat(e.target.value))} className={inputStyles} />
        </ParamCard>
        <ParamCard title="📉 MaxDD 門檻 (%)" description="最大回撤最高容忍值">
          <input type="number" value={settings.maxDDThreshold} onChange={e => handleSettingsChange('maxDDThreshold', parseFloat(e.target.value))} className={inputStyles} />
        </ParamCard>
        <ParamCard title="🧬 優化算法" description="智能算法通常更快更強" special>
          <select value={settings.optimizationAlgorithm} onChange={e => handleSettingsChange('optimizationAlgorithm', e.target.value)} className={inputStyles}>
            <option value="monte_carlo">🎲 蒙地卡羅</option>
            <option value="genetic">🧬 遺傳算法 (推薦)</option>
            <option value="grid">🧱 網格搜索 (5% 步進)</option>
          </select>
        </ParamCard>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-xl font-bold text-teal-400 mb-4">🎯 優化目標設定</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ParamCard title="🎯 優化目標" description="選擇您最重視的指標">
              <select value={settings.optimizeTarget} onChange={e => handleSettingsChange('optimizeTarget', e.target.value)} className={inputStyles}>
                <option value="super_ai">🤖 超級AI優化 (終極多維度)</option>
                <option value="super_ai_v2">🤖 超級AI優化 v2.0 (六邊形戰士)</option>
                <option value="ultra_smooth_v1">💎 極致穩定 v1 (類定存效果)</option>
                <option value="ultra_smooth">💎 極致穩定 v2 (雙向波動通道)</option>
                {/* v3 暫時隱藏 - 測試中 */}
                {/* <option value="ultra_smooth_v3">💎 極致穩定 v3 (低位佈局)</option> */}
                <option value="sharpe">最大化 Sharpe Ratio</option>
                <option value="cagr">最大化 CAGR</option>
                <option value="calmar">最大化 CAGR/MaxDD</option>
                <option value="sortino">最大化 Sortino Ratio</option>
                <option value="min_dd">最小化 MaxDD</option>
                <option value="smoothness">✨ 最大化平穩度 (直線增長)</option>
                <option value="target_return_mindd">🎯 達標回報 + 最小回撤</option>
                <option value="target_return_smooth">📈 達標回報 + 最直線增長</option>
                <option value="target_return_winrate">🏆 達標回報 + 最高勝率</option>
              </select>
              {settings.optimizeTarget === 'super_ai_v2' && (
                  <div className="mt-2 text-xs text-teal-300 bg-teal-900/30 p-2 rounded border border-teal-700/50">
                      <i className="fas fa-microchip mr-1"></i>
                      <strong>Super AI v2.0:</strong> 自適應時間頻率 + 嚴格的閘門淘汰機制 + 六邊形能力乘積。適合追求高夏普、低回撤且曲線平滑的完美組合。
                  </div>
              )}
              {settings.optimizeTarget === 'ultra_smooth' && (
                  <div className="mt-2 text-xs text-yellow-400 bg-yellow-900/30 p-2 rounded border border-yellow-700/50">
                      <i className="fas fa-info-circle mr-1"></i>
                      已啟用雙向波動控制：單日漲跌超過 8% 的組合將直接被淘汰。
                  </div>
              )}
              {settings.optimizeTarget === 'ultra_smooth_v3' && (
                  <div className="mt-2 text-xs text-green-400 bg-green-900/30 p-2 rounded border border-green-700/50">
                      <i className="fas fa-check-circle mr-1"></i>
                      <strong>V3 (低位佈局):</strong> 基於 V2 通道，但嚴重懲罰目前價格處於通道上方的組合。專門尋找「走勢穩、且目前剛好回落到通道底部」的買入良機。
                  </div>
              )}
               {settings.optimizeTarget === 'ultra_smooth_v1' && (
                  <div className="mt-2 text-xs text-blue-400 bg-blue-900/30 p-2 rounded border border-blue-700/50">
                      <i className="fas fa-info-circle mr-1"></i>
                      V1 核心算法: 強調線性增長 (R²) 與極低回撤。
                  </div>
              )}
            </ParamCard>
            <ParamCard title="💰 目標年化回報 (%)" description="配合「達標回報」模式使用" special={isTargetReturnMode}>
               <input type="number" value={settings.targetCAGR} onChange={e => handleSettingsChange('targetCAGR', parseFloat(e.target.value))} className={`${inputStyles} ${!isTargetReturnMode && 'opacity-50'}`} disabled={!isTargetReturnMode} />
            </ParamCard>
        </div>

        {/* WASM 算法加速選項 - 純 WASM 版本 */}
        {(settings.optimizeTarget === 'super_ai' || settings.optimizeTarget === 'super_ai_v2' || settings.optimizeTarget === 'ultra_smooth' || settings.optimizeTarget === 'ultra_smooth_v1') && (
          <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg border border-purple-500/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <h3 className="text-sm font-bold text-purple-300">WebAssembly 保護模式</h3>
                  <p className="text-xs text-gray-400">
                    核心算法已編譯為 WASM - 程式碼受保護
                    {wasmStatus === 'loading' && ' (載入中...)'}
                    {wasmStatus === 'unavailable' && ' (載入失敗)'}
                    {wasmStatus === 'available' && ' ✅ 已就緒'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-300 font-bold">WASM</span>
                <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></div>
              </div>
            </div>
            {wasmStatus === 'available' && (
              <div className="mt-2 text-xs text-purple-300 bg-purple-900/40 p-2 rounded">
                🔒 純 WASM 模式運行中 - 所有核心算法已編譯為 WebAssembly 二進位檔，無法被逆向工程。
              </div>
            )}
            {wasmStatus === 'unavailable' && (
              <div className="mt-2 text-xs text-red-300 bg-red-900/40 p-2 rounded">
                ⚠️ WASM 載入失敗 - 請確保 algorithms.wasm 文件存在於正確位置。
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Portfolio Section Kept Same */}
      <div className="bg-gray-800 p-6 rounded-lg border border-blue-500/50">
           {/* ... (Existing user portfolio code) ... */}
           <div className="flex justify-between items-center mb-4">
              <div>
                  <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2"><i className="fas fa-briefcase"></i> 現有持倉優化 (種子)</h2>
                  <p className="text-sm text-gray-400">輸入您目前的組合，AI 將以此為基礎進行進化改良。</p>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => fileInputRef.current?.click()} className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1 rounded transition border border-gray-600">
                      <i className="fas fa-file-csv mr-1"></i> Import CSV
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
                  
                  <button onClick={addUserHolding} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded transition">
                      <i className="fas fa-plus mr-1"></i> 新增持倉
                  </button>
              </div>
          </div>
          {userHoldings.length === 0 ? (
              <div className="text-center py-4 bg-gray-900/30 rounded border border-dashed border-gray-700 text-gray-500">
                  尚未輸入現有持倉。點擊「新增持倉」或「Import CSV」開始。
              </div>
          ) : (
              <div className="space-y-2">
                  {userHoldings.map((holding, idx) => (
                      <div key={idx} className="flex gap-2 items-center animate-fade-in">
                          <select 
                              value={holding.ticker} 
                              onChange={(e) => updateUserHolding(idx, 'ticker', e.target.value)}
                              className={`${inputStyles} flex-1`}
                          >
                              <option value="">-- 選擇股票 --</option>
                              {stockTickers.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <div className="relative w-32">
                              <input 
                                  type="number" 
                                  placeholder="%"
                                  value={holding.weight}
                                  onChange={(e) => updateUserHolding(idx, 'weight', parseFloat(e.target.value))}
                                  className={inputStyles}
                              />
                              <span className="absolute right-3 top-2 text-gray-500 text-xs">%</span>
                          </div>
                          <button onClick={() => removeUserHolding(idx)} className="text-gray-500 hover:text-red-400 px-2">
                              <i className="fas fa-trash"></i>
                          </button>
                      </div>
                  ))}
                  <div className={`text-right text-sm font-bold mt-2 ${totalUserWeight > 100 ? 'text-red-400' : 'text-green-400'}`}>
                      總權重: {totalUserWeight.toFixed(1)}% {totalUserWeight > 100 && '(請調整至 100% 以下)'}
                  </div>
              </div>
          )}
      </div>
      
      {/* Advanced Dynamic Strategies */}
      <div className="bg-gray-800 p-6 rounded-lg border border-purple-500/50">
        {/* ... (Existing dynamic strategies code) ... */}
        <h2 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2"><i className="fas fa-magic"></i>高級動態策略 (實驗性)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ParamCard title="🔄 投資組合重新平衡" description="定期調整回目標權重">
                <select value={settings.rebalanceMode} onChange={e => handleSettingsChange('rebalanceMode', e.target.value)} className={inputStyles}>
                  <option value="none">🚫 不重新平衡</option>
                  <option value="quarterly">🔄 每季度重新平衡</option>
                  <option value="dynamic">📈 動態再平衡 (基於均線)</option>
                </select>
              </ParamCard>
              {settings.rebalanceMode === 'dynamic' && (
                <ParamCard title="偏離閾值 (%)" description="偏離 60 日均線多少時觸發再平衡">
                   <input type="number" value={settings.dynamicRebalanceThreshold} onChange={e => handleSettingsChange('dynamicRebalanceThreshold', parseFloat(e.target.value))} className={inputStyles} />
                </ParamCard>
              )}
            </div>
            <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-700">
                 <div className="flex justify-between items-center mb-2">
                    <div>
                        <h3 className="text-sm font-medium text-gray-300">📉 市場擇時避險</h3>
                        <p className="text-xs text-gray-500">使用均線交叉策略進行空倉避險</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={hedgeConfig.enabled} onChange={e => handleHedgeChange('enabled', e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                 </div>
                 <div className={`mt-4 space-y-4 transition-opacity ${!hedgeConfig.enabled && 'opacity-50'}`}>
                    <ParamCard title="市場指標 (Signal)" description="選擇作為信號的股票 (如大盤 ETF)。若無則使用全部平均。">
                        <select 
                            value={hedgeConfig.signalTicker || ''} 
                            onChange={e => handleHedgeChange('signalTicker', e.target.value || null)} 
                            className={inputStyles}
                            disabled={!hedgeConfig.enabled}
                        >
                            <option value="">全部平均 (Portfolio Average)</option>
                            {stockTickers.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </ParamCard>
                    <ParamCard title="再進場策略" description="空倉後，如何判斷重新進場時機">
                        <select value={hedgeConfig.reentryStrategy} onChange={e => handleHedgeChange('reentryStrategy', e.target.value)} className={inputStyles} disabled={!hedgeConfig.enabled}>
                            <option value="golden_cross">黃金交叉再進場 (較保守)</option>
                            <option value="short_ma_rebound">短期均線回升即進場 (較積極)</option>
                        </select>
                    </ParamCard>
                    <ParamCard title="短期均線" description="快線，預設 20">
                        <input type="number" value={hedgeConfig.shortMAPeriod} onChange={e => handleHedgeChange('shortMAPeriod', parseInt(e.target.value))} className={inputStyles} disabled={!hedgeConfig.enabled}/>
                    </ParamCard>
                     <ParamCard title="長期均線" description="慢線，預設 60">
                        <input type="number" value={hedgeConfig.longMAPeriod} onChange={e => handleHedgeChange('longMAPeriod', parseInt(e.target.value))} className={inputStyles} disabled={!hedgeConfig.enabled} />
                    </ParamCard>
                 </div>
            </div>
        </div>
      </div>

      {/* Priority Stock Feature */}
      <div className="bg-gray-800 p-6 rounded-lg border border-yellow-500/50">
         {/* ... (Existing priority stock code) ... */}
        <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2"><i className="fas fa-star"></i>優先股權重設定</h2>
        <p className="text-sm text-gray-400 mb-4">您可以指定一隻股票並為其設定權重範圍，優化器將在此限制下尋找最佳組合。</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ParamCard title="指定優先股" description="從您的數據中選擇一隻股票">
                <select 
                    value={priorityStock.ticker || ''} 
                    onChange={e => handlePriorityChange('ticker', e.target.value || null)} 
                    className={inputStyles}
                >
                    <option value="">-- 無指定 --</option>
                    {stockTickers.map(ticker => <option key={ticker} value={ticker}>{ticker}</option>)}
                </select>
            </ParamCard>
            <ParamCard title="最低權重 (%)" description="優先股的最小投資比例">
                <input 
                    type="number" 
                    value={priorityStock.minWeight} 
                    onChange={e => handlePriorityChange('minWeight', parseFloat(e.target.value))} 
                    className={`${inputStyles} ${!priorityStock.ticker && 'opacity-50'}`}
                    disabled={!priorityStock.ticker}
                />
            </ParamCard>
            <ParamCard title="最高權重 (%)" description="優先股的最大投資比例">
                <input 
                    type="number" 
                    value={priorityStock.maxWeight} 
                    onChange={e => handlePriorityChange('maxWeight', parseFloat(e.target.value))} 
                    className={`${inputStyles} ${!priorityStock.ticker && 'opacity-50'}`}
                    disabled={!priorityStock.ticker}
                />
            </ParamCard>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button onClick={handleSubmit} className="w-full md:w-1/2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg">
          <i className="fas fa-rocket mr-2"></i> 前往優化
        </button>
      </div>
    </div>
  );
};

export default ParamsSettings;
