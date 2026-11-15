import { ref } from 'vue'
import { faFileInvoice } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'


const doc: ComponentDoc = {
  name: 'AsyncBoundary',
  group: 'feedback',
  subgroup: 'States',
  summary: 'Shows the right state for async content: loading, error with retry, empty or the content itself.',
  description:
    'Wrap anything that is fetched. Drive it with `state` (`idle`, `loading`, `error`, `empty`, `success`) or hand it a `promise` and it follows the promise: pending is loading, rejected is the error, fulfilled is the content (or the empty state when the result has nothing in it). The built-in states are `LoadingState`, `ErrorState` and `EmptyState`; replace any of them with the `loading`, `error`, `empty` or `idle` slot. `delay` holds the loading state back so a fast load never flashes it, and `minDuration` keeps it up long enough to read. A promise that is swapped for a newer one, or that settles after the component is gone, is ignored. Use it for a region of a page. For a whole failed page use `ErrorState` with `variant="page"`; for content that only needs a skeleton while it loads, `LoadingState` alone is enough.',
  status: 'stable',
  props: [
    { name: 'state', type: "'idle' | 'loading' | 'error' | 'empty' | 'success'", description: 'The state to show. Wins over `promise` when set. Unknown values fall back to `success`. With neither `state` nor `promise` the default slot shows.' },
    { name: 'promise', type: 'PromiseLike<unknown> | null', description: 'Follow a promise: pending is `loading`, rejected is `error`, fulfilled is `success` or `empty`. `null` means not started (`idle`). A newer promise replaces the old one, whose result is then ignored.' },
    { name: 'error', type: 'unknown', description: 'What went wrong: a string, an Error, an object with a `message`, a number. Rendered as plain text (never HTML), control characters removed, cut at 300 characters. Overrides the reason of a rejected promise.' },
    { name: 'variant', type: "'default' | 'card' | 'compact'", default: "'default'", description: '`default` has no surface. `card` draws a bordered surface with padding for the content. `compact` swaps in the dense forms of the built-in states: an inline loader, a single-row error, a compact empty state. Unknown values fall back to `default`. Non-default values add `data-variant`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Scale of the built-in loading, error and empty states. Your own content is not affected. Unknown values fall back to `md`. Non-default values add `data-size`.' },
    { name: 'delay', type: 'number', default: '0', description: 'Milliseconds to wait before the loading state appears. Finished content stays on screen meanwhile. A load that ends sooner never shows the loader. Negative, NaN and Infinity count as 0; the maximum is 60000.' },
    { name: 'minDuration', type: 'number', default: '0', description: 'Milliseconds the loading state stays once it has appeared, so it does not flash. Counted from the moment it appeared. The same limits as `delay`.' },
    { name: 'loadingLabel', type: 'string', default: "'Loading…'", description: 'Text of the built-in loading state. Also announced when you supply your own `loading` slot.' },
    { name: 'loadingVariant', type: "'spinner' | 'text' | 'card' | 'table' | 'list' | 'avatar-text' | 'kpi-grid' | 'form'", default: "'spinner'", description: 'Look of the built-in loading state (the `variant` of `LoadingState`): a spinner or a skeleton that matches the content.' },
    { name: 'errorTitle', type: 'string', description: 'Heading of the built-in error state. Defaults to "Something went wrong".' },
    { name: 'errorMessage', type: 'string', description: 'Your own wording for the built-in error state. The real error then moves into the collapsible technical details. Without it the error text is shown, or a generic sentence when there is none.' },
    { name: 'retryable', type: 'boolean', default: 'true', description: 'Show the retry button in the built-in error state. It needs an `@retry` handler.' },
    { name: 'retryLabel', type: 'string', default: "'Try again'", description: 'Text of the retry button.' },
    { name: 'emptyTitle', type: 'string', default: "'Nothing to show'", description: 'Heading of the built-in empty state. Say what is empty ("No invoices yet"). Also announced when loading ends with nothing.' },
    { name: 'emptyDescription', type: 'string', description: 'Supporting text of the built-in empty state.' },
    { name: 'emptyIcon', type: 'IconDefinition', description: 'Icon of the built-in empty state.' },
    { name: 'isEmpty', type: '(value: unknown) => boolean', description: 'Decides whether a fulfilled promise value is empty. The default treats null, undefined, an empty array, a blank string and an empty Set or Map as empty. A function that throws counts as not empty.' },
    { name: 'successLabel', type: 'string', default: "'Loaded.'", description: 'Announced politely when a load ends with content. An empty string turns the announcement off, for the empty state as well.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', props: '{ data: unknown }', description: 'The content. `data` is the value a followed promise fulfilled with.' },
    { name: 'loading', description: 'Replaces the built-in loading state.' },
    { name: 'error', props: '{ error: unknown, message: string, retry: () => void }', description: 'Replaces the built-in error state. `message` is the safe text; call `retry` to emit `retry`.' },
    { name: 'empty', props: '{ data: unknown }', description: 'Replaces the built-in empty state.' },
    { name: 'empty-action', description: 'Button or link shown under the built-in empty state (the `action` slot of `EmptyState`).' },
    { name: 'idle', description: 'Shown before anything was requested (`state="idle"` or `:promise="null"`). Renders nothing when omitted.' },
  ],
  emits: [{ name: 'retry', payload: '[]', description: 'The retry button of the built-in error state was pressed, or `retry()` was called from the `error` slot. Start the load again.' }],
  examples: [
    {
      title: 'Move through the states',
      description: 'The buttons set `state`; the boundary swaps the built-in states and the content.',
      script: `const current = ref('success')\nconst states = ['loading', 'error', 'empty', 'success']`,
      code: `<div class="grid gap-3">
  <div class="flex flex-wrap gap-2">
    <Button v-for="s in states" :key="s" size="sm" :variant="current === s ? 'default' : 'outline'" :aria-pressed="current === s" @click="current = s">{{ s }}</Button>
  </div>
  <AsyncBoundary :state="current" error="The sample server did not answer." empty-title="No invoices yet" empty-description="Invoices appear here once one is issued." @retry="current = 'loading'">
    <p>Three sample invoices are listed here.</p>
  </AsyncBoundary>
</div>`,
      state: () => ({ current: ref('success'), states: ['loading', 'error', 'empty', 'success'] }),
    },
    {
      title: 'Follow a promise',
      description: 'Starting a load swaps in a new promise. Pending shows the loader, a rejection shows the error, and Try again starts over.',
      script: `const promise = ref(null)\nlet attempt = 0\nfunction load() {\n  attempt += 1\n  const ok = attempt % 2 === 0\n  promise.value = new Promise((resolve, reject) => setTimeout(() => (ok ? resolve(['Sample row']) : reject(new Error('Sample request failed'))), 700))\n}`,
      code: `<div class="grid gap-3">
  <div><Button size="sm" @click="load">Load sample rows</Button></div>
  <AsyncBoundary :promise="promise" loading-label="Loading sample rows" empty-title="No sample rows" @retry="load">
    <template #idle><p class="text-sm text-muted-foreground">Nothing requested yet.</p></template>
    <template #default="{ data }"><p>Loaded {{ data ? data.length : 0 }} sample row.</p></template>
  </AsyncBoundary>
</div>`,
      state: () => {
        const promise = ref<Promise<unknown> | null>(null)
        let attempt = 0
        const load = () => {
          attempt += 1
          const ok = attempt % 2 === 0
          promise.value = new Promise((resolve, reject) => setTimeout(() => (ok ? resolve(['Sample row']) : reject(new Error('Sample request failed'))), 700))
        }
        return { promise, load }
      },
    },
    {
      title: 'No flash: delay and minimum time',
      description: 'With `delay` the loader only appears when a load is slow. With `minDuration` a loader that did appear stays long enough to read. Try a quick load and a slow one.',
      script: `const current = ref('success')\nfunction run(ms) {\n  current.value = 'loading'\n  setTimeout(() => (current.value = 'success'), ms)\n}`,
      code: `<div class="grid gap-3">
  <div class="flex flex-wrap gap-2">
    <Button size="sm" variant="outline" @click="run(150)">Quick load (150 ms)</Button>
    <Button size="sm" variant="outline" @click="run(1500)">Slow load (1.5 s)</Button>
  </div>
  <AsyncBoundary :state="current" :delay="400" :min-duration="800" loading-label="Loading sample report" :retryable="false">
    <p>Sample report is ready.</p>
  </AsyncBoundary>
</div>`,
      state: () => {
        const current = ref('success')
        const run = (ms: number) => {
          current.value = 'loading'
          setTimeout(() => (current.value = 'success'), ms)
        }
        return { current, run }
      },
    },
    {
      title: 'Skeleton loading and an empty state with an action',
      description: '`loadingVariant` picks a skeleton that matches the content. The empty state takes its next step from the `empty-action` slot.',
      code: `<div class="grid gap-6 md:grid-cols-2">
  <AsyncBoundary state="loading" loading-variant="list" :rows="3" loading-label="Loading sample list" :retryable="false">
    <p>List</p>
  </AsyncBoundary>
  <AsyncBoundary state="empty" :empty-icon="faFileInvoice" empty-title="No invoices yet" empty-description="Issue the first one to see it here." :retryable="false">
    <p>List</p>
    <template #empty-action><Button size="sm">Issue an invoice</Button></template>
  </AsyncBoundary>
</div>`,
      script: `import { faFileInvoice } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faFileInvoice }),
    },
    {
      title: 'Error text is shown safely',
      description: 'A string, an Error or any other value becomes plain text. HTML is not interpreted and very long text is cut. With `error-message` the real error moves into the technical details.',
      script: `const failure = new Error('Request to /sample/reports timed out after 30 seconds')\nconst hostile = '<img src=x onerror=alert(1)> ' + 'long text '.repeat(80)`,
      code: `<div class="grid gap-6 md:grid-cols-2">
  <AsyncBoundary state="error" :error="hostile" error-title="Could not load the report" @retry="() => {}">
    <p>Report</p>
  </AsyncBoundary>
  <AsyncBoundary state="error" :error="failure" error-title="Could not load the report" error-message="The report service is slow. Try again in a minute." @retry="() => {}">
    <p>Report</p>
  </AsyncBoundary>
</div>`,
      state: () => ({
        failure: new Error('Request to /sample/reports timed out after 30 seconds'),
        hostile: '<img src=x onerror=alert(1)> ' + 'long text '.repeat(80),
      }),
    },
    {
      title: 'Variants and sizes',
      description: '`card` puts the states and the content on one bordered surface. `compact` swaps in the dense forms of the states. `size` scales the built-in states.',
      code: `<div class="grid gap-4 md:grid-cols-2">
  <AsyncBoundary variant="card" state="success" :retryable="false"><p>Content on a card surface.</p></AsyncBoundary>
  <AsyncBoundary variant="card" size="sm" state="empty" empty-title="No sample items" :retryable="false"><p>Items</p></AsyncBoundary>
  <AsyncBoundary variant="compact" state="loading" loading-label="Loading sample items" :retryable="false"><p>Items</p></AsyncBoundary>
  <AsyncBoundary variant="compact" state="error" error="The sample list could not be loaded." @retry="() => {}"><p>Items</p></AsyncBoundary>
  <AsyncBoundary variant="compact" state="empty" empty-title="No sample items" :retryable="false"><p>Items</p></AsyncBoundary>
  <AsyncBoundary size="lg" state="loading" loading-label="Loading a large sample" :retryable="false"><p>Items</p></AsyncBoundary>
</div>`,
    },
    {
      title: 'Your own states in slots',
      description: 'A slot replaces the built-in state. The `error` slot receives the safe `message` and a `retry` function; the boundary announces a custom error and a custom loader politely.',
      code: `<AsyncBoundary state="error" error="Sample failure" loading-label="Loading" @retry="() => {}">
  <template #loading><p>Fetching the sample list</p></template>
  <template #error="{ message, retry }">
    <div class="flex flex-wrap items-center gap-3 rounded-md border p-3 text-sm">
      <span>{{ message }}</span>
      <Button size="sm" variant="outline" @click="retry">Fetch again</Button>
    </div>
  </template>
  <p>Sample list</p>
</AsyncBoundary>`,
    },
  ],
  a11y: [
    'The root carries `aria-busy="true"` while loading, including the time before a delayed loader appears.',
    'Announcements: the built-in loading state is a polite `role="status"` region and the built-in error state is `role="alert"` (assertive, because the person has to act). A separate visually hidden polite status region announces the end of a load ("Loaded." or the empty title), a custom `loading` slot and a custom `error` slot. Regions are siblings, never nested.',
    'Nothing is announced on first render with finished content, and a load that ended before its `delay` produces one short announcement, not a loading and a loaded pair.',
    'The retry button is a labelled native button with a 24px minimum target (44px on coarse pointers) and a visible focus ring. When the loader replaces the error, focus is not moved; the retry button leaves the DOM, so put your own focus management in the `retry` handler when needed.',
    'Error text is rendered as text only, long words wrap (`break-words`), and the technical details are a labelled, focusable region. Colour is never the only signal: the error has an icon and a heading, the empty state a title.',
    'Motion: the skeleton pulse is off under `prefers-reduced-motion`. Borders keep the card surface visible in forced-colors mode. Layout uses logical properties and wraps at 320px.',
  ],
  related: ['LoadingState', 'ErrorState', 'EmptyState', 'StaleNotice', 'OfflineIndicator'],
  requires: [
    'Throws a ContractError when `AsyncBoundary` has no default slot (the content to show once loading succeeds).',
    'Throws a ContractError when the retry button is on (`retryable`, the default) but there is no `@retry` handler and no `error` slot, because the button would do nothing.',
  ],
  llmNotes: [
    'Give the boundary one source of truth: `state` or `promise`, not both. `state` wins when both are set.',
    'Always handle `@retry` (start the load again) or set `:retryable="false"`.',
    'Create the promise once per load (in an event handler or a watcher). A promise created in the template runs on every render.',
    'Use `delay` (about 200 ms) for fast endpoints and `minDuration` (about 500 ms) when a flash of loader is worse than waiting. Both default to 0.',
    'Name what is empty in `emptyTitle` ("No invoices yet"); say what failed in `errorTitle`. Do not rely on the defaults in shipped screens.',
    'Pass the raw error to `error`; the component shortens it and never renders HTML. Use `errorMessage` for friendlier wording.',
    'Timers and the promise callback are cleaned up on unmount; do not add your own.',
  ],
  replaces: ['hand-rolled v-if chains for loading, error and empty states', 'Suspense wrappers that only show a spinner'],
}
export default doc
