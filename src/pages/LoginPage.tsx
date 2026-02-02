import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useTranslation } from '../contexts/LanguageContext';
import { Logo } from '../components/landing/Logo';
import { Loader2, AlertCircle, Clock, Upload, CheckCircle, CreditCard, QrCode } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email);
        // Check user status in Airtable
        try {
          const response = await fetch(`/api/check-user-status?email=${encodeURIComponent(user.email || '')}`);
          const data = await response.json();

          if (data.approved === true) {
            navigate('/app');
          } else {
            // User is pending or new - show pending message
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

  // 壓縮圖片函數
  const compressImage = (file: File, maxSizeMB: number = 1): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // 計算縮放比例，確保圖片不會太大
          const maxDimension = 1920;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // 壓縮為 JPEG，質量 0.7
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64.split(',')[1]);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userEmail) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError(language === 'zh-TW' ? '請上傳圖片檔案' : 'Please upload an image file');
      return;
    }

    // Validate file size (max 10MB for original, will be compressed)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(language === 'zh-TW' ? '圖片大小不能超過 10MB' : 'Image size cannot exceed 10MB');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // 壓縮圖片
      const compressedBase64 = await compressImage(file);

      // 發送到 Vercel API（由 API 轉發到 Google Apps Script）
      const response = await fetch('/api/upload-payment-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          imageData: compressedBase64,
          fileName: file.name.replace(/\.[^.]+$/, '.jpg'), // 改為 .jpg
          contentType: 'image/jpeg'
        })
      });

      const data = await response.json();

      if (data.success) {
        setUploadSuccess(true);
      } else {
        setUploadError(data.error || data.message || (language === 'zh-TW' ? '上傳失敗，請重試' : 'Upload failed, please try again'));
      }
      setUploading(false);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(language === 'zh-TW' ? '上傳失敗，請重試' : 'Upload failed, please try again');
      setUploading(false);
    }
  };

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

            {/* Pending Approval Message with Payment Options */}
            {pendingApproval && (
              <div className="mb-6 space-y-6">
                {/* Pending Status */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-amber-200 text-sm">
                    {t('login.pending')}
                  </p>
                </div>

                {/* Payment Section */}
                <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-bold text-white">
                      {language === 'zh-TW' ? '付款方式' : 'Payment Methods'}
                    </h3>
                  </div>

                  <p className="text-slate-400 text-sm mb-4">
                    {language === 'zh-TW'
                      ? '請使用以下方式付款，完成後上傳截圖：'
                      : 'Please pay using the methods below, then upload screenshot:'}
                  </p>

                  {/* QR Codes Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* PayMe QR Code */}
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 text-center">
                      <div className="w-full aspect-square bg-white rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                        {/* 請將此處的 src 替換為您的 PayMe QR code 圖片 URL */}
                        <img
                          src="/payme-qr.png"
                          alt="PayMe QR Code"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // Fallback if image not found
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden flex-col items-center justify-center text-slate-400">
                          <QrCode size={48} />
                          <span className="text-xs mt-2">PayMe</span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-emerald-400">PayMe</span>
                    </div>

                    {/* FPS QR Code */}
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 text-center">
                      <div className="w-full aspect-square bg-white rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                        {/* 請將此處的 src 替換為您的 FPS QR code 圖片 URL */}
                        <img
                          src="/fps-qr.png"
                          alt="FPS QR Code"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // Fallback if image not found
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden flex-col items-center justify-center text-slate-400">
                          <QrCode size={48} />
                          <span className="text-xs mt-2">FPS</span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-sky-400">FPS 轉數快</span>
                    </div>
                  </div>

                  {/* Upload Section */}
                  <div className="border-t border-slate-700 pt-4">
                    <p className="text-slate-300 text-sm font-medium mb-3">
                      {language === 'zh-TW'
                        ? '付款後請上傳截圖：'
                        : 'After payment, upload screenshot:'}
                    </p>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    {uploadSuccess ? (
                      <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-300 text-sm">
                          {language === 'zh-TW'
                            ? '付款證明已上傳！我們會在 1-2 個工作天內審核。'
                            : 'Payment proof uploaded! We will review within 1-2 business days.'}
                        </span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-semibold transition-all disabled:opacity-50"
                        >
                          {uploading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Upload size={18} />
                              {language === 'zh-TW' ? '上傳付款截圖' : 'Upload Payment Screenshot'}
                            </>
                          )}
                        </button>

                        {uploadError && (
                          <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle size={14} />
                            {uploadError}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
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
