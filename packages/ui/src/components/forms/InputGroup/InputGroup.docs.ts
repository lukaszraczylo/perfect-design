import { ref } from 'vue'
import { faEnvelope, faMagnifyingGlass } from '../../../lib/icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'InputGroup',
  group: 'forms',
  subgroup: 'Text fields',
  summary: 'Puts a prefix, a suffix or joined buttons around an Input, Textarea or NativeSelect so they share one field surface.',
  description:
    'Use `InputGroup` with `InputGroupAddon` when a field needs fixed text ("https://", ".com", a currency sign), an icon, or an attached button ("Subscribe", "Apply"). ' +
    '`layout="inset"` (default) draws one surface around everything: the addons sit inside the border and the Input inside loses its own border, background and ring, so focus is shown once, on the group. ' +
    '`layout="joined"` keeps every child as its own control and only squares the touching edges, which suits an attached `Button` or `Select`. ' +
    '`variant`, `size`, `shape` and `status` take the same values as every text field. Put the group inside `Field` for the label, hint and error: the Input inside still receives `id`, `aria-describedby` and `aria-invalid` from the Field. ' +
    'Give the inner Input the same `size` as the group, and a Button inside a joined group the matching Button size. Use the Input `prefix` and `suffix` slots instead when a single icon is all you need.',
  status: 'stable',
  parts: [
    {
      name: 'InputGroupAddon',
      description: 'A prefix, suffix or action next to the control. Text is muted; in a `joined` group it gets its own border and fill. A Button inside an inset addon is pulled toward the edge.',
      props: [
        { name: 'as', type: 'string | Component', default: "'div'", description: 'Element to render. Use `span` or `label` when the addon should be associated with the control.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
      ],
    },
  ],
  props: [
    { name: 'layout', type: "'inset' | 'joined'", default: "'inset'", description: '`inset`: one shared surface with the addons inside. `joined`: separate controls attached edge to edge. Unknown values fall back to `inset`.' },
    { name: 'variant', type: "'outline' | 'filled' | 'underline' | 'ghost'", default: "'outline'", description: 'Surface of an inset group (a joined group draws no surface of its own). Unknown values fall back to `outline`.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Minimum height and text size: `xs` 28px, `sm` 32px, `md` 36px, `lg` 44px (44px minimum on touch pointers except `lg`, which is already 44px). Unknown values fall back to `md`.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corners of the group (inset) or of the outer edges of the row (joined). Unknown values fall back to `rounded`.' },
    { name: 'status', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Inset only. Colours the border and adds a status icon; `success` and `warning` add visually hidden text. In a joined group give the Input its own `status`. Unknown values fall back to `default`.' },
    { name: 'statusLabel', type: 'string', description: 'Hidden text of the success and warning icons. Defaults to the English text (translate it).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the group; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'InputGroupAddon parts and one Input, Textarea or NativeSelect, in visual order.' }],
  examples: [
    {
      title: 'Prefix and suffix text',
      script: "const site = ref('')",
      code: `<div class="grid max-w-sm gap-4">
  <Field label="Website">
    <InputGroup>
      <InputGroupAddon>https://</InputGroupAddon>
      <Input v-model="site" placeholder="example" autocomplete="url" />
      <InputGroupAddon>.com</InputGroupAddon>
    </InputGroup>
  </Field>
  <Field label="Amount" hint="Sample amount in dollars.">
    <InputGroup>
      <InputGroupAddon>$</InputGroupAddon>
      <Input type="number" inputmode="decimal" placeholder="0.00" />
      <InputGroupAddon>USD</InputGroupAddon>
    </InputGroup>
  </Field>
</div>`,
      state: () => ({ site: ref('') }),
    },
    {
      title: 'Icon and attached button',
      description: 'An icon inside an inset group, and a joined group where the Button keeps its own surface.',
      code: `<div class="grid max-w-sm gap-4">
  <Field label="Search the docs">
    <InputGroup>
      <InputGroupAddon><Icon :icon="faMagnifyingGlass" size="sm" /></InputGroupAddon>
      <Input placeholder="Search" />
    </InputGroup>
  </Field>
  <Field label="Email" hint="One message a month.">
    <InputGroup layout="joined">
      <Input type="email" placeholder="you@example.test" autocomplete="email" />
      <Button type="submit">Subscribe</Button>
    </InputGroup>
  </Field>
  <Field label="Voucher code">
    <InputGroup>
      <Input placeholder="SAMPLE-CODE" />
      <InputGroupAddon><Button size="xs" variant="ghost" type="button">Apply</Button></InputGroupAddon>
    </InputGroup>
  </Field>
  <Field label="Reply-to address">
    <InputGroup layout="joined">
      <InputGroupAddon><Icon :icon="faEnvelope" size="sm" /></InputGroupAddon>
      <Input type="email" autocomplete="email" />
    </InputGroup>
  </Field>
</div>`,
      state: () => ({ faMagnifyingGlass, faEnvelope }),
    },
    {
      title: 'Variants, shapes and sizes',
      code: `<div class="grid max-w-sm gap-3">
  <InputGroup variant="filled"><InputGroupAddon>@</InputGroupAddon><Input aria-label="Filled" /></InputGroup>
  <InputGroup variant="underline"><InputGroupAddon>@</InputGroupAddon><Input aria-label="Underline" /></InputGroup>
  <InputGroup variant="ghost"><InputGroupAddon>@</InputGroupAddon><Input aria-label="Ghost" /></InputGroup>
  <InputGroup shape="pill"><InputGroupAddon>@</InputGroupAddon><Input aria-label="Pill" /></InputGroup>
  <InputGroup shape="square"><InputGroupAddon>@</InputGroupAddon><Input aria-label="Square" /></InputGroup>
  <InputGroup size="xs"><InputGroupAddon>@</InputGroupAddon><Input size="xs" aria-label="Extra small" /></InputGroup>
  <InputGroup size="sm"><InputGroupAddon>@</InputGroupAddon><Input size="sm" aria-label="Small" /></InputGroup>
  <InputGroup size="lg"><InputGroupAddon>@</InputGroupAddon><Input size="lg" aria-label="Large" /></InputGroup>
</div>`,
    },
    {
      title: 'Status',
      description: 'Colour plus an icon; success and warning also add hidden text, error sets `aria-invalid` through the Input inside.',
      code: `<div class="grid max-w-sm gap-3">
  <InputGroup status="success"><InputGroupAddon>https://</InputGroupAddon><Input aria-label="Success" model-value="example" /></InputGroup>
  <InputGroup status="warning"><InputGroupAddon>https://</InputGroupAddon><Input aria-label="Warning" model-value="example" /></InputGroup>
  <InputGroup status="error"><InputGroupAddon>https://</InputGroupAddon><Input aria-label="Error" invalid model-value="example" /></InputGroup>
</div>`,
    },
  ],
  a11y: [
    'The group is a plain container: it adds no role and no name. The control inside keeps its own label (use `Field`, `aria-label` or `aria-labelledby`), and addon text is read in document order with it.',
    'An addon that holds only an icon must keep the icon decorative (`aria-hidden`, the default of `Icon`); a Button inside an addon needs its own name like any Button.',
    'Focus shows once, as a border and ring on the whole group (`:has(:focus-visible)`), so keyboard users see which field is active; an invalid control inside turns the group border destructive. The group border stays visible in forced-colors mode, and an invalid group gets a dashed one.',
    '`status` is never colour only: an icon sits at the inline end, and `success` and `warning` add visually hidden text.',
    'Responsive: the group is `w-full min-w-0`, text is 16px below `md` and the minimum height is 44px on touch pointers.',
  ],
  related: ['Input', 'Field', 'Button', 'NativeSelect', 'SearchInput'],
  llmNotes: [
    'Wrap the whole group in `Field` with a label; never rely on the addon text as the label.',
    'Use `layout="joined"` for an attached Button, the default inset layout for text and icon addons.',
    'Give the inner Input the same `size` as the group; do not restyle the Input border, the group draws it.',
    'Put the addons and the control in visual order; `InputGroupAddon` before the Input is a prefix, after it a suffix.',
  ],
  replaces: ['Bootstrap input-group', 'shadcn/ui InputGroup'],
}
export default doc
