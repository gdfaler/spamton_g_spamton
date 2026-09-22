import { defineConfig } from 'vite';

// Relative base so the built `dist/` works from any sub-path — needed for
// GitHub Pages project sites (https://<user>.github.io/<repo>/) without
// having to hardcode the repo name here.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist'
  },
  server: {
    port: 5173
  }
});
