import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'InfiniteScroll',
  group: 'layout',
  subgroup: 'Scrolling',
  summary: 'Fires `load` when the end of a list scrolls into view; handles loading, end-of-list and error-with-retry states.',
  description:
    'Wrap the items of a feed, table or list in `InfiniteScroll`. A hidden sentinel after the content is watched with `IntersectionObserver` (with a scroll-listener fallback when it is unavailable); when it comes within `rootMargin` of the viewport (or of your scroll container via `root`) the component emits `load` once. Set `loading` synchronously in your handler and clear it when the page arrived: the sentinel is re-checked after every loading cycle, so a still-visible sentinel loads the next page. Set `finished` when no more data exists and `error` to show a retry affordance. Do not use it for page-numbered data (use pagination) or for rendering thousands of rows (pair it with VirtualList).',
  status: 'stable',
  props: [
    { name: 'loading', type: 'boolean', default: 'false', description: 'A page is being fetched: shows the loading slot and blocks `load`. Set it synchronously inside `@load`.' },
    { name: 'finished', type: 'boolean', default: 'false', description: 'No more data: shows the end slot and stops observing.' },
    { name: 'error', type: 'boolean | string', default: 'false', description: 'Last fetch failed: shows the error slot with a retry button and stops auto-loading. A string is used as the message.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Pause loading (no observer, no `load`).' },
    { name: 'root', type: 'HTMLElement | string | null', default: 'null', description: 'Scroll container as an element or CSS selector (resolved after mount). `null` or not found = the viewport.' },
    { name: 'rootMargin', type: 'string', default: "'200px'", description: 'IntersectionObserver rootMargin: how early `load` fires. Invalid values fall back to the scroll-listener path.' },
    { name: 'variant', type: "'default' | 'compact'", default: "'default'", description: 'Footer density for the loading, end and error blocks. `default`: py-4, error message above the retry button. `compact`: py-2, message and retry on one wrapping row. Sets `data-variant` when not default. Unknown values fall back to `default`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Footer text and spinner size: sm text-xs with a 12px spinner, md text-sm with 16px, lg text-base with 20px. Unknown values fall back to `md`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', description: 'The loaded items.' },
    { name: 'loading', description: 'Shown while `loading` (default: spinner + "Loading…").' },
    { name: 'end', description: 'Shown when `finished` (default: "No more results.").' },
    { name: 'error', props: '{ retry: () => void, error: boolean | string }', description: 'Shown when `error` (default: message + "Try again" button). Call `retry` to emit `retry` + `load`.' },
  ],
  emits: [
    { name: 'load', description: 'Fetch the next page. Emitted once per intersection; never while `loading`, `finished`, `error` or `disabled`.' },
    { name: 'retry', description: 'The retry button was used; `load` follows immediately.' },
  ],
  examples: [
    {
      title: 'Load pages on demand',
      description: 'The sentinel only loads when scrolled near; in a real app the handler awaits a request.',
      script: `const items = ref(Array.from({ length: 5 }, (_, i) => i + 1))
const loading = ref(false)
const finished = ref(false)
async function load() {
  loading.value = true
  await new Promise((r) => setTimeout(r, 500))
  items.value.push(...Array.from({ length: 5 }, (_, i) => items.value.length + i + 1))
  loading.value = false
  finished.value = items.value.length >= 20
}`,
      code: `<InfiniteScroll :loading="loading" :finished="finished" class="grid gap-2" @load="load">
  <div v-for="n in items" :key="n" class="rounded-md border p-3 text-sm">Sample row {{ n }}</div>
</InfiniteScroll>`,
      state: () => {
        const items = ref(Array.from({ length: 5 }, (_, i) => i + 1))
        const loading = ref(false)
        const finished = ref(false)
        async function load() {
          loading.value = true
          await new Promise((r) => setTimeout(r, 500))
          items.value.push(...Array.from({ length: 5 }, (_, i) => items.value.length + i + 1))
          loading.value = false
          finished.value = items.value.length >= 20
        }
        return { items, loading, finished, load }
      },
    },
    {
      title: 'Inside a scroll container with an error state',
      description: 'Point `root` at the scrolling element. The error slot receives `retry`.',
      script: "const failed = ref(true)",
      code: `<div id="infinite-demo-scroll" class="h-40 overflow-auto rounded-md border p-2" tabindex="0" role="region" aria-label="Infinite scroll demo">
  <InfiniteScroll root="#infinite-demo-scroll" root-margin="0px 0px 40px 0px" :error="failed ? 'Could not reach the server.' : false" @load="failed = false">
    <div v-for="n in 8" :key="n" class="border-b py-2 text-sm">Item {{ n }}</div>
    <template #error="{ retry, error }">
      <p class="text-sm">{{ error }}</p>
      <Button size="sm" variant="outline" @click="retry">Retry</Button>
    </template>
  </InfiniteScroll>
</div>`,
      state: () => ({ failed: ref(true) }),
    },
    {
      title: 'Footer variants and sizes',
      description: 'Loading, end and error footers at the default and compact density, and at each size. Each block is static (`finished`) so nothing fetches.',
      code: `<div class="grid gap-4 md:grid-cols-2">
  <div class="rounded-md border"><InfiniteScroll loading finished><p class="px-3 pt-3 text-sm">Default, loading</p></InfiniteScroll></div>
  <div class="rounded-md border"><InfiniteScroll loading finished variant="compact"><p class="px-3 pt-3 text-sm">Compact, loading</p></InfiniteScroll></div>
  <div class="rounded-md border"><InfiniteScroll finished size="sm"><p class="px-3 pt-3 text-sm">Small, end</p></InfiniteScroll></div>
  <div class="rounded-md border"><InfiniteScroll finished size="lg"><p class="px-3 pt-3 text-sm">Large, end</p></InfiniteScroll></div>
  <div class="rounded-md border"><InfiniteScroll finished error="Could not reach the server."><p class="px-3 pt-3 text-sm">Default, error</p></InfiniteScroll></div>
  <div class="rounded-md border"><InfiniteScroll finished error="Could not reach the server." variant="compact"><p class="px-3 pt-3 text-sm">Compact, error</p></InfiniteScroll></div>
</div>`,
    },
    {
      title: 'Finished with a custom end slot',
      code: `<InfiniteScroll finished class="grid gap-2">
  <div class="rounded-md border p-3 text-sm">Only sample item</div>
  <template #end><p class="text-center text-xs text-muted-foreground">No more items.</p></template>
</InfiniteScroll>`,
    },
  ],
  a11y: [
    'The status area is a polite live region (`role="status"`); the loading and end messages are announced when they appear. The root gets `aria-busy` while loading.',
    'The error block is `role="alert"`; the default retry is a real `button`. Custom error slots must provide a keyboard-reachable retry control.',
    'The sentinel is `aria-hidden`. Consider also offering a manual "Load more" button for keyboard users on very long feeds.',
    'Spinner animation is disabled under `prefers-reduced-motion`.',
    '`variant` and `size` change spacing and text size only; the live region, `role="alert"` error block and retry button are the same in every combination. The compact error row wraps, so it does not overflow at 320px.',
    'The default retry button is at least 24px high (44px on coarse pointers) and has the shared focus ring.',
    'When `root` is a scrolling box, give that box `tabindex="0"`, `role="region"` and an `aria-label` so keyboard users can scroll it.',
  ],
  related: ['VirtualList', 'LoadingState', 'ErrorState', 'EmptyState'],
  requires: [
    'Throws a ContractError when nothing listens for `load` (unless `finished` is set), because no page would ever be fetched.',
    'Throws a ContractError when `root` is a selector that matches no element (or is not a valid selector).',
  ],
  llmNotes: [
    'Set `loading` to true synchronously in the `@load` handler and false when done; set `finished` when the API returns no more pages.',
    'On failure set `error` (not `finished`) so the user can retry; clear it on `@retry`/`@load`.',
    'Inside a scrolling div pass `root` (element or selector); otherwise the viewport is observed.',
    'Do not emit your own scroll listeners; the component already falls back when IntersectionObserver is missing.',
  ],
}

export default doc
