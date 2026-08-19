
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
// Fix: Import process to ensure that Node.js specific methods like cwd() are recognized by the TypeScript compiler
import process from 'process';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api-tspay': {
          target: 'https://tspay.uz/api/v1',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api-tspay/, ''),
        }
      }
    },
    plugins: [react()],
    css: {
      postcss: {
        plugins: [
          tailwindcss,
          autoprefixer,
        ],
      },
    },
    // process.env ni butunlay bo'shatmaslik kerak, Gemini API uchun kerak bo'lishi mumkin
    define: {
      // API_KEY runtime muhitdan olinishi uchun bu yerda o'zgartirmaymiz
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    }
  };
});
