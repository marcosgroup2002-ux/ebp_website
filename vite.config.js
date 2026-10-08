import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: ['es2018', 'chrome70', 'firefox65', 'safari12', 'edge18'],
  },
})
