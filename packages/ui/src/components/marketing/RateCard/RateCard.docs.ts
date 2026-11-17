import type { ComponentDoc } from '../../../docs-types'

const items = `[
  { name: 'Sample requests', unit: 'per 1,000 requests', rate: 0.4, included: 'First 10,000 free' },
  { name: 'Sample storage', unit: 'per GB-month', rate: 0.02, included: 'First 5 GB free' },
  { name: 'Sample egress', unit: 'per GB', rate: 0.1, included: 'First 10 GB free' },
]`

const doc: ComponentDoc = {
  name: 'RateCard',
  group: 'marketing',
  subgroup: 'Pricing',
  summary: 'A dense, metered price list: one row per billable unit with its rate, what is included and what happens beyond it.',
  description:
    'Use `RateCard` for developer and infrastructure products that bill by usage, where a grid of plan cards would hide the numbers. Each item has a name, the unit the rate is per, and a rate. A numeric `rate` is formatted with `Price` (small rates such as 0.0004 keep the digits they need); a string rate ("Custom") is shown as written. `included` and `overage` columns appear only when at least one item has them.\n\n' +
    '`variant="table"` (default) is a semantic table inside a focusable, named scroll region, so at 375px it scrolls sideways instead of overflowing the page. `variant="list"` stacks every rate as a definition row and reflows with no horizontal scroll. `size` sets the density.\n\n' +
    'Group rows: give items a `group` name and optionally list `groups` to set the order and add a description. Ungrouped items come first without a heading; groups without items are skipped.\n\n' +
    'Pass a `caption` (or `aria-label` / `aria-labelledby`): the list must have a name. Sample rates in these docs are labelled samples, not offers. For plan comparison use `PricingTable` or `ComparisonTable`; for graduated or volume tiers use `TieredPricing`.',
  status: 'stable',
  props: [
    { name: 'items', type: 'RateCardItem[]', required: true, description: 'Rates: `{ id?, name, description?, unit, rate, included?, overage?, badge?, group? }`. `rate` is a number (formatted as a price) or text. Items without a name or a rate are skipped.' },
    { name: 'currency', type: 'string', default: "'USD'", description: 'ISO 4217 code. An invalid code renders plain numbers.' },
    { name: 'locale', type: 'string', default: "ConfigProvider locale, else 'en-US'", description: 'BCP 47 tag such as `de-DE`.' },
    { name: 'caption', type: 'string', description: 'Accessible name of the table or list. Required unless `aria-label` or `aria-labelledby` is set.' },
    { name: 'variant', type: "'table' | 'list'", default: "'table'", description: '`table` is a semantic table in a scroll region; `list` stacks the rates. Unknown values fall back to `table`. Exposed as `data-variant`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size and row padding. Unknown values fall back to `md`. Exposed as `data-size`.' },
    { name: 'groups', type: '{ group: string; description?: string }[]', description: 'Heading rows and their order. Items join a group through `item.group`; other group names follow in order of first appearance.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'Labelled sample rates, table variant.',
      code: `<RateCard caption="Sample usage rates" :items="${items}" />`,
    },
    {
      title: 'Grouped with overage',
      description: 'Sample rates for a fictional product, with group rows, included amounts and overage notes.',
      code: `<RateCard
  caption="Kestrel Freight sample rates"
  :groups="[{ group: 'Compute', description: 'Sample rates' }, { group: 'Data' }]"
  :items="[
    { name: 'Sample workers', description: 'Sample unit', unit: 'per 1,000 requests', rate: 0.5, included: 'First 100,000 free', overage: 'Billed at the rate shown', group: 'Compute', badge: 'Sample' },
    { name: 'Sample queues', unit: 'per 1,000 messages', rate: 0.0004, included: 'First 1,000,000 free', overage: 'Billed at the rate shown', group: 'Compute' },
    { name: 'Sample storage', unit: 'per GB-month', rate: 0.02, included: 'First 5 GB free', overage: 'Billed at the rate shown', group: 'Data' },
    { name: 'Sample support', unit: 'per month', rate: 'Custom', group: 'Data' },
  ]"
/>`,
    },
    {
      title: 'Variant: list',
      description: 'Stacked definition rows that reflow on narrow screens.',
      code: `<RateCard variant="list" caption="Sample usage rates (list)" :items="${items}" />`,
    },
    {
      title: 'Size',
      code: `<div class="flex flex-col gap-6">
  <RateCard size="sm" caption="Sample rates, small" :items="${items}" />
  <RateCard size="lg" caption="Sample rates, large" :items="${items}" />
</div>`,
    },
    {
      title: 'Currency and locale',
      description: 'Sample rates formatted for a German locale.',
      code: `<RateCard currency="EUR" locale="de-DE" caption="Sample rates in euro" :items="[{ name: 'Sample requests', unit: 'per 1.000 Anfragen', rate: 0.4 }, { name: 'Sample storage', unit: 'pro GB-Monat', rate: 0.02 }]" />`,
    },
  ],
  a11y: [
    'The table variant is a real `<table>` with a `<caption>`, column headers (`scope="col"`), row headers (`scope="row"`) and group headers (`scope="rowgroup"`), wrapped in a `role="region"` scroll area that is focusable (`tabindex="0"`) and named, so keyboard users can scroll it with the arrow keys.',
    'At 375px the table scrolls inside its region and the page never scrolls sideways. The list variant has no horizontal scroll at 320px.',
    'The list variant is a `role="group"` of definition lists; each group heading names its list. The included and overage text carries hidden "Included" and "Beyond included" labels for screen readers.',
    'Badges are text, never colour alone. Rates use `Price` with tabular figures.',
    'Use a `caption` that names what the rates are for; when several rate lists share a page the names must differ.',
  ],
  requires: ['Throws a ContractError when none of `caption`, `aria-label` or `aria-labelledby` names the rate list.'],
  llmNotes: [
    'Always pass `caption`; the list needs a name.',
    'Pass numeric rates as numbers in major units (0.0004), not formatted strings; use a string only for text such as "Custom".',
    'Put the unit in `unit` ("per 1,000 requests"), not in the name.',
    'Use `variant="list"` where a wide table would scroll in a narrow column.',
    'Use `group` on items for heading rows; do not render several RateCards to fake groups.',
    'Only invented, labelled sample rates in examples ("Sample requests"); never real prices or real company names.',
  ],
  related: ['Price', 'TieredPricing', 'PricingCard', 'PricingTable', 'ComparisonTable'],
  replaces: ['hand-rolled usage price tables', 'hand-rolled Intl.NumberFormat price markup'],
}
export default doc
