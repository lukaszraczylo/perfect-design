import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'NumberInput',
  group: 'forms',
  subgroup: 'Text fields',
  summary: 'Numeric text field with -/+ steppers, clamping, keyboard stepping, float-safe arithmetic, variants, sizes, shapes and status.',
  description:
    'A native `<input inputmode="decimal">` (deliberately NOT `type="number"`, which has inconsistent locale, scroll-wheel and validation behaviour) wrapped with stepper buttons. The value is committed on blur, Enter or a stepper/keyboard step: it is clamped to `min`/`max`, non-numeric drafts are rejected and the field reverts to the last valid value. `v-model` is `number | null` (`null` = empty). `variant`, `size`, `shape` and `status` style the whole control (the steppers follow); `status` adds an icon left of the increment stepper, plus screen reader text for `success` and `warning`. `numberInputVariants` gives a wrapper element the same surface. Use `Slider` for approximate picks, `Input` for free text and identifiers (zip codes, phone numbers) that merely look numeric.',
  status: 'stable',
  props: [
    { name: 'modelValue', type: 'number | null', description: 'Current value; `null` (or NaN/Infinity) means empty.' },
    { name: 'min', type: 'number', description: 'Lower bound applied on commit and when stepping.' },
    { name: 'max', type: 'number', description: 'Upper bound applied on commit and when stepping.' },
    { name: 'step', type: 'number', default: '1', description: 'Increment for steppers and ArrowUp/ArrowDown. PageUp/PageDown move by 10 steps. Stepping is float-safe (0.1 + 0.2 = 0.3).' },
    { name: 'precision', type: 'number', description: 'Fixed decimals: values are rounded and displayed padded (`1.50`). Omit to keep typed decimals.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the input and both steppers.' },
    { name: 'readonly', type: 'boolean', default: 'false', description: 'Value is visible and focusable but cannot be changed by typing, keys or steppers.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Native required attribute.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets aria-invalid and destructive styling.' },
    { name: 'placeholder', type: 'string', description: 'Placeholder shown when empty.' },
    { name: 'variant', type: "'outline' | 'filled' | 'underline' | 'ghost'", default: "'outline'", description: 'Surface: muted fill (`filled`), bottom border only (`underline`), border on hover and fill while focused (`ghost`). Unknown values fall back to `outline`.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Height and stepper width: 28, 32, 36 and 44px tall. Text stays 16px below `md` and touch pointers get a 44px target. Unknown values fall back to `md`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corners. `pill` is fully rounded and clips the steppers to it; `underline` has no corners and ignores it. Unknown values fall back to `rounded`.' },
    { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Status colour with an icon left of the increment stepper. `success` and `warning` add visually hidden text linked through `aria-describedby`; `error` also sets `aria-invalid="true"`. Unknown values fall back to `default`.' },
    { name: 'statusLabel', type: 'string', default: "'Valid' or 'Warning'", description: 'Screen reader text of the `success` and `warning` status. Set it when the app is not in English.' },
    { name: 'showSteppers', type: 'boolean', default: 'true', description: 'Render the -/+ buttons.' },
    { name: 'decrementLabel', type: 'string', default: "'Decrease'", description: 'aria-label of the minus button (use for i18n or context: "Fewer guests").' },
    { name: 'incrementLabel', type: 'string', default: "'Increase'", description: 'aria-label of the plus button.' },
    { name: 'invalidLabel', type: 'string', default: "'Not a number, value restored'", description: 'Spoken through the polite live region when typed text is not a number and the previous value comes back.' },
    { name: 'adjustedLabel', type: 'string', default: "'Adjusted to'", description: 'Spoken when `min`, `max` or `precision` changes what was typed (`Adjusted to 10`).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the wrapper; wins over internal classes. Other attributes (name, id, aria-*) go to the inner input.' },
  ],
  emits: [{ name: 'update:modelValue', payload: '[value: number | null]', description: 'Fires on commit (blur, Enter, stepper, arrow/page/home/end keys) with the clamped value, or null when emptied. Not fired while typing or when the value is unchanged.' }],
  examples: [
    {
      title: 'Quantity',
      script: `const qty = ref(2)`,
      code: `<div class="flex w-40 flex-col gap-2">
  <NumberInput v-model="qty" :min="1" :max="10" aria-label="Quantity" />
  <p class="text-sm text-muted-foreground">Quantity: {{ qty }}</p>
</div>`,
      state: () => ({ qty: ref<number | null>(2) }),
    },
    {
      title: 'Decimals with precision',
      description: 'Fractional steps do not accumulate floating point error; precision pads the display.',
      script: `const amount = ref(9.9)`,
      code: `<Field label="Amount" hint="Step 0.1, two decimals" class="w-48">
  <NumberInput v-model="amount" :step="0.1" :precision="2" :min="0" />
</Field>`,
      state: () => ({ amount: ref<number | null>(9.9) }),
    },
    {
      title: 'Variants, shapes and sizes',
      code: `<div class="grid w-48 gap-3">
  <NumberInput :model-value="4" variant="outline" aria-label="Outline quantity" />
  <NumberInput :model-value="4" variant="filled" aria-label="Filled quantity" />
  <NumberInput :model-value="4" variant="underline" aria-label="Underline quantity" />
  <NumberInput :model-value="4" variant="ghost" aria-label="Ghost quantity" />
  <NumberInput :model-value="4" shape="pill" aria-label="Pill quantity" />
  <NumberInput :model-value="4" shape="square" aria-label="Square quantity" />
  <NumberInput :model-value="4" size="xs" aria-label="Extra small quantity" />
  <NumberInput :model-value="4" size="lg" aria-label="Large quantity" />
</div>`,
    },
    {
      title: 'Status',
      description: 'The status icon sits left of the increment stepper; success and warning add screen reader text.',
      code: `<div class="grid w-48 gap-3">
  <NumberInput :model-value="4" status="success" aria-label="Valid quantity" />
  <NumberInput :model-value="9" status="warning" aria-label="Quantity close to the limit" />
  <NumberInput :model-value="0" status="error" aria-label="Invalid quantity" />
  <NumberInput :model-value="4" status="success" :show-steppers="false" aria-label="Valid quantity without steppers" />
</div>`,
    },
    {
      title: 'Disabled and read-only',
      code: `<div class="flex w-40 flex-col gap-3">
  <NumberInput :model-value="3" disabled aria-label="Disabled" />
  <NumberInput :model-value="3" readonly aria-label="Read only" />
</div>`,
    },
  ],
  a11y: [
    'Status is never colour alone: an icon appears for `success`, `warning` and `error`; `success` and `warning` add screen reader text referenced by `aria-describedby`, and `error` sets `aria-invalid="true"` (pair it with a visible message in `Field`).',
    'The surface is a wrapper, so the variants react to `focus-within`: `underline` thickens its bottom border and `ghost` fills while the input or a stepper has focus, and forced-colors mode keeps the outline.',
    'The input exposes role="spinbutton" with aria-valuenow/min/max (omitted when empty or unbounded), aria-valuetext with the formatted value (`1.50`) and aria-readonly when `readonly`.',
    'ArrowUp/ArrowDown step, PageUp/PageDown step x10, Home/End jump to min/max when defined, Enter commits.',
    'Stepper buttons have aria-labels (`incrementLabel`/`decrementLabel`) and sit outside the tab order; the keyboard works on the input itself. A stepper click speaks the new value through a polite `role="status"` region.',
    'Rejected input is announced: non-numeric text restores the previous value ("Not a number, value restored") and clamping or rounding says "Adjusted to <value>".',
    'inputmode is `decimal` (`numeric` when `precision` is 0) and enterkeyhint is `done`. Inside `Field` the input gets the id, aria-describedby and aria-invalid.',
    'Responsive: 16px text below `md`, 44px height and stepper width on coarse pointers, tabular numerals, logical (RTL-safe) stepper borders and a forced-colors focus outline on the whole control.',
  ],
  related: ['Slider', 'Input', 'Field', 'InputGroup'],
  requires: [
    'Throws a ContractError when the input has no accessible name: no `Field` label, `for` label, `aria-label` or `aria-labelledby`. A wrapping `<label>` only counts without steppers, because the first button inside it is labelled instead.',
    'Throws a ContractError when a rendered stepper has no name, that is when `decrementLabel` or `incrementLabel` is blank while `showSteppers` is on.',
  ],
  llmNotes: [
    'v-model is number | null, never a string.',
    'Set `min`/`max` rather than validating after the fact; the value is clamped on commit.',
    'Give an `aria-label` or wrap in `Field` with a label.',
    'Use `status` for validation feedback (it adds the icon) and still show the message through `Field error` or `hint`.',
    'Use `precision` for money-like fixed decimals; use `step` for fractional increments.',
    'Use Input (not NumberInput) for identifiers such as postcodes or phone numbers.',
  ],
  replaces: ['<input type="number"> usages', 'shadcn-vue NumberField'],
}
export default doc
