import { ref } from 'vue'
import { faBold, faItalic } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Toggle',
  group: 'primitives',
  subgroup: 'Toggles',
  summary: 'Two-state button that stays pressed (bold, mute, pin). Controlled or uncontrolled.',
  description:
    'Use `Toggle` for an independent on/off button, typically with an icon (formatting, mute, favourite). Use `v-model` for the pressed state, or `default-pressed` when you only need an initial state. For a set of related toggles use `ToggleGroup`; for settings use `Switch` or `Checkbox`. Icon-only toggles MUST have an `aria-label`.\n\nVariations:\n\n- `variant`: `default` (flat), `outline` (bordered), `soft` (muted fill, primary tint when pressed) and `filled` (secondary fill, solid primary when pressed). `soft` and `filled` read as buttons without a border, for toolbars and filter rows.\n- `tone`: `primary`, `success`, `warning`, `danger`, `info` recolours the PRESSED state: tinted for `default`, `outline` and `soft`, solid for `filled`. Unset keeps the neutral accent (primary for `soft` and `filled`).\n- `size`: `xs` (28px), `sm` (32px), `md` (36px, default), `lg` (40px), `xl` (44px).\n- `shape`: `rounded` (default, rounded-md), `pill`, `square`.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'boolean', description: 'Pressed state (v-model). Leave undefined for uncontrolled use.' },
    { name: 'defaultPressed', type: 'boolean', default: 'false', description: 'Initial pressed state when uncontrolled.' },
    { name: 'variant', type: "'default' | 'outline' | 'soft' | 'filled'", default: "'default'", description: 'Visual style: flat, bordered, muted fill (primary tint when pressed) or secondary fill (solid primary when pressed). Unknown values fall back to default.' },
    { name: 'tone', type: "'primary' | 'success' | 'warning' | 'danger' | 'info'", description: 'Colour of the pressed state (tinted, or solid for `filled`). Unset = neutral accent (primary for `soft` and `filled`). Unknown values are ignored.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Height/padding: 28px, 32px, 36px, 40px, 44px. Unknown values fall back to md.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corner radius: rounded-md, rounded-full or none. Unknown values fall back to rounded.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables interaction.' },
    { name: 'as', type: 'string | Component', default: "'button'", description: 'Element to render.' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single slot child instead of a wrapper (reka-ui).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Label and/or icon.', props: '{ pressed: boolean }' }],
  emits: [{ name: 'update:modelValue', payload: '[value: boolean]', description: 'Fired when the pressed state changes.' }],
  examples: [
    {
      title: 'Variants and sizes',
      code: `<div class="flex flex-wrap items-center gap-2">
  <Toggle aria-label="Bold"><Icon :icon="faBold" /></Toggle>
  <Toggle variant="outline" aria-label="Italic"><Icon :icon="faItalic" /></Toggle>
  <Toggle size="sm" default-pressed>Small</Toggle>
  <Toggle size="lg" variant="outline">Large</Toggle>
  <Toggle disabled>Disabled</Toggle>
</div>`,
      state: () => ({ faBold, faItalic }),
    },
    {
      title: 'v-model',
      script: `const pinned = ref(false)`,
      code: `<div class="flex items-center gap-3">
  <Toggle v-model="pinned" variant="outline">{{ pinned ? 'Pinned' : 'Pin' }}</Toggle>
  <span class="text-sm text-muted-foreground">Pinned: {{ pinned }}</span>
</div>`,
      state: () => ({ pinned: ref(false) }),
    },
    {
      title: 'Soft and filled',
      description: 'Both are shown unpressed and pressed. The pressed state is also exposed as aria-pressed.',
      code: `<div class="flex flex-wrap items-center gap-2">
  <Toggle variant="soft">Soft</Toggle>
  <Toggle variant="soft" default-pressed>Soft pressed</Toggle>
  <Toggle variant="filled">Filled</Toggle>
  <Toggle variant="filled" default-pressed>Filled pressed</Toggle>
</div>`,
    },
    {
      title: 'Pressed tones',
      description: 'The tone only changes the pressed look. The first row is tinted, the second row is solid (`filled`).',
      code: `<div class="flex flex-col gap-2">
  <div class="flex flex-wrap items-center gap-2">
    <Toggle default-pressed tone="primary">Primary</Toggle>
    <Toggle default-pressed tone="success">Success</Toggle>
    <Toggle default-pressed tone="warning">Warning</Toggle>
    <Toggle default-pressed tone="danger">Danger</Toggle>
    <Toggle default-pressed tone="info">Info</Toggle>
  </div>
  <div class="flex flex-wrap items-center gap-2">
    <Toggle variant="filled" default-pressed tone="primary">Primary</Toggle>
    <Toggle variant="filled" default-pressed tone="success">Success</Toggle>
    <Toggle variant="filled" default-pressed tone="warning">Warning</Toggle>
    <Toggle variant="filled" default-pressed tone="danger">Danger</Toggle>
    <Toggle variant="filled" default-pressed tone="info">Info</Toggle>
  </div>
</div>`,
    },
    {
      title: 'Sizes and shapes',
      description: 'Five sizes, then the three corner shapes.',
      code: `<div class="flex flex-col gap-2">
  <div class="flex flex-wrap items-center gap-2">
    <Toggle variant="outline" size="xs">xs</Toggle>
    <Toggle variant="outline" size="sm">sm</Toggle>
    <Toggle variant="outline" size="md">md</Toggle>
    <Toggle variant="outline" size="lg">lg</Toggle>
    <Toggle variant="outline" size="xl">xl</Toggle>
  </div>
  <div class="flex flex-wrap items-center gap-2">
    <Toggle variant="outline" shape="rounded">Rounded</Toggle>
    <Toggle variant="outline" shape="pill">Pill</Toggle>
    <Toggle variant="outline" shape="square">Square</Toggle>
    <Toggle variant="soft" shape="pill" default-pressed>Pill soft</Toggle>
  </div>
</div>`,
    },
  ],
  a11y: [
    'Native <button> with aria-pressed reflecting the state; Space/Enter toggle.',
    'Icon-only toggles need aria-label; the label names the control and must not change with the state (aria-pressed already says on or off).',
    'Target size: `xs` is 28px, `sm` 32px, `md` 36px, `lg` 40px and `xl` 44px high, all at least 24px; on coarse pointers `xs` and `sm` grow to 40px and `md`, `lg` to 44px.',
    'Pressed state is shown by a fill and exposed as aria-pressed, so it is not conveyed by colour alone; `outline` adds a border that keeps the shape visible in forced-colors mode; `soft` and `filled` get a border there, and any pressed toggle a 2px border.',
    'Tones and variants use tested token pairs: tinted text on its tint, primary-foreground on primary, status foregrounds on solid status colours, muted-foreground on muted and secondary-foreground on secondary. The pressed state never depends on the tone: it is aria-pressed, a fill change and, in forced-colors mode, a border.',
    'Pressed state is also exposed as data-state="on|off" for styling.',
  ],
  related: ['ToggleGroup', 'Button', 'Switch'],
  requires: [
    'Throws a ContractError when a Toggle has no accessible name (an icon-only Toggle needs `aria-label` or `aria-labelledby`).',
  ],
  llmNotes: [
    'Always set aria-label on icon-only toggles.',
    'Use v-model (boolean) for controlled state; default-pressed for uncontrolled.',
    'Group related toggles with ToggleGroup instead of laying out several Toggles by hand.',
    'Reuse `toggleVariants({ variant, tone, size, shape })` (wrapped in `cn()`) to style non-button elements.',
    'Use `tone` for the pressed colour only; do not use it to mean a status without text.',
  ],
  replaces: ['shadcn-vue Toggle'],
}
export default doc
