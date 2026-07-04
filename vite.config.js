import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png'],
      manifest: {
        name: 'Sai Laptop & Computer Gallery - Service Management',
        short_name: 'Sai Laptop RMS',
        description: 'Repair management system for Sai Laptop & Computer Gallery',
        theme_color: '#0a0b10',
        background_color: '#0a0b10',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: '/logo.png', sizes: '192x192', type: 'image/png' },
          { src: '/logo.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5000000,
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://rms-api-psi.vercel.app',
        changeOrigin: true,
        secure: false,
      },
      '/track': {
        target: 'https://rms-api-psi.vercel.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
