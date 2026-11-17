import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const PLANS_SCRIPT = `const plans = [
  { id: 'a', name: 'Sample plan A', description: 'Sample description for the smallest plan.', price: 0, period: '/month' },
  { id: 'b', name: 'Sample plan B', description: 'Sample description for the middle plan.', price: 10, yearlyPrice: 100, period: '/month', yearlyPeriod: '/year', features: ['Sample feature one', 'Sample feature two'] },
  { id: 'c', name: 'Sample plan C', description: 'Sample description for the largest plan.', price: 40, yearlyPrice: 400, period: '/month', yearlyPeriod: '/year', badge: 'Sample badge' },
]`

const plans = [
  { id: 'a', name: 'Sample plan A', description: 'Sample description for the smallest plan.', price: 0, period: '/month' },
  { id: 'b', name: 'Sample plan B', description: 'Sample description for the middle plan.', price: 10, yearlyPrice: 100, period: '/month', yearlyPeriod: '/year', features: ['Sample feature one', 'Sample feature two'] },
  { id: 'c', name: 'Sample plan C', description: 'Sample description for the largest plan.', price: 40, yearlyPrice: 400, period: '/month', yearlyPeriod: '/year', badge: 'Sample badge' },
]

const doc: ComponentDoc = {
  name: 'PlanPicker',
  group: 'forms',
  subgroup: 'Choice',
  summary: 'One column of selectable plans with the price at the end, for checkout, upgrade and settings screens.',
  description:
    'Use `PlanPicker` when a person chooses one plan inside a form or a settings page: each plan is a radio card with a name, an optional description and a few short points, and its price at the end of the row. It is built on a reka-ui radio group, so the arrow keys move and select, and the whole group is one tab stop. Use `PricingGrid` or `PricingCard` for the marketing page that compares plans side by side, `RadioCardGroup` when the options are not priced, and `UsageEstimator` for usage-based pricing. The model is the selected plan `id`. Set `name` to submit the id in a native form. Prices render through `Price`; a `price` of `null` shows `customLabel`. `billing` switches every plan between `price` and `yearlyPrice` (a plan without `yearlyPrice` keeps its monthly price), and `showBillingToggle` adds the toggle.',
  status: 'beta',
  props: [
    { name: 'plans', type: 'PlanPickerPlan[]', required: true, description: 'Plans in display order: `{ id, name, description?, price, yearlyPrice?, period?, yearlyPeriod?, badge?, disabled?, features? }`. `id` is a unique non-empty string, `price` is in major units or `null`. Keep `features` to about three short points. A value that is not an array renders no plans.' },
    { name: 'modelValue', type: 'string', description: 'v-model: the selected plan `id`. Uncontrolled when omitted.' },
    { name: 'defaultValue', type: 'string', description: 'Initial plan `id` when uncontrolled.' },
    { name: 'billing', type: "'monthly' | 'yearly'", description: 'v-model:billing. Uncontrolled when omitted. Unknown values count as `monthly`.' },
    { name: 'defaultBilling', type: "'monthly' | 'yearly'", default: "'monthly'", description: 'Initial billing when uncontrolled.' },
    { name: 'showBillingToggle', type: 'boolean', default: 'false', description: 'Show the monthly and yearly toggle above the plans.' },
    { name: 'billingLabels', type: '{ group?: string; monthly?: string; yearly?: string }', description: 'Text of the toggle and its accessible name. Defaults are "Billing period", "Monthly" and "Yearly".' },
    { name: 'yearlyNote', type: 'string', default: "'Billed yearly'", description: 'Small text under a price that is a yearly price. An empty string hides it.' },
    { name: 'customLabel', type: 'string', default: "'Custom'", description: 'Shown instead of the price when `price` is `null`.' },
    { name: 'currency', type: 'string', description: 'ISO 4217 currency code. Default `USD`. An invalid code renders a plain number.' },
    { name: 'locale', type: 'string', description: 'BCP 47 locale for prices, such as `de-DE`. Defaults to the ConfigProvider locale, else `en-US`.' },
    { name: 'name', type: 'string', description: 'Form field name. A hidden input with the selected `id` is rendered while a plan is selected, so a native form submits it.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Sets `aria-required` on the group. Also inherited from a Field. Native form validation does not check it.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables every plan and the toggle. Also inherited from a Field.' },
    { name: 'invalid', type: 'boolean', default: 'false', description: 'Sets `aria-invalid` on the group and a destructive border on every plan. Also set by a Field with an error.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding, gap and text size of the plans. Unknown values fall back to `md`.' },
    { name: 'variant', type: "'cards' | 'list'", default: "'cards'", description: '`cards` are separate bordered radio cards; `list` is one bordered list with dividers between rows. Unknown values fall back to `cards`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root element; wins over internal classes.' },
  ],
  emits: [
    { name: 'update:modelValue', payload: '[value: string]', description: 'Emitted when the user selects a plan.' },
    { name: 'update:billing', payload: "[value: 'monthly' | 'yearly']", description: 'Emitted when the user switches the billing toggle.' },
  ],
  examples: [
    {
      title: 'Basic',
      script: `${PLANS_SCRIPT}\nconst plan = ref('b')`,
      code: `<div class="grid max-w-lg gap-3">
  <PlanPicker v-model="plan" :plans="plans" aria-label="Plan" />
  <p class="text-sm text-muted-foreground">Selected: {{ plan }}</p>
</div>`,
      state: () => ({ plans, plan: ref('b') }),
    },
    {
      title: 'In a Field, with billing toggle and form value',
      description: 'The Field label names the group and carries the hint. `name` submits the selected id with the form; the toggle switches every plan to its yearly price.',
      script: `${PLANS_SCRIPT}\nconst plan = ref('b')\nconst billing = ref('monthly')`,
      code: `<form class="grid max-w-lg gap-4" @submit.prevent>
  <Field label="Plan" hint="Sample plans. You can change plan later." required>
    <PlanPicker v-model="plan" v-model:billing="billing" name="plan" show-billing-toggle :plans="plans" />
  </Field>
  <p class="text-sm text-muted-foreground tabular-nums">Selected: {{ plan }}, billed {{ billing }}</p>
  <div><Button type="submit">Continue to payment</Button></div>
</form>`,
      state: () => ({ plans, plan: ref('b'), billing: ref('monthly') }),
    },
    {
      title: 'List variant',
      description: 'One bordered list with dividers. A disabled plan stays visible and cannot be selected.',
      script: `const plan = ref('a')\nconst plans = [\n  { id: 'a', name: 'Sample plan A', price: 0, period: '/month' },\n  { id: 'b', name: 'Sample plan B', price: 10, period: '/month' },\n  { id: 'c', name: 'Sample plan C', price: null, disabled: true, badge: 'Unavailable' },\n]`,
      code: `<PlanPicker v-model="plan" variant="list" :plans="plans" aria-label="Plan" class="max-w-lg" />`,
      state: () => ({
        plan: ref('a'),
        plans: [
          { id: 'a', name: 'Sample plan A', price: 0, period: '/month' },
          { id: 'b', name: 'Sample plan B', price: 10, period: '/month' },
          { id: 'c', name: 'Sample plan C', price: null, disabled: true, badge: 'Unavailable' },
        ],
      }),
    },
    {
      title: 'Sizes',
      description: 'Small, medium (default) and large plans.',
      script: PLANS_SCRIPT,
      code: `<div class="grid max-w-lg gap-6">
  <PlanPicker size="sm" default-value="a" :plans="plans" aria-label="Small plans" />
  <PlanPicker default-value="a" :plans="plans" aria-label="Medium plans" />
  <PlanPicker size="lg" default-value="a" :plans="plans" aria-label="Large plans" />
</div>`,
      state: () => ({ plans }),
    },
    {
      title: 'Yearly billing and German prices',
      description: 'A plan without `yearlyPrice` keeps its price in both modes. `locale` and `currency` format the amounts.',
      script: `${PLANS_SCRIPT}\nconst billing = ref('yearly')`,
      code: `<PlanPicker v-model:billing="billing" show-billing-toggle locale="de-DE" currency="EUR" yearly-note="Jährlich abgerechnet" :billing-labels="{ group: 'Abrechnung', monthly: 'Monatlich', yearly: 'Jährlich' }" :plans="plans" aria-label="Tarif" class="max-w-lg" />`,
      state: () => ({ plans, billing: ref('yearly') }),
    },
  ],
  a11y: [
    'The group has `role="radiogroup"` and each plan `role="radio"`. Name the group with a Field label, a Fieldset legend, `aria-label` or `aria-labelledby`. Each plan is named by its `name`, and described by its description, points and price.',
    'Keyboard: Tab enters the group at the selected plan (or the first one) and leaves it; the arrow keys move to the next enabled plan and select it; Space selects the focused plan. Disabled plans are skipped.',
    'The selected plan shows a filled radio dot as well as a primary border and tint, so selection never relies on colour. The focus ring uses `focusRing` and an outline in forced-colors mode.',
    'Each row stacks no further than one column, so the layout reflows at 320px: the name wraps, and the price stays at the end of the row.',
    'The billing toggle is a named radio group of its own. Prices are tabular figures.',
  ],
  requires: [
    'Throws a ContractError when the picker has no accessible name (no Field label, Fieldset legend, `aria-label` or `aria-labelledby`).',
    'Throws a ContractError when a plan has an empty `id` or two plans share an `id`.',
    'Throws a ContractError when a plan has an empty `name`.',
  ],
  llmNotes: [
    'Use PlanPicker for choosing a plan inside a form or settings screen; use PricingGrid for the marketing comparison.',
    'Always name the picker: wrap it in Field with a label, or set `aria-label`.',
    'Give every plan a unique non-empty `id` and a `name`; the model is the plan `id`.',
    'Pass prices as numbers in major units and set `currency` and `locale`; never pass formatted strings.',
    'Keep `features` to about three short points; put the full comparison on a pricing page.',
    'Use `v-model:billing` with `show-billing-toggle` for monthly and yearly prices; give `yearlyPrice` and `yearlyPeriod` on each plan that has them.',
    'Set `name` when the selected plan must be submitted by a native form.',
    'In examples, label plans as samples ("Sample plan A") and use round numbers.',
  ],
  related: ['Price', 'PricingCard', 'PricingGrid', 'RateCard', 'TieredPricing', 'UsageEstimator', 'RadioCardGroup', 'RadioGroup', 'SegmentedControl', 'Field'],
  replaces: ['hand-rolled radio cards for choosing a plan', 'a plan list built from native radio inputs and custom CSS'],
}

export default doc
