import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@mediapipe/hands': '/mediapipe-shim.js'
    }
  },
  optimizeDeps: {
    exclude: ['@tensorflow-models/hand-pose-detection', '@mediapipe/hands'],
    include: [
      '@tensorflow/tfjs',
      '@tensorflow/tfjs-core',
      '@tensorflow/tfjs-backend-webgl',
      '@tensorflow/tfjs-backend-cpu',
      '@tensorflow/tfjs-converter'
    ]
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
})