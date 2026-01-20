import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // WASM support for Vercel deployment
      build: {
        target: 'esnext',
        // Ensure WASM files are copied to dist
        assetsInlineLimit: 0,
        rollupOptions: {
          output: {
            // Preserve original file names for WASM
            assetFileNames: (assetInfo) => {
              if (assetInfo.name && assetInfo.name.endsWith('.wasm')) {
                return 'assets/[name][extname]';
              }
              return 'assets/[name]-[hash][extname]';
            }
          }
        }
      },
      // Optimize deps to handle WASM properly
      optimizeDeps: {
        exclude: ['@assemblyscript/loader']
      },
      // Make sure WASM files have correct MIME type
      assetsInclude: ['**/*.wasm'],
    };
});
