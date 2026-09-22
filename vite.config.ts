import { defineConfig } from 'vite';

// GitHub Pages project sites are served from
// https://<user>.github.io/<repo>/ — every asset URL needs that `/repo/`
// prefix in the PRODUCTION build. Locally (`npm run dev`) we still want
// the dev server at the plain root, so base is conditional on the Vite
// command rather than hardcoded everywhere.
const REPO_NAME = 'spamton_g_spamton';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? `/${REPO_NAME}/` : '/',
  build: {
    target: 'es2022',
    outDir: 'dist'
  },
  server: {
    port: 5173
  }
}));
