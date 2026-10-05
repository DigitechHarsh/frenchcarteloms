import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Pre-transform main application files during startup for near-instant first page load
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/features/dashboard/DashboardPage.tsx',
        './src/features/order/OrderPage.tsx',
        './src/features/kitchen/KitchenPage.tsx',
      ],
    },
  },
  optimizeDeps: {
    // Pre-bundle heavy dependencies upfront so Vite does not pause or reload during browser load
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-router-dom',
      'antd',
      '@ant-design/icons',
      'recharts',
      'dayjs',
      'framer-motion',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'idb',
      'canvas-confetti',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
    ],
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-core': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['antd', '@ant-design/icons'],
          'vendor-charts': ['recharts'],
          'vendor-data': ['@tanstack/react-query', '@supabase/supabase-js', 'idb'],
        },
      },
    },
  },
})
