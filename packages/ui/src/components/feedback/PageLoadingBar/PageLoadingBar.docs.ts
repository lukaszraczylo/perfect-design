import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'PageLoadingBar',
  group: 'feedback',
  subgroup: 'Loading',
  summary: 'A thin bar fixed to the top of the viewport that shows a route change or page load, with a delay so fast navigations never flash.',
  description:
    'Mount `PageLoadingBar` once in the app shell and drive `active` from your router. While `active` is true it shows an indeterminate sweep; when `active` turns false it fills to 100% and fades. `delay` (default 150ms) keeps navigations that finish quickly from flashing the bar, and `minDuration` (default 300ms) keeps a bar that did show from blinking away. Turning `active` back on during the finish or fade resumes the sweep without a flash.\n\n' +
    'The bar is `position: fixed` at `z-(--z-toast)` and ignores the pointer. It is idle and `aria-hidden` until it shows; then it is a `progressbar` named by `label` (default "Loading page") with no value while loading. Under prefers-reduced-motion the sweep becomes a static full-width bar while active and the fade is instant.\n\n' +
    'Use it for route and page level waits. For a bar inside a layout use `Progress`; for a region use `LoadingState`.\n\n' +
    'vue-router:\n\n```ts\nconst loading = ref(false)\nrouter.beforeEach(() => { loading.value = true })\nrouter.afterEach(() => { loading.value = false })\nrouter.onError(() => { loading.value = false })\n```\n\n```vue\n<PageLoadingBar :active="loading" />\n```',
  status: 'stable',
  props: [
    { name: 'active', type: 'boolean', default: 'false', description: 'True while a navigation or load is in flight.' },
    { name: 'delay', type: 'number', default: '150', description: 'Milliseconds before the bar shows. 0 shows at once. Negative or invalid values give 150.' },
    { name: 'minDuration', type: 'number', default: '300', description: 'Minimum milliseconds the bar stays once shown. Negative or invalid values give 300.' },
    { name: 'tone', type: "'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", default: "'primary'", description: 'Colour of the bar. Unknown values fall back to primary.' },
    { name: 'size', type: "'xs' | 'sm' | 'md'", default: "'sm'", description: 'Thickness: 2px, 4px, 6px. Unknown values fall back to sm.' },
    { name: 'label', type: 'string', default: "'Loading page'", description: 'Accessible name of the progressbar while it is visible.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last onto the fixed root; use it to move the bar or change its stacking.' },
  ],
  examples: [
    {
      title: 'Toggle with a button',
      description: 'delay 0 and a short minDuration make the bar easy to see in this demo.',
      code: `<div class="space-y-3">
  <Button size="sm" variant="outline" @click="loading = !loading">{{ loading ? 'Finish loading' : 'Start loading' }}</Button>
  <PageLoadingBar :active="loading" :delay="0" :min-duration="600" label="Loading sample page" />
</div>`,
      state: () => ({ loading: ref(false) }),
    },
    {
      title: 'Tone and thickness',
      description: 'Always active here, so every look is visible; the bars stack at the top of the viewport.',
      code: `<div>
  <PageLoadingBar active :delay="0" size="xs" tone="info" label="Loading sample xs" />
  <p class="text-sm text-muted-foreground">The info-toned bar sits at the top of the viewport.</p>
</div>`,
    },
  ],
  a11y: [
    'Idle: `aria-hidden="true"` and invisible, so it adds nothing to the accessibility tree.',
    'Visible: `role="progressbar"` with `aria-label` (default "Loading page"); no `aria-valuenow` while loading (indeterminate), `aria-valuenow="100"` while it finishes.',
    'A progress bar is not announced on its own. For a route change also move focus or update the document title; this bar is a visual cue.',
    'prefers-reduced-motion: a static full-width bar while active, no sweep, no fade.',
    'The bar never takes pointer events and is not focusable.',
  ],
  related: ['Progress', 'LoadingState', 'Spinner', 'Skeleton'],
  llmNotes: [
    'Mount one PageLoadingBar in the app shell; drive `active` from router.beforeEach / afterEach / onError.',
    'Keep the default `delay`; do not set it to 0 outside demos.',
    'Do not use it for in-component loading; use Progress, Spinner or LoadingState.',
    'Announce route changes separately (focus or title); the bar is visual only.',
  ],
  replaces: ['nprogress', 'hand-rolled fixed top loading bars'],
}
export default doc
