import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'ErrorState',
  group: 'feedback',
  subgroup: 'States',
  summary: 'Failed-load placeholder with a message, retry button and collapsible technical details.',
  description:
    'Use `ErrorState` where content could not be loaded (a list, a page, a widget). Keep `message` short and actionable; put stacks, request ids and response bodies in `details`. The parent owns the retry logic: handle `retry` and toggle `retrying`. Variants: `default` (centred block inside a region), `card` (bordered surface), `inline` (one row for widgets, list items and table cells) and `page` (full-viewport 404/500/403/503 layout with an `h1`). Use `status` for ready-made HTTP copy (`404` and `403` hide the retry button, `500` and `503` keep it). For form-level errors use `Alert`; for one-line field errors use `InlineMessage`.',
  status: 'stable',
  props: [
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding, gap, icon, title, message and code size of the `default` and `card` variants (`inline` is a fixed compact row and `page` fills the viewport). Unknown values fall back to `md`. Non-default values add `data-size`.' },
    { name: 'layout', type: "'center' | 'start'", default: "'center'", description: '`start` aligns the icon, text and actions to the start edge (follows the writing direction). It applies to `default`, `card` and `page`. Unknown values fall back to `center`. Non-default values add `data-layout`.' },
    { name: 'tone', type: "'danger' | 'warning' | 'neutral'", default: "'danger'", description: 'Colour of the icon (and of the `inline` row). Use `warning` for degraded service and `neutral` for not found or no access. The title and message still say what happened. Unknown values fall back to `danger`. Non-default values add `data-tone`.' },
    { name: 'variant', type: "'default' | 'card' | 'inline' | 'page'", default: "'default'", description: 'Layout. Unknown values fall back to `default`. Non-default values add `data-variant`.' },
    { name: 'status', type: 'number | string', description: 'HTTP status preset: 403, 404, 500 or 503 fill `code`, title, message and the default of `retryable`. Other values only show the code.' },
    { name: 'code', type: 'number | string', description: 'Large code shown instead of the icon (defaults to `status`). Blank values are ignored.' },
    { name: 'title', type: 'string', default: "'Something went wrong'", description: 'Heading. Blank values fall back to the `status` preset title, then to the default.' },
    { name: 'message', type: 'string', description: 'Human-readable explanation. Falls back to the `status` preset message. The default slot overrides it.' },
    { name: 'titleAs', type: "'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div'", default: "'h3' ('h1' for page)", description: 'Heading element of the title. Invalid values fall back to the default.' },
    { name: 'details', type: 'string', description: 'Technical detail in a collapsible <details> block (closed by default). Hidden when blank.' },
    { name: 'retryable', type: 'boolean', default: 'true', description: 'Show the retry button. When omitted it follows the `status` preset (false for 403/404), otherwise true.' },
    { name: 'retryLabel', type: 'string', default: "'Try again'", description: 'Retry button text.' },
    { name: 'retrying', type: 'boolean', default: 'false', description: 'Spinner + disabled retry button with aria-busy (the alert root is not marked busy).' },
    { name: 'detailsLabel', type: 'string', default: "'Technical details'", description: 'Summary text of the details block.' },
    { name: 'icon', type: 'IconDefinition', default: 'faTriangleExclamation', description: 'Icon in the destructive-tinted circle. Hidden when a `code` is shown.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', description: 'Rich message; overrides `message`.' },
    { name: 'actions', description: 'Extra buttons next to the retry button.' },
  ],
  emits: [{ name: 'retry', payload: '[]', description: 'Retry button clicked (not emitted while `retrying`).' }],
  examples: [
    {
      title: 'Minimal',
      code: `<ErrorState message="We could not load your projects." />`,
    },
    {
      title: 'Retry with details',
      script: `import { ref } from 'vue'\nconst retrying = ref(false)\nfunction retry() { retrying.value = true; setTimeout(() => (retrying.value = false), 1500) }`,
      code: `<ErrorState
  title="Could not load users"
  message="The server did not respond in time."
  details="GET /api/users -> 504 Gateway Timeout (request id 7f3a)"
  :retrying="retrying"
  @retry="retry"
/>`,
      state: () => {
        const retrying = ref(false)
        return { retrying, retry: () => { retrying.value = true; setTimeout(() => (retrying.value = false), 1500) } }
      },
    },
    {
      title: 'Variant: card',
      description: 'Bordered surface for a failed panel.',
      code: `<ErrorState variant="card" title="Could not load chart" message="The analytics service did not respond." details="GET /api/stats -> 504" />`,
    },
    {
      title: 'Variant: inline',
      description: 'One row: icon, text and retry. For widgets, list items and table cells.',
      script: `import { ref } from 'vue'\nconst retrying = ref(false)\nfunction retry() { retrying.value = true; setTimeout(() => (retrying.value = false), 1500) }`,
      code: `<ErrorState variant="inline" title="Could not load comments" message="Check your connection." :retrying="retrying" @retry="retry" />`,
      state: () => {
        const retrying = ref(false)
        return { retrying, retry: () => { retrying.value = true; setTimeout(() => (retrying.value = false), 1500) } }
      },
    },
    {
      title: 'Variant: page (404)',
      description: 'Full-viewport layout. `status="404"` supplies the code, copy and hides retry; add a way home in `actions`. (Capped in height here with a class override.)',
      code: `<ErrorState variant="page" status="404" title-as="h4" class="min-h-80 py-8"><template #actions><Button size="sm" as="a" href="/components">Back to the component list</Button></template></ErrorState>`,
    },
    {
      title: 'Variant: page (500)',
      description: '`status="500"` keeps the retry button; the parent decides what retry does.',
      script: `import { ref } from 'vue'\nconst retrying = ref(false)\nfunction retry() { retrying.value = true; setTimeout(() => (retrying.value = false), 1500) }`,
      code: `<ErrorState variant="page" status="500" title-as="h4" class="min-h-80 py-8" details="Request id 7f3a9c" :retrying="retrying" @retry="retry" />`,
      state: () => {
        const retrying = ref(false)
        return { retrying, retry: () => { retrying.value = true; setTimeout(() => (retrying.value = false), 1500) } }
      },
    },
    {
      title: 'Custom code',
      description: '`code` replaces the icon with a large label in any variant.',
      code: `<ErrorState variant="card" code="E_TIMEOUT" title="Request timed out" message="The server took too long to answer." :retryable="false" />`,
    },
    {
      title: 'Size, layout and tone',
      description: 'A compact start-aligned error for a panel, and a large warning for a degraded service.',
      code: `<div class="grid gap-4">
  <ErrorState variant="card" size="sm" layout="start" title="Could not load the list" message="The server did not answer. Try again." />
  <ErrorState variant="card" size="lg" tone="warning" status="503" />
  <ErrorState variant="inline" tone="neutral" title="No access" message="Ask an admin for the viewer role." :retryable="false" />
</div>`,
    },
  ],
  a11y: [
    'The root has role="alert" so the failure is announced when it appears.',
    'The title is an `h3` by default and an `h1` for the page variant. Change it with `titleAs` to keep heading levels in order.',
    'Technical details use native <details>/<summary>. The scrollable details block is keyboard focusable and labelled by `detailsLabel`.',
    'Every size, layout and tone keeps role="alert", the title, the message and the retry button. The tone changes only the icon and row colour: warning icons use the warning foreground token and the words carry the meaning.',
    'The retry button exposes aria-busy while retrying. The status code uses the muted foreground token, which keeps 3:1 contrast.',
  ],
  related: ['EmptyState', 'LoadingState', 'Alert'],
  requires: [
    'Throws a ContractError when an `ErrorState` has no message: a `message`, a known `status` preset or the default slot is required.',
  ],
  llmNotes: ['Use `tone="warning"` for degraded service and `"neutral"` for 403/404; keep `danger` for failures the person can retry.', 'Handle @retry and drive `retrying` from the request state.', 'Never put secrets in `details`.', 'Use ErrorState for failed loads, not for validation errors.', 'For route-level 404/500 screens use `variant="page"` with `status` and provide a link home in the `actions` slot.', 'Use `variant="inline"` for failed widgets and list rows, `card` for failed panels.'],
  replaces: ['hand-rolled ErrorState markup in app code'],
}
export default doc
