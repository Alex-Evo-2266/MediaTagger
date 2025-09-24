import { resolve } from 'path'
import { normalizePath } from 'vite'

import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            // теперь кроссплатформенно
            src: normalizePath(resolve(__dirname, 'src/renderer/alt.html')),
            dest: ''
          }
        ]
      })
    ]
  }
})
