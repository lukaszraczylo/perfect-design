<script lang="ts">
import { ref as sharedRef } from 'vue'

// The live-demo chunk (template compiler + the whole library, ~1 MB) must not compete with the first paint. It starts
// loading on the first user input, or a few seconds after the page finished loading, whichever comes first.
const readyToLoad = sharedRef(false)
if (typeof window !== 'undefined' && !(window as unknown as { __PRERENDER__?: boolean }).__PRERENDER__) {
  const go = () => {
    readyToLoad.value = true
    for (const e of INPUT_EVENTS) window.removeEventListener(e, go)
  }
  const INPUT_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const
  for (const e of INPUT_EVENTS) window.addEventListener(e, go, { passive: true, once: true })
  const afterLoad = () => setTimeout(go, 3000)
  if (document.readyState === 'complete') afterLoad()
  else window.addEventListener('load', afterLoad, { once: true })
}
</script>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import type { ExampleDoc } from '@ui/docs-types'
import CodeSnippet from './CodeSnippet.vue'
import DocText from './DocText.vue'

// The live demo chunk (template compiler + the whole library) loads only when an example scrolls near the viewport,
// or immediately with `?eager` (used by the accessibility sweep so every demo is audited).
const ExampleLive = defineAsyncComponent(() => import('./ExampleLive.vue'))

const props = withDefaults(defineProps<{ example: ExampleDoc; eager?: boolean }>(), { eager: false })
const tab = ref<'preview' | 'code'>('preview')
const host = ref<HTMLElement | null>(null)
// `?eager` (used by the accessibility sweep) is read after mount so the first render matches the server-rendered HTML.
const queryEager = ref(false)
const visible = ref(props.eager)
const live = computed(() => props.eager || queryEager.value || (visible.value && readyToLoad.value))
const uid = useId()
let observer: IntersectionObserver | undefined

onMounted(() => {
  queryEager.value = new URLSearchParams(location.search).has('eager')
  if (visible.value) return
  if (typeof IntersectionObserver === 'undefined') {
    visible.value = true
    return
  }
  observer = new IntersectionObserver((records) => {
    if (records.some((r) => r.isIntersecting)) {
      visible.value = true
      observer?.disconnect()
    }
  }, { rootMargin: '400px 0px' })
  if (host.value) observer.observe(host.value)
})
onBeforeUnmount(() => observer?.disconnect())

const fullCode = computed(() => (props.example.script ? `<script setup lang="ts">\n${props.example.script}\n<\/script>\n\n<template>\n${props.example.code.replace(/^/gm, '  ')}\n</template>` : props.example.code))
const tabs = ['preview', 'code'] as const
</script>

<template>
  <figure class="overflow-hidden rounded-xl border" data-testid="example" :aria-labelledby="`${uid}-title`">
    <figcaption class="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
      <div class="min-w-0 [overflow-wrap:anywhere]">
        <h3 :id="`${uid}-title`" class="text-sm font-medium">{{ example.title }}</h3>
        <DocText v-if="example.description" :text="example.description" size="sm" tone="muted" />
      </div>
      <div class="flex shrink-0 rounded-md border bg-background p-0.5 text-xs" role="group" :aria-label="`${example.title} view`">
        <button v-for="t in tabs" :key="t" type="button" :aria-pressed="tab === t" class="min-h-6 rounded px-2.5 py-1 capitalize focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none pointer-coarse:min-h-11" :class="tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'" @click="tab = t">{{ t }}</button>
      </div>
    </figcaption>
    <div v-show="tab === 'preview'" ref="host" class="min-h-24 overflow-x-auto bg-background p-4 sm:p-6" data-testid="example-preview" :aria-busy="!live">
      <ExampleLive v-if="live" :example="example" />
      <p v-else class="text-sm text-muted-foreground">Loading preview…</p>
    </div>
    <CodeSnippet v-if="tab === 'code'" :code="fullCode" class="rounded-none border-0" />
  </figure>
</template>
