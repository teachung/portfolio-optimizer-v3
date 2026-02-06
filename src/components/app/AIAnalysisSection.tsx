import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Send, Loader2, ChevronDown, ChevronUp, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { OptimizationResult } from '../../types';
import { auth } from '../../firebase';

interface AIAnalysisSectionProps {
  result: OptimizationResult;
  userPlan: string | null;
  language: string;
}

const MONTHLY_AI_LIMIT = 30;

const AIAnalysisSection: React.FC<AIAnalysisSectionProps> = ({ result, userPlan, language }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usageInfo, setUsageInfo] = useState<{ usageCount: number; remainingUsage: number } | null>(null);

  // FirstMonth、Pro 和 Admin 都有 AI 功能
  const hasAIAccess = userPlan === 'FirstMonth' || userPlan === 'Pro' || userPlan === 'Admin';

  const handleAnalyze = async () => {
    if (!hasAIAccess) return;

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      // ===== Get Firebase ID Token =====
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error(language === 'zh-TW' ? '請先登入' : 'Please login first');
      }

      const idToken = await currentUser.getIdToken(true); // Force refresh token

      // ===== Call API with Token =====
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`, // Send token in header
        },
        body: JSON.stringify({
          weights: result.weights,
          metrics: {
            cagr: result.metrics.cagr,
            sharpe: result.metrics.sharpe,
            maxDD: result.metrics.maxDD,
            winRate: result.metrics.winRate,
            volatility: result.metrics.volatility,
            calmar: result.metrics.calmar,
            totalReturn: result.metrics.totalReturn,
            duration: result.metrics.duration,
          },
          query: query || undefined,
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (data.code === 'USAGE_LIMIT_EXCEEDED') {
          throw new Error(
            language === 'zh-TW'
              ? `本月 AI 使用次數已達上限 (${data.limit} 次)`
              : `Monthly AI usage limit reached (${data.limit} times)`
          );
        }
        throw new Error(data.error || 'Failed to get AI analysis');
      }

      setAnalysis(data.analysis);

      // Update usage info
      if (data.usageCount !== undefined) {
        setUsageInfo({
          usageCount: data.usageCount,
          remainingUsage: data.remainingUsage,
        });
      }
    } catch (err) {
      console.error('AI analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const placeholderText = language === 'zh-TW'
    ? '例如: 這個組合的科技股佔比是否太高？在加息環境下表現如何？有什麼防守股建議加入？'
    : 'E.g.: Is the tech allocation too high? How would it perform in a rising rate environment? Any defensive stocks to add?';

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-lg font-semibold text-gray-100">
            AI 組合戰略分析 (Portfolio Analyst)
          </span>
          {!hasAIAccess && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-medium">
              <Lock size={12} />
              {language === 'zh-TW' ? '付費' : 'Paid'}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-700 p-4">
          {!hasAIAccess ? (
            // Trial User - Show upgrade prompt
            <div className="text-center py-8">
              <Lock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                {language === 'zh-TW' ? '付費專屬功能' : 'Paid Feature'}
              </h3>
              <p className="text-gray-400 mb-4">
                {language === 'zh-TW'
                  ? 'AI 組合分析是 FirstMonth / Pro 用戶專屬功能。訂閱後可獲得專業的投資組合深度分析報告。'
                  : 'AI Portfolio Analysis is a FirstMonth/Pro exclusive feature. Subscribe to get professional portfolio analysis reports.'}
              </p>
              <a
                href="/login?upgrade=true"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors"
              >
                <Sparkles size={16} />
                {language === 'zh-TW' ? '訂閱方案' : 'Subscribe'}
              </a>
            </div>
          ) : (
            // Pro User - Show AI interface
            <div className="space-y-4">
              {/* Status indicator with usage info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  <span className="text-gray-400">
                    {language === 'zh-TW'
                      ? '已連接雲端 AI (Web Search) - 可獲取最新資料'
                      : 'Connected to Cloud AI (Web Search) - Can fetch latest data'}
                  </span>
                </div>
                {/* Usage counter */}
                <div className="text-sm text-gray-400">
                  {usageInfo ? (
                    <span className={usageInfo.remainingUsage <= 5 ? 'text-amber-400' : ''}>
                      {language === 'zh-TW'
                        ? `本月剩餘: ${usageInfo.remainingUsage}/${MONTHLY_AI_LIMIT} 次`
                        : `Remaining: ${usageInfo.remainingUsage}/${MONTHLY_AI_LIMIT}`}
                    </span>
                  ) : (
                    <span>
                      {language === 'zh-TW'
                        ? `每月上限: ${MONTHLY_AI_LIMIT} 次`
                        : `Monthly limit: ${MONTHLY_AI_LIMIT}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Input area */}
              <div className="space-y-2">
                <label className="text-sm text-gray-400">
                  {language === 'zh-TW'
                    ? '你想問什麼? (針對此投資組合)'
                    : 'What do you want to ask? (About this portfolio)'}
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholderText}
                  className="w-full h-24 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  disabled={isLoading}
                />
              </div>

              {/* Analyze button */}
              <div className="flex justify-end">
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 disabled:cursor-not-allowed text-white font-medium transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {language === 'zh-TW' ? '分析中...' : 'Analyzing...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {language === 'zh-TW' ? '開始全組合分析' : 'Start Portfolio Analysis'}
                    </>
                  )}
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-medium">
                      {language === 'zh-TW' ? '分析失敗' : 'Analysis Failed'}
                    </p>
                    <p className="text-red-400/80 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Analysis result */}
              {analysis && (
                <div className="mt-6 p-6 bg-gray-900/50 border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
                    <Bot className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-gray-100">
                      {language === 'zh-TW' ? '分析報告' : 'Analysis Report'}
                    </h3>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="text-xl font-bold text-gray-100 mt-6 mb-3">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-bold text-gray-100 mt-5 mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-bold text-gray-200 mt-4 mb-2">{children}</h3>,
                        p: ({ children }) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-gray-300">{children}</li>,
                        strong: ({ children }) => <strong className="text-gray-100 font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="text-purple-300">{children}</em>,
                        code: ({ children }) => <code className="bg-gray-700 px-1.5 py-0.5 rounded text-purple-300 text-sm">{children}</code>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-purple-500 pl-4 my-3 text-gray-400 italic">
                            {children}
                          </blockquote>
                        ),
                        hr: () => <hr className="border-gray-700 my-4" />,
                      }}
                    >
                      {analysis}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAnalysisSection;
