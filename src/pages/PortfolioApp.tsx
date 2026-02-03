import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useTranslation } from '../contexts/LanguageContext';
import { Logo } from '../components/landing/Logo';
import DataInput from '../components/app/DataInput';
import ParamsSettings from '../components/app/ParamsSettings';
import RunOptimization from '../components/app/RunOptimization';
import ResultsDisplay from '../components/app/ResultsDisplay';
import Toast, { ToastType } from '../components/app/Toast';
import { StockData, PortfolioParams, OptimizationSettings, OptimizationResult, Tab, ProgressUpdate, ScatterPoint } from '../types';
import { runOptimizationWorkers, stopOptimization } from '../services/workerHelper';
import { Loader2, LogOut, LayoutDashboard, Settings, Play, BarChart3, ArrowUpCircle } from 'lucide-react';

const PortfolioApp: React.FC = () => {
  const { language, setLanguage } = useTranslation();
  const navigate = useNavigate();

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  // App state
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Data);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [params, setParams] = useState<PortfolioParams | null>(null);
  const [settings, setSettings] = useState<OptimizationSettings | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  // Optimization state
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ simCount: 0, validCount: 0, bestScore: '0', eta: '--' });
  const scatterPointsRef = useRef<ScatterPoint[]>([]);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      // Check user status
      try {
        const response = await fetch(`/api/check-user-status?email=${encodeURIComponent(currentUser.email || '')}`);
        const data = await response.json();

        if (data.approved !== true) {
          navigate('/login');
          return;
        }

        setUser(currentUser);
        setUserPlan(data.plan || null);
      } catch (err) {
        console.error('Error checking user status:', err);
        navigate('/login');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleDataParsed = (data: { stockData: StockData; params: PortfolioParams }) => {
    setStockData(data.stockData);
    setParams(data.params);
    setToast({ message: `成功解析 ${data.stockData.tickers.length} 支股票，${data.stockData.dates.length} 筆數據`, type: 'success' });
    setActiveTab(Tab.Params);
  };

  const handleStartOptimization = async (newSettings: OptimizationSettings) => {
    if (!stockData) return;

    setSettings(newSettings);
    setIsRunning(true);
    setProgress(0);
    setStats({ simCount: 0, validCount: 0, bestScore: '0', eta: '--' });
    scatterPointsRef.current = [];
    setResult(null);
    setActiveTab(Tab.Optimize);

    const startTime = Date.now();

    const handleProgress = (update: ProgressUpdate) => {
      if (update.type === 'progress') {
        setProgress(update.progress || 0);
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = update.progress && update.progress > 0 ? (elapsed / update.progress) * (100 - update.progress) : 0;
        const etaStr = remaining > 0 ? `${Math.ceil(remaining)}s` : '--';

        setStats({
          simCount: update.simCount || 0,
          validCount: update.totalValidCount || update.validCount || 0,
          bestScore: update.bestScore?.toFixed(4) || '0',
          eta: etaStr,
        });

        if (update.scatterChunk) {
          scatterPointsRef.current = [...scatterPointsRef.current, ...update.scatterChunk];
        }
      } else if (update.type === 'complete') {
        setIsRunning(false);
        setProgress(100);

        if (update.bestPortfolio) {
          const finalResult = {
            ...update.bestPortfolio,
            scatterPoints: scatterPointsRef.current,
          };
          setResult(finalResult);
          setToast({ message: '優化完成！', type: 'success' });
          setActiveTab(Tab.Results);
        }
      } else if (update.type === 'error') {
        setIsRunning(false);
        setToast({ message: update.message || '優化失敗', type: 'error' });
      }
    };

    try {
      await runOptimizationWorkers(stockData, newSettings, handleProgress);
    } catch (err) {
      console.error('Optimization error:', err);
      setIsRunning(false);
      setToast({ message: '優化過程發生錯誤', type: 'error' });
    }
  };

  const handleStopOptimization = () => {
    stopOptimization();
    setIsRunning(false);
    setToast({ message: '優化已停止', type: 'warning' });
  };

  const tabs = [
    { id: Tab.Data, icon: LayoutDashboard, label: '數據輸入' },
    { id: Tab.Params, icon: Settings, label: '參數設定', disabled: !stockData },
    { id: Tab.Optimize, icon: Play, label: '運行優化', disabled: !stockData },
    { id: Tab.Results, icon: BarChart3, label: '結果分析', disabled: !result },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <Logo />
              <span className="text-xl font-bold text-white">PortfolioBlender</span>
            </a>
          </div>

          <div className="flex items-center gap-4">
            {/* Plan 標籤和升級按鈕 */}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                userPlan === 'Pro'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
              }`}>
                {userPlan || 'Trial'}
              </span>
              {userPlan === 'Trial' && (
                <button
                  onClick={() => navigate('/login?upgrade=true')}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-medium transition-colors border border-amber-500/30"
                >
                  <ArrowUpCircle size={14} />
                  {language === 'zh-TW' ? '升級' : 'Upgrade'}
                </button>
              )}
            </div>

            <button
              onClick={() => setLanguage(language === 'en' ? 'zh-TW' : 'en')}
              className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm font-medium transition-colors"
            >
              {language === 'en' ? '繁中' : 'EN'}
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{user?.email}</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors"
            >
              <LogOut size={16} />
              {language === 'zh-TW' ? '登出' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-teal-400 text-teal-400'
                    : tab.disabled
                    ? 'border-transparent text-gray-600 cursor-not-allowed'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === Tab.Data && (
          <DataInput onDataParsed={handleDataParsed} />
        )}

        {activeTab === Tab.Params && stockData && params && (
          <ParamsSettings
            initialParams={params}
            stockTickers={stockData.tickers}
            onStart={handleStartOptimization}
          />
        )}

        {activeTab === Tab.Optimize && (
          <RunOptimization
            isRunning={isRunning}
            progress={progress}
            stats={stats}
            settings={settings}
            onStop={handleStopOptimization}
          />
        )}

        {activeTab === Tab.Results && result && stockData && settings && (
          <ResultsDisplay
            result={result}
            settings={settings}
            stockData={stockData}
          />
        )}
      </main>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default PortfolioApp;
