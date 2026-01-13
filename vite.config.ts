import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 這是 Step 5 的核心設定
export default defineConfig({
  plugins: [react()],
  build: {
    minify: false, // 暫時關閉壓縮以解決 Worker 函數注入後的名稱混淆問題
    terserOptions: {
      keep_fnames: true,
      keep_classnames: true,
    },
  },
  server: {
    proxy: {
      // 這段設定是為了讓前端能順利呼叫後端的 Netlify Function (如果有的話)
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/\.netlify\/functions/, ''),
      },
    },
  },
});
