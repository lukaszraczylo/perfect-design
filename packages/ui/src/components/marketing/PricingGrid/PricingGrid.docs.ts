import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const plans = () => [
  { name: 'Sample plan A', price: 'Free', features: ['First sample feature', { label: 'Excluded sample feature', included: false }] },
  { name: 'Sample plan B', price: '$XX', period: '/mo', yearlyPrice: '$YY', yearlyPeriod: '/mo, billed yearly', yearlyNote: 'Billed yearly', highlighted: true, badge: 'Recommended', features: ['First sample feature', 'Second sample feature'] },
  { name: 'Sample plan C', price: '$XX', period: '/mo', yearlyPrice: '$YY', yearlyPeriod: '/mo, billed yearly', features: ['Everything in plan B', 'Third sample feature'] },
]

const doc: ComponentDoc = {
  name: 'PricingGrid',
  group: 'marketing',
  subgroup: 'Pricing',
  summary: 'Responsive grid of PricingCards from a plans array, with a per-plan CTA slot and an optional monthly/yearly billing toggle.',
  description:
    'Use to lay out 1-4 plans side by side. Pass `plans` (PricingCard props) and a scoped `cta` slot, or put your own `PricingCard`s in the default slot. When at least one plan has a `yearlyPrice` a billing toggle appears above the grid (force it with `showToggle`); the selected `billing` is passed to every generated card so prices switch together. `v-model:billing` controls the state; without it the grid keeps its own state (`defaultBilling` sets the start value). `variant` is passed to generated cards (a plan\'s own `variant` wins). When the toggle is visible the root is a wrapper (`pricing-grid`) and the list element is the inner `pricing-grid-items`. For a feature-by-plan matrix use `PricingTable`.',
  status: 'stable',
  props: [
    { name: 'plans', type: 'PricingPlan[]', default: '[]', description: 'Plan objects with the same fields as PricingCard props (name, price, period, yearlyPrice, yearlyPeriod, yearlyNote, description, features, highlighted, variant, badge, level, excludedLabel). `billing` is controlled by the grid.' },
    { name: 'columns', type: '1 | 2 | 3 | 4', default: '3', description: 'Columns on large screens; invalid falls back to 3.' },
    { name: 'billing', type: "'monthly' | 'yearly'", description: '`v-model:billing`. Leave undefined for uncontrolled use. Unknown values mean `monthly`.' },
    { name: 'defaultBilling', type: "'monthly' | 'yearly'", default: "'monthly'", description: 'Initial period when uncontrolled.' },
    { name: 'showToggle', type: 'boolean', description: 'Force the toggle on or off. Default (unset): visible when at least one plan has a `yearlyPrice`.' },
    { name: 'yearlyDiscountLabel', type: 'string', description: 'Badge next to the yearly option. State a fact you can back up.' },
    { name: 'monthlyLabel', type: 'string', default: "'Monthly'", description: 'Label of the monthly option.' },
    { name: 'yearlyLabel', type: 'string', default: "'Yearly'", description: 'Label of the yearly option.' },
    { name: 'billingLabel', type: 'string', default: "'Billing period'", description: 'Accessible name of the toggle group.' },
    { name: 'variant', type: "'default' | 'highlighted' | 'outline' | 'minimal' | 'compact'", description: 'PricingCard variant for generated cards; a plan\'s own `variant` wins. Unknown values fall back to `default`. The resolved value is exposed as `data-variant` on the root, also when the cards come from the slot.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'PricingCard `size` for generated cards (a plan\'s own `size` wins). Exposed as `data-size`.' },
    { name: 'shape', type: "'rounded' | 'square'", default: "'rounded'", description: 'PricingCard `shape` for generated cards (a plan\'s own `shape` wins). Exposed as `data-shape`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; lands on the root (the wrapper when the toggle is visible).' },
  ],
  slots: [
    { name: 'default', description: 'Custom cards; replaces `plans` rendering. Receives the active billing so you can pass it to your cards.', props: "{ billing: 'monthly' | 'yearly' }" },
    { name: 'cta', description: 'Per-plan call to action when using `plans`.', props: "{ plan: PricingPlan, index: number, billing: 'monthly' | 'yearly' }" },
  ],
  emits: [{ name: 'update:billing', payload: "[value: 'monthly' | 'yearly']", description: 'The user picked a different billing period (not emitted when the active option is clicked again).' }],
  examples: [
    {
      title: 'From plans',
      code: `<PricingGrid :plans="plans">
  <template #cta="{ plan }"><Button :variant="plan.highlighted ? 'default' : 'outline'">Choose {{ plan.name }}</Button></template>
</PricingGrid>`,
      script: `const plans = [{ name: 'Sample plan A', price: 'Free', features: ['First sample feature'] }, ...]`,
      state: () => ({
        plans: [
          { name: 'Sample plan A', price: 'Free', features: ['First sample feature', { label: 'Excluded sample feature', included: false }] },
          { name: 'Sample plan B', price: '$XX', period: '/mo', highlighted: true, badge: 'Recommended', features: ['First sample feature', 'Second sample feature'] },
          { name: 'Sample plan C', price: 'Custom', features: ['Everything in plan B', 'Third sample feature'] },
        ],
      }),
    },
    {
      title: 'Two custom cards',
      description: 'Slot cards need no role. Wrap them in an `<li>` inside your own `<ul>` only if you want list semantics.',
      code: `<PricingGrid :columns="2">
  <PricingCard name="Sample monthly plan" price="$XX" period="/mo" :features="['First sample feature']"><template #cta><Button variant="outline">Pick monthly</Button></template></PricingCard>
  <PricingCard name="Sample yearly plan" price="$YY" period="/yr" highlighted badge="Recommended" :features="['First sample feature']"><template #cta><Button>Pick yearly</Button></template></PricingCard>
</PricingGrid>`,
    },
    {
      title: 'Billing toggle (uncontrolled)',
      description: 'The toggle appears because two plans have a `yearlyPrice`. Free keeps its price in both modes.',
      code: `<PricingGrid :plans="plans" yearly-discount-label="Yearly saves money">
  <template #cta="{ plan }"><Button :variant="plan.highlighted ? 'default' : 'outline'">Choose {{ plan.name }}</Button></template>
</PricingGrid>`,
      state: () => ({ plans: plans() }),
    },
    {
      title: 'Billing toggle with v-model:billing',
      description: 'Bind `billing` to sync other UI (for example a footnote).',
      code: `<PricingGrid v-model:billing="billing" :plans="plans" yearly-discount-label="Yearly saves money" />
<p class="mt-4 text-center text-sm text-muted-foreground">Showing {{ billing }} prices</p>`,
      script: `const billing = ref('yearly')`,
      state: () => ({ plans: plans(), billing: ref('yearly') }),
    },
    {
      title: 'Billing toggle with localised labels',
      code: `<PricingGrid :plans="plans" monthly-label="Monat" yearly-label="Jahr" billing-label="Abrechnungszeitraum" yearly-discount-label="Spart Geld" :columns="3" />`,
      state: () => ({ plans: plans() }),
    },
    {
      title: 'Card variant: compact, four columns',
      code: `<PricingGrid :columns="4" variant="compact" :plans="plans" />`,
      state: () => ({ plans: [...plans(), { name: 'Sample plan D', price: 'Custom', features: ['Fourth sample feature'] }] }),
    },
    {
      title: 'Card variant: outline',
      code: `<PricingGrid variant="outline" :plans="plans" />`,
      state: () => ({ plans: plans() }),
    },
  ],
  requires: [
    'Throws a ContractError when `plans` is empty and no cards are placed in the default slot.',
    'Throws a ContractError when `billing` or `defaultBilling` is not `monthly` or `yearly`.',
    'Throws a ContractError when `billing` is set, the toggle is visible and nothing listens to `update:billing` (use `v-model:billing`).',
    'Throws a ContractError when the visible toggle has an empty `billingLabel`, `monthlyLabel` or `yearlyLabel`.',
  ],
  a11y: [
    'With `plans` the plans form a native `<ul>` of `<li>` elements, each containing an `<article>` PricingCard (a role on the article itself is not allowed). With the default slot (or no plans) the container is a plain `<div>`: put any markup in it.',
    'The toggle is a `radiogroup` (named by `billingLabel`) with two `radio` buttons; one is in the tab order (roving tabindex); Arrow keys change and focus the option, Home/End jump to monthly/yearly. Options are at least 24px tall (44px on coarse pointers) and the checked option keeps a border, so the state shows in forced-colors mode as well as by colour.',
    'The discount badge is part of the yearly option text, so it is announced with it; it uses the `success` / `success-foreground` token pair so the 12px text keeps 4.5:1 contrast in light and dark mode.',
    'One column at 320px, two from `md`, then `columns`; cards stretch to equal height. Use `level` so plan names continue the page heading outline.',
  ],
  related: ['PricingCard', 'PricingTable', 'FaqList'],
  llmNotes: [
    'Use `plans` + `cta` slot for the common case.',
    'Exactly one plan should be `highlighted`.',
    'Use columns equal to the number of plans (max 4).',
    'For monthly/yearly pricing add `yearlyPrice` to paid plans; the toggle appears by itself. Use `v-model:billing` only if something else on the page needs the value.',
    'Do not pass `billing` inside `plans`; the grid owns it.',
    'With custom default-slot cards use the slot prop `billing` to pass the period to your PricingCards; do not add role="listitem" to them.',
  ],
  replaces: ['hand-rolled PricingGrid markup in app code'],
}
export default doc
