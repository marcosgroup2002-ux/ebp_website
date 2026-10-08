import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: ['es2018', 'chrome70', 'firefox65', 'safari12', 'edge18'],
    rollupOptions: {
      output: {
        // Librairies dans des fichiers séparés : elles restent en cache d'une mise à jour du site à l'autre.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@supabase')) return 'vendor-supabase'
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'vendor-motion'
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/') || id.includes('scheduler')) return 'vendor-react'
          return 'vendor'
        },
      },
    },
  },
})
