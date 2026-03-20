import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: { usePolling: true }, // Docker volume mount で HMR を確実に効かせる
    proxy: {
      /**
       * /api/* を backend コンテナに転送する。
       * Docker 環境: VITE_API_URL=http://backend:3000（docker-compose.yml で設定）
       * ローカル直起動: http://localhost:3000 にフォールバック
       * 本番環境: VITE_API_BASE_URL を設定するためプロキシは使用されない
       */
      '/api': {
        target: process.env.VITE_API_URL ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
