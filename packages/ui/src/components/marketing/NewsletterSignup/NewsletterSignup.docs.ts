import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

/** Demo handler: pretends to call an API. Replace with your own request. */
function demo() {
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
  const email = ref('')
  const onSubscribe = (value: string) => {
    status.value = 'loading'
    setTimeout(() => {
      status.value = value.endsWith('@fail.test') ? 'error' : 'success'
    }, 800)
  }
  return { status, email, onSubscribe }
}

const script = `const status = ref('idle')
const email = ref('')
async function onSubscribe(value) {
  status.value = 'loading'
  try {
    await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ email: value }) })
    status.value = 'success'
  } catch {
    status.value = 'error'
  }
}`

const doc: ComponentDoc = {
  name: 'NewsletterSignup',
  group: 'marketing',
  subgroup: 'Forms',
  summary: 'Single-field email signup with validation; the parent performs the request and drives `status`.',
  description:
    'Presentational newsletter form. It validates the address (simple pattern), emits `subscribe` with the trimmed email and renders whatever `status` the parent sets: `loading` disables the button (aria-busy) and ignores further submits, `success` shows `successMessage`, `error` shows `errorMessage`. It never makes a network call itself: the form submits nowhere until you handle `subscribe`, so always wire the event or remove the component. `inline` puts input and button in a row from `sm`, `stacked` is a centred narrow column, `card` is a stacked form on a bordered surface, `split` puts the copy on the left and the form on the right from `lg` (one column below). `size` scales the controls, title and spacing, and `shape` rounds the field and the button as rounded, pill or square. For multi-field forms use `ContactSection` with your own form.',
  status: 'stable',
  props: [
    { name: 'variant', type: "'inline' | 'stacked' | 'card' | 'split'", default: "'inline'", description: 'Layout. `split` places the title and description on the left and the form and its messages on the right from `lg`; below `lg` it is one column in reading order. Without a title or description the form is not pushed to the right column. Unknown values fall back to `inline`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Controls, title, description and spacing. `sm`: 36px controls, `md`: the original 44px, `lg`: 48px controls and a larger title. Touch pointers keep a 44px minimum height and the field keeps 16px text on small screens at every size. Unknown values fall back to `md`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corners of the email field and the button: 6px (the original), fully round (the field gets extra inline padding) or none. The field keeps its border and focus ring. Unknown values fall back to `rounded`.' },
    { name: 'status', type: "'idle' | 'loading' | 'success' | 'error'", default: "'idle'", description: 'Controlled by the parent after handling `subscribe`; unknown values fall back to `idle`.' },
    { name: 'modelValue', type: 'string', description: 'Email value for `v-model`. Optional: without it the component keeps its own value.' },
    { name: 'title', type: 'string', description: 'Heading text (or use the `title` slot).' },
    { name: 'description', type: 'string', description: 'Supporting text under the title (or use the `description` slot).' },
    { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', default: '2', description: 'Heading element level of the title; invalid values fall back to 2.' },
    { name: 'placeholder', type: 'string', default: "'Enter your email'", description: 'Input placeholder.' },
    { name: 'buttonLabel', type: 'string', default: "'Subscribe'", description: 'Submit button text.' },
    { name: 'label', type: 'string', default: "'Email address'", description: 'Visually hidden label of the input (accessible name).' },
    { name: 'successMessage', type: 'string', default: "'Thanks for subscribing!'", description: 'Shown (role="status") while `status` is `success`.' },
    { name: 'errorMessage', type: 'string', default: "'Something went wrong. Please try again.'", description: 'Shown (role="alert") while `status` is `error`.' },
    { name: 'invalidMessage', type: 'string', default: "'Enter a valid email address.'", description: 'Shown (role="alert") when the typed email fails validation; also sets aria-invalid on the input and moves focus to it.' },
    { name: 'resetOnSuccess', type: 'boolean', default: 'false', description: 'Clear the input (and emit `update:modelValue` with `""`) when `status` becomes `success`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes. Attributes fall through to the root element.' },
  ],
  slots: [
    { name: 'title', description: 'Rich title content; replaces the `title` prop.' },
    { name: 'description', description: 'Rich description content; replaces the `description` prop.' },
  ],
  emits: [
    { name: 'subscribe', payload: '[email: string]', description: 'Fired on a valid submit with the trimmed email. Not fired for invalid emails, nor while `status` is `loading`.' },
    { name: 'update:modelValue', payload: '[value: string]', description: 'Fired on every input and on reset after success.' },
  ],
  examples: [
    {
      title: 'Minimal',
      code: `<NewsletterSignup :status="status" @subscribe="onSubscribe" />`,
      script,
      state: demo,
    },
    {
      title: 'Inline variant',
      description: 'Default. Input and button in one row from `sm`.',
      code: `<NewsletterSignup variant="inline" title="Release notes for the inline layout" description="Sent when a version ships." :status="status" v-model="email" reset-on-success @subscribe="onSubscribe" />`,
      script,
      state: demo,
    },
    {
      title: 'Stacked variant',
      description: 'Centred narrow column; good for footers and centred bands. Sample form: the demo handler fakes a request.',
      code: `<NewsletterSignup variant="stacked" title="Release notes for the stacked layout" description="Sent when a version ships." button-label="Send release notes" :status="status" @subscribe="onSubscribe" />`,
      script,
      state: demo,
    },
    {
      title: 'Card variant',
      description: 'Bordered surface for plain page backgrounds or sidebars.',
      code: `<NewsletterSignup variant="card" title="Release notes for the card layout" description="Sent when a version ships." :level="3" :status="status" @subscribe="onSubscribe" />`,
      script,
      state: demo,
    },
    {
      title: 'Split variant',
      description: 'Copy on the left, form on the right from `lg`.',
      code: `<NewsletterSignup variant="split" title="Release notes for the split layout" description="Sent when a version ships." button-label="Send release notes" :status="status" @subscribe="onSubscribe" />`,
      script,
      state: demo,
    },
    {
      title: 'Sizes',
      description: 'Gallery of `size`: sm, md (default) and lg. All three keep a 44px minimum on touch pointers.',
      code: `<div class="grid gap-8">
  <NewsletterSignup v-for="s in ['sm', 'md', 'lg']" :key="s" :size="s" :title="'Release notes, size ' + s" description="Sample newsletter for the size gallery." :level="3" :status="status" @subscribe="onSubscribe" />
</div>`,
      script,
      state: demo,
    },
    {
      title: 'Shapes',
      description: 'Gallery of `shape`: rounded (default), pill and square, on the stacked layout.',
      code: `<div class="grid gap-8 md:grid-cols-3">
  <NewsletterSignup v-for="s in ['rounded', 'pill', 'square']" :key="s" variant="stacked" :shape="s" :title="'Release notes, ' + s" :level="3" button-label="Send" :status="status" @subscribe="onSubscribe" />
</div>`,
      script,
      state: demo,
    },
    {
      title: 'Combined: large pill card',
      code: `<NewsletterSignup variant="card" size="lg" shape="pill" title="Release notes in a large card" description="Sent when a version ships." :level="3" button-label="Send release notes" :status="status" @subscribe="onSubscribe" />`,
      script,
      state: demo,
    },
    {
      title: 'Realistic: states and custom messages',
      description: 'Type an address ending in `@fail.test` to see the error state.',
      code: `<NewsletterSignup
  variant="stacked"
  title="Release notes with custom messages"
  placeholder="name@example.com"
  button-label="Send release notes"
  success-message="Subscribed. Check your inbox to confirm."
  error-message="The server did not answer. Try again in a minute."
  invalid-message="That does not look like an email address."
  :status="status"
  reset-on-success
  v-model="email"
  @subscribe="onSubscribe"
/>
<p class="mt-2 text-center text-xs text-muted-foreground">Status: {{ status }}</p>`,
      script,
      state: demo,
    },
  ],
  a11y: [
    'The input has a visually hidden `<label>` (`label` prop) and `type="email"` with `autocomplete="email"`. Keyboard: Tab to the input and the button, Enter submits. The row stacks below `sm`, so it reflows at 320px, and the input text uses `text-start` for RTL.',
    'Invalid input sets `aria-invalid="true"` and `aria-describedby` pointing at the error message (`role="alert"`), and moves focus to the input (native validation is off with `novalidate`, so the component does it). The input shows the invalid state with a border, not colour alone, and clears it as soon as the value becomes valid.',
    'A server error (`status="error"`) is announced via `role="alert"` and linked with `aria-describedby`; success uses a persistent `role="status"` live region.',
    'While loading the button is disabled with `aria-busy="true"`, the form has `aria-busy`, and the input is read-only so typing is not lost.',
    '`variant`, `size` and `shape` change layout, scale and corners only. The label, the `type="email"` field, the submit button, the alert and status regions and the `aria-busy` handling are identical in every combination. Controls keep a 44px minimum on touch pointers and 16px text below `md`; the pill field gets extra inline padding so the text stays off the curve, and the border and focus ring follow the shape (a `Highlight` outline replaces the ring in forced-colors mode).',
    'The form is named by the title (`aria-labelledby`) when one is set, which makes it a form landmark: give every newsletter form on a page a different title (or none). Native browser validation is disabled (`novalidate`) so messages are consistent.',
  ],
  requires: [
    'Throws a ContractError when there is no `@subscribe` listener: the form only emits `subscribe`, so without one it submits nowhere.',
    'Throws a ContractError when `label` or `buttonLabel` is an empty string (the input and the button need accessible names).',
  ],
  related: ['ContactSection', 'CtaBand', 'Input', 'Button', 'SiteFooter'],
  llmNotes: [
    'The form submits nowhere on its own: always handle `@subscribe`.',
    'Handle `@subscribe`, set `status="loading"` immediately, then `success` or `error` when your request finishes; the component does no network I/O.',
    'Never set `status` to `loading` without a pending request; the button stays disabled until you change it.',
    'Use `split` for a wide band with a heading and the form side by side; give it a title or description so the form sits in the right column. Keep one `size` and one `shape` per page, matching the neighbouring buttons.',
    'Choose `inline` for wide bands, `stacked` for footers/narrow columns, `card` for sidebars or plain backgrounds.',
    'Use `v-model` plus `reset-on-success` to clear the field after success.',
    'The `subscribe` payload is the trimmed email string, already validated.',
  ],
}
export default doc
