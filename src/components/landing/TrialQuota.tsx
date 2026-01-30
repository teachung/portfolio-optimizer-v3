import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Clock, CreditCard, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

interface QuotaData {
  remaining: number;
  total: number;
  isOpen: boolean;
}

interface TrialQuotaProps {
  variant?: 'hero' | 'pricing' | 'card';
  showWaitlistForm?: boolean;
}

export const TrialQuota: React.FC<TrialQuotaProps> = ({
  variant = 'hero',
  showWaitlistForm = true
}) => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchQuota();
  }, []);

  const fetchQuota = async () => {
    try {
      const response = await fetch('/api/get-trial-quota');
      if (response.ok) {
        const data = await response.json();
        setQuota(data);
      }
    } catch (error) {
      console.error('Failed to fetch quota:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch('/api/join-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      setSubmitResult({
        success: data.success,
        message: data.message
      });

      if (data.success) {
        setEmail('');
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: language === 'zh-TW' ? '提交失敗，請稍後再試' : 'Failed to submit, please try again'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayNow = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-48 mb-2"></div>
        <div className="h-2 bg-slate-700 rounded w-full"></div>
      </div>
    );
  }

  if (!quota) return null;

  const percentage = (quota.remaining / quota.total) * 100;
  const isLow = quota.remaining <= 10;
  const isFull = quota.remaining === 0;

  // Hero variant - compact display
  if (variant === 'hero') {
    return (
      <div className="mt-6">
        {/* Quota Display - Bolder and more prominent */}
        <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-full ${
          isFull
            ? 'bg-red-500/20 border-2 border-red-500/50'
            : isLow
              ? 'bg-orange-500/20 border-2 border-orange-500/50'
              : 'bg-emerald-500/20 border-2 border-emerald-500/50'
        }`}>
          <Flame size={20} className={isFull ? 'text-red-400' : isLow ? 'text-orange-400' : 'text-emerald-400'} />
          <span className={`text-base font-extrabold tracking-wide ${isFull ? 'text-red-400' : isLow ? 'text-orange-400' : 'text-emerald-400'}`}>
            {language === 'zh-TW'
              ? `🔥 本月試用名額剩餘：${quota.remaining}/${quota.total}`
              : `🔥 Trial spots remaining: ${quota.remaining}/${quota.total}`
            }
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 w-full max-w-xs">
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFull
                  ? 'bg-red-500'
                  : isLow
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                    : 'bg-gradient-to-r from-emerald-500 to-sky-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'zh-TW'
              ? '名額有限 · 額滿需排隊等候'
              : 'Limited spots · Queue when full'
            }
          </p>
        </div>

        {/* Waitlist Form (when full) */}
        {isFull && showWaitlistForm && (
          <div className="mt-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-orange-400" />
              <span className="text-sm font-semibold text-white">
                {language === 'zh-TW' ? '本月名額已滿' : 'Spots full this month'}
              </span>
            </div>

            {!submitResult?.success ? (
              <>
                <form onSubmit={handleJoinWaitlist} className="flex gap-2 mb-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={language === 'zh-TW' ? '輸入 Email 排隊' : 'Enter email to queue'}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    disabled={submitting}
                  />
                  <button
                    type="submit"
                    disabled={submitting || !email}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Mail size={16} />
                  </button>
                </form>

                {submitResult && !submitResult.success && (
                  <div className="flex items-center gap-2 text-red-400 text-xs mb-3">
                    <AlertCircle size={14} />
                    {submitResult.message}
                  </div>
                )}

                <button
                  onClick={handlePayNow}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-sm font-semibold rounded-lg transition-all"
                >
                  <CreditCard size={16} />
                  {language === 'zh-TW' ? '直接付費成為 Pro 會員' : 'Pay now for Pro membership'}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle size={16} />
                {submitResult.message}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Card variant - compact for inside pricing card
  if (variant === 'card') {
    return (
      <div className={`mt-4 p-4 rounded-xl border ${
        isFull
          ? 'bg-red-500/10 border-red-500/30'
          : isLow
            ? 'bg-orange-500/10 border-orange-500/30'
            : 'bg-emerald-500/10 border-emerald-500/30'
      }`}>
        {/* Quota Display */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Flame size={16} className={isFull ? 'text-red-400' : isLow ? 'text-orange-400' : 'text-emerald-400'} />
            <span className={`text-sm font-bold ${isFull ? 'text-red-400' : isLow ? 'text-orange-400' : 'text-emerald-400'}`}>
              {language === 'zh-TW' ? '本月名額' : 'Spots'}
            </span>
          </div>
          <span className={`text-lg font-extrabold ${isFull ? 'text-red-400' : isLow ? 'text-orange-400' : 'text-emerald-400'}`}>
            {quota.remaining}/{quota.total}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFull
                ? 'bg-red-500'
                : isLow
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                  : 'bg-gradient-to-r from-emerald-500 to-sky-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="text-xs text-slate-500">
          {isFull
            ? (language === 'zh-TW' ? '名額已滿，請排隊或付費' : 'Full, queue or pay now')
            : isLow
              ? (language === 'zh-TW' ? '即將額滿！' : 'Almost full!')
              : (language === 'zh-TW' ? '名額充足' : 'Available')
          }
        </p>
      </div>
    );
  }

  // Pricing variant - card style (standalone above cards)
  return (
    <div className={`p-6 rounded-2xl border ${
      isFull
        ? 'bg-red-500/5 border-red-500/30'
        : isLow
          ? 'bg-orange-500/5 border-orange-500/30'
          : 'bg-emerald-500/5 border-emerald-500/30'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame size={20} className={isFull ? 'text-red-400' : isLow ? 'text-orange-400' : 'text-emerald-400'} />
          <span className="font-bold text-white">
            {language === 'zh-TW' ? '試用名額' : 'Trial Spots'}
          </span>
        </div>
        <span className={`text-2xl font-bold ${isFull ? 'text-red-400' : isLow ? 'text-orange-400' : 'text-emerald-400'}`}>
          {quota.remaining}/{quota.total}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isFull
              ? 'bg-red-500'
              : isLow
                ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                : 'bg-gradient-to-r from-emerald-500 to-sky-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Status Text */}
      <p className="text-sm text-slate-400 mb-4">
        {isFull
          ? (language === 'zh-TW' ? '本月名額已滿，可排隊等候或直接付費' : 'Full this month. Queue or pay now.')
          : isLow
            ? (language === 'zh-TW' ? '名額即將額滿，把握機會！' : 'Almost full, grab yours now!')
            : (language === 'zh-TW' ? '名額充足，立即開始試用' : 'Spots available, start now!')
        }
      </p>

      {/* Waitlist Form (when full) */}
      {isFull && showWaitlistForm && (
        <div className="space-y-3">
          {!submitResult?.success ? (
            <>
              <form onSubmit={handleJoinWaitlist} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === 'zh-TW' ? '輸入 Email 排隊' : 'Enter email to queue'}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  disabled={submitting}
                />
                <button
                  type="submit"
                  disabled={submitting || !email}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {language === 'zh-TW' ? '排隊' : 'Queue'}
                </button>
              </form>

              {submitResult && !submitResult.success && (
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle size={14} />
                  {submitResult.message}
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-[#0B1120] text-slate-500">
                    {language === 'zh-TW' ? '或' : 'or'}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePayNow}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all"
              >
                <CreditCard size={18} />
                {language === 'zh-TW' ? '直接付費跳過排隊' : 'Pay now to skip queue'}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle size={18} />
              {submitResult.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
