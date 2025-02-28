import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true, // すべてのアドレスでリッスン
    port: 5173, // デフォルトポートを使用
    strictPort: true, // 指定したポートが使用中の場合はエラーを出す
  },
})
