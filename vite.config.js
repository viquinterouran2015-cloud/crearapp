import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
// Política de contenido estricta solo en producción (el modo dev necesita scripts en línea para HMR)
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'";
const csp = () => ({ name: 'fluir-csp', apply: 'build', transformIndexHtml: html => html.replace('<!--csp-->', `<meta http-equiv="Content-Security-Policy" content="${CSP}">`) });

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: { sourcemap: false, target: 'es2020' },
  plugins: [
    csp(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/*.png', 'icons/icon.svg'],
      manifest: {
        id: './',
        name: 'Fluir · Entrena en casa',
        short_name: 'Fluir',
        description: 'Rutinas en casa sin anuncios ni cuentas.',
        lang: 'es',
        start_url: './index.html',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0D0E10',
        theme_color: '#0D0E10',
        categories: ['health', 'fitness', 'lifestyle'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        shortcuts: [
          { name: 'Entrenar ahora', url: './index.html#/hoy?go=1' },
          { name: 'Explorar', url: './index.html#/explorar' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // Las fotos no se precargan (instalación ligera): se guardan al verlas
        runtimeCaching: [
          { urlPattern: /\/img\/.*\.webp$/, handler: 'CacheFirst', options: { cacheName: 'fluir-fotos', expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 90 } } },
          { urlPattern: /\/video\/.*\.(mp4|webm|webp)$/, handler: 'CacheFirst', options: { cacheName: 'fluir-clips', rangeRequests: true, cacheableResponse: { statuses: [200] }, expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 90 } } },
          { urlPattern: /\/(img|video)\/manifest\.json$/, handler: 'StaleWhileRevalidate', options: { cacheName: 'fluir-fotos-manifest' } }
        ]
      }
    })
  ]
});
