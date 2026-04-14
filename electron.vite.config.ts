import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  renderer: {
    // Each window gets its own entry point so they are separate bundles.
    // This keeps the quick-entry window fast — it doesn't load log-viewer code.
    build: {
      rollupOptions: {
        input: {
          quickEntry: resolve('src/renderer/windows/quick-entry/index.html'),
          settings: resolve('src/renderer/windows/settings/index.html'),
          logViewer: resolve('src/renderer/windows/log-viewer/index.html')
        }
      }
    },
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@renderer': resolve('src/renderer')
      }
    },
    plugins: [react()]
  }
})