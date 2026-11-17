import { createApp, createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { createWebHistory } from 'vue-router'
import { useThemeStore } from '@ui/index'
import App from './App.vue'
import { createAppRouter } from './router'
import { browserEnv, isChunkLoadError, reloadForNewBuild } from './lib/stale-build'
import './style.css'

// Pages are rendered to HTML at build time (see scripts/prerender.mjs). When that HTML is present the app hydrates it in
// place: the content the browser already painted stays put, so there is no second paint or layout shift. An empty shell
// (the 404 fallback, or a dev server) is mounted normally.
const hydrate = !!document.getElementById('app')?.hasChildNodes()
const app = (hydrate ? createSSRApp : createApp)(App)
const router = createAppRouter(createWebHistory(import.meta.env.BASE_URL))
app.use(createPinia())
app.use(router)
// After a deploy, a tab opened earlier asks for chunk names that no longer exist: load the page again from the new build.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewBuild(window.location.href, browserEnv())) event.preventDefault()
})
router.onError((error, to) => {
  if (isChunkLoadError(error)) reloadForNewBuild(to.fullPath, browserEnv())
})
router.isReady().then(() => {
  app.mount('#app')
  useThemeStore().init()
})
