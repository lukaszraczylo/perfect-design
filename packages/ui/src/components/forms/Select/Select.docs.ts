import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Select',
  group: 'forms',
  subgroup: 'Selection',
  summary: 'Custom single-select dropdown with groups, labels, keyboard typeahead and Field wiring.',
  description:
    'Use `Select` (compound: `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectLabel`, `SelectSeparator`) when you need a styled, accessible dropdown for 4+ options, with grouping or rich item content. Use `NativeSelect` for the best mobile UX and simple option lists, `Combobox` when the user needs to filter a long list by typing, `RadioGroup`/`SegmentedControl` for 2-5 visible options. The model is the selected item value (string). Item values must be NON-EMPTY strings (use a `Placeholder` on `SelectValue` for the empty state, not an item with value `""`). The content is portalled, so style it through `SelectContent`\'s `class`, not through the parent. Wrap in `Field` for label, hint and error; the trigger receives `id`, `aria-describedby`, `aria-invalid` and disabled state.',
  status: 'stable',
  parts: [
    {
      name: 'SelectTrigger',
      description:
        'The button that shows the value and opens the list. Applies the shared field surface and a chevron. It carries the look props (`size`, `variant`, `shape`, `status`) because the trigger is the field surface; the `Select` root is a compound root with no element of its own. `selectTriggerVariants` returns the same classes for a plain element.',
      props: [
        { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Height: 28px, 32px, 36px or 44px. Unknown values fall back to `md`.' },
        { name: 'variant', type: "'outline' | 'filled' | 'underline' | 'ghost'", default: "'outline'", description: 'Surface. `outline` is the bordered default, `filled` uses a muted fill, `underline` keeps a bottom rule that thickens on focus, `ghost` shows its border on hover and focus. Unknown values fall back to `outline`.' },
        { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corners. `underline` is always square-cornered, so `shape` does not change it. Unknown values fall back to `rounded`.' },
        { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Validation status. Colours the border and adds an icon before the chevron; `success` and `warning` also add hidden text that `aria-describedby` points at. `error` also sets `aria-invalid="true"`. Unknown values fall back to `default`.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the trigger. Also inherited from the Select root and a surrounding Field.' },
        { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid="true"` and destructive styling. Also set by a Field with an error.' },
        { name: 'id', type: 'string', description: 'Trigger id. Falls back to the surrounding Field id.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
      ],
    },
    {
      name: 'SelectValue',
      description: 'Displays the selected item text or the placeholder. Place inside SelectTrigger.',
      props: [
        { name: 'placeholder', type: 'string', description: 'Text shown while no value is selected.' },
        { name: 'class', type: 'string | object | array', description: 'Merged onto the value element.' },
      ],
    },
    {
      name: 'SelectContent',
      description: 'Portalled floating list with scroll buttons. Contains SelectItem/SelectGroup/SelectSeparator.',
      props: [
        { name: 'position', type: "'popper' | 'item-aligned'", default: "'popper'", description: '`popper` anchors under the trigger and matches its width; `item-aligned` overlays the selected item.' },
        { name: 'side', type: "'top' | 'right' | 'bottom' | 'left'", default: "'bottom'", description: 'Preferred side (popper only).' },
        { name: 'align', type: "'start' | 'center' | 'end'", default: "'start'", description: 'Alignment against the trigger (popper only).' },
        { name: 'sideOffset', type: 'number', default: '4', description: 'Gap in px between trigger and content (popper only).' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Row density of every item: `sm` is compact (12px text), `md` the standard row, `lg` a roomy 16px row. A `size` on a `SelectItem` wins. Items stay 44px tall on touch devices. Unknown values fall back to `md`.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last on the floating surface; wins over internal classes.' },
      ],
    },
    {
      name: 'SelectItem',
      description: 'One option with a check indicator when selected.',
      props: [
        { name: 'value', type: 'string', required: true, description: 'Item value. Must be a non-empty string.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Prevents selecting this item.' },
        { name: 'textValue', type: 'string', description: 'Text for typeahead and the trigger display when the slot content is not plain text.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", description: 'Row density. Defaults to the `size` of the surrounding `SelectContent`, then `md`.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
      ],
    },
    { name: 'SelectGroup', description: 'Groups items under a SelectLabel (`role="group"`).', props: [{ name: 'class', type: 'string | object | array', description: 'Merged onto the group.' }] },
    { name: 'SelectLabel', description: 'Non-selectable heading for a SelectGroup.', props: [{ name: 'class', type: 'string | object | array', description: 'Merged last.' }] },
    { name: 'SelectSeparator', description: 'Thin divider between groups.', props: [{ name: 'class', type: 'string | object | array', description: 'Merged last.' }] },
  ],
  props: [
    { name: 'modelValue', type: 'string', description: 'v-model: the selected item value. Uncontrolled when omitted.' },
    { name: 'defaultValue', type: 'string', description: 'Initial value when uncontrolled.' },
    { name: 'open', type: 'boolean', description: 'Controlled open state (`v-model:open`).' },
    { name: 'defaultOpen', type: 'boolean', description: 'Initial open state when uncontrolled.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the trigger.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Marks the select required for forms and `aria-required`.' },
    { name: 'name', type: 'string', description: 'Form field name; a hidden native select is rendered inside a `<form>`.' },
  ],
  slots: [{ name: 'default', description: 'SelectTrigger and SelectContent.' }],
  emits: [
    { name: 'update:modelValue', payload: '[value: string]', description: 'Emitted when an item is selected.' },
    { name: 'update:open', payload: '[value: boolean]', description: 'Emitted when the list opens or closes.' },
  ],
  examples: [
    {
      title: 'Basic',
      script: "const fruit = ref('')",
      code: `<div class="grid max-w-xs gap-2">
  <Select v-model="fruit">
    <SelectTrigger aria-label="Fruit">
      <SelectValue placeholder="Pick a fruit" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="apple">Apple</SelectItem>
      <SelectItem value="banana">Banana</SelectItem>
      <SelectItem value="cherry" disabled>Cherry (sold out)</SelectItem>
    </SelectContent>
  </Select>
  <p class="text-sm text-muted-foreground">Selected: {{ fruit || 'nothing' }}</p>
</div>`,
      state: () => ({ fruit: ref('') }),
    },
    {
      title: 'Groups in a Field with an error',
      script: "const tz = ref('')",
      code: `<Field class="max-w-xs" label="Timezone" hint="Used for schedules." :error="tz ? '' : 'Choose a timezone'" required>
  <Select v-model="tz">
    <SelectTrigger>
      <SelectValue placeholder="Select timezone" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>Europe</SelectLabel>
        <SelectItem value="cet">Central European (CET)</SelectItem>
        <SelectItem value="gmt">Greenwich Mean (GMT)</SelectItem>
      </SelectGroup>
      <SelectSeparator />
      <SelectGroup>
        <SelectLabel>Americas</SelectLabel>
        <SelectItem value="est">Eastern (EST)</SelectItem>
        <SelectItem value="pst">Pacific (PST)</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</Field>`,
      state: () => ({ tz: ref('') }),
    },
    {
      title: 'Sizes',
      code: `<div class="grid max-w-xs gap-2">
  <Select default-value="a"><SelectTrigger size="xs" aria-label="Extra small"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Extra small</SelectItem></SelectContent></Select>
  <Select default-value="a"><SelectTrigger size="sm" aria-label="Small"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Small</SelectItem></SelectContent></Select>
  <Select default-value="a"><SelectTrigger aria-label="Medium"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Medium</SelectItem></SelectContent></Select>
  <Select default-value="a"><SelectTrigger size="lg" aria-label="Large"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Large</SelectItem></SelectContent></Select>
</div>`,
    },
    {
      title: 'Variants',
      description: 'The four surfaces side by side: outline (default), filled, underline and ghost.',
      code: `<div class="grid max-w-xs gap-2">
  <Select default-value="a"><SelectTrigger aria-label="Outline"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Outline</SelectItem></SelectContent></Select>
  <Select default-value="a"><SelectTrigger variant="filled" aria-label="Filled"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Filled</SelectItem></SelectContent></Select>
  <Select default-value="a"><SelectTrigger variant="underline" aria-label="Underline"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Underline</SelectItem></SelectContent></Select>
  <Select default-value="a"><SelectTrigger variant="ghost" aria-label="Ghost"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Ghost</SelectItem></SelectContent></Select>
</div>`,
    },
    {
      title: 'Shapes',
      description: 'Rounded (default), pill and square corners.',
      code: `<div class="grid max-w-xs gap-2">
  <Select default-value="a"><SelectTrigger aria-label="Rounded"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Rounded</SelectItem></SelectContent></Select>
  <Select default-value="a"><SelectTrigger shape="pill" aria-label="Pill"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Pill</SelectItem></SelectContent></Select>
  <Select default-value="a"><SelectTrigger shape="square" aria-label="Square"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Square</SelectItem></SelectContent></Select>
</div>`,
    },
    {
      title: 'Status',
      description: 'Success, warning and error add an icon next to the chevron. Pair them with a visible message in a Field.',
      code: `<div class="grid max-w-xs gap-3">
  <Field label="Plan" hint="Sample message: this plan is available."><Select default-value="a"><SelectTrigger status="success"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Team plan</SelectItem></SelectContent></Select></Field>
  <Field label="Region" hint="Sample message: this region is close to capacity."><Select default-value="a"><SelectTrigger status="warning"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">North region</SelectItem></SelectContent></Select></Field>
  <Field label="Currency" error="Sample message: choose a currency."><Select><SelectTrigger status="error"><SelectValue placeholder="Choose" /></SelectTrigger><SelectContent><SelectItem value="a">Euro</SelectItem></SelectContent></Select></Field>
</div>`,
    },
    {
      title: 'Item density',
      description: '`size` on SelectContent sets the row density of every item; `size` on one SelectItem overrides it. Open each list to compare.',
      code: `<div class="grid max-w-xs gap-2">
  <Select default-value="a">
    <SelectTrigger aria-label="Compact list"><SelectValue /></SelectTrigger>
    <SelectContent size="sm"><SelectItem value="a">Compact row</SelectItem><SelectItem value="b">Second compact row</SelectItem></SelectContent>
  </Select>
  <Select default-value="a">
    <SelectTrigger aria-label="Roomy list"><SelectValue /></SelectTrigger>
    <SelectContent size="lg"><SelectItem value="a">Roomy row</SelectItem><SelectItem value="b" size="sm">One compact row</SelectItem></SelectContent>
  </Select>
</div>`,
    },
  ],
  a11y: [
    'Trigger is a `role="combobox"` button with `aria-expanded`/`aria-controls`; the list is a `role="listbox"` with `role="option"` items and `aria-selected`.',
    'Keyboard: Enter/Space/Arrow Up/Arrow Down opens, Arrow keys move, Home/End jump, type-ahead jumps, Enter or Space selects, Escape closes and returns focus to the trigger.',
    'Inside a Field the trigger receives `id` (label `for`), `aria-describedby`, `aria-invalid` (only when invalid); without Field set `aria-label` on SelectTrigger.',
    'Content is portalled and focus moves into the list while it is open; Tab does not leave it. Disabled items are skipped by keyboard navigation.',
    'The trigger is 16px text on small screens (no iOS zoom) and 14px from `md` (`lg` stays 16px); trigger and items are at least 44px tall on touch devices. The content is capped to the available width and scrolls with the scroll buttons or the keyboard.',
    '`status` is never colour alone: success, warning and error draw an icon before the chevron. Success and warning also add visually hidden text ("Valid", "Warning") that the trigger references from `aria-describedby`; error sets `aria-invalid` and relies on the Field error message.',
    'Every `variant` keeps a visible edge or fill and the focus indicator (a ring, or a thicker bottom border for `underline`); forced-colors mode draws the border of `underline` and `ghost` in system colours.',
    'The highlighted item keeps an outline in forced-colors mode and the selected item shows a check icon (not colour alone). Layout uses logical properties (RTL safe).',
  ],
  related: ['NativeSelect', 'Combobox', 'RadioGroup', 'SegmentedControl', 'Field'],
  requires: [
    'Throws a ContractError when `SelectTrigger` has no accessible name: no `Field` label, wrapping or `for` label, `aria-label` or `aria-labelledby` (the selected value and the placeholder do not count).',
    'Throws a ContractError when `Select` has no `SelectTrigger`, no `SelectValue` or no `SelectContent`.',
    'Throws a ContractError when a `SelectItem` has a missing or empty `value` (the item is not rendered).',
  ],
  llmNotes: [
    'Always compose Select > SelectTrigger(SelectValue) + SelectContent(SelectItem...). Put `placeholder` on SelectValue.',
    'SelectItem `value` must be a non-empty string (an empty one raises a ContractError and the item is not rendered); never use "" for "none" - use a placeholder or a "none" sentinel value.',
    'Wrap in Field for label/error; otherwise give SelectTrigger an `aria-label`.',
    'Style the dropdown via SelectContent `class` (it is portalled out of the parent).',
    'Look props go on SelectTrigger (`variant`, `shape`, `status`, `size`), not on Select. `status="error"` already sets aria-invalid; still show a visible error message in a Field.',
    'Prefer NativeSelect for simple lists or when native mobile pickers are desirable.',
  ],
  replaces: ['shadcn-vue Select', 'hand-rolled Select markup in app code'],
}
export default doc
