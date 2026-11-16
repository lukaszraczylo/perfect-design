import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'ColorPicker',
  group: 'forms',
  subgroup: 'Choice inputs',
  summary: 'Swatch palette plus validated hex input; emits normalised lowercase hex colours.',
  description:
    'Use `ColorPicker` to choose a brand, label or tag colour from a configurable palette, with a hex field for custom values. It has no canvas or hue slider. The model is a lowercase `#rrggbb` or `#rrggbbaa` string (or `null`). Typed values accept `#rgb`, `#rgba`, `#rrggbb` and `#rrggbbaa` with or without `#`, in any case, and are normalised before emitting. An unparsable hex marks the input `aria-invalid`, shows a message and is NOT emitted; blur reverts the text to the last valid value. Clearing the input emits `null`. For a native OS picker use `<input type="color">`.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'string | null', description: 'Hex colour. Normalised for display; invalid strings render as none. Uncontrolled when omitted.' },
    { name: 'swatches', type: 'string[]', default: '12-colour default palette', description: 'Palette of hex colours. Entries are normalised; invalid ones are dropped and duplicates collapsed. Pass `[]` for hex input only.' },
    { name: 'showInput', type: 'boolean', default: 'true', description: 'Show the preview chip and hex text field.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables swatches and input. Also inherited from a Field.' },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'Shows the value but blocks every change; the input snaps back.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Native required on the hex input. Also inherited from a Field.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid` on the hex input. Typing an unparsable hex sets it temporarily as well.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Swatch and input size (24 / 32 / 40 px swatches). Unknown values fall back to `md`.' },
    { name: 'shape', type: "'rounded' | 'square' | 'circle'", default: "'rounded'", description: 'Outline of every swatch and of the preview chip. The checked ring and the forced-colors outline follow the shape. Unknown values fall back to `rounded`.' },
    { name: 'layout', type: "'stacked' | 'inline' | 'compact'", default: "'stacked'", description: '`stacked` puts the hex field under the swatches. `inline` puts both on one wrapping row (up to `max-w-lg`). `compact` is the same row with a tighter swatch gap, a fixed narrow field and `max-w-md`. The DOM and tab order never change. Unknown values fall back to `stacked`.' },
    { name: 'name', type: 'string', description: 'Form field name. The committed value is submitted through a hidden input, never the half-typed text.' },
    { name: 'placeholder', type: 'string', default: "'#000000'", description: 'Hex input placeholder.' },
    { name: 'swatchesLabel', type: 'string', default: "'Colour swatches'", description: 'Accessible name of the swatch radiogroup.' },
    { name: 'inputLabel', type: 'string', default: "'Hex colour'", description: 'Accessible name of the hex input. Dropped when a surrounding Field label names the input, so the visible label stays the name.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  emits: [{ name: 'update:modelValue', payload: '[value: string | null]', description: 'Normalised lowercase hex (`#rrggbb` / `#rrggbbaa`) on swatch pick or valid input; `null` when the input is emptied. Never emitted for invalid text or unchanged values.' }],
  examples: [
    {
      title: 'Basic',
      script: "const color = ref('#3b82f6')",
      code: `<div class="grid gap-2">
  <ColorPicker v-model="color" />
  <p class="text-sm text-muted-foreground">Value: {{ color ?? 'none' }}</p>
</div>`,
      state: () => ({ color: ref('#3b82f6') }),
    },
    {
      title: 'Custom swatches',
      script: "const tag = ref('#0ea5e9')",
      code: `<ColorPicker v-model="tag" :swatches="['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#a855f7']" />`,
      state: () => ({ tag: ref('#0ea5e9') }),
    },
    {
      title: 'Hex input only, with alpha',
      description: 'Type #rgb, #rrggbb or #rrggbbaa; try an invalid value like "#12".',
      script: "const color = ref('#ff000080')",
      code: `<div class="grid gap-2">
  <ColorPicker v-model="color" :swatches="[]" />
  <p class="text-sm text-muted-foreground">Value: {{ color ?? 'none' }}</p>
</div>`,
      state: () => ({ color: ref('#ff000080') }),
    },
    {
      title: 'Sizes',
      code: `<div class="grid gap-4">
  <ColorPicker size="sm" model-value="#22c55e" :swatches="['#22c55e', '#ef4444']" />
  <ColorPicker size="md" model-value="#22c55e" :swatches="['#22c55e', '#ef4444']" />
  <ColorPicker size="lg" model-value="#22c55e" :swatches="['#22c55e', '#ef4444']" />
</div>`,
    },
    {
      title: 'Shapes',
      description: 'Rounded (default), square and circle swatches. The selected swatch always shows a ring and `aria-checked`.',
      code: `<div class="grid gap-4">
  <ColorPicker shape="rounded" model-value="#14b8a6" :swatches="['#14b8a6', '#f59e0b', '#6366f1', '#ef4444']" />
  <ColorPicker shape="square" model-value="#f59e0b" :swatches="['#14b8a6', '#f59e0b', '#6366f1', '#ef4444']" />
  <ColorPicker shape="circle" model-value="#6366f1" :swatches="['#14b8a6', '#f59e0b', '#6366f1', '#ef4444']" />
</div>`,
    },
    {
      title: 'Layouts',
      description: 'Stacked (default), inline and compact. All three keep the same markup order.',
      code: `<div class="grid gap-6">
  <ColorPicker layout="stacked" model-value="#14b8a6" :swatches="['#14b8a6', '#f59e0b', '#6366f1']" />
  <ColorPicker layout="inline" model-value="#14b8a6" :swatches="['#14b8a6', '#f59e0b', '#6366f1']" />
  <ColorPicker layout="compact" shape="circle" size="sm" model-value="#14b8a6" :swatches="['#14b8a6', '#f59e0b', '#6366f1']" />
</div>`,
    },
    {
      title: 'Disabled, readonly and invalid',
      code: `<div class="grid gap-4">
  <ColorPicker disabled model-value="#8b5cf6" :swatches="['#8b5cf6', '#ec4899']" />
  <ColorPicker readonly model-value="#8b5cf6" :swatches="['#8b5cf6', '#ec4899']" />
  <ColorPicker invalid model-value="#8b5cf6" :swatches="['#8b5cf6', '#ec4899']" />
</div>`,
    },
    {
      title: 'In a Field',
      script: "const brand = ref('#14b8a6')",
      code: `<Field class="max-w-xs" label="Brand colour" hint="Pick a swatch or type a hex value.">
  <ColorPicker v-model="brand" />
</Field>`,
      state: () => ({ brand: ref('#14b8a6') }),
    },
  ],
  a11y: [
    'Swatches are `role="radio"` buttons inside a `role="radiogroup"` named by `swatchesLabel`; each is labelled with its hex value. The checked (or first) swatch is the only tab stop.',
    'Keyboard: ArrowRight/ArrowDown select the next swatch, ArrowLeft/ArrowUp the previous one (wrapping, flipped in right-to-left layouts), Home/End the first and last. Space selects the focused swatch. Focus and selection move together, as in a native radio group.',
    '`readonly` sets `aria-readonly` on the radiogroup (the only role of the pair that allows it) and `disabled` sets `disabled` on each swatch.',
    'The hex input is named by `inputLabel`, or by the Field label when inside a `Field`. While the text cannot be parsed it sets `aria-invalid` and a polite `role="status"` message linked with `aria-describedby`. The preview chip is decorative.',
    'Selection is never conveyed by colour alone: the checked swatch gets a ring, `aria-checked`, and an outline in forced-colors mode (swatch colours are kept with `forced-color-adjust: none`). Keyboard focus on the checked swatch widens its ring from 2px to 4px, so focus stays visible on the one tab stop.',
    'Shape and layout are presentation only: the swatches stay `role="radio"` buttons named by their hex value, the DOM order (swatches, preview, input) does not change, and the checked swatch keeps its ring and forced-colors outline in every shape.',
    'Responsive: swatches wrap, grow to 44px on coarse pointers, and the hex input uses 16px text on mobile with a 44px minimum height on touch. The picker is `max-w-xs` and `w-full`, so it fits 320px.',
  ],
  related: ['Input', 'Select', 'SegmentedControl', 'Field'],
  requires: [
    'Throws a ContractError when the hex input has no name (`inputLabel` blank and no `Field` label) or the swatch group has none (`swatchesLabel` blank).',
  ],
  llmNotes: [
    'Model is a lowercase hex string or null; never pass colour names or rgb().',
    'Pass `swatches` as hex strings; use `[]` to offer only the text input.',
    'Use `shape` ("circle" for tags and avatars, "square" for brand tiles) and `layout` ("inline" or "compact" in toolbars and table cells); they never change behaviour.',
    'Do not rely on an event for invalid text: invalid hex is intentionally not emitted.',
  ],
  replaces: ['custom colour swatch pickers'],
}
export default doc
