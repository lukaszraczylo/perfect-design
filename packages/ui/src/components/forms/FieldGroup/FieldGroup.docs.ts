import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'FieldGroup',
  group: 'forms',
  subgroup: 'Layout',
  summary: 'Layout wrapper that stacks or grids several Fields with a consistent gap.',
  description:
    'Use `FieldGroup` to space a set of `Field`s evenly instead of hand-writing gap utilities. `orientation="horizontal"` makes a wrapping row (each child is at least 12rem wide, so a row reflows to one column at 320px), `columns` 2 or 3 makes a responsive grid that collapses to one column on small screens. Give it a `label` to expose it as a named `role="group"`. For a visually bordered group with a legend, or to disable a whole section, use `Fieldset`.',
  status: 'stable',
  props: [
    { name: 'orientation', type: "'vertical' | 'horizontal'", default: "'vertical'", description: 'Stack vertically or lay out in a wrapping row. Ignored when `columns` > 1.' },
    { name: 'columns', type: '1 | 2 | 3', default: '1', description: 'Responsive grid column count (one column below `sm`). Invalid values fall back to a single column.' },
    { name: 'gap', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Space between fields: 12px, 20px or 32px when stacked (smaller in a wrapping row). Unknown values fall back to `md`.' },
    { name: 'label', type: 'string', description: 'Accessible name. When set, the wrapper gets `role="group"` and `aria-label`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes (e.g. override the gap).' },
  ],
  slots: [{ name: 'default', description: 'The Fields (or any form content) to lay out.' }],
  examples: [
    {
      title: 'Stacked fields',
      code: `<FieldGroup>
  <Field label="First name"><Input autocomplete="given-name" /></Field>
  <Field label="Last name"><Input autocomplete="family-name" /></Field>
</FieldGroup>`,
    },
    {
      title: 'Two-column grid with an accessible name',
      code: `<FieldGroup :columns="2" label="Shipping address">
  <Field label="Street"><Input autocomplete="address-line1" /></Field>
  <Field label="City"><Input autocomplete="address-level2" /></Field>
  <Field label="Postcode" hint="No spaces"><Input autocomplete="postal-code" /></Field>
  <Field label="Country"><Input autocomplete="country-name" /></Field>
</FieldGroup>`,
    },
    {
      title: 'Gap',
      code: `<div class="grid gap-6">
  <FieldGroup gap="sm"><Field label="Tight A"><Input /></Field><Field label="Tight B"><Input /></Field></FieldGroup>
  <FieldGroup gap="lg" :columns="2"><Field label="Loose A"><Input /></Field><Field label="Loose B"><Input /></Field></FieldGroup>
</div>`,
    },
  ],
  a11y: [
    'With `label` the wrapper is a `role="group"` named by `aria-label`; without it there is no role and no extra tab stop.',
    'Layout only: DOM order is the reading and focus order at every width.',
    'Responsive: one column below `sm`; `horizontal` wraps at 12rem per child, so nothing overflows at 320px.',
    'A group of related answers (radios, checkboxes) needs a visible name: use `Fieldset` with a legend.',
  ],
  related: ['Field', 'Fieldset', 'FormActions'],
  llmNotes: [
    'Wrap sibling Fields in FieldGroup instead of adding gap/space-y utilities.',
    'Use `columns` (1-3), not custom grid classes; it is responsive already.',
    'Use Fieldset, not FieldGroup, when the group needs a visible legend or must be disabled as a whole.',
  ],
  replaces: ['ad-hoc `space-y-4` / `grid gap-4` form containers'],
}
export default doc
