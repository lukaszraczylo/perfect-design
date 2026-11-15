import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Fieldset',
  group: 'forms',
  subgroup: 'Layout',
  summary: 'Native fieldset with legend and description that groups related controls and can disable them all at once.',
  description:
    'Use `Fieldset` for a set of related controls that needs a visible title (shipping address, notification preferences, a radio set). It renders a real `<fieldset>` + `<legend>`, so screen readers announce the group name, and `disabled` natively disables every descendant control. `variant="card"` draws a bordered panel, `filled` a panel on the secondary surface, `divided` a single rule above the group, and `plain` has no chrome. Use `FieldGroup` when you only need spacing.',
  status: 'stable',
  props: [
    { name: 'legend', type: 'string', description: 'Legend text. Use the `legend` slot for rich content.' },
    { name: 'description', type: 'string', description: 'Helper text under the legend; linked to the fieldset through `aria-describedby`.' },
    { name: 'variant', type: "'plain' | 'card' | 'filled' | 'divided'", default: "'plain'", description: '`card` adds border, radius, padding and card background; `filled` uses the secondary surface without a border; `divided` adds a top rule and padding only. Unknown values fall back to `plain`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Legend and description text size and the gap between fields (12px, 20px, 24px). Unknown values fall back to `md`.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Native `disabled`: disables every control inside and dims the section.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [
    { name: 'default', description: 'The controls, stacked with a consistent gap.' },
    { name: 'legend', description: 'Rich legend content (replaces the `legend` prop).' },
    { name: 'description', description: 'Rich description content (replaces the `description` prop).' },
  ],
  examples: [
    {
      title: 'Plain fieldset',
      code: `<Fieldset legend="Contact" description="How we reach you about your order.">
  <Field label="Email"><Input type="email" autocomplete="email" /></Field>
  <Field label="Phone"><Input type="tel" autocomplete="tel" /></Field>
</Fieldset>`,
    },
    {
      title: 'Card variant, disabled section',
      script: `const locked = ref(true)`,
      code: `<div class="space-y-3">
  <Button size="sm" variant="outline" @click="locked = !locked">{{ locked ? 'Enable section' : 'Disable section' }}</Button>
  <Fieldset variant="card" legend="Billing" description="Locked while the invoice is processing." :disabled="locked">
    <Field label="Company name"><Input autocomplete="organization" /></Field>
    <Field label="Tax id"><Input /></Field>
  </Fieldset>
</div>`,
      state: () => ({ locked: ref(true) }),
    },
    {
      title: 'Variants and sizes',
      code: `<div class="grid max-w-md gap-6">
  <Fieldset variant="filled" legend="Filled" description="Secondary surface."><Field label="One"><Input /></Field></Fieldset>
  <Fieldset variant="divided" legend="Divided" size="lg"><Field label="Two"><Input /></Field></Fieldset>
  <Fieldset variant="card" legend="Compact card" size="sm"><Field label="Three" size="sm"><Input size="sm" /></Field></Fieldset>
</div>`,
    },
  ],
  a11y: [
    'Native `<fieldset>` and `<legend>` (legend first): the legend is announced as the group name when focus enters the group. A fieldset without a legend has no name, so it throws a ContractError (set `aria-label` when a visible legend is not wanted).',
    '`description` is referenced by `aria-describedby` on the fieldset.',
    '`filled` pairs `bg-secondary` with `text-secondary-foreground` for the legend, description and content, so contrast follows the tested pair; the legend and description stay real text at every size.',
    'Native `disabled` removes all descendant controls from the tab order and from form submission.',
    'Responsive: `min-w-0` lets the fieldset shrink inside flex and grid parents, so wide content never forces horizontal scrolling at 320px.',
  ],
  related: ['FieldGroup', 'Field', 'RadioGroup'],
  requires: [
    'Throws a ContractError when the Fieldset has no `legend` (prop or slot) and no `aria-label` / `aria-labelledby`.',
  ],
  llmNotes: [
    'Use Fieldset (not a div + heading) for groups of related inputs that need a title; always set `legend` (a missing one throws a ContractError).',
    'Use `disabled` on the Fieldset to disable a whole section; do not disable each control.',
    'Put Fields directly inside; the default slot already applies the gap.',
  ],
  replaces: ['hand-rolled `<fieldset class="border rounded">` blocks'],
}
export default doc
