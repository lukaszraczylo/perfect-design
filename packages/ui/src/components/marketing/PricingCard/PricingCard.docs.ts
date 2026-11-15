import type { ComponentDoc, ExampleDoc } from '../../../docs-types'

const features = `:features="['First sample feature', 'Second sample feature', { label: 'Excluded sample feature', included: false }]"`

const variantExample = (variant: string, description: string): ExampleDoc => ({
  title: `Variant: ${variant}`,
  description,
  code: `<PricingCard class="max-w-sm" variant="${variant}" name="Sample plan" price="$XX" period="/month" description="One line on who the plan is for" ${features}>
  <template #cta><Button${variant === 'highlighted' ? '' : ' variant="outline"'}>Choose this plan</Button></template>
</PricingCard>`,
})

const doc: ComponentDoc = {
  name: 'PricingCard',
  group: 'marketing',
  subgroup: 'Pricing',
  summary: 'Single pricing plan: name, monthly/yearly price, feature checklist, badge and CTA slot, in five variants.',
  description:
    'Use one card per plan, usually inside `PricingGrid`. `variant` picks the look: `default`, `highlighted` (recommended plan; same as `highlighted`), `outline` (transparent, 2px border), `minimal` (no frame, for plan lists on plain backgrounds) and `compact` (smaller padding and type, for sidebars or 4+ plans). Features are strings or `{ label, included }`; excluded features get an X icon, strike-through and a screen-reader "Not included" note. Provide prices already formatted ("Free", "Custom" or your own currency format). For yearly billing give `yearlyPrice` (+ optional `yearlyPeriod`, `yearlyNote`) and set `billing="yearly"`; PricingGrid and PricingTable do that from their billing toggle. Plans without `yearlyPrice` (Free, Custom) keep `price` in both modes.',
  status: 'stable',
  props: [
    { name: 'name', type: 'string', description: 'Plan name. Required unless the `name` slot is used.' },
    { name: 'price', type: 'string | number', description: 'Displayed (monthly / default) price text, formatted by you ("$XX" in these samples). Required unless the `price` slot is used: use text such as "Free" or "Custom" when there is no number. `0` is shown.' },
    { name: 'period', type: 'string', description: 'Suffix such as "/month".' },
    { name: 'yearlyPrice', type: 'string | number', description: 'Price shown instead of `price` while `billing` is `yearly`. Plans without it keep `price`.' },
    { name: 'yearlyPeriod', type: 'string', description: 'Suffix for the yearly price (e.g. "/month, billed yearly" or "/year"). Falls back to `period`.' },
    { name: 'yearlyNote', type: 'string', description: 'Small note under the price while the yearly price is shown (e.g. "Billed yearly").' },
    { name: 'billing', type: "'monthly' | 'yearly'", default: "'monthly'", description: 'Which price to display. Unknown values mean `monthly`. Exposed as `data-billing` on the price block.' },
    { name: 'description', type: 'string', description: 'One-line plan summary.' },
    { name: 'features', type: "(string | { label: string; included?: boolean })[]", default: '[]', description: 'Checklist entries. Empty/malformed entries are skipped.' },
    { name: 'highlighted', type: 'boolean', default: 'false', description: 'Emphasise as the recommended plan; works with every variant. Equivalent to `variant="highlighted"`.' },
    { name: 'variant', type: "'default' | 'highlighted' | 'outline' | 'minimal' | 'compact'", default: "'default'", description: 'Visual style. Unknown values fall back to `default`. Exposed as `data-variant`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Padding, gap and price scale of every variant; `md` is the original spacing. Unknown values fall back to `md`. Exposed as `data-size`.' },
    { name: 'shape', type: "'rounded' | 'square'", default: "'rounded'", description: '`square` removes the corner radius. Unknown values fall back to `rounded`. Exposed as `data-shape`.' },
    { name: 'badge', type: 'string', description: 'Small badge above the name.' },
    { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', default: '3', description: 'Heading level of the plan name.' },
    { name: 'excludedLabel', type: 'string', default: "'Not included'", description: 'Screen-reader text for excluded features (localise here).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  slots: [
    { name: 'name', description: 'Replaces the plan name text.' },
    { name: 'price', description: 'Replaces the whole price line (amount + period + note).', props: "{ price: string | number | undefined, period: string | undefined, billing: 'monthly' | 'yearly', yearly: boolean }" },
    { name: 'default', description: 'Extra content between features and the CTA.' },
    { name: 'cta', description: 'Call-to-action button(s), pinned to the bottom of the card.' },
  ],
  examples: [
    {
      title: 'Basic plan',
      code: `<PricingCard class="max-w-sm" name="Sample plan" price="$XX" period="/month" description="One line on who the plan is for" :features="['First sample feature', 'Second sample feature']">
  <template #cta><Button variant="outline">Choose this plan</Button></template>
</PricingCard>`,
    },
    {
      title: 'Highlighted with excluded features',
      code: `<PricingCard class="max-w-sm" highlighted badge="Recommended" name="Sample plan" price="$XX" period="/month" :features="features">
  <template #cta><Button>Choose this plan</Button></template>
</PricingCard>`,
      script: `const features = ['First sample feature', 'Second sample feature', { label: 'Excluded sample feature', included: false }]`,
      state: () => ({ features: ['First sample feature', 'Second sample feature', { label: 'Excluded sample feature', included: false }] }),
    },
    variantExample('default', 'Bordered card surface, no shadow.'),
    variantExample('highlighted', 'Solid primary border plus a 1px ring for the recommended plan (no glow or shadow).'),
    variantExample('outline', 'Transparent with a 2px border. Good on tinted or image backgrounds.'),
    variantExample('minimal', 'No border, background or padding; combine with dividers in a plain list of plans.'),
    variantExample('compact', 'Tighter padding, smaller price and text.'),
    {
      title: 'Sizes and square corners',
      description: '`size` scales padding and price; `shape="square"` removes the radius.',
      code: `<div class="grid gap-4 md:grid-cols-3">
  <PricingCard size="sm" name="Small plan" price="$XX" period="/month" :features="['Sample feature']" />
  <PricingCard size="md" name="Medium plan" price="$XX" period="/month" :features="['Sample feature']" />
  <PricingCard size="lg" shape="square" name="Large square plan" price="$XX" period="/month" :features="['Sample feature']" />
</div>`,
    },
    {
      title: 'Yearly price (billing="yearly")',
      description: 'The same plan in both modes; the price, period and note switch together.',
      code: `<div class="grid max-w-2xl gap-4 sm:grid-cols-2">
  <PricingCard name="Sample plan, monthly" price="$XX" period="/month" yearly-price="$YY" yearly-period="/month, billed yearly" yearly-note="Billed yearly" billing="monthly" />
  <PricingCard name="Sample plan, yearly" price="$XX" period="/month" yearly-price="$YY" yearly-period="/month, billed yearly" yearly-note="Billed yearly" billing="yearly" />
</div>`,
    },
    {
      title: 'Custom price slot',
      description: 'The slot receives the resolved price for the active billing mode.',
      code: `<PricingCard class="max-w-sm" name="Sample plan" price="$XX" yearly-price="$YY" billing="yearly">
  <template #price="{ price, yearly }"><span class="text-3xl font-bold">{{ price }}</span><span v-if="yearly" class="text-xs text-muted-foreground">billed yearly</span></template>
</PricingCard>`,
    },
  ],
  requires: [
    'Throws a ContractError when `name` is empty and the `name` slot is not used.',
    'Throws a ContractError when `price` is empty (undefined, an empty string, NaN) and the `price` slot is not used. `0` and text such as "Free" are valid.',
  ],
  a11y: [
    'Rendered as an `<article>` with a heading (`level`, default 3: set it to follow the section heading, e.g. `:level="2"` under an h1); features are a `<ul>`; excluded items are announced as "Not included" and the check/cross icons are decorative.',
    'Highlighting is not conveyed by colour alone: it uses a solid border (kept in forced-colors mode) and you should add `badge` text for the recommended plan. Text on the card uses card tokens, so contrast holds in light and dark mode.',
    'The card has no interactive parts of its own; Tab reaches the buttons you put in `cta`. Inside PricingGrid the card is wrapped in an `<li>`; do not put `role="listitem"` on it (an article cannot take that role).',
    'Variants only change styling, never the DOM order or semantics. The card stacks to one column at 320px and nothing animates.',
  ],
  related: ['PricingGrid', 'PricingTable', 'Button', 'Badge'],
  llmNotes: [
    'Provide pre-formatted price strings.',
    'One `highlighted` plan per grid.',
    'Put exactly one Button per card in the `cta` slot; use the default variant only on the highlighted plan.',
    'For monthly/yearly pricing set `price` + `yearlyPrice` on each plan and let PricingGrid/PricingTable own the `billing` state; do not set `billing` on cards inside a grid.',
    'Use `outline` on coloured backgrounds, `compact` for 4+ plans or narrow columns, `minimal` only on plain backgrounds.',
    'Free/Custom plans: omit `yearlyPrice` so they stay unchanged.',
  ],
  replaces: ['hand-rolled PricingCard markup in app code'],
}
export default doc
