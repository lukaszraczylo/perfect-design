import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Label',
  group: 'forms',
  subgroup: 'Field wrappers',
  summary: 'Accessible form label with optional required indicator and disabled style.',
  description:
    'Renders a `<label>` (reka-ui) pointing at a control via `for`. Prefer `Field`, which renders and wires the Label for you; use `Label` directly for custom layouts, checkbox/switch rows, or standalone captions. The asterisk is decorative (`aria-hidden`); also set `required` on the control so assistive tech announces it.',
  status: 'stable',
  props: [
    { name: 'for', type: 'string', description: 'Id of the labelled control.' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Appends a destructive-coloured `*` (aria-hidden).' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the label and sets `data-disabled`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size: 12px, 14px or 16px. Unknown values fall back to `md`.' },
    { name: 'variant', type: "'default' | 'muted'", default: "'default'", description: '`muted` renders the label in the muted text colour for secondary captions. Unknown values fall back to `default`.' },
    { name: 'as', type: 'string | Component', default: "'label'", description: 'Element to render.' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single slot child instead of a wrapper (reka-ui).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge.' },
  ],
  slots: [{ name: 'default', description: 'Label text.' }],
  examples: [
    {
      title: 'Basic',
      code: `<div class="grid max-w-sm gap-1.5">
  <Label for="demo-label-email">Email</Label>
  <Input id="demo-label-email" type="email" />
</div>`,
    },
    {
      title: 'Required and disabled',
      code: `<div class="grid max-w-sm gap-3">
  <div class="grid gap-1.5"><Label for="demo-label-req" required>Full name</Label><Input id="demo-label-req" required /></div>
  <div class="grid gap-1.5"><Label for="demo-label-dis" disabled>Locked</Label><Input id="demo-label-dis" disabled /></div>
</div>`,
    },
    {
      title: 'Sizes and muted',
      code: `<div class="grid max-w-sm gap-3">
  <div class="grid gap-1.5"><Label for="demo-label-sm" size="sm">Small label</Label><Input id="demo-label-sm" size="sm" /></div>
  <div class="grid gap-1.5"><Label for="demo-label-md">Medium label</Label><Input id="demo-label-md" /></div>
  <div class="grid gap-1.5"><Label for="demo-label-lg" size="lg">Large label</Label><Input id="demo-label-lg" size="lg" /></div>
  <div class="grid gap-1.5"><Label for="demo-label-muted" variant="muted">Muted label</Label><Input id="demo-label-muted" /></div>
</div>`,
    },
  ],
  a11y: [
    'Renders a native `<label>`: clicking it focuses or activates the control through `for`, and the text becomes the control name.',
    'The required asterisk is `aria-hidden`; the native `required` attribute on the control is what assistive tech announces.',
    '`for` only labels labelable elements (input, select, textarea, button). For a radio group or other `div` widget use `aria-labelledby` pointing at the label `id` (Field does this).',
    '`muted` uses the muted-foreground colour, which meets 4.5:1 on the page and card backgrounds; every size stays real text that zooms with the page.',
    'Text wraps (`leading-snug`) so a long label stays readable at 320px and at 200% zoom.',
  ],
  related: ['Field', 'Fieldset'],
  requires: [
    'Throws a ContractError when the label has no `for` and no control nested inside it.',
    'Throws a ContractError when `for` does not match the id of any element in the document (the label rendered by `Field` is exempt, since it names group controls through `aria-labelledby`).',
  ],
  llmNotes: ['Prefer `Field` over bare `Label`.', 'Always set `for` to the control id.', 'Do not nest interactive controls inside Label except via `as-child` patterns.'],
  replaces: ['hand-rolled Label markup in app code'],
}
export default doc
