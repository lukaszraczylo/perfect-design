import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const plans = () => [
  { name: 'Sample plan A', price: 'Free', description: 'One line on who the plan is for' },
  { name: 'Sample plan B', price: '$XX', period: '/mo', yearlyPrice: '$YY', yearlyPeriod: '/mo, billed yearly', yearlyNote: 'Billed yearly', highlighted: true, badge: 'Recommended', description: 'One line on who the plan is for' },
  { name: 'Sample plan C', price: '$XX', period: '/mo', yearlyPrice: '$YY', yearlyPeriod: '/mo, billed yearly', description: 'One line on who the plan is for' },
]
const rows = () => [
  { label: 'Projects', values: ['1', '10', 'Unlimited'] },
  { label: 'Custom domains', values: [false, true, true] },
  { group: 'Security' },
  { label: 'SSO', values: [false, false, true] },
  { label: 'Audit log', values: [false, true, true] },
  { group: 'Support' },
  { label: 'Support channel', values: ['Community', 'Email', 'Chat'] },
]

const doc: ComponentDoc = {
  name: 'PricingTable',
  group: 'marketing',
  subgroup: 'Pricing',
  summary: 'Pricing comparison table: plans as columns (price, badge, CTA), features as rows with check/cross/text cells and an optional billing toggle.',
  description:
    'Use when visitors need to compare many features across plans; for a short card-per-plan layout use `PricingGrid`. `plans` define the columns (price, optional `yearlyPrice`, `badge`, `highlighted`), `rows` the features and `{ group }` headings (same shape as `ComparisonTable`). Cell values: `true` check, `false` cross, text/number as-is, `null`/missing dash. A monthly/yearly toggle appears when a plan has a `yearlyPrice` (`v-model:billing`, or uncontrolled with `defaultBilling`). Put CTA buttons in the `cta` slot (under each price; `repeatCta` repeats them in a footer row). The table is a real `<table>`; table-level options (`variant`, `size`, `stickyHeader`, `stickyFirstColumn`) match `ComparisonTable`, which this component wraps.',
  status: 'stable',
  props: [
    { name: 'plans', type: 'PricingTablePlan[]', default: '[]', description: 'Columns: `{ id?, name, price?, period?, yearlyPrice?, yearlyPeriod?, yearlyNote?, description?, highlighted?, badge? }`. Malformed entries are skipped.' },
    { name: 'rows', type: 'ComparisonRow[]', default: '[]', description: 'Feature rows `{ label, description?, values[] }` (one value per plan) and `{ group }` headings.' },
    { name: 'billing', type: "'monthly' | 'yearly'", description: '`v-model:billing`. Leave undefined for uncontrolled use. Unknown values mean `monthly`.' },
    { name: 'defaultBilling', type: "'monthly' | 'yearly'", default: "'monthly'", description: 'Initial period when uncontrolled.' },
    { name: 'showToggle', type: 'boolean', description: 'Force the toggle on or off. Default (unset): visible when at least one plan has a `yearlyPrice`.' },
    { name: 'yearlyDiscountLabel', type: 'string', description: 'Badge next to the yearly option. State a fact you can back up.' },
    { name: 'monthlyLabel', type: 'string', default: "'Monthly'", description: 'Label of the monthly option.' },
    { name: 'yearlyLabel', type: 'string', default: "'Yearly'", description: 'Label of the yearly option.' },
    { name: 'billingLabel', type: 'string', default: "'Billing period'", description: 'Accessible name of the toggle group.' },
    { name: 'variant', type: "'default' | 'striped' | 'bordered' | 'minimal'", default: "'default'", description: 'Table surface style (see ComparisonTable). Unknown values fall back to `default`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Cell density. Unknown values fall back to `md`.' },
    { name: 'caption', type: 'string', description: 'Required (or `aria-label` / `aria-labelledby`). Accessible name of the table and its scroll region. Make it unique when a page has several tables (identical region names fail the landmark-unique rule).' },
    { name: 'tableClass', type: 'string', description: 'Extra classes merged onto the table scroll region (e.g. `max-h-96`); `class` goes on the root instead.' },
    { name: 'stickyHeader', type: 'boolean', default: 'false', description: 'Pin plan headers while the table scrolls vertically; pair with `tableClass="max-h-96"` so the table has a height to scroll within.' },
    { name: 'stickyFirstColumn', type: 'boolean', default: 'true', description: 'Pin the feature-name column while scrolling horizontally. On by default; pass `false` to let the whole table scroll.' },
    { name: 'cornerLabel', type: 'string', default: "'Features'", description: 'Top-left header cell text.' },
    { name: 'repeatCta', type: 'boolean', default: 'false', description: 'Also render the `cta` slot in a footer row.' },
    { name: 'includedLabel', type: 'string', default: "'Included'", description: 'Screen-reader text for a check.' },
    { name: 'excludedLabel', type: 'string', default: "'Not included'", description: 'Screen-reader text for a cross.' },
    { name: 'unavailableLabel', type: 'string', default: "'Not available'", description: 'Screen-reader text for an empty cell.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last onto the root (toggle + table).' },
  ],
  slots: [
    { name: 'cta', description: 'Call to action under each plan price.', props: "{ plan: PricingTablePlan, index: number, billing: 'monthly' | 'yearly' }" },
    { name: 'corner', description: 'Replaces the top-left header cell content.' },
    { name: 'cell', description: 'Replaces the default check/cross/text rendering of a cell.', props: '{ value, row, column, rowIndex, columnIndex }' },
    { name: 'row-label', description: 'Replaces the feature name cell content.', props: '{ row: ComparisonFeature }' },
  ],
  emits: [{ name: 'update:billing', payload: "[value: 'monthly' | 'yearly']", description: 'The user picked a different billing period.' }],
  examples: [
    {
      title: 'Minimal',
      code: `<PricingTable caption="Minimal plan comparison" :plans="plans" :rows="rows" />`,
      script: `const plans = [{ name: 'Plan A', price: 'Free' }, { name: 'Plan B', price: '$XX', highlighted: true }]
const rows = [{ label: 'Projects', values: ['1', '10'] }, { label: 'SSO', values: [false, true] }]`,
      state: () => ({
        plans: [{ name: 'Plan A', price: 'Free' }, { name: 'Plan B', price: '$XX', highlighted: true }],
        rows: [{ label: 'Projects', values: ['1', '10'] }, { label: 'SSO', values: [false, true] }],
      }),
    },
    {
      title: 'Realistic: grouped features, CTA and billing toggle',
      code: `<PricingTable caption="Plan comparison with billing toggle" :plans="plans" :rows="rows" yearly-discount-label="Yearly saves money">
  <template #cta="{ plan }"><Button :variant="plan.highlighted ? 'default' : 'outline'" size="sm">Choose {{ plan.name }}</Button></template>
</PricingTable>`,
      state: () => ({ plans: plans(), rows: rows() }),
    },
    {
      title: 'Billing toggle with v-model:billing',
      code: `<PricingTable caption="Plan comparison bound to billing" v-model:billing="billing" :plans="plans" :rows="rows" />
<p class="mt-3 text-center text-sm text-muted-foreground">Showing {{ billing }} prices</p>`,
      script: `const billing = ref('yearly')`,
      state: () => ({ plans: plans(), rows: rows(), billing: ref('yearly') }),
    },
    {
      title: 'Without a toggle (single price per plan)',
      code: `<PricingTable caption="Plan comparison without a toggle" :plans="plans" :rows="rows" />`,
      state: () => ({ plans: [{ name: 'Basic sample', price: '$XX', period: '/mo' }, { name: 'Plus sample', price: '$YY', period: '/mo', highlighted: true }], rows: rows().slice(0, 2).map((r) => ({ ...r, values: (r as { values: unknown[] }).values.slice(0, 2) })) }),
    },
    {
      title: 'Footer CTA row (repeatCta)',
      description: 'Repeat the buttons below long tables.',
      code: `<PricingTable caption="Plan comparison with footer actions" repeat-cta :plans="plans" :rows="rows">
  <template #cta="{ plan }"><Button size="sm" variant="outline">Choose {{ plan.name }}</Button></template>
</PricingTable>`,
      state: () => ({ plans: plans(), rows: rows() }),
    },
    {
      title: 'Table variant: striped, size sm',
      code: `<PricingTable caption="Striped small plan comparison" variant="striped" size="sm" :plans="plans" :rows="rows" />`,
      state: () => ({ plans: plans(), rows: rows() }),
    },
    {
      title: 'Table variant: bordered',
      code: `<PricingTable caption="Bordered plan comparison" variant="bordered" :plans="plans" :rows="rows" />`,
      state: () => ({ plans: plans(), rows: rows() }),
    },
    {
      title: 'Sticky header',
      description: '`tableClass` limits the table height so the plan headers stay visible while scrolling.',
      code: `<PricingTable caption="Plan comparison with sticky header" sticky-header table-class="max-h-64" :plans="plans" :rows="rows" />`,
      state: () => ({ plans: plans(), rows: rows() }),
    },
    {
      title: 'Sticky first column (default)',
      description: 'On narrow screens the table scrolls sideways while feature names stay visible. This is the default; pass `:sticky-first-column="false"` to opt out.',
      code: `<PricingTable caption="Plan comparison with sticky first column" class="max-w-md" :plans="plans" :rows="rows" />`,
      state: () => ({ plans: plans(), rows: rows() }),
    },
  ],
  requires: [
    'Throws a ContractError when the table has no name: set `caption`, `aria-label` or `aria-labelledby` (the last two land on the table region, not the wrapper).',
    'Throws a ContractError when a plan has an empty `name` (the first one is named by index).',
    'Throws a ContractError when `billing` or `defaultBilling` is not `monthly` or `yearly`.',
    'Throws a ContractError when `billing` is set, the toggle is visible and nothing listens to `update:billing` (use `v-model:billing`).',
    'Throws a ContractError when the visible toggle has an empty `billingLabel`, `monthlyLabel` or `yearlyLabel`.',
  ],
  a11y: [
    'Real `<table>` with sr-only caption, `scope="col"` plan headers, `scope="row"` feature headers and `scope="rowgroup"` group headings.',
    'Checks and crosses are icons with screen-reader text; localise with `includedLabel`, `excludedLabel` and `unavailableLabel`.',
    'The billing toggle is a `radiogroup` of two `radio` buttons with roving tabindex and Arrow/Home/End keys; the 12px discount badge uses the success / success-foreground pair for 4.5:1 contrast.',
    'The table sits in a focusable, named scroll region (`tabindex="0"`, name from `caption`: give each table on a page a different caption) and keeps a 36rem minimum width, so it scrolls inside itself at 320px instead of the page scrolling sideways.',
    'The highlighted plan is marked with `data-highlighted` and an opaque tinted header; add a `badge` so emphasis is not colour-only.',
  ],
  related: ['ComparisonTable', 'PricingGrid', 'PricingCard'],
  llmNotes: [
    'One `values` entry per plan, in plan order.',
    'Add `yearlyPrice` to paid plans to get the toggle; Free/Custom plans keep their `price`.',
    'Mark at most one plan `highlighted` with a `badge`.',
    'Put one Button per plan in `cta`; the default variant only on the highlighted plan.',
    'Use PricingTable for 5+ features compared across plans; use PricingGrid for a short checklist per plan.',
  ],
}
export default doc
