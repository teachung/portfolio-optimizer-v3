import React from 'react';
import { auth } from '../firebase';

const Pending: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl border border-yellow-500/50 text-center">
        <div className="text-yellow-500 text-6xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold mb-4">後台正在確認中</h2>
        <p className="text-gray-400 mb-6">
          您的帳號已成功登入，但管理員尚未開通權限。<br/>
          請在確認支付會員費後稍候，或聯繫管理員。
        </p>
        <button
          onClick={() => auth.signOut()}
          className="text-teal-400 hover:underline"
        >
          切換帳號登入
        </button>
      </div>
    </div>
  );
};

export default Pending;
