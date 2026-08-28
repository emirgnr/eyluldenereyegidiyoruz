import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Tek dosyalık build: dist/index.html hiçbir dış dosyaya ihtiyaç duymadan açılır.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { assetsInlineLimit: 100000000, cssCodeSplit: false, chunkSizeWarningLimit: 10000 },
})
