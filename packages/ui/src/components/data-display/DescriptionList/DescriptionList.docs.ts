import type { ComponentDoc } from '../../../docs-types'

const classProp = { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' }

const doc: ComponentDoc = {
  name: 'DescriptionList',
  group: 'data-display',
  subgroup: 'Lists',
  summary: 'Semantic term/definition pairs (`dl`) for showing record details, with optional copy buttons.',
  description:
    'Use `DescriptionList` with `DescriptionItem` children to show key/value details of one record (a user, a deployment, an API key). Pick a `variant`: `stacked` (default) for narrow detail panels, `inline` for compact key-on-left/value-on-right rows (settings summaries, receipts), `grid` for wide overview sections that show many short facts in 1-4 responsive columns, `striped` for long lists of facts that need row tracking (framed, alternate rows tinted). `orientation` (stacked/horizontal) applies inside `stacked`, `grid` and `striped`: `stacked` (default) puts the term above the value and `horizontal` aligns them in two columns from the `sm` breakpoint. Set `copyable` on an item to show a copy button for IDs, URLs and tokens. `size` (`sm`, `md`, `lg`) sets the type scale and `density` (`compact`, `default`, `comfortable`) the space between items (row gaps, and the padding of divided or striped items). For a single standalone pair use `DetailField` (it takes `size` too). For tabular comparisons of many records use `Table`.',
  status: 'stable',
  props: [
    { name: 'variant', type: "'stacked' | 'inline' | 'grid' | 'striped'", default: "'stacked'", description: 'Layout: `stacked` default; `inline` term left / value right on one row; `grid` responsive columns; `striped` framed list with alternate row tint. Unknown values fall back to `stacked`.' },
    { name: 'columns', type: '1 | 2 | 3 | 4', default: '3', description: 'Column count for `variant="grid"` (always 1 on mobile, 2 from `sm`, N from `lg`). Ignored by other variants.' },
    { name: 'orientation', type: "'horizontal' | 'stacked'", default: "'stacked'", description: 'Term above value (stacked) or side by side (horizontal, from `sm`).' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Type scale of terms and values: 12px, 14px or 16px. Unknown values fall back to `md`.' },
    { name: 'density', type: "'compact' | 'default' | 'comfortable'", default: "'default'", description: 'Space between items: row gaps (6px, 12px, 20px; grid row gaps 8px, 16px, 24px) and the vertical padding of divided and striped items. Unknown values fall back to `default`.' },
    { name: 'divided', type: 'boolean', default: 'false', description: 'Draw a divider between items instead of a gap. Ignored by `grid`.' },
    classProp,
  ],
  slots: [{ name: 'default', description: '`DescriptionItem` children.' }],
  parts: [
    {
      name: 'DescriptionItem',
      description: 'One term + definition pair rendered as `div > dt + dd` (valid inside `dl`).',
      props: [
        { name: 'term', type: 'string', description: 'Term text. Required: set `term` or use the `term` slot for rich content.' },
        { name: 'copyable', type: 'boolean', default: 'false', description: 'Show a copy button next to the definition.' },
        { name: 'copyText', type: 'string', description: 'Text to copy; defaults to the rendered text of the definition.' },
        classProp,
      ],
    },
    {
      name: 'DetailField',
      description: 'A single standalone label/value pair (its own `dl`).',
      props: [
        { name: 'label', type: 'string', required: true, description: 'Label text.' },
        { name: 'value', type: 'string | number | null', description: 'Value; the default slot wins when given.' },
        { name: 'copyable', type: 'boolean', default: 'false', description: 'Show a copy button (hidden when the value is empty).' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Type scale of the label and value. Unknown values fall back to `md`.' },
        { name: 'emptyText', type: 'string', default: "'–'", description: 'Placeholder for empty values.' },
        classProp,
      ],
    },
  ],
  emits: [{ name: 'copy', payload: '[text: string]', description: 'Emitted by DescriptionItem/DetailField after the text was copied.' }],
  examples: [
    {
      title: 'Stacked details',
      code: `<DescriptionList class="max-w-sm">
  <DescriptionItem term="Region">eu-west-1</DescriptionItem>
  <DescriptionItem term="Status"><Badge variant="success">Healthy</Badge></DescriptionItem>
  <DescriptionItem term="Owner">Platform team</DescriptionItem>
</DescriptionList>`,
    },
    {
      title: 'Inline rows',
      description: 'Term on the left, value on the right: compact summaries such as plan details or receipts.',
      code: `<DescriptionList variant="inline" divided class="max-w-sm">
  <DescriptionItem term="Plan">Sample plan</DescriptionItem>
  <DescriptionItem term="Seats">12</DescriptionItem>
  <DescriptionItem term="Renewal">Sample date</DescriptionItem>
</DescriptionList>`,
    },
    {
      title: 'Grid',
      description: 'Responsive columns (`columns` 1-4, default 3) for overview sections with many short facts.',
      code: `<DescriptionList variant="grid" :columns="3">
  <DescriptionItem term="Region">eu-west-1</DescriptionItem>
  <DescriptionItem term="Runtime">Node 22</DescriptionItem>
  <DescriptionItem term="Memory">512 MB</DescriptionItem>
  <DescriptionItem term="Timeout">30 s</DescriptionItem>
  <DescriptionItem term="Owner">Platform team</DescriptionItem>
  <DescriptionItem term="Last deploy">2 hours ago</DescriptionItem>
</DescriptionList>`,
    },
    {
      title: 'Grid with two columns',
      code: `<DescriptionList variant="grid" :columns="2" class="max-w-xl">
  <DescriptionItem term="First name">Sample</DescriptionItem>
  <DescriptionItem term="Last name">Person</DescriptionItem>
  <DescriptionItem term="Email" copyable>person@example.com</DescriptionItem>
  <DescriptionItem term="Role">Admin</DescriptionItem>
</DescriptionList>`,
    },
    {
      title: 'Striped',
      description: 'Framed list with alternate row tint; combine with `orientation="horizontal"` for a two-column label/value table feel.',
      code: `<DescriptionList variant="striped" orientation="horizontal" class="max-w-xl">
  <DescriptionItem term="Hostname">api-1.example.com</DescriptionItem>
  <DescriptionItem term="IP address" copyable>10.0.4.17</DescriptionItem>
  <DescriptionItem term="Kernel">6.8.0</DescriptionItem>
  <DescriptionItem term="Uptime">41 days</DescriptionItem>
</DescriptionList>`,
    },
    {
      title: 'Horizontal, divided, copyable',
      code: `<Card class="max-w-xl">
  <CardContent>
    <DescriptionList orientation="horizontal" divided>
      <DescriptionItem term="API key ID" copyable>key-sample-1</DescriptionItem>
      <DescriptionItem term="Endpoint" copyable>https://api.example.com/v1</DescriptionItem>
      <DescriptionItem term="Created">Sample date</DescriptionItem>
    </DescriptionList>
  </CardContent>
</Card>`,
    },
    {
      title: 'Size gallery: sm, md, lg',
      description: 'Type scale of terms and values, here with `divided` rows and a standalone DetailField.',
      code: `<div class="grid gap-6 sm:grid-cols-3">
  <div class="space-y-3"><DescriptionList size="sm" divided><DescriptionItem term="Region">eu-west-1</DescriptionItem><DescriptionItem term="Owner">Platform team</DescriptionItem></DescriptionList><DetailField label="Plan" value="Small" size="sm" /></div>
  <div class="space-y-3"><DescriptionList size="md" divided><DescriptionItem term="Region">eu-west-1</DescriptionItem><DescriptionItem term="Owner">Platform team</DescriptionItem></DescriptionList><DetailField label="Plan" value="Medium" size="md" /></div>
  <div class="space-y-3"><DescriptionList size="lg" divided><DescriptionItem term="Region">eu-west-1</DescriptionItem><DescriptionItem term="Owner">Platform team</DescriptionItem></DescriptionList><DetailField label="Plan" value="Large" size="lg" /></div>
</div>`,
    },
    {
      title: 'Density gallery: compact, default, comfortable',
      description: 'Space between items in `stacked`, `divided` and `striped` lists.',
      code: `<div class="grid gap-6 sm:grid-cols-3">
  <div class="space-y-4">
    <DescriptionList density="compact"><DescriptionItem term="Region">eu-west-1</DescriptionItem><DescriptionItem term="Owner">Platform team</DescriptionItem></DescriptionList>
    <DescriptionList density="compact" divided><DescriptionItem term="Region">eu-west-1</DescriptionItem><DescriptionItem term="Owner">Platform team</DescriptionItem></DescriptionList>
    <DescriptionList density="compact" variant="striped"><DescriptionItem term="Region">eu-west-1</DescriptionItem><DescriptionItem term="Owner">Platform team</DescriptionItem></DescriptionList>
  </div>
  <div class="space-y-4">
    <DescriptionList density="default"><DescriptionItem term="Region">eu-west-1</DescriptionItem><DescriptionItem term="Owner">Platform team</DescriptionItem></DescriptionList>
    <DescriptionList density="default" divided><DescriptionItem term="Region">eu-west-1</DescriptionItem><DescriptionItem term="Owner">Platform team</DescriptionItem></DescriptionList>
    <DescriptionList density="default" variant="striped"><DescriptionItem term="Region">eu-west-1</DescriptionItem><DescriptionItem term="Owner">Platform team</DescriptionItem></DescriptionList>
  </div>
  <div class="space-y-4">
    <DescriptionList density="comfortable"><DescriptionItem term="Region">eu-west-1</DescriptionItem><DescriptionItem term="Owner">Platform team</DescriptionItem></DescriptionList>
    <DescriptionList density="comfortable" divided><DescriptionItem term="Region">eu-west-1</DescriptionItem><DescriptionItem term="Owner">Platform team</DescriptionItem></DescriptionList>
    <DescriptionList density="comfortable" variant="striped"><DescriptionItem term="Region">eu-west-1</DescriptionItem><DescriptionItem term="Owner">Platform team</DescriptionItem></DescriptionList>
  </div>
</div>`,
    },
    {
      title: 'Standalone DetailField',
      code: `<div class="flex gap-8">
  <DetailField label="Plan" value="Sample plan" />
  <DetailField label="Seats" :value="12" />
  <DetailField label="Record ID" value="sample-id-1" copyable />
  <DetailField label="Notes" :value="null" />
</div>`,
    },
  ],
  a11y: [
    'Renders native `dl`/`dt`/`dd` so screen readers announce term/definition relationships.',
    'The copy button is named after what it copies ("Copy Region"; "Copy value" without a term) and keeps that name. The result ("Copied" or "Copy failed") is announced by a sibling `role="status"` element, not inside the button. It is a 24px target.',
    '`size` and `density` change type scale and spacing only; the `dl`, `dt`, `dd` structure and copy buttons are the same in every combination. The copy button stays a 24px target at every size.',
    'Inline values align to the end edge (logical), so RTL mirrors the layout. Items stack on narrow screens; `horizontal` orientation only applies from the `sm` breakpoint.',
  ],
  related: ['Card', 'Table', 'List'],
  requires: [
    'Throws a ContractError when a `DescriptionItem` has no `term` text (prop or `term` slot).',
    'Throws a ContractError when a `DescriptionItem` is rendered outside a `DescriptionList`.',
    'Throws a ContractError when a `DetailField` has a blank `label`.',
  ],
  llmNotes: [
    'Put only `DescriptionItem` elements directly inside `DescriptionList`.',
    'Use `copyable` for IDs, URLs, tokens; copyText for masked values.',
    'Use horizontal orientation inside wide cards, stacked in narrow columns.',
    'Use DetailField, not DescriptionList, for a lone label/value pair.',
    'Choose `variant`: stacked for narrow panels, inline for compact key/value rows, grid for wide overviews with many short facts, striped for long fact lists.',
    '`columns` only applies to `variant="grid"`; `divided` is ignored by grid.',
    'Use `size` for text and `density` for spacing on DescriptionList (not per item); `density` has an effect on gaps, `divided` and `striped` rows.',
    'Items adapt to the list `variant` automatically; do not style DescriptionItem per variant yourself.',
  ],
  replaces: ['hand-rolled DescriptionList markup in app code'],
}
export default doc
