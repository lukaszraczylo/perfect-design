import { createRouter, type RouteRecordRaw, type RouterHistory } from 'vue-router'
import { findEntry, GROUP_META, loadDoc } from '@/lib/registry'

export const FOUNDATION_TOPICS = [
  { id: 'colors', title: 'Colour' },
  { id: 'typography', title: 'Typography' },
  { id: 'spacing', title: 'Spacing & radius' },
  { id: 'elevation', title: 'Elevation' },
  { id: 'motion', title: 'Motion' },
  { id: 'iconography', title: 'Iconography' },
  { id: 'themes', title: 'Themes & dark mode' },
  { id: 'styles', title: 'Style packs' },
  { id: 'accessibility', title: 'Accessibility' },
] as const

export const GUIDE_TOPICS = [
  { id: 'getting-started', title: 'Getting started' },
  { id: 'customisation', title: 'Customisation contract' },
  { id: 'migration', title: 'Migrating existing apps' },
  { id: 'contracts', title: 'Required parts and strict mode' },
  { id: 'testing', title: 'Testing' },
  { id: 'llm', title: 'Using with LLMs' },
] as const

const routes: RouteRecordRaw[] = [
    { path: '/', name: 'home', component: () => import('@/pages/HomePage.vue') },
    { path: '/foundations/:topic', name: 'foundation', component: () => import('@/pages/FoundationPage.vue'), beforeEnter: (to) => FOUNDATION_TOPICS.some((t) => t.id === to.params.topic) || { name: 'not-found', params: { pathMatch: 'foundations' }, replace: true } },
    { path: '/guides/:topic', name: 'guide', component: () => import('@/pages/GuidePage.vue'), beforeEnter: (to) => GUIDE_TOPICS.some((t) => t.id === to.params.topic) || { name: 'not-found', params: { pathMatch: 'guides' }, replace: true } },
    { path: '/components', name: 'components', component: () => import('@/pages/ComponentsIndexPage.vue') },
    { path: '/components/:group', name: 'group', component: () => import('@/pages/GroupPage.vue') },
    { path: '/components/:group/:slug', name: 'component', component: () => import('@/pages/ComponentPage.vue'), beforeEnter: (to) => !!findEntry(String(to.params.group), String(to.params.slug)) || { name: 'not-found', params: { pathMatch: 'components' }, replace: true } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFoundPage.vue') },
]

const SITE = 'Perfect Design'

/** Human-readable page title + description for a route (WCAG 2.4.2 Page Titled; also used for SEO). */
export function pageMeta(path: string, params: Record<string, unknown>): { title: string; description: string } {
  const p = (k: string) => String(params[k] ?? '')
  if (path === '/') return { title: `${SITE}: design system and Vue component library`, description: 'Perfect Design: one design system and a universal, accessible, tested Vue 3 + Tailwind 4 component library with live documentation.' }
  if (path.startsWith('/foundations/')) {
    const t = FOUNDATION_TOPICS.find((x) => x.id === p('topic'))
    return { title: `${t?.title ?? 'Foundations'} · Foundations · ${SITE}`, description: `Design foundations: ${t?.title ?? ''} tokens and rules of the ${SITE} design system.` }
  }
  if (path.startsWith('/guides/')) {
    const t = GUIDE_TOPICS.find((x) => x.id === p('topic'))
    return { title: `${t?.title ?? 'Guide'} · Guides · ${SITE}`, description: `${t?.title ?? 'Guide'}: how to install, customise, migrate to and test with ${SITE}.` }
  }
  if (path === '/components') return { title: `Components · ${SITE}`, description: 'Catalogue of every component, grouped and documented with live examples.' }
  if (params.group && params.slug) {
    const e = findEntry(p('group'), p('slug'))
    return { title: `${e?.name ?? 'Component'} · ${GROUP_META[p('group')]?.title ?? p('group')} · ${SITE}`, description: e?.summary ?? `${SITE} component documentation.` }
  }
  if (params.group) return { title: `${GROUP_META[p('group')]?.title ?? p('group')} components · ${SITE}`, description: GROUP_META[p('group')]?.blurb ?? `${SITE} components.` }
  return { title: `Page not found · ${SITE}`, description: 'This page does not exist.' }
}

/** One router per app instance: the browser gets web history, the prerender gets memory history. */
export function createAppRouter(history: RouterHistory) {
  const router = createRouter({
    history,
    scrollBehavior: (to, _from, saved) => (saved ? saved : to.hash ? { el: to.hash, behavior: 'smooth' } : { top: 0 }),
    routes,
  })

  // Load the component's docs before the page renders, so the first render (and hydration of the prerendered HTML) is complete.
  router.beforeResolve(async (to) => {
    if (to.name !== 'component') return
    const entry = findEntry(String(to.params.group), String(to.params.slug))
    if (entry) await loadDoc(entry).catch(() => null)
  })

  router.afterEach((to, from) => {
    if (typeof document === 'undefined') return
    const { title, description } = pageMeta(to.path, to.params)
    document.title = title
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = description
    // Client-side navigation does not move focus or announce anything on its own: hand focus to <main> so keyboard and
    // screen-reader users start at the new content (skipped on the very first load and on same-page hash jumps).
    if (from.name && to.path !== from.path) {
      queueMicrotask(() => requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true })))
    }
  })

  return router
}
