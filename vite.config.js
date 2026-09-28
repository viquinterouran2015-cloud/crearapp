import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/icon.svg'],
      manifest: {
        name: 'Fluir · Entrena en casa',
        short_name: 'Fluir',
        description: 'Rutinas en casa sin anuncios ni cuentas.',
        lang: 'es',
        start_url: './index.html',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F6F5F1',
        theme_color: '#3E7C6E',
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
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'] }
    })
  ]
});
