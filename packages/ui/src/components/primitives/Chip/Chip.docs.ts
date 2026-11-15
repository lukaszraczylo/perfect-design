import { faStar } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Chip',
  group: 'primitives',
  subgroup: 'Chips',
  summary: 'Compact tag that can be removable and/or selectable (toggle).',
  description:
    'Use `Chip` for tags, filters and selected values. `removable` adds a remove button (and Backspace/Delete on the focused chip) that emits `remove` - you remove the item from your data. `selectable` turns the label into a toggle button bound with `v-model:selected`. Do not use it for status labels with no interaction (use `Badge`).\n\nVariations: `variant` (fixed-colour looks plus tone-aware `soft`, `solid`, `outline`), `tone` (`neutral | primary | success | warning | danger | info`, used by `soft` / `solid` / `outline`), `size` (`sm | md | lg`), `rounded` (`full` pill default, `md`, `none`), and the `selected` state for filter chips.',
  status: 'stable',
  props: [
    { name: 'variant', type: "'default' | 'secondary' | 'outline' | 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'soft' | 'solid'", default: "'default'", description: 'Look. `soft`, `solid` and `outline` are tone-aware. Unknown values fall back to default.' },
    { name: 'tone', type: "'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", description: 'Semantic colour for `soft` / `solid` / `outline`. Unset = neutral (soft, solid) or plain outline. Ignored by other variants and when unknown.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding and text size. Unknown values fall back to md.' },
    { name: 'rounded', type: "'full' | 'md' | 'none'", default: "'full'", description: 'Corner radius: pill (rounded-full), rounded-md or none. Unknown values fall back to full.' },
    { name: 'label', type: 'string', description: 'Chip text (default slot overrides it); also names the remove button.' },
    { name: 'icon', type: 'IconDefinition', description: 'Leading FontAwesome icon. Use the `leading` slot for other content.' },
    { name: 'removable', type: 'boolean', default: 'false', description: 'Show remove button and enable Backspace/Delete.' },
    { name: 'selectable', type: 'boolean', default: 'false', description: 'Render the label as a toggle button with aria-pressed.' },
    { name: 'selected', type: 'boolean', default: 'false', description: 'Toggle state, use `v-model:selected`. Works controlled and uncontrolled.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Blocks selection, removal and keyboard shortcuts.' },
    { name: 'as', type: 'string | Component', default: "'span'", description: 'Element to render.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', description: 'Chip content; defaults to `label`.' },
    { name: 'leading', description: 'Content before the label (icon, avatar, dot). Defaults to the `icon` prop.' },
  ],
  emits: [
    { name: 'remove', payload: '[]', description: 'Remove button clicked or Backspace/Delete pressed on a removable chip.' },
    { name: 'update:selected', payload: '[value: boolean]', description: 'Selection toggled (v-model:selected).' },
  ],
  examples: [
    {
      title: 'Variants',
      code: `<div class="flex flex-wrap gap-2">
  <Chip label="Default" />
  <Chip label="Secondary" variant="secondary" />
  <Chip label="Outline" variant="outline" />
  <Chip label="Primary" variant="primary" />
  <Chip label="Success" variant="success" />
  <Chip label="Warning" variant="warning" />
  <Chip label="Destructive" variant="destructive" />
  <Chip label="Info" variant="info" :icon="faStar" />
</div>`,
      state: () => ({ faStar }),
    },
    {
      title: 'Soft tones',
      code: `<div class="flex flex-wrap gap-2">
  <Chip label="Neutral" variant="soft" />
  <Chip label="Primary" variant="soft" tone="primary" />
  <Chip label="Success" variant="soft" tone="success" />
  <Chip label="Warning" variant="soft" tone="warning" />
  <Chip label="Danger" variant="soft" tone="danger" />
  <Chip label="Info" variant="soft" tone="info" />
</div>`,
    },
    {
      title: 'Solid tones',
      code: `<div class="flex flex-wrap gap-2">
  <Chip label="Neutral" variant="solid" />
  <Chip label="Primary" variant="solid" tone="primary" />
  <Chip label="Success" variant="solid" tone="success" />
  <Chip label="Warning" variant="solid" tone="warning" />
  <Chip label="Danger" variant="solid" tone="danger" />
  <Chip label="Info" variant="solid" tone="info" />
</div>`,
    },
    {
      title: 'Outline tones',
      code: `<div class="flex flex-wrap gap-2">
  <Chip label="Plain" variant="outline" />
  <Chip label="Neutral" variant="outline" tone="neutral" />
  <Chip label="Primary" variant="outline" tone="primary" />
  <Chip label="Success" variant="outline" tone="success" />
  <Chip label="Warning" variant="outline" tone="warning" />
  <Chip label="Danger" variant="outline" tone="danger" />
  <Chip label="Info" variant="outline" tone="info" />
</div>`,
    },
    {
      title: 'Sizes',
      code: `<div class="flex flex-wrap items-center gap-2">
  <Chip label="Small" size="sm" variant="soft" tone="primary" />
  <Chip label="Medium" variant="soft" tone="primary" />
  <Chip label="Large" size="lg" variant="soft" tone="primary" removable />
</div>`,
    },
    {
      title: 'Rounded',
      description: '`rounded="md"` gives rectangular tags, `full` (default) gives pills.',
      code: `<div class="flex flex-wrap gap-2">
  <Chip label="Pill" variant="soft" tone="primary" />
  <Chip label="Rounded" variant="soft" tone="primary" rounded="md" />
  <Chip label="Square" variant="outline" rounded="none" />
</div>`,
    },
    {
      title: 'Removable tags',
      script: `const tags = ref(['Vue', 'Tailwind', 'Vite'])\nfunction remove(t) { tags.value = tags.value.filter((x) => x !== t) }`,
      code: `<div class="flex flex-wrap gap-2">
  <Chip v-for="t in tags" :key="t" :label="t" removable @remove="remove(t)" />
</div>`,
      state: () => {
        const tags = ref(['Vue', 'Tailwind', 'Vite'])
        return { tags, remove: (t: string) => { tags.value = tags.value.filter((x) => x !== t) } }
      },
    },
    {
      title: 'Selectable filters',
      script: `const a = ref(true)\nconst b = ref(false)`,
      code: `<div class="flex flex-wrap gap-2">
  <Chip label="Open" selectable v-model:selected="a" variant="outline" />
  <Chip label="Closed" selectable v-model:selected="b" variant="outline" />
</div>`,
      state: () => ({ a: ref(true), b: ref(false) }),
    },
    {
      title: 'Selected state with tones',
      description: 'A selected chip gets a primary ring on top of its look; tone colours stay the same.',
      script: `const a = ref(true)\nconst b = ref(false)\nconst c = ref(true)`,
      code: `<div class="flex flex-wrap gap-2">
  <Chip label="Soft" variant="soft" tone="primary" selectable v-model:selected="a" />
  <Chip label="Solid" variant="solid" tone="success" selectable v-model:selected="b" />
  <Chip label="Outline" variant="outline" tone="info" selectable v-model:selected="c" size="lg" />
  <Chip label="Disabled" variant="soft" tone="danger" selectable disabled />
</div>`,
      state: () => ({ a: ref(true), b: ref(false), c: ref(true) }),
    },
  ],
  a11y: [
    'Selectable chips render a native button with aria-pressed (Tab to focus, Space/Enter to toggle).',
    'A removable, non-selectable chip is a focusable `group` named by `label`: Backspace or Delete removes it (`aria-keyshortcuts`). The remove button has aria-label "Remove <label>" and stays out of the tab order, but screen-reader and touch users can still activate it.',
    'The remove button is at least 24x24px (WCAG 2.5.8) even on the small chip: it extends past the chip with negative margins instead of growing it.',
    'A selected chip adds a primary ring; the ring is also drawn in forced-colors mode through the focus outline, and `aria-pressed` carries the state so colour is not the only signal.',
    'Disabled chips set aria-disabled and disable inner buttons.',
  ],
  related: ['Badge', 'IconButton'],
  requires: [
    'Throws a ContractError when a `removable` Chip has no non-empty `label` (it names the remove button).',
    'Throws a ContractError when a `selectable` Chip has no text (`label` or default slot).',
  ],
  llmNotes: [
    'Always set `label` on removable chips so the remove button is named.',
    'Handle `@remove` by deleting the item from your data; the chip does not hide itself.',
    'Use `v-model:selected`, not `modelValue`.',
    'Use `variant="soft"` + `tone` for tags, `outline` for filter chips, `solid` for strong emphasis; `tone` is ignored by the fixed-colour variants.',
  ],
  replaces: ['shadcn-vue Badge used as a removable tag', 'ad-hoc tag pills with a close icon'],
}
export default doc
