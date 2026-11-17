import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const tiers = `[
  { upTo: 1000, rate: 0.5 },
  { upTo: 10000, rate: 0.4 },
  { upTo: null, rate: 0.3 },
]`

const doc: ComponentDoc = {
  name: 'TieredPricing',
  group: 'marketing',
  subgroup: 'Pricing',
  summary: 'Graduated or volume price tiers with an optional usage marker and a computed total.',
  description:
    'Use `TieredPricing` to explain how a per-unit rate falls as usage grows. Each tier is `{ upTo, rate, flat? }`; `upTo: null` means "and above" and `upTo` is inclusive. Tiers can come in any order and invalid ones are skipped.\n\n' +
    '`mode="graduated"` (default) prices the units inside each tier at that tier\'s rate. `mode="volume"` prices every unit at the rate of the tier the total reaches. A visible note states which one applies. A `flat` fee is charged once when the tier applies (graduated: when it holds any units; volume: for the tier reached).\n\n' +
    'Pass `usage` to mark the tier(s) it reaches with a "Your usage" marker (icon plus text) and to show the computed total in one polite status region, so a changing usage value is announced. Usage above the last tier continues at the last tier\'s rate; 0 and negative usage cost nothing; a non-finite usage shows nothing. The same arithmetic is exported as `tierTotal(tiers, usage, mode)`.\n\n' +
    '`variant="table"` (default) is a semantic table in a focusable, named scroll region. `variant="steps"` is a ladder that runs side by side from `sm` and stacks below it. Pass a `caption` (or `aria-label` / `aria-labelledby`). Examples use labelled sample rates, not offers.',
  status: 'stable',
  props: [
    { name: 'tiers', type: 'PricingTier[]', required: true, description: '`{ upTo: number | null; rate: number; flat?: number }`. `upTo` is inclusive; `null` means and above. Any order; tiers with a non-finite rate or a bad `upTo` are skipped.' },
    { name: 'mode', type: "'graduated' | 'volume'", default: "'graduated'", description: '`graduated`: each tier prices its own units. `volume`: all units use the rate of the tier reached. Unknown values mean `graduated`. Exposed as `data-mode`.' },
    { name: 'usage', type: 'number', description: 'Units to price. Marks the tier(s) reached and shows the total. Negative counts as 0; NaN and Infinity show nothing.' },
    { name: 'unit', type: 'string', description: 'Plural unit name such as "requests", used in the column header, marker and total.' },
    { name: 'currency', type: 'string', default: "'USD'", description: 'ISO 4217 code. An invalid code renders plain numbers.' },
    { name: 'locale', type: 'string', default: "ConfigProvider locale, else 'en-US'", description: 'BCP 47 tag such as `de-DE`.' },
    { name: 'caption', type: 'string', description: 'Accessible name of the table or list. Required unless `aria-label` or `aria-labelledby` is set.' },
    { name: 'variant', type: "'table' | 'steps'", default: "'table'", description: '`table` is a semantic table; `steps` is a ladder that stacks below `sm`. Unknown values fall back to `table`. Exposed as `data-variant`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size and spacing. Unknown values fall back to `md`. Exposed as `data-size`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'Three sample tiers, graduated.',
      code: `<TieredPricing caption="Sample request tiers" unit="requests" :tiers="${tiers}" />`,
    },
    {
      title: 'Usage and total',
      description: 'Sample rates. With 12,500 units graduated pricing charges 1,000 at 0.50, 9,000 at 0.40 and 2,500 at 0.30. The total is announced when usage changes.',
      script: "const usage = ref('12500')",
      state: () => ({ usage: ref('12500') }),
      code: `<div class="flex flex-col gap-3">
  <Field label="Sample usage (requests)">
    <Input v-model="usage" type="number" min="0" />
  </Field>
  <TieredPricing caption="Sample request tiers with usage" unit="requests" :usage="Number(usage)" :tiers="[
    { upTo: 1000, rate: 0.5 },
    { upTo: 10000, rate: 0.4 },
    { upTo: null, rate: 0.3 },
  ]" />
</div>`,
    },
    {
      title: 'Mode: volume',
      description: 'The same sample tiers priced as volume: all 12,500 units use the top tier rate.',
      code: `<TieredPricing mode="volume" caption="Sample volume tiers" unit="requests" :usage="12500" :tiers="${tiers}" />`,
    },
    {
      title: 'Flat fees',
      description: 'A flat sample fee per tier adds a column.',
      code: `<TieredPricing caption="Sample tiers with flat fees" unit="seats" :usage="30" :tiers="[
  { upTo: 10, rate: 5, flat: 20 },
  { upTo: 50, rate: 4, flat: 20 },
  { upTo: null, rate: 3, flat: 20 },
]" />`,
    },
    {
      title: 'Variant: steps',
      description: 'A ladder that stacks vertically below the sm breakpoint.',
      code: `<TieredPricing variant="steps" caption="Sample request tiers (steps)" unit="requests" :usage="5000" :tiers="${tiers}" />`,
    },
    {
      title: 'Size',
      code: `<div class="flex flex-col gap-6">
  <TieredPricing size="sm" caption="Sample tiers, small" :tiers="${tiers}" />
  <TieredPricing size="lg" caption="Sample tiers, large" :tiers="${tiers}" />
</div>`,
    },
    {
      title: 'Currency and locale',
      code: `<TieredPricing currency="EUR" locale="de-DE" caption="Sample tiers in euro" unit="Anfragen" :usage="2500" :tiers="${tiers}" />`,
    },
  ],
  a11y: [
    'The table variant is a real `<table>` with a `<caption>`, column headers and row headers, inside a `role="region"` scroll area that is focusable (`tabindex="0"`) and named, so it scrolls with the keyboard and never overflows the page at 375px.',
    'The steps variant is an ordered list named by `caption`; below `sm` the steps stack vertically.',
    'The tier(s) a usage reaches carry a "Your usage" marker with a check icon and text, plus `data-active`; the highlight colour is never the only signal.',
    'One polite `role="status"` region holds the computed total, so changing `usage` announces the new total once. There are no other live regions.',
    'The mode note ("Each tier prices only the units that fall inside it.") is visible text above the tiers.',
  ],
  requires: ['Throws a ContractError when none of `caption`, `aria-label` or `aria-labelledby` names the tiers.'],
  llmNotes: [
    'Always pass `caption`; the tiers need a name.',
    'Set `mode` on purpose: `graduated` prices each tier\'s own units, `volume` prices all units at the tier reached.',
    '`upTo` is inclusive and `null` means and above; do not pass a huge number for the last tier.',
    'Use `tierTotal(tiers, usage, mode)` when you need the number outside the component.',
    'Pass `usage` to get the marker and total; do not render your own total next to the component.',
    'Only invented, labelled sample rates in examples; never real prices.',
  ],
  related: ['RateCard', 'Price', 'PricingCard', 'PricingTable', 'UsageEstimator'],
  replaces: ['hand-rolled usage tier tables', 'hand-rolled Intl.NumberFormat price markup'],
}
export default doc
