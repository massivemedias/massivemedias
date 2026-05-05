import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Base path: '/massivemedias/' pour GitHub Pages (massivemedias.github.io/massivemedias/)
  // Changer en '/' quand le custom domain massivemedias.com sera actif
    base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    // FRONT-02 : limite raisonnable par chunk pour que vite warn si un chunk
    // commence a gonfler (par defaut 500KB, on descend a 400 pour etre pushy).
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // FRONT-02 : splitting aggressif. Le but est que les visiteurs
          // publics (95% du trafic) ne telechargent JAMAIS les gros chunks
          // admin (jspdf, html2canvas, recharts, invoiceParser).
          if (!id.includes('node_modules')) return undefined;

          // React + router restent dans le critical path
          if (id.includes('/react-dom/') || id.includes('/react-router') || id.match(/\/react\/[^/]+$/)) {
            return 'vendor-react';
          }
          // Animations : critique pour la plupart des pages publiques
          if (id.includes('/framer-motion/')) return 'vendor-motion';
          if (id.includes('/lucide-react/')) return 'vendor-icons';
          // Supabase client : uniquement auth + stockage, loade tard
          if (id.includes('/@supabase/')) return 'vendor-supabase';
          // Axios : utilise partout, garde dans vendor mais separe
          if (id.includes('/axios/')) return 'vendor-axios';
          // PDF: admin-only (factures, contrats) - ne DOIT pas etre dans
          // l'index principal. On force ces libs dans leurs propres chunks
          // pour qu'elles ne soient telechargees que quand un import dynamique
          // de generateInvoice/generateContractPDF les reference.
          if (id.includes('/jspdf') || id.includes('/jspdf-autotable/')) return 'vendor-pdf';
          if (id.includes('/html2canvas')) return 'vendor-html2canvas';
          // Recharts : admin stats uniquement
          if (id.includes('/recharts/') || id.includes('/d3-')) return 'vendor-charts';
          // i18n : critique sur toutes les pages publiques
          if (id.includes('/i18next') || id.includes('/react-i18next')) return 'vendor-i18n';
          // Stripe : checkout seulement
          if (id.includes('/@stripe/')) return 'vendor-stripe';
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:1337',
        changeOrigin: true,
      },
    },
  },
})
