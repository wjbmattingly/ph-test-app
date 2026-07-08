require('dotenv').config();

const fs = require('fs');
const path = require('path');

const transcriptsManifestPath = path.resolve(__dirname, 'static/data/transcripts.json');
const transcriptsManifestPathAlt = path.resolve(__dirname, 'platform/static/data/transcripts.json');

function loadTranscriptRoutes() {
  try {
    const manifestPath = fs.existsSync(transcriptsManifestPath)
      ? transcriptsManifestPath
      : (fs.existsSync(transcriptsManifestPathAlt) ? transcriptsManifestPathAlt : null);
    if (!manifestPath) return [];
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const data = JSON.parse(raw);
    return (data.items || []).map((item) => `/transcripts/${item.slug}`);
  } catch (err) {
    console.warn('Unable to load transcript routes:', err.message);
    return [];
  }
}

export default {
  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'placing-holocaust-app',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      {
        rel: 'stylesheet',
        href: 'https://use.typekit.net/aks0uxe.css', // Adobe Fonts stylesheet
      },
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },
  
  serverMiddleware: [
    // Frontend posts to /api/weaviate; keep the old path as an alias.
    { path: "/api/weaviate", handler: "~/server/api/weaviate-proxy.js" },
    { path: "/api/weaviate-proxy", handler: "~/server/api/weaviate-proxy.js" },
    // Local LaBSE embedding service (transformers.js)
    { path: "/api/embed", handler: "~/server/api/embed.js" }
  ],

    // Router Configuration
    router: {
      base: '/', // Replace 'platform' with your repository name
    },
  
  // Generate Configuration
  generate: {
    // Use SPA-style fallback so dynamic routes (e.g., /transcripts/:rg) work
    // without pre-generation. '200.html' is served with a 200 status; the
    // Vercel rewrite in vercel.json points unmatched routes here.
    fallback: '200.html',
    // Avoid pre-generating every transcript detail page; keep the listing route so it’s always present
    routes: ['/transcripts'],
    crawler: false
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    '@/assets/main.css',
    'maplibre-gl/dist/maplibre-gl.css', // Maplibre CSS
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
  ],

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
  }
}
