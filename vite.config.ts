import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Marcatore di build (UTC, "YYYY-MM-DD HH:mm"): calcolato a ogni build e
// iniettato via `define` come costante globale __BUILD_ID__. Mostrato nella
// Libreria per verificare a colpo d'occhio quale versione è servita (no cache).
const buildId = new Date().toISOString().slice(0, 16).replace('T', ' ')

// Tailwind v4 via plugin ufficiale (@tailwindcss/vite) — NIENTE config PostCSS v3.
// vite-plugin-pwa con registerType autoUpdate: precache di tutta l'app shell.
// Nessuna risorsa da CDN: tutto è bundlato per garantire il funzionamento offline.
// Percorso base dell'app. '/' per dev, Docker e host alla radice; per GitHub
// Pages (https://<utente>.github.io/<repo>/) il workflow imposta BASE_PATH=/<repo>/.
// (Letto da globalThis per non richiedere @types/node solo per questa riga.)
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
const base = env?.BASE_PATH || '/'

export default defineConfig({
  base,
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  // Porta di default per dev (`npm run dev`) e preview (`npm run preview`).
  // host: true → bind su 0.0.0.0 (tutte le interfacce) così l'app è raggiungibile
  // dallo smartphone sulla stessa rete (es. http://192.168.x.x:4200).
  // allowedHosts: autorizza i tunnel cloudflared (sottodominio casuale ogni volta)
  // e ngrok, per il test PWA in HTTPS da telefono.
  server: { port: 4200, host: true, allowedHosts: ['.trycloudflare.com', '.ngrok-free.app'] },
  preview: { port: 4200, host: true, allowedHosts: ['.trycloudflare.com', '.ngrok-free.app'] },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // La registrazione del SW la facciamo a mano in main.tsx (per agganciare il
      // controllo periodico degli aggiornamenti) → niente auto-inject del plugin.
      injectRegister: false,
      includeAssets: ['favicon-16.png', 'favicon-32.png', 'apple-touch-icon.png'],
      workbox: {
        // L'app shell (JS/CSS/HTML/font) viene precachata.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,woff,woff2,ico}'],
        // L'EPUB e i salvataggi vivono in IndexedDB, non serve cachearli qui.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
      manifest: {
        name: 'Kai-Chronik',
        short_name: 'Kai-Chronik',
        description: 'Offline-Begleiter für Spielbücher: Leser, Aktionsblatt, Kampf und Protokoll',
        lang: 'de',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#1a1206',
        background_color: '#1a1206',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
