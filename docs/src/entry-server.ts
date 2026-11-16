import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { renderToString } from 'vue/server-renderer'
import { createMemoryHistory } from 'vue-router'
import App from './App.vue'
import { createAppRouter, FOUNDATION_TOPICS, GUIDE_TOPICS, pageMeta } from './router'

/** Topic routes, from the same lists the router guards use, so prerender and sweeps cannot miss a new page. */
export const topicRoutes: string[] = [
  ...GUIDE_TOPICS.map((t) => `/guides/${t.id}`),
  ...FOUNDATION_TOPICS.map((t) => `/foundations/${t.id}`),
]

/** Renders one route to an HTML string (build-time only; used by scripts/prerender.mjs). */
export async function render(url: string): Promise<{ html: string; title: string; description: string; status: number }> {
  const app = createSSRApp(App)
  const router = createAppRouter(createMemoryHistory())
  app.use(createPinia())
  app.use(router)
  await router.push(url)
  await router.isReady()
  const route = router.currentRoute.value
  const html = await renderToString(app)
  const { title, description } = pageMeta(route.path, route.params)
  return { html, title, description, status: route.name === 'not-found' ? 404 : 200 }
}
