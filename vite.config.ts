import { defineConfig } from 'vite'
import packageJson from './package.json' // Import the package.json file

const externalDeps = Object.keys(packageJson.dependencies || {})
const nodeBuiltins = [/^node:.*/]

export default defineConfig({
  plugins: [],
  build: {
    target: 'es2022',
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      treeshake: true, // Ensure tree-shaking is on
      external: [...externalDeps, ...nodeBuiltins],
    },
    outDir: 'dist', // Output directory
    emptyOutDir: true, // Clean output directory before builds
  },
})
