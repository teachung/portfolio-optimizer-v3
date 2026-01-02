import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 這是 Step 5 的核心設定
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 這段設定是為了讓前端能順利呼叫後端的 Netlify Function
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/\.netlify\/functions/, ''),
      },
    },
  },
});