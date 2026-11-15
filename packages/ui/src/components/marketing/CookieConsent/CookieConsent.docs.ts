import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

/** Demo state: records the last choice so the examples show what `change` carries. */
function demo() {
  const open = ref(false)
  const last = ref('No choice yet')
  const onChange = (choice: { action: string; categories: Record<string, boolean> }) => {
    last.value = choice.action + ': ' + Object.entries(choice.categories).map(([id, on]) => id + '=' + (on ? 'on' : 'off')).join(', ')
  }
  const categories = [
    { id: 'necessary', label: 'Strictly necessary', description: 'Keeps you signed in and remembers this choice.', necessary: true },
    { id: 'analytics', label: 'Analytics', description: 'Counts visits so the site owner can see which pages are read.' },
    { id: 'preferences', label: 'Preferences', description: 'Remembers language and layout settings.' },
  ]
  return { open, last, onChange, categories }
}

const script = `const last = ref('No choice yet')
const categories = [
  { id: 'necessary', label: 'Strictly necessary', description: 'Keeps you signed in and remembers this choice.', necessary: true },
  { id: 'analytics', label: 'Analytics', description: 'Counts visits so the site owner can see which pages are read.' },
  { id: 'preferences', label: 'Preferences', description: 'Remembers language and layout settings.' },
]
function onChange(choice) {
  // choice: { action: 'accept-all' | 'reject-all' | 'save', categories: { necessary: true, analytics: false, ... } }
  last.value = choice.action
}`

const modalScript = `const open = ref(false)
${script}`

const doc: ComponentDoc = {
  name: 'CookieConsent',
  group: 'marketing',
  subgroup: 'Notices',
  summary: 'Cookie notice with per-category toggles and equally prominent accept and reject buttons; it stores nothing and emits `change`.',
  description:
    'Presentational consent notice. It shows a title, an explanation, a policy link (`policy` slot) and one toggle per category. Necessary categories are on, locked and labelled "Always on"; every optional category starts off. "Reject all" and "Accept all" are the same button: same variant, size, weight and width, rejecting comes first in the reading order, and neither needs a second step. "Save choices" sends the toggles as they are. The component remembers nothing: handle `change`, store the result yourself (the optional `readConsent` / `writeConsent` / `clearConsent` helpers do that in `localStorage` and are safe on the server) and load scripts only for categories that are `true`. `banner` is a full-width bar (categories sit behind "Choose categories"; place it with `class`, for example `fixed inset-x-0 bottom-0`), `inline` is a card with the categories always visible, and `modal` is a dialog with a focus trap. In the modal, Escape and the close button hide it and emit `dismiss` without a choice, and a click outside does nothing. Wording is plain: no guilt copy, no pre-ticked boxes, no hidden reject.',
  status: 'beta',
  props: [
    { name: 'variant', type: "'banner' | 'modal' | 'inline'", default: "'banner'", description: 'Look. `banner`: full-width bar with the categories behind a button. `inline`: bordered card with all categories shown. `modal`: dialog with a focus trap and a close button. Unknown values fall back to `banner`.' },
    { name: 'categories', type: 'ConsentCategory[]', default: '[]', description: 'Entries `{ id, label, description?, necessary? }`. Entries without a non-blank string `id` and repeated ids are dropped; a missing label falls back to the id. With no categories only the three-choice notice is shown (no toggles, no "Save choices").' },
    { name: 'modelValue', type: 'Record<string, boolean>', description: 'Toggle state by id (`v-model`). Only `true` turns an optional category on. A necessary category stays on whatever this holds. Unknown keys are ignored.' },
    { name: 'open', type: 'boolean', description: 'Whether the notice is shown (`v-model:open`). Omit it and the component hides itself after a choice or a dismissal.' },
    { name: 'title', type: 'string', default: "'Cookie preferences'", description: 'Heading text and accessible name of the region or dialog. Required: an empty title needs `aria-label` or `aria-labelledby`. The `title` slot replaces it.' },
    { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', default: '2', description: 'Heading level of the title. Invalid values fall back to 2.' },
    { name: 'description', type: 'string', default: "'We use cookies to run this site. Optional categories stay off until you turn them on.'", description: 'Explanation under the title. The `description` slot replaces it.' },
    { name: 'acceptLabel', type: 'string', default: "'Accept all'", description: 'Text of the accept button.' },
    { name: 'rejectLabel', type: 'string', default: "'Reject all'", description: 'Text of the reject button.' },
    { name: 'saveLabel', type: 'string', default: "'Save choices'", description: 'Text of the button that sends the current toggles. Shown only while the categories are visible.' },
    { name: 'manageLabel', type: 'string', default: "'Choose categories'", description: 'Text of the button that shows and hides the categories in the `banner` variant (aria-expanded).' },
    { name: 'alwaysOnLabel', type: 'string', default: "'Always on'", description: 'Text added to the description of a necessary category, so the locked state is not only a dimmed switch.' },
    { name: 'categoriesLabel', type: 'string', default: "'Cookie categories'", description: 'Accessible name of the list of categories.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes. Attributes fall through to the root (the section, or the dialog content in `modal`).' },
  ],
  slots: [
    { name: 'title', description: 'Rich title content; replaces the `title` prop.' },
    { name: 'description', description: 'Rich explanation; replaces the `description` prop.' },
    { name: 'policy', description: 'Link to the cookie or privacy policy, shown under the explanation. The component renders no link of its own.' },
  ],
  emits: [
    { name: 'change', payload: '[choice: { action: "accept-all" | "reject-all" | "save", categories: Record<string, boolean> }]', description: 'The user pressed Accept all, Reject all or Save choices. `categories` has one boolean per id and necessary ones are always `true`. Never emitted by Escape or the close button.' },
    { name: 'update:modelValue', payload: '[value: Record<string, boolean>]', description: 'A toggle moved, or a button set the state.' },
    { name: 'update:open', payload: '[value: boolean]', description: 'Emitted with `false` after a choice or a dismissal.' },
    { name: 'dismiss', description: '`modal` only: closed with Escape or the close button, without a choice.' },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'No categories: accept or reject, same button.',
      code: `<CookieConsent title="Cookie notice without categories" class="max-w-3xl" @change="onChange" />
<p class="mt-2 text-sm text-muted-foreground">{{ last }}</p>`,
      script,
      state: demo,
    },
    {
      title: 'Banner variant',
      description: 'Default. The categories open behind "Choose categories". Place it with `class` (for example `fixed inset-x-0 bottom-0`).',
      code: `<CookieConsent variant="banner" title="Cookie notice as a banner" :categories="categories" @change="onChange">
  <template #policy><a href="/cookies" class="underline underline-offset-4">Cookie policy</a></template>
</CookieConsent>
<p class="mt-2 text-sm text-muted-foreground">{{ last }}</p>`,
      script,
      state: demo,
    },
    {
      title: 'Inline variant',
      description: 'A card with every category visible, for a settings page.',
      code: `<CookieConsent variant="inline" :categories="categories" title="Cookie settings" :level="3" class="max-w-xl" @change="onChange">
  <template #policy><a href="/cookies" class="underline underline-offset-4">Cookie policy</a></template>
</CookieConsent>
<p class="mt-2 text-sm text-muted-foreground">{{ last }}</p>`,
      script,
      state: demo,
    },
    {
      title: 'Modal variant',
      description: 'Focus moves into the dialog and stays there. Escape and the close button hide it without a choice.',
      code: `<Button variant="outline" @click="open = true">Cookie preferences</Button>
<CookieConsent v-model:open="open" variant="modal" :categories="categories" @change="onChange">
  <template #policy><a href="/cookies" class="underline underline-offset-4">Cookie policy</a></template>
</CookieConsent>
<p class="mt-2 text-sm text-muted-foreground">{{ last }}</p>`,
      script: modalScript,
      state: demo,
    },
    {
      title: 'Controlled toggles',
      description: 'With `v-model` the toggles can start from a saved choice. The necessary category stays on even when the value says false.',
      code: `<CookieConsent v-model="saved" variant="inline" :categories="categories" title="Saved choice" :level="3" class="max-w-xl" />
<p class="mt-2 text-sm text-muted-foreground">Analytics: {{ saved.analytics ? 'on' : 'off' }}</p>`,
      script: `const saved = ref({ necessary: false, analytics: true })
${script}`,
      state: () => ({ ...demo(), saved: ref({ necessary: false, analytics: true }) }),
    },
    {
      title: 'Own wording',
      description: 'Every string can be replaced, for example for another language.',
      code: `<CookieConsent
  variant="inline"
  :categories="[{ id: 'necessary', label: 'Notwendig', description: 'Speichert diese Auswahl.', necessary: true }, { id: 'statistics', label: 'Statistik', description: 'Zaehlt Seitenaufrufe.' }]"
  title="Cookie-Einstellungen"
  :level="3"
  description="Optionale Kategorien bleiben aus, bis Sie sie einschalten."
  accept-label="Alle akzeptieren"
  reject-label="Alle ablehnen"
  save-label="Auswahl speichern"
  always-on-label="Immer aktiv"
  categories-label="Cookie-Kategorien"
  class="max-w-xl"
  @change="onChange"
/>`,
      script,
      state: demo,
    },
    {
      title: 'Realistic: remember the choice',
      description: 'The component stores nothing. Read the saved choice first and write it from `change`.',
      code: `<CookieConsent v-if="!stored" variant="inline" :categories="categories" title="Cookies on Kestrel Freight" :level="3" class="max-w-xl" @change="onSave">
  <template #policy><a href="/cookies" class="underline underline-offset-4">Cookie policy</a></template>
</CookieConsent>
<p v-else class="text-sm text-muted-foreground">Saved: {{ Object.keys(stored).join(', ') }}</p>`,
      script: `import { readConsent, writeConsent } from '@perfect-design/ui'
const stored = ref(readConsent('cookie-consent'))
function onSave(choice) {
  writeConsent('cookie-consent', choice.categories)
  stored.value = choice.categories
}`,
      state: () => {
        const stored = ref<Record<string, boolean> | null>(null)
        const onSave = (choice: { categories: Record<string, boolean> }) => (stored.value = choice.categories)
        return { ...demo(), stored, onSave }
      },
    },
  ],
  a11y: [
    'The banner and the inline card are a `section` named by the title (`aria-labelledby`), so they are a region landmark: give each one on a page a different title (or `aria-label`). The modal is a reka Dialog: focus moves in, Tab stays inside, Escape closes it and focus returns to what had it before. The dialog title is required (the Dialog contract).',
    'Every toggle is a switch with a visible label and a description linked with `aria-describedby`. A necessary category is a disabled switch that is on; the words "Always on" in its description carry the locked state, so it is not conveyed by dimming alone.',
    'Accept all and Reject all share one variant, size and class set, so they look and behave the same. Both are reachable with Tab in a fixed order (reject, accept, save, choose categories). The categories button has `aria-expanded` and `aria-controls`.',
    'Buttons are at least 36px high and 44px on touch pointers, stack to full width below `sm` and wrap, so the notice reflows at 320px. Long labels and descriptions wrap (`break-words`). Logical properties keep it correct in right-to-left layouts.',
    'The modal does not close on an outside click, so a stray tap is never treated as a decision; Escape and the close button emit `dismiss` and never `change`.',
  ],
  requires: [
    'Throws a ContractError when there is no accessible name: an empty `title` (and no `title` slot) without `aria-label` or `aria-labelledby`. In `modal` the Dialog also throws when no title is rendered.',
  ],
  related: ['Dialog', 'Switch', 'Button', 'NewsletterSignup', 'ConfirmDialog'],
  llmNotes: [
    'The component stores nothing: handle `@change`, persist the result (`writeConsent` helps) and only load scripts for categories whose value is `true`.',
    'Never pre-tick an optional category, never style accept and reject differently, never hide reject behind a second screen, and never write guilt copy; the defaults already avoid all four.',
    'Show it again only when no saved choice exists, or when the user opens a "Cookie settings" link (use `v-model:open`).',
    'Mark categories `necessary: true` only for cookies the site cannot work without; those cannot be switched off.',
    'Give a policy link through the `policy` slot; the component does not know your URL.',
    'Use `banner` with a fixed-position `class` for the first visit, `inline` on a settings page and `modal` when the choice must interrupt.',
  ],
}
export default doc
