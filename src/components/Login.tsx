import React from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

interface LoginProps {
  onLoginSuccess: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user && result.user.email) {
        onLoginSuccess(result.user.email);
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      alert(`登入失敗: ${error.code || error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 text-center">
        <h2 className="text-3xl font-bold mb-6 text-teal-400">歡迎使用</h2>
        <p className="text-gray-400 mb-8">請先登入以使用 AI 智慧投資組合優化器</p>
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          使用 Google 帳號登入
        </button>
      </div>
    </div>
  );
};

export default Login;
