
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Tab, StockData, PortfolioParams, OptimizationSettings, OptimizationResult, ProgressUpdate, PriorityStockConfig, ScatterPoint } from './types';
import DataInput from './components/DataInput';
import ParamsSettings from './components/ParamsSettings';
import RunOptimization from './components/RunOptimization';
import ResultsDisplay from './components/ResultsDisplay';
import Toast from './components/Toast';
import { createWorkerCode } from './services/workerHelper';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Data);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [params, setParams] = useState<PortfolioParams | null>(null);
  const [optimizationSettings, setOptimizationSettings] = useState<OptimizationSettings | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressStats, setProgressStats] = useState({ simCount: 0, validCount: 0, bestScore: '-', eta: '-' });
  const [results, setResults] = useState<OptimizationResult | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' | 'warning' }[]>([]);
  
  // Use Ref for scatter data accumulation to avoid closure stale state issues in worker callbacks
  const scatterDataRef = useRef<ScatterPoint[]>([]);
  
  const workersRef = useRef<Worker[]>([]);
  const shouldStopRef = useRef<boolean>(false);
  const nextToastId = useRef(0);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = nextToastId.current++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const handleDataParsed = (data: { stockData: StockData; params: PortfolioParams }) => {
    setStockData(data.stockData);
    setParams(data.params);
    // CRITICAL FIX: Clear previous results to prevent crashing ResultsDisplay with mismatched ticker data
    setResults(null); 
    setOptimizationSettings(null); 
    addToast(`數據解析成功！共 ${data.stockData.tickers.length} 隻股票，${data.stockData.dates.length} 個數據點`, 'success');
    setActiveTab(Tab.Params);
  };

  const handleStop = () => {
    shouldStopRef.current = true;
    workersRef.current.forEach(w => w.terminate());
    workersRef.current = [];
    setIsRunning(false);
    addToast('優化已手動停止', 'warning');
  };

  const handleStart = async (settings: OptimizationSettings) => {
    if (!stockData) {
      addToast('請先載入股票數據', 'error');
      return;
    }
    
    setIsRunning(true);
    shouldStopRef.current = false;
    setResults(null);
    scatterDataRef.current = []; // Reset scatter data ref
    setProgress(0);
    setProgressStats({ simCount: 0, validCount: 0, bestScore: '-', eta: '-' });
    setOptimizationSettings(settings);
    setActiveTab(Tab.Optimize);

    const startTime = Date.now();
    let totalSims = 0;
    let totalValid = 0;
    let globalBestScore = settings.optimizeTarget.includes('min_dd') || settings.optimizeTarget === 'target_return_mindd' || settings.optimizeTarget.includes('winrate') ? Infinity : -Infinity;
    let globalBestPortfolio: OptimizationResult | null = null;
    
    const workerCount = navigator.hardwareConcurrency || 4;
    const workerCode = createWorkerCode();
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workersRef.current = Array.from({ length: workerCount }, () => new Worker(workerUrl));
    
    addToast(`開始優化... 使用 ${workerCount} 線程 (${settings.optimizationAlgorithm === 'genetic' ? '🧬 遺傳算法' : '🎲 蒙地卡羅'})`, 'info');

    const simsPerWorker = Math.ceil(settings.simulations / workerCount);

    workersRef.current.forEach((worker, index) => {
        worker.postMessage({
            stockData,
            settings,
            simulations: simsPerWorker,
            workerId: index
        });
        
        worker.onmessage = (e: MessageEvent<ProgressUpdate>) => {
          if (shouldStopRef.current) return;
          
          const data = e.data;
          
          switch (data.type) {
            case 'progress':
              totalSims += data.simCount || 0;
              totalValid += data.validCount || 0;
              
              if(data.scatterChunk && data.scatterChunk.length > 0) {
                  // Append to Ref instead of State
                  scatterDataRef.current.push(...data.scatterChunk);
                  // Limit to prevent memory issues
                  if (scatterDataRef.current.length > 3000) {
                      scatterDataRef.current = scatterDataRef.current.slice(scatterDataRef.current.length - 3000);
                  }
              }

              if(data.bestPortfolio) {
                const isImprovement = settings.optimizeTarget.includes('min_dd') || settings.optimizeTarget === 'target_return_mindd' || settings.optimizeTarget.includes('winrate')
                  ? (data.bestScore! < globalBestScore)
                  : (data.bestScore! > globalBestScore);
                
                if (isImprovement) {
                  globalBestScore = data.bestScore!;
                  globalBestPortfolio = data.bestPortfolio;
                }
              }

              const currentProgress = Math.min(100, (totalSims / settings.simulations) * 100);
              setProgress(currentProgress);

              const elapsed = (Date.now() - startTime) / 1000;
              const eta = (elapsed / totalSims) * (settings.simulations - totalSims);

              let bestScoreDisplay = '-';
              if(globalBestScore !== Infinity && globalBestScore !== -Infinity) {
                  if (settings.optimizeTarget.includes('dd') || settings.optimizeTarget.includes('smooth') || settings.optimizeTarget.includes('winrate')) {
                      bestScoreDisplay = (globalBestScore * 100).toFixed(2) + '%';
                  } else {
                      bestScoreDisplay = globalBestScore.toFixed(3);
                  }
              }

              setProgressStats({
                simCount: totalSims,
                validCount: totalValid,
                bestScore: bestScoreDisplay,
                eta: eta > 0 ? `${Math.ceil(eta)}s` : 'N/A'
              });
              break;

            case 'complete':
                worker.terminate();
                workersRef.current = workersRef.current.filter(w => w !== worker);
                if (workersRef.current.length === 0) {
                    URL.revokeObjectURL(workerUrl);
                    setIsRunning(false);
                    if(globalBestPortfolio) {
                        // Use Ref.current to get the accumulated scatter points
                        const finalResult = { ...globalBestPortfolio, scatterPoints: scatterDataRef.current };
                        setResults(finalResult);
                        addToast('優化完成！', 'success');
                        setActiveTab(Tab.Results);
                    } else {
                        addToast('優化失敗，未能計算出任何有效的投資組合。', 'error');
                    }
                }
                break;
            case 'error':
              addToast(`Worker 錯誤: ${data.message}`, 'error');
              handleStop();
              break;
          }
        };

        worker.onerror = (e) => {
            addToast(`一個 Worker 發生嚴重錯誤: ${e.message}`, 'error');
            handleStop();
        };
    });
  };
  
  const TabButton = ({ tabId, children }: React.PropsWithChildren<{ tabId: Tab }>) => (
      <button
          className={`px-4 py-3 text-sm md:text-base font-semibold border-b-4 transition-all duration-300 ${activeTab === tabId ? 'border-teal-400 text-teal-300' : 'border-transparent text-gray-400 hover:border-teal-500/50 hover:text-white'}`}
          onClick={() => setActiveTab(tabId)}
      >
          {children}
      </button>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gray-900 text-gray-200 font-sans">
      <div className="max-w-7xl mx-auto bg-gray-800/50 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden border border-gray-700">
        <header className="p-6 text-center bg-gray-900/70 border-b-2 border-teal-500/50">
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-12 h-12" role="img" aria-label="Network Connection Logo">
              <g>
                <line x1="20" y1="35" x2="15" y2="65" stroke="#00A79D" strokeWidth="3" strokeLinecap="round" />
                <line x1="20" y1="35" x2="50" y2="55" stroke="#00A79D" strokeWidth="3" strokeLinecap="round" />
                
                <line x1="85" y1="15" x2="55" y2="30" stroke="#B0D236" strokeWidth="3" strokeLinecap="round" />
                <line x1="55" y1="30" x2="50" y2="55" stroke="#B0D236" strokeWidth="3" strokeLinecap="round" />
                
                <line x1="15" y1="65" x2="45" y2="90" stroke="#21314D" strokeWidth="3" strokeLinecap="round" />
                <line x1="85" y1="55" x2="45" y2="90" stroke="#21314D" strokeWidth="3" strokeLinecap="round" />
                
                <polyline points="30,72 45,82 65,62" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                <g fill="#B0D236">
                    <circle cx="20" cy="35" r="9" /> <circle cx="15" cy="65" r="9" /> <circle cx="45" cy="90" r="9" /> <circle cx="85" cy="15" r="9" /> </g>
                
                <g fill="#00A79D">
                    <circle cx="55" cy="30" r="9" /> <circle cx="50" cy="55" r="9" /> <circle cx="85" cy="55" r="9" /> </g>
                
                <g fill="#21314D">
                    <circle cx="20" cy="35" r="5" />
                    <circle cx="15" cy="65" r="5" />
                    <circle cx="45" cy="90" r="5" />
                    <circle cx="85" cy="15" r="5" />
                    <circle cx="55" cy="30" r="5" />
                    <circle cx="50" cy="55" r="5" />
                    <circle cx="85" cy="55" r="5" />
                </g>
              </g>
            </svg>
            <span>AI 智慧投資組合優化器 v3.4</span>
          </h1>
          <p className="mt-2 text-gray-400">Web Worker 遺傳算法 | 風險平價模擬 | 效率前緣互動分析</p>
        </header>

        <main className="p-6">
          <nav className="flex space-x-2 border-b border-gray-700 mb-6 overflow-x-auto">
            <TabButton tabId={Tab.Data}><i className="fas fa-database mr-2"></i>數據輸入</TabButton>
            <TabButton tabId={Tab.Params}><i className="fas fa-sliders-h mr-2"></i>參數設定</TabButton>
            <TabButton tabId={Tab.Optimize}><i className="fas fa-rocket mr-2"></i>開始優化</TabButton>
            <TabButton tabId={Tab.Results}><i className="fas fa-chart-pie mr-2"></i>專業分析報告</TabButton>
          </nav>

          <div className={`${activeTab !== Tab.Data ? 'hidden' : 'block'}`}>
            <DataInput onDataParsed={handleDataParsed} />
          </div>
          <div className={`${activeTab !== Tab.Params ? 'hidden' : 'block'}`}>
            {stockData && params ? (
              <ParamsSettings initialParams={params} stockTickers={stockData.tickers} onStart={handleStart} />
            ) : (
              <div className="text-center py-10 bg-gray-800 rounded-lg">
                <p className="text-gray-400">請先在「數據輸入」分頁中提供數據。</p>
              </div>
            )}
          </div>
          <div className={`${activeTab !== Tab.Optimize ? 'hidden' : 'block'}`}>
            <RunOptimization 
              isRunning={isRunning} 
              progress={progress}
              stats={progressStats}
              settings={optimizationSettings}
              onStop={handleStop}
            />
          </div>
          <div className={`${activeTab !== Tab.Results ? 'hidden' : 'block'}`}>
            <ResultsDisplay result={results} settings={optimizationSettings} stockData={stockData} />
          </div>
        </main>
      </div>
      <div className="fixed bottom-4 right-4 z-50">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(p => p.filter(t => t.id !== toast.id))} />
        ))}
      </div>
    </div>
  );
};

export default App;
