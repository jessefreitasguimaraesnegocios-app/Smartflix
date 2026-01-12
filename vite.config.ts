import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['smartflix-logo.svg'],
          manifest: {
            name: 'Smart Flix - Streaming App',
            short_name: 'Smart Flix',
            description: 'Streaming app compatible with Android TV',
            theme_color: '#141414',
            background_color: '#141414',
            display: 'standalone',
            orientation: 'landscape',
            start_url: '/',
            icons: [
              {
                src: '/smartflix-logo.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any maskable'
              },
              {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ],
            categories: ['entertainment', 'video']
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/api\.themoviedb\.org\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'tmdb-api-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 // 24 horas
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'tmdb-images-cache',
                  expiration: {
                    maxEntries: 200,
                    maxAgeSeconds: 60 * 60 * 24 * 7 // 7 dias
                  }
                }
              },
              {
                urlPattern: /^https:\/\/www\.youtube\.com\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'youtube-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 // 1 hora
                  }
                }
              }
            ]
          },
          devOptions: {
            enabled: true,
            type: 'module'
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
