// 登入頁面組件
import React, { useState } from 'react';
import { signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '../src/firebase';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

type AuthStatus = 'idle' | 'loading' | 'checking' | 'pending' | 'error';

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pendingEmail, setPendingEmail] = useState<string>('');

  const handleGoogleLogin = async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      // Step 1: Google 登入
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user.email) {
        throw new Error('無法獲取用戶郵箱');
      }

      setStatus('checking');

      // Step 2: 檢查 Airtable 審批狀態
      const response = await fetch(`/api/check-user-status?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '伺服器錯誤');
      }

      if (data.approved) {
        // 已通過審批，進入系統
        onLoginSuccess(user);
      } else {
        // 未通過審批，顯示等待頁面
        setPendingEmail(user.email);
        setStatus('pending');
        // 登出 Firebase（保持未授權狀態）
        await signOut(auth);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorMessage(error.message || '登入失敗，請稍後再試');
      setStatus('error');
      // 確保登出
      try {
        await signOut(auth);
      } catch {}
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setErrorMessage('');
    setPendingEmail('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-12 h-12" role="img">
              <g>
                <line x1="20" y1="35" x2="15" y2="65" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                <line x1="20" y1="35" x2="50" y2="55" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                <line x1="85" y1="15" x2="55" y2="30" stroke="#B0D236" strokeWidth="3" strokeLinecap="round" />
                <line x1="55" y1="30" x2="50" y2="55" stroke="#B0D236" strokeWidth="3" strokeLinecap="round" />
                <g fill="#B0D236">
                  <circle cx="20" cy="35" r="8" />
                  <circle cx="15" cy="65" r="8" />
                  <circle cx="85" cy="15" r="8" />
                </g>
                <g fill="#ffffff">
                  <circle cx="55" cy="30" r="8" />
                  <circle cx="50" cy="55" r="8" />
                </g>
              </g>
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">AI 智慧投資組合優化器</h1>
          <p className="text-gray-400">專業級投資組合分析與優化工具</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700 p-8">
          {status === 'idle' && (
            <>
              <h2 className="text-xl font-semibold text-white text-center mb-6">歡迎使用</h2>
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                使用 Google 帳號登入
              </button>
              <p className="text-xs text-gray-500 text-center mt-4">
                首次登入需要管理員審批後才能使用
              </p>
            </>
          )}

          {status === 'loading' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-500/20 rounded-full mb-4">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-300">正在連接 Google...</p>
            </div>
          )}

          {status === 'checking' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-300">驗證用戶權限中...</p>
            </div>
          )}

          {status === 'pending' && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-4">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">等待審批</h3>
              <p className="text-gray-400 text-sm mb-4">
                您的帳號 <span className="text-white font-medium">{pendingEmail}</span> 已提交註冊申請
              </p>
              <p className="text-gray-500 text-xs mb-6">
                請聯繫管理員進行審批，審批通過後即可使用系統
              </p>
              <button
                onClick={handleRetry}
                className="text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors"
              >
                重新登入 →
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">登入失敗</h3>
              <p className="text-gray-400 text-sm mb-6">{errorMessage}</p>
              <button
                onClick={handleRetry}
                className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                重試
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          © 2024 AI Portfolio Optimizer. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
