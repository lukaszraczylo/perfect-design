import { ref } from 'vue'
import { faAlignCenter, faAlignLeft, faAlignRight, faBold, faItalic, faUnderline } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'ToggleGroup',
  group: 'primitives',
  subgroup: 'Toggles',
  summary: 'Joined set of toggle buttons (default, outline or segmented look) with single or multiple selection and roving keyboard focus.',
  description:
    'Use `ToggleGroup` with `ToggleGroupItem` children for segmented choices (alignment, view mode, text formatting). `type="single"` keeps one value (string, pressing the active item clears it); `type="multiple"` keeps an array. `variant` and `size` are provided to every item (items can override). Unknown `variant`/`size` values fall back to `default`/`md`. For a required single choice with radio semantics prefer `RadioGroup`/`Tabs`.\n\n' +
    '**Variants**: `default` (flat joined buttons; toolbars and formatting), `outline` (bordered joined buttons; filters, alignment) and `segmented` (separate rounded items sitting on a muted track, the active one raised; view switchers like List/Grid or Day/Week/Month, best with `fullWidth`). **Sizes**: `xs` (28px) to `xl` (44px). `fullWidth` stretches the group and shares the width between items.\n\n' +
    '**Shape** (`shape`): `rounded` (default), `pill` (fully rounded ends or segments) and `square`. **Tone** (`tone`): the colour of the pressed item. `neutral` (default) keeps the accent fill; `primary`, `success`, `danger` and `info` use a solid status fill with its foreground colour. **Gap** (`gap`): `none` (default) joins the items; `sm` (4px) and `md` (8px) turn them into separate buttons. All three can be combined with every `variant`, `size` and `orientation`; items may override `shape` and `tone`. Unknown values fall back to the defaults.',
  status: 'stable',
  parts: [
    {
      name: 'ToggleGroupItem',
      description: 'One toggle inside the group. Inherits variant/size/orientation from the group. Renders a button with aria-pressed and data-state="on|off".',
      props: [
        { name: 'value', type: 'string', required: true, description: 'Value reported to the group v-model when pressed.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables this item.' },
        { name: 'variant', type: "'default' | 'outline' | 'segmented'", description: 'Overrides the group variant.' },
        { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", description: 'Overrides the group size.' },
        { name: 'shape', type: "'rounded' | 'pill' | 'square'", description: 'Overrides the group shape.' },
        { name: 'tone', type: "'neutral' | 'primary' | 'success' | 'danger' | 'info'", description: 'Overrides the group pressed-state colour.' },
        { name: 'as', type: 'string | Component', default: "'button'", description: 'Element to render.' },
        { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single slot child instead of a wrapper.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
      ],
    },
  ],
  props: [
    { name: 'type', type: "'single' | 'multiple'", default: "'single'", description: 'Selection mode. Value is string (single) or string[] (multiple).' },
    { name: 'modelValue', type: 'string | string[]', description: 'Selected value(s) (v-model). Leave undefined for uncontrolled use.' },
    { name: 'defaultValue', type: 'string | string[]', description: 'Initial value(s) when uncontrolled.' },
    { name: 'variant', type: "'default' | 'outline' | 'segmented'", default: "'default'", description: 'Look shared by all items. segmented puts separate rounded items on a muted track. Unknown values fall back to default.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Size shared by all items: 28px, 32px, 36px, 40px, 44px tall. Unknown values fall back to md.' },
    { name: 'shape', type: "'rounded' | 'pill' | 'square'", default: "'rounded'", description: 'Corner shape shared by all items: rounded-md, fully rounded (pill) or no rounding. Pill and square also change the segmented track. Unknown values fall back to rounded.' },
    { name: 'tone', type: "'neutral' | 'primary' | 'success' | 'danger' | 'info'", default: "'neutral'", description: 'Colour of the pressed item. neutral is the accent fill; the others are solid status fills (primary, success, destructive, info) with their foreground colour. Unknown values fall back to neutral.' },
    { name: 'gap', type: "'none' | 'sm' | 'md'", default: "'none'", description: 'Space between items. none joins them into one control; sm (4px) and md (8px) render separate buttons, each with its own corners and border. Unknown values fall back to none.' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Layout and arrow-key direction.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Stretch the group to its container (w-full) and let horizontal items share the width equally.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables every item.' },
    { name: 'loop', type: 'boolean', default: 'true', description: 'Wrap keyboard focus from last to first item.' },
    { name: 'dir', type: "'ltr' | 'rtl'", description: 'Reading direction for keyboard navigation.' },
    { name: 'as', type: 'string | Component', description: 'Root element (default div).' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single slot child instead of a wrapper.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last onto the group root.' },
  ],
  slots: [{ name: 'default', description: 'ToggleGroupItem children.' }],
  emits: [{ name: 'update:modelValue', payload: '[value: string | string[] | undefined]', description: 'Fired when the selection changes. undefined when a single group is cleared.' }],
  examples: [
    {
      title: 'Single selection',
      script: `const align = ref('left')`,
      code: `<ToggleGroup v-model="align" type="single" variant="outline" aria-label="Text alignment">
  <ToggleGroupItem value="left" aria-label="Align left"><Icon :icon="faAlignLeft" /></ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Align center"><Icon :icon="faAlignCenter" /></ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Align right"><Icon :icon="faAlignRight" /></ToggleGroupItem>
</ToggleGroup>`,
      state: () => ({ align: ref('left'), faAlignLeft, faAlignCenter, faAlignRight }),
    },
    {
      title: 'Multiple selection',
      script: `const marks = ref(['bold'])`,
      code: `<div class="space-y-2">
  <ToggleGroup v-model="marks" type="multiple" size="sm" aria-label="Text formatting">
    <ToggleGroupItem value="bold" aria-label="Bold"><Icon :icon="faBold" /></ToggleGroupItem>
    <ToggleGroupItem value="italic" aria-label="Italic"><Icon :icon="faItalic" /></ToggleGroupItem>
    <ToggleGroupItem value="underline" aria-label="Underline"><Icon :icon="faUnderline" /></ToggleGroupItem>
  </ToggleGroup>
  <p class="text-sm text-muted-foreground">Active: {{ marks.join(', ') || 'none' }}</p>
</div>`,
      state: () => ({ marks: ref(['bold']), faBold, faItalic, faUnderline }),
    },
    {
      title: 'Vertical and disabled item',
      code: `<ToggleGroup type="single" orientation="vertical" variant="outline" default-value="a" aria-label="Sample options">
  <ToggleGroupItem value="a">First option</ToggleGroupItem>
  <ToggleGroupItem value="b">Second option</ToggleGroupItem>
  <ToggleGroupItem value="c" disabled>Disabled option</ToggleGroupItem>
</ToggleGroup>`,
    },
    {
      title: 'Outline variant',
      description: 'Bordered joined buttons.',
      code: `<ToggleGroup type="single" variant="outline" default-value="list" aria-label="Layout">
  <ToggleGroupItem value="list">List</ToggleGroupItem>
  <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
  <ToggleGroupItem value="board">Board</ToggleGroupItem>
</ToggleGroup>`,
    },
    {
      title: 'Default (flat) variant',
      description: 'No borders; the pressed item gets an accent fill. Good inside toolbars.',
      code: `<ToggleGroup type="multiple" variant="default" :default-value="['a']" aria-label="Filters">
  <ToggleGroupItem value="a">Open</ToggleGroupItem>
  <ToggleGroupItem value="b">Assigned</ToggleGroupItem>
  <ToggleGroupItem value="c">Mine</ToggleGroupItem>
</ToggleGroup>`,
    },
    {
      title: 'Segmented variant',
      description: 'A segmented control: items on a muted track, the active one raised.',
      script: `const range = ref('week')`,
      code: `<div class="space-y-2">
  <ToggleGroup v-model="range" type="single" variant="segmented" aria-label="Range">
    <ToggleGroupItem value="day">Day</ToggleGroupItem>
    <ToggleGroupItem value="week">Week</ToggleGroupItem>
    <ToggleGroupItem value="month">Month</ToggleGroupItem>
  </ToggleGroup>
  <p class="text-sm text-muted-foreground">Range: {{ range ?? 'none' }}</p>
</div>`,
      state: () => ({ range: ref<string | undefined>('week') }),
    },
    {
      title: 'Segmented, full width',
      description: 'fullWidth makes the segments share the container width.',
      code: `<div class="max-w-sm">
  <ToggleGroup type="single" variant="segmented" full-width default-value="first" aria-label="Sample period">
    <ToggleGroupItem value="first">First</ToggleGroupItem>
    <ToggleGroupItem value="second">Second</ToggleGroupItem>
  </ToggleGroup>
</div>`,
    },
    {
      title: 'Sizes',
      description: 'xs, sm, md, lg and xl for each variant.',
      code: `<div class="space-y-3">
  <ToggleGroup type="single" variant="outline" size="xs" default-value="a" aria-label="xs"><ToggleGroupItem value="a">XS</ToggleGroupItem><ToggleGroupItem value="b">Two</ToggleGroupItem></ToggleGroup><br />
  <ToggleGroup type="single" variant="outline" size="sm" default-value="a" aria-label="sm"><ToggleGroupItem value="a">SM</ToggleGroupItem><ToggleGroupItem value="b">Two</ToggleGroupItem></ToggleGroup><br />
  <ToggleGroup type="single" variant="outline" size="md" default-value="a" aria-label="md"><ToggleGroupItem value="a">MD</ToggleGroupItem><ToggleGroupItem value="b">Two</ToggleGroupItem></ToggleGroup><br />
  <ToggleGroup type="single" variant="outline" size="lg" default-value="a" aria-label="lg"><ToggleGroupItem value="a">LG</ToggleGroupItem><ToggleGroupItem value="b">Two</ToggleGroupItem></ToggleGroup><br />
  <ToggleGroup type="single" variant="segmented" size="xl" default-value="a" aria-label="xl"><ToggleGroupItem value="a">XL</ToggleGroupItem><ToggleGroupItem value="b">Two</ToggleGroupItem></ToggleGroup>
</div>`,
    },
    {
      title: 'Shapes',
      description: 'rounded (default), pill and square, for the outline and segmented variants.',
      code: `<div class="flex flex-col items-start gap-3">
  <ToggleGroup type="single" variant="outline" shape="rounded" default-value="a" aria-label="Rounded shape"><ToggleGroupItem value="a">Rounded</ToggleGroupItem><ToggleGroupItem value="b">Two</ToggleGroupItem></ToggleGroup>
  <ToggleGroup type="single" variant="outline" shape="pill" default-value="a" aria-label="Pill shape"><ToggleGroupItem value="a">Pill</ToggleGroupItem><ToggleGroupItem value="b">Two</ToggleGroupItem></ToggleGroup>
  <ToggleGroup type="single" variant="outline" shape="square" default-value="a" aria-label="Square shape"><ToggleGroupItem value="a">Square</ToggleGroupItem><ToggleGroupItem value="b">Two</ToggleGroupItem></ToggleGroup>
  <ToggleGroup type="single" variant="segmented" shape="pill" default-value="a" aria-label="Pill segments"><ToggleGroupItem value="a">Pill</ToggleGroupItem><ToggleGroupItem value="b">Segments</ToggleGroupItem></ToggleGroup>
  <ToggleGroup type="single" variant="segmented" shape="square" default-value="a" aria-label="Square segments"><ToggleGroupItem value="a">Square</ToggleGroupItem><ToggleGroupItem value="b">Segments</ToggleGroupItem></ToggleGroup>
</div>`,
    },
    {
      title: 'Tones',
      description: 'The pressed item takes a solid status fill. The pressed state is also exposed as aria-pressed.',
      code: `<div class="flex flex-col items-start gap-3">
  <ToggleGroup type="single" variant="outline" tone="neutral" default-value="a" aria-label="Neutral tone"><ToggleGroupItem value="a">Neutral</ToggleGroupItem><ToggleGroupItem value="b">Two</ToggleGroupItem></ToggleGroup>
  <ToggleGroup type="single" variant="outline" tone="primary" default-value="a" aria-label="Primary tone"><ToggleGroupItem value="a">Primary</ToggleGroupItem><ToggleGroupItem value="b">Two</ToggleGroupItem></ToggleGroup>
  <ToggleGroup type="single" variant="outline" tone="success" default-value="a" aria-label="Success tone"><ToggleGroupItem value="a">Success</ToggleGroupItem><ToggleGroupItem value="b">Two</ToggleGroupItem></ToggleGroup>
  <ToggleGroup type="single" variant="outline" tone="danger" default-value="a" aria-label="Danger tone"><ToggleGroupItem value="a">Danger</ToggleGroupItem><ToggleGroupItem value="b">Two</ToggleGroupItem></ToggleGroup>
  <ToggleGroup type="single" variant="outline" tone="info" default-value="a" aria-label="Info tone"><ToggleGroupItem value="a">Info</ToggleGroupItem><ToggleGroupItem value="b">Two</ToggleGroupItem></ToggleGroup>
  <ToggleGroup type="single" variant="segmented" tone="primary" default-value="a" aria-label="Segmented primary"><ToggleGroupItem value="a">Segmented</ToggleGroupItem><ToggleGroupItem value="b">Primary</ToggleGroupItem></ToggleGroup>
</div>`,
    },
    {
      title: 'Gap',
      description: 'none joins the items; sm and md make separate buttons that keep their own borders and corners.',
      code: `<div class="flex flex-col items-start gap-3">
  <ToggleGroup type="multiple" variant="outline" gap="none" :default-value="['a']" aria-label="No gap"><ToggleGroupItem value="a">Joined</ToggleGroupItem><ToggleGroupItem value="b">Two</ToggleGroupItem><ToggleGroupItem value="c">Three</ToggleGroupItem></ToggleGroup>
  <ToggleGroup type="multiple" variant="outline" gap="sm" :default-value="['a']" aria-label="Small gap"><ToggleGroupItem value="a">Small gap</ToggleGroupItem><ToggleGroupItem value="b">Two</ToggleGroupItem><ToggleGroupItem value="c">Three</ToggleGroupItem></ToggleGroup>
  <ToggleGroup type="multiple" variant="outline" gap="md" shape="pill" :default-value="['a']" aria-label="Medium gap, pill"><ToggleGroupItem value="a">Medium gap</ToggleGroupItem><ToggleGroupItem value="b">Two</ToggleGroupItem><ToggleGroupItem value="c">Three</ToggleGroupItem></ToggleGroup>
</div>`,
    },
  ],
  a11y: [
    'Group has role="group": label it with aria-label or aria-labelledby.',
    'Items are buttons with aria-pressed; roving tabindex gives a single tab stop and arrow keys move between items (Home/End supported, `loop` wraps).',
    'Icon-only items need aria-label.',
    'Single groups behave as toggle buttons (aria-pressed), not radios: Arrow keys move focus, Space/Enter press the focused item. Use RadioGroup when exactly one choice is required.',
    'A toned fill (primary, success, danger, info) uses the status colour with its foreground token, so the label stays readable; in forced-colors mode the pressed item also gets a 2px border, because background colours are replaced there. Tone never replaces `aria-pressed`.',
    'Shape and gap change corners and spacing only. Joined groups round their outer corners with logical properties, so they mirror in right-to-left layouts.',
    'Items are 28px to 44px high (at least 24px at every size) and grow on coarse pointers; the pressed fill is paired with aria-pressed so state is not colour only.',
    'Responsive: the group is `inline-flex`; use `full-width` inside a `max-w-*` container so segments reflow at 320px.',
  ],
  related: ['Toggle', 'Tabs', 'RadioGroup', 'Button'],
  requires: [
    'Throws a ContractError when a ToggleGroup has neither `aria-label` nor `aria-labelledby`.',
    'Throws a ContractError when a ToggleGroupItem has no accessible name (an icon-only item needs `aria-label` or `aria-labelledby`).',
    'Throws a ContractError when a ToggleGroupItem `value` is blank or used by another item of the same group.',
  ],
  llmNotes: [
    'single mode v-model is string | undefined; multiple mode is string[].',
    'Use `tone` only to colour the pressed item (success = on, danger = destructive filter); do not use it as the only signal of a state.',
    'Use `gap="sm"|"md"` for separate chips; keep `gap="none"` for one joined control.',
    'Set variant/size on the group, not per item, unless one item must differ.',
    'Use variant="segmented" (usually with full-width) for view/range switchers; "outline" for bordered button rows; "default" for toolbars.',
    'Always label the group (aria-label) and every icon-only item.',
    'ToggleGroupItem must be a descendant of ToggleGroup.',
  ],
  replaces: ['shadcn-vue ToggleGroup', 'hand-rolled segmented controls / button groups'],
}
export default doc
