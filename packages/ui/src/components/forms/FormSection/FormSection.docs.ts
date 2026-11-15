import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'FormSection',
  group: 'forms',
  subgroup: 'Layout',
  summary: 'Titled form section landmark with description, optional aside actions, divider and a responsive 1-4 column fields grid.',
  description:
    'Use `FormSection` to break a long form into named chunks ("Profile", "Billing address") with a heading, help text and a grid of fields. It renders a `<section>` labelled by its heading (a named region landmark) and lays its default slot out as a responsive grid (`columns` 1-4: one column on mobile, two from `sm`, three/four from `lg`). The `split` variant puts the header beside the fields on large screens (settings pages). Use `Fieldset` when you need a native `<fieldset>/<legend>` grouping a set of related controls (radio/checkbox groups) and `FieldGroup` for vertical spacing only; `FormSection` can wrap either. Make a field span the whole row with `class="col-span-full"`.',
  status: 'stable',
  props: [
    { name: 'title', type: 'string', description: 'Heading text; also names the landmark via `aria-labelledby`. Use the `title` slot for rich content.' },
    { name: 'description', type: 'string', description: 'Help text under the title; referenced by `aria-describedby`. Use the `description` slot for rich content.' },
    { name: 'level', type: '1 | 2 | 3 | 4 | 5 | 6', default: '3', description: 'Heading level of the title (`h1`-`h6`). Invalid values fall back to 3. Pick the level that fits the page outline.' },
    { name: 'columns', type: '1 | 2 | 3 | 4', default: '1', description: 'Field grid columns: 1 on mobile; 2 from `sm`; the full count (3 or 4) from `lg`. Invalid values fall back to 1.' },
    { name: 'variant', type: "'stacked' | 'split' | 'card'", default: "'stacked'", description: '`stacked`: header above the fields. `split`: header on the left (1/3) and fields on the right (2/3) from `lg`. `card`: stacked inside a bordered, padded panel. Unknown values fall back to `stacked`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Title size (14px, 16px, 18px) and the gaps between header, rows and columns. Unknown values fall back to `md`.' },
    { name: 'divider', type: 'boolean', default: 'false', description: 'Adds a bottom border and padding to separate consecutive sections.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the `<section data-slot="form-section">` root; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', description: 'The fields. Direct children become grid items.' },
    { name: 'title', description: 'Rich heading content; replaces the `title` prop.' },
    { name: 'description', description: 'Rich description content; replaces the `description` prop.' },
    { name: 'aside', description: 'Actions aligned to the end of the header (e.g. an Edit or Reset button).' },
  ],
  examples: [
    {
      title: 'Basic',
      code: `<FormSection title="Profile" description="Shown on your public page." class="max-w-2xl">
  <Field label="First name"><Input autocomplete="given-name" /></Field>
  <Field label="Last name"><Input autocomplete="family-name" /></Field>
</FormSection>`,
    },
    {
      title: 'Three columns with divider and aside action',
      code: `<div class="max-w-4xl">
  <FormSection title="Billing address" description="Used on invoices." :columns="3" divider>
    <template #aside><Button size="sm" variant="outline">Reset</Button></template>
    <Field label="Street" class="col-span-full"><Input /></Field>
    <Field label="City"><Input /></Field>
    <Field label="Region"><Input /></Field>
    <Field label="Postal code"><Input autocomplete="postal-code" /></Field>
  </FormSection>
  <FormSection title="Contact" :level="3" class="pt-8">
    <Field label="Email"><Input type="email" /></Field>
  </FormSection>
</div>`,
    },
    {
      title: 'Columns: 2 and 4',
      code: `<div class="grid max-w-4xl gap-8">
  <FormSection title="Two columns" :columns="2">
    <Field label="A"><Input /></Field>
    <Field label="B"><Input /></Field>
  </FormSection>
  <FormSection title="Four columns" :columns="4">
    <Field label="A"><Input /></Field>
    <Field label="B"><Input /></Field>
    <Field label="C"><Input /></Field>
    <Field label="D"><Input /></Field>
  </FormSection>
</div>`,
    },
    {
      title: 'Variant: split with heading level',
      code: `<div class="max-w-5xl">
  <FormSection variant="split" title="Notifications" description="Choose how we reach you." :level="2" :columns="2" divider>
    <Field label="Email"><Input type="email" /></Field>
    <Field label="Phone"><Input type="tel" /></Field>
  </FormSection>
</div>`,
    },
    {
      title: 'Card variant and sizes',
      code: `<div class="grid max-w-3xl gap-6">
  <FormSection variant="card" title="Account" description="Used to sign in." :columns="2">
    <Field label="Username"><Input autocomplete="username" /></Field>
    <Field label="Email"><Input type="email" autocomplete="email" /></Field>
  </FormSection>
  <FormSection size="sm" title="Compact section" :columns="2">
    <Field label="A" size="sm"><Input size="sm" /></Field>
    <Field label="B" size="sm"><Input size="sm" /></Field>
  </FormSection>
  <FormSection size="lg" title="Roomy section">
    <Field label="C"><Input /></Field>
  </FormSection>
</div>`,
    },
  ],
  a11y: [
    'Renders a `<section>` named by its title via `aria-labelledby`, which exposes it as a region landmark; without a title it has no name, so pass `aria-label` (attrs fall through to the section).',
    'The description is linked with `aria-describedby`.',
    'The heading level is configurable (`level`, h1-h6): pick one that continues the page outline without skipping levels.',
    'Layout changes are purely visual; DOM order (header, then fields) is the reading order at every breakpoint.',
    'Responsive: the header row wraps when the `aside` actions do not fit, and the field grid is one column below `sm`, so nothing overflows at 320px.',
    'Use `Fieldset` inside a section for radio or checkbox sets that need a legend.',
  ],
  related: ['Fieldset', 'FieldGroup', 'Field', 'FormActions'],
  requires: [
    'Throws a ContractError when the FormSection has no `title` (prop or slot) and no `aria-label` / `aria-labelledby`.',
  ],
  llmNotes: [
    'Wrap related Fields in FormSection with a title; do not nest FormSections.',
    'Use `columns` (1-4) for the field grid; it collapses on small screens automatically. Use class="col-span-full" for wide fields.',
    'Set `level` to fit the page heading outline (default h3).',
    'Use `variant="split"` for settings pages; `divider` to separate stacked sections.',
    'Put section-level actions in the `aside` slot, not inside the fields grid.',
  ],
  replaces: ['hand-rolled section blocks made of a heading and a grid of fields'],
}

export default doc
