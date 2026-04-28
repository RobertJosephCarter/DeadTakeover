import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Game JS is intentionally large (one big sim). Bump the warning so it
    // stops crying about chunks under 800 KB — the engine has a known floor.
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        // Split Three.js into its own long-cacheable chunk. When game code
        // changes, browsers don't re-download the ~600 KB renderer.
        // Rolldown expects a function form (Rollup's object form is gone).
        manualChunks(id) {
          if (id.includes('node_modules/three/')) return 'three';
          return undefined;
        },
      },
    },
  },
  server: {
    open: true,
  },
});
