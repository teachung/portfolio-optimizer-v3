import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useTranslation } from '../contexts/LanguageContext';
import { Logo } from '../components/landing/Logo';
import { Loader2, AlertCircle, Clock } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check user status in Airtable
        try {
          const response = await fetch(`/api/check-user-status?email=${encodeURIComponent(user.email || '')}`);
          const data = await response.json();

          if (data.approved === true) {
            navigate('/app');
          } else {
            setPendingApproval(true);
          }
        } catch (err) {
          console.error('Error checking user status:', err);
        }
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Auth state change will handle the redirect
    } catch (err: any) {
      console.error('Login error:', err);
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <a href="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-xl font-bold text-white">PortfolioBlender</span>
        </a>
        <button
          onClick={() => setLanguage(language === 'en' ? 'zh-TW' : 'en')}
          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors"
        >
          {language === 'en' ? '繁中' : 'EN'}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Logo />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {t('login.title')}
              </h1>
              <p className="text-slate-400">
                {t('login.subtitle')}
              </p>
            </div>

            {/* Pending Approval Message */}
            {pendingApproval && (
              <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-amber-200 text-sm">
                  {t('login.pending')}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Google Login Button */}
            {!pendingApproval && (
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {t('login.google_btn')}
                  </>
                )}
              </button>
            )}

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-slate-400 hover:text-emerald-400 text-sm transition-colors"
              >
                ← Back to Home
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
