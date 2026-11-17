import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const DIMENSIONS_SCRIPT = `const dimensions = [
  { id: 'requests', label: 'Sample requests', unit: 'requests', rate: 0.4, per: 1000, included: 10000, max: 1000000, step: 1000 },
  { id: 'storage', label: 'Sample storage', unit: 'GB', rate: 0, tiers: [{ upTo: 100, rate: 0.1 }, { upTo: 1000, rate: 0.05 }, { upTo: null, rate: 0.02 }], max: 5000, step: 10 },
  { id: 'seats', label: 'Sample seats', unit: 'seats', unitSingular: 'seat', rate: 5, included: 3, min: 1, max: 50 },
]`

const dimensions = [
  { id: 'requests', label: 'Sample requests', unit: 'requests', rate: 0.4, per: 1000, included: 10000, max: 1000000, step: 1000 },
  { id: 'storage', label: 'Sample storage', unit: 'GB', rate: 0, tiers: [{ upTo: 100, rate: 0.1 }, { upTo: 1000, rate: 0.05 }, { upTo: null, rate: 0.02 }], max: 5000, step: 10 },
  { id: 'seats', label: 'Sample seats', unit: 'seats', unitSingular: 'seat', rate: 5, included: 3, min: 1, max: 50 },
]

const doc: ComponentDoc = {
  name: 'UsageEstimator',
  group: 'forms',
  subgroup: 'Selection',
  summary: 'Usage-based cost calculator: a slider and number field per metered dimension, a live cost per line and an estimated total.',
  description:
    'Use `UsageEstimator` on a pricing page or a plan screen when the price depends on how much is used. Each dimension has a `rate` per unit (or per `per` units), optional free `included` units, bounds, and optionally graduated `tiers` that replace the flat rate. The estimate is computed by the exported pure helpers `lineCost` and `estimateTotal`, which never round: amounts are rounded only when displayed. Quantities are clamped to `min` and `max`; NaN and negative values count as 0. Tier bounds `upTo` count billable units (after `included`), and units above the last bounded tier are billed at that tier rate. Use `PlanPicker` to choose a plan and `RateCard` or `TieredPricing` to show the rates as a table. Always say that the figures are an estimate with `note`.',
  status: 'beta',
  props: [
    { name: 'dimensions', type: 'UsageDimension[]', required: true, description: 'Metered dimensions, one row each: `{ id, label, unit, unitSingular?, rate, per?, included?, min?, max, step?, tiers? }`. `id` and `label` are required and unique, `max` is a finite number above `min`, `rate` is at least 0. `tiers` is `{ upTo: number | null, rate: number }[]` in ascending order.' },
    { name: 'modelValue', type: 'Record<string, number>', description: 'v-model: quantity per dimension id. A missing id counts as that dimension\'s `min` (or 0). Uncontrolled when omitted.' },
    { name: 'defaultValue', type: 'Record<string, number>', description: 'Initial quantities when uncontrolled.' },
    { name: 'currency', type: 'string', description: 'ISO 4217 currency code. Default `USD`.' },
    { name: 'locale', type: 'string', description: 'BCP 47 locale for money and quantities. Defaults to the ConfigProvider locale, else `en-US`.' },
    { name: 'period', type: 'string', description: 'Text after the total, such as "/month". It is also spoken with the total.' },
    { name: 'input', type: "'slider' | 'number' | 'both'", default: "'both'", description: 'Controls in each row. With `slider` alone the quantity is shown as text. Unknown values fall back to `both`.' },
    { name: 'showBreakdown', type: 'boolean', default: 'true', description: 'Show the cost of each row and its rate hint. The total is always shown.' },
    { name: 'totalLabel', type: 'string', default: "'Estimated total'", description: 'Label of the total line, also used in the spoken update.' },
    { name: 'labels', type: 'Partial<UsageEstimatorLabels>', description: 'Rate hint text for i18n: `included` (default `{count} included`, `{count}` is replaced by the formatted number) and `graduated` (default `Graduated rates`). An empty value keeps the English default.' },
    { name: 'note', type: 'string', description: 'Disclaimer under the total, such as "Sample rates. Estimate only." Use the `note` slot for rich content.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Spacing, text size and control size. Unknown values fall back to `md`.' },
    { name: 'variant', type: "'card' | 'plain'", default: "'card'", description: '`card` is a bordered panel; `plain` has no surface. Unknown values fall back to `card`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root element; wins over internal classes.' },
  ],
  slots: [{ name: 'note', description: 'Rich disclaimer under the total. Overrides the `note` prop.' }],
  emits: [{ name: 'update:modelValue', payload: '[value: Record<string, number>]', description: 'Emitted with the full quantity map when a slider or number field changes a quantity.' }],
  examples: [
    {
      title: 'Basic',
      script: `const dimensions = [{ id: 'requests', label: 'Sample requests', unit: 'requests', rate: 0.5, per: 1000, max: 100000, step: 1000 }]`,
      code: `<UsageEstimator :dimensions="dimensions" :default-value="{ requests: 20000 }" period="/month" note="Sample rate. Estimate only." class="max-w-xl" />`,
      state: () => ({ dimensions: [{ id: 'requests', label: 'Sample requests', unit: 'requests', rate: 0.5, per: 1000, max: 100000, step: 1000 }] }),
    },
    {
      title: 'Included units, tiers and a shown model',
      description: 'Requests include 10,000 free units and are billed per 1,000. Storage is graduated: the first 100 GB, the next 900 GB, then the rest. Seats include three. The total follows every change.',
      script: `${DIMENSIONS_SCRIPT}\nconst usage = ref({ requests: 250000, storage: 400, seats: 5 })`,
      code: `<div class="grid max-w-xl gap-3">
  <UsageEstimator v-model="usage" :dimensions="dimensions" period="/month" note="Sample rates. Estimate only." />
  <p class="text-sm text-muted-foreground tabular-nums">Model: {{ usage }}</p>
</div>`,
      state: () => ({ dimensions, usage: ref({ requests: 250000, storage: 400, seats: 5 }) }),
    },
    {
      title: 'Inputs and breakdown',
      description: '`input` chooses the controls and `showBreakdown` hides the per-row costs. A slider alone shows the quantity as text.',
      script: DIMENSIONS_SCRIPT,
      code: `<div class="grid max-w-xl gap-8">
  <UsageEstimator input="slider" :dimensions="dimensions" :default-value="{ requests: 120000, storage: 50, seats: 4 }" />
  <UsageEstimator input="number" :show-breakdown="false" :dimensions="dimensions" :default-value="{ requests: 120000, storage: 50, seats: 4 }" />
</div>`,
      state: () => ({ dimensions }),
    },
    {
      title: 'Variant and sizes',
      description: '`plain` drops the panel. `sm` and `lg` change spacing, text and control size.',
      script: DIMENSIONS_SCRIPT,
      code: `<div class="grid max-w-xl gap-8">
  <UsageEstimator variant="plain" size="sm" :dimensions="dimensions" />
  <UsageEstimator size="lg" :dimensions="dimensions" />
</div>`,
      state: () => ({ dimensions }),
    },
    {
      title: 'German locale and currency',
      script: DIMENSIONS_SCRIPT,
      code: `<UsageEstimator locale="de-DE" currency="EUR" period="/Monat" total-label="Geschätzter Gesamtbetrag" note="Beispielpreise. Nur eine Schätzung." :dimensions="dimensions" :default-value="{ requests: 50000, storage: 120, seats: 4 }" class="max-w-xl" />`,
      state: () => ({ dimensions }),
    },
  ],
  a11y: [
    'Every slider thumb and number field is named from the dimension `label` and `unit` ("Sample requests, requests"). The visible label is contained in that name.',
    'Keyboard: the slider takes the arrow keys, Home, End and Page Up/Down; the number field takes the arrow keys and typed digits, and commits on Enter or blur.',
    'The total is announced through one polite `role="status"` region, once the quantities stop changing (about 600ms), not on every slider step.',
    'Rows stack at 375px: the label and cost on one line, the slider above the number field. Numbers use tabular figures and logical properties, so right-to-left layouts mirror.',
  ],
  requires: [
    'Throws a ContractError when a dimension has an empty `id` or two dimensions share an `id`.',
    'Throws a ContractError when a dimension has an empty `label`, which names its controls.',
    'Throws a ContractError when a dimension `max` is not a finite number above its `min`.',
    'Throws a ContractError when a dimension `rate` (or a tier `rate`) is not a finite number of at least 0.',
  ],
  llmNotes: [
    'Use UsageEstimator for usage-based pricing; use PlanPicker to choose a plan and RateCard or TieredPricing to list the rates.',
    'Give every dimension a unique `id`, a `label`, a `unit`, a `rate` and a `max`; set `step` so the slider moves in useful jumps.',
    'Set `unitSingular` ("seat") when `unit` is plural, so a per-unit rate reads "$5 / seat".',
    'Use `per` for rates quoted per 1,000 units and `included` for free units; use `tiers` for graduated pricing (`upTo` counts billable units, `null` means no limit).',
    'Compute the figure with `lineCost` and `estimateTotal`, never by hand; they do not round.',
    'On a translated page, pass `labels` (`included` with `{count}`, `graduated`) next to `totalLabel`, `period` and `note`.',
    'Always set `note` to say the figure is an estimate, and `period` for the billing period.',
    'In examples, use labelled sample rates and round numbers ("Sample requests"), never real prices.',
  ],
  related: ['Price', 'RateCard', 'TieredPricing', 'PricingCard', 'PlanPicker', 'Slider', 'NumberInput'],
  replaces: ['a hand-built pricing calculator with a range input and a computed total'],
}

export default doc
