import { defineConfig } from 'astro/config';

// Projet GitHub Pages : https://n3w4l.github.io/yoga-perrigny/
export default defineConfig({
  site: 'https://n3w4l.github.io',
  base: '/yoga-perrigny',
  trailingSlash: 'always',
  output: 'static',
  compressHTML: true,
  prefetch: false,
  build: {
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // Garde les scripts dans des fichiers : une CSP sans 'unsafe-inline' peut alors les autoriser.
      assetsInlineLimit: 0,
    },
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
});
