import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import packageJson from './package.json' // Import the package.json file

const externalDeps = Object.keys(packageJson.dependencies || {})

export default defineConfig({
  plugins: [
    // Support for TypeScript path aliases
    tsconfigPaths(),
  ],
  build: {
    target: 'es2022',
    lib: {
      entry: './src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      treeshake: true, // Ensure tree-shaking is on
      external: externalDeps,
    },
    outDir: 'dist', // Output directory
    emptyOutDir: true, // Clean output directory before builds
  },
})
