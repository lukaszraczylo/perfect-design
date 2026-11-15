import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'NativeSelect',
  group: 'forms',
  subgroup: 'Selection',
  summary: 'Styled native <select> with chevron, options array or slot content, placeholder, variants, sizes, shapes, status and Field wiring.',
  description:
    'Use `NativeSelect` for simple option lists where the platform picker is a feature (mobile, long lists, forms that must work without JS-heavy widgets). Provide options through the `options` array, or through the default slot with `<option>` / `<optgroup>` for grouping; both can be combined. Use `Select` for custom-styled dropdowns with rich items, `Combobox` for type-to-filter. `placeholder` renders a disabled, hidden first option with an empty value shown while nothing is selected. `class` is applied to the wrapper (use it for width such as `w-48`); every other attribute (`name`, `autocomplete`, `aria-*`) goes to the `<select>`.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'string | null', description: 'v-model value. `null`/`undefined` render as empty. Uncontrolled when omitted.' },
    { name: 'options', type: 'Array<{ value: string; label: string; disabled?: boolean }>', description: 'Options rendered as `<option>` before any slot content.' },
    { name: 'placeholder', type: 'string', description: 'Disabled hidden first option (value `""`) shown while no value is selected; text is muted.' },
    { name: 'variant', type: "'outline' | 'filled' | 'underline' | 'ghost'", default: "'outline'", description: 'Surface: muted fill (`filled`), bottom border only (`underline`, the chevron sits flush at the end), border on hover and fill on focus (`ghost`). Unknown values fall back to `outline`.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Height: 28, 32, 36 and 44px. Unknown values fall back to `md`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corners. `pill` is fully rounded and moves the chevron in; `underline` has no corners and ignores it. Unknown values fall back to `rounded`.' },
    { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Status colour with an icon left of the chevron. `success` and `warning` add visually hidden text linked through `aria-describedby`; `error` also sets `aria-invalid="true"`. Unknown values fall back to `default`.' },
    { name: 'statusLabel', type: 'string', default: "'Valid' or 'Warning'", description: 'Screen reader text of the `success` and `warning` status. Set it when the app is not in English.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the select. Also inherited from a surrounding Field.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Native required. Also inherited from a surrounding Field.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid="true"` and destructive styling. Also set by a Field with an error.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the wrapper element; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: '`<option>` / `<optgroup>` elements, rendered after the `options` array.' }],
  emits: [{ name: 'update:modelValue', payload: '[value: string]', description: 'Emitted on the native change event.' }],
  examples: [
    {
      title: 'Options array with placeholder',
      script: "const country = ref('')\nconst countries = [{ value: 'pl', label: 'Poland' }, { value: 'de', label: 'Germany' }, { value: 'fr', label: 'France', disabled: true }]",
      code: `<div class="grid max-w-xs gap-2">
  <NativeSelect v-model="country" :options="countries" placeholder="Choose a country" aria-label="Country" />
  <p class="text-sm text-muted-foreground">Value: {{ country || '(none)' }}</p>
</div>`,
      state: () => ({
        country: ref(''),
        countries: [
          { value: 'pl', label: 'Poland' },
          { value: 'de', label: 'Germany' },
          { value: 'fr', label: 'France', disabled: true },
        ],
      }),
    },
    {
      title: 'Slot options with optgroups in a Field',
      script: "const city = ref('')",
      code: `<Field class="max-w-xs" label="City" hint="Where we ship from." :error="city ? '' : 'Choose a city'" required>
  <NativeSelect v-model="city" placeholder="Select city">
    <optgroup label="Poland">
      <option value="waw">Warsaw</option>
      <option value="krk">Krakow</option>
    </optgroup>
    <optgroup label="Germany">
      <option value="ber">Berlin</option>
    </optgroup>
  </NativeSelect>
</Field>`,
      state: () => ({ city: ref('') }),
    },
    {
      title: 'Variants and shapes',
      code: `<div class="grid max-w-xs gap-3">
  <NativeSelect model-value="a" variant="outline" aria-label="Outline" :options="[{ value: 'a', label: 'Outline' }]" />
  <NativeSelect model-value="a" variant="filled" aria-label="Filled" :options="[{ value: 'a', label: 'Filled' }]" />
  <NativeSelect model-value="a" variant="underline" aria-label="Underline" :options="[{ value: 'a', label: 'Underline' }]" />
  <NativeSelect model-value="a" variant="ghost" aria-label="Ghost" :options="[{ value: 'a', label: 'Ghost' }]" />
  <NativeSelect model-value="a" shape="pill" aria-label="Pill" :options="[{ value: 'a', label: 'Pill' }]" />
  <NativeSelect model-value="a" shape="square" aria-label="Square" :options="[{ value: 'a', label: 'Square' }]" />
</div>`,
    },
    {
      title: 'Status',
      description: 'The status icon sits left of the chevron; success and warning add screen reader text.',
      code: `<div class="grid max-w-xs gap-3">
  <NativeSelect model-value="a" status="success" aria-label="Valid choice" :options="[{ value: 'a', label: 'Available' }]" />
  <NativeSelect model-value="a" status="warning" aria-label="Choice with a warning" :options="[{ value: 'a', label: 'Limited stock' }]" />
  <NativeSelect model-value="a" status="error" aria-label="Invalid choice" :options="[{ value: 'a', label: 'Unavailable' }]" />
</div>`,
    },
    {
      title: 'Sizes',
      code: `<div class="grid max-w-xs gap-2">
  <NativeSelect model-value="a" size="xs" aria-label="Extra small" :options="[{ value: 'a', label: 'Extra small' }]" />
  <NativeSelect model-value="a" size="sm" aria-label="Small" :options="[{ value: 'a', label: 'Small' }]" />
  <NativeSelect model-value="a" aria-label="Medium" :options="[{ value: 'a', label: 'Medium' }]" />
  <NativeSelect model-value="a" size="lg" aria-label="Large" :options="[{ value: 'a', label: 'Large' }]" />
  <NativeSelect model-value="a" disabled aria-label="Disabled" :options="[{ value: 'a', label: 'Disabled' }]" />
  <NativeSelect model-value="a" invalid aria-label="Invalid" :options="[{ value: 'a', label: 'Invalid' }]" />
</div>`,
    },
  ],
  a11y: [
    'Status is never colour alone: an icon appears for `success`, `warning` and `error`; `success` and `warning` add screen reader text referenced by `aria-describedby`, and `error` sets `aria-invalid="true"` (pair it with a visible message in `Field`). The chevron and the status icon are decorative and ignore pointer events.',
    '`underline` and `ghost` keep a visible focus indicator (a thicker bottom border, or a border and ring); forced-colors mode draws borders in system colours.',
    'Native `<select>` semantics: platform picker, full keyboard (Arrow keys, type-ahead, Space or Alt+Down to open) and screen-reader support.',
    'Inside a Field it receives `id` (label `for`), `aria-describedby`, `aria-invalid`, `required` and disabled state; otherwise give it `aria-label`.',
    'The chevron is decorative (`aria-hidden` SVG) and ignores pointer events. Options use popover colours, so they stay readable in dark mode.',
    'The placeholder is a disabled, hidden first option; with `required` the browser reports the empty choice as invalid after interaction.',
    'Responsive: `w-full min-w-0`; 16px text below `md` prevents iOS focus zoom; 44px tall on touch pointers. The chevron uses `end-3`, so RTL works.',
  ],
  related: ['Select', 'Combobox', 'Field', 'InputGroup', 'RadioGroup'],
  requires: [
    'Throws a ContractError when the select has no accessible name: no `Field` label, wrapping or `for` label, `aria-label` or `aria-labelledby` (a placeholder option does not count).',
  ],
  llmNotes: [
    'Use `options` for simple lists, the default slot for `<optgroup>`. Do not mix a placeholder with a pre-selected value.',
    'Bind with `v-model`; the value is always a string.',
    'Put width classes (`w-48`) in `class` (applied to the wrapper); pass `name`/`autocomplete` as plain attributes.',
    'Wrap in Field with a label; never rely on the placeholder as the label.',
    'Use `status` for validation feedback (it adds the icon) and still show the message through `Field error` or `hint`.',
  ],
  replaces: ['shadcn-vue NativeSelect', 'hand-rolled NativeSelect markup in app code'],
}
export default doc
