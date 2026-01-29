
import React from 'react';
import { OptimizationSettings } from '../../types';

interface RunOptimizationProps {
  isRunning: boolean;
  progress: number;
  stats: { simCount: number; validCount: number; bestScore: string; eta: string };
  settings: OptimizationSettings | null;
  onStop: () => void;
}

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="bg-gray-800 p-4 rounded-lg text-center">
        <div className="text-sm text-gray-400 mb-1">{label}</div>
        <div className="text-2xl font-bold text-teal-400">{value}</div>
    </div>
);

const RunOptimization: React.FC<RunOptimizationProps> = ({ isRunning, progress, stats, settings, onStop }) => {

  if (!settings && !isRunning) {
    return (
      <div className="text-center py-10 bg-gray-800 rounded-lg">
        <p className="text-gray-400">請先在「參數設定」分頁中設定並開始優化。</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <h2 className="text-xl font-bold text-teal-400 mb-4">{isRunning ? '🚀 優化進行中...' : '✅ 準備就緒'}</h2>
      
      {settings && (
         <div className="mb-6 p-4 bg-gray-900/50 rounded-md text-sm text-gray-300 space-y-2">
            <p><strong>優化目標:</strong> {settings.optimizeTarget}</p>
            <p><strong>模擬次數:</strong> {settings.simulations.toLocaleString()}</p>
            {settings.priorityStockConfig.ticker && (
                <p className="text-yellow-400"><strong>優先股:</strong> {settings.priorityStockConfig.ticker} (權重: {settings.priorityStockConfig.minWeight*100}% - {settings.priorityStockConfig.maxWeight*100}%)</p>
            )}
             {settings.hedgeConfig.enabled && (
                <div className="text-purple-400">
                  <p><strong>避險策略:</strong> 啟用 (MA {settings.hedgeConfig.shortMAPeriod}/{settings.hedgeConfig.longMAPeriod})</p>
                  <p><strong>信號來源:</strong> {settings.hedgeConfig.signalTicker || '全部平均 (Average)'}</p>
                  <p><strong>再進場策略:</strong> {settings.hedgeConfig.reentryStrategy === 'golden_cross' ? '黃金交叉 (保守)' : '短期均線回升 (積極)'}</p>
                </div>
            )}
        </div>
      )}

      {isRunning && (
        <div className="space-y-6">
            <div>
                <div className="relative pt-1">
                    <div className="overflow-hidden h-4 mb-2 text-xs flex rounded-full bg-gray-700">
                        <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500">
                        </div>
                    </div>
                    <p className="text-right text-gray-400 text-sm">{progress.toFixed(1)}%</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="已模擬" value={stats.simCount.toLocaleString()} />
                <StatCard label="符合條件" value={stats.validCount.toLocaleString()} />
                <StatCard label="當前最佳分數" value={stats.bestScore} />
                <StatCard label="預計剩餘時間" value={stats.eta} />
            </div>

            <div className="text-center">
                <button onClick={onStop} className="w-full md:w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300">
                    <i className="fas fa-stop mr-2"></i> 停止優化
                </button>
            </div>
        </div>
      )}

      {!isRunning && settings && (
          <div className="text-center py-6">
              <p className="text-green-400">優化已完成或已停止。您可以在「結果查看」分頁查看結果，或返回「參數設定」重新開始。</p>
          </div>
      )}
    </div>
  );
};

export default RunOptimization;