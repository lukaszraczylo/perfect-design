import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Separator',
  group: 'primitives',
  subgroup: 'Display',
  summary: 'Thin horizontal or vertical divider line, solid, dashed or dotted, optionally with a label ("or", "Today") on the line.',
  description:
    'Use `Separator` to split groups of content or toolbar items. It is decorative by default (role="none"); set `:decorative="false"` when the divider carries meaning for assistive tech. Vertical separators need a parent with a height (e.g. `flex items-center` with `h-5` on the separator).\n\n' +
    '**Line style** (`variant`): `solid` (default, filled `bg-border`), `dashed` and `dotted` (1px border; use for "tear-off", optional or secondary regions, receipts). Unknown values fall back to solid.\n\n' +
    '**Thickness** (`size`): `thin` (1px, default), `md` (2px) and `thick` (3px) for section breaks that need more weight. **Tone**: `default` (border colour), `muted` (half strength, for dense lists), `strong` (the form-control border colour, for dividers that must stay visible on cards) and `primary` (accent). On a labelled separator the tone also sets the text colour (`strong` is foreground, `primary` is the accent, the others stay muted). Unknown values fall back to `thin` and `default`. Thicker and toned filled lines add a border in forced-colors mode.\n\n' +
    '**Labelled** separators: pass `label="or"` or put any content in the default slot to show text on the line. `align` places it: `center` (line on both sides, default; sign-in forms, "or"), `start` (label first, line after; section headings) or `end` (line first, label last). Unknown `align` values fall back to center. Labelled separators work vertically too (the label sits between two vertical lines). Without `label`/slot the markup is a single element as before. With `asChild` the slot is the element to render and `label` is ignored.',
  status: 'stable',
  props: [
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Direction of the line. Invalid values fall back to horizontal.' },
    { name: 'decorative', type: 'boolean', default: 'true', description: 'true = role="none"; false = role="separator" (+ aria-orientation when vertical). A non-decorative separator with `label` gets aria-label=label (role separator hides its children).' },
    { name: 'variant', type: "'solid' | 'dashed' | 'dotted'", default: "'solid'", description: 'Line style. Unknown values fall back to solid.' },
    { name: 'size', type: "'thin' | 'md' | 'thick'", default: "'thin'", description: 'Line thickness: 1px, 2px or 3px. Applies to plain and labelled separators, in both orientations. Unknown values fall back to thin.' },
    { name: 'tone', type: "'default' | 'muted' | 'strong' | 'primary'", default: "'default'", description: 'Colour of the line (and of the label text when `strong` or `primary`). default = border token, muted = half strength, strong = form-control border token, primary = accent. Unknown values fall back to default.' },
    { name: 'label', type: 'string', description: 'Text shown on the line. Empty string = plain separator. Ignored with `asChild`; the default slot takes precedence.' },
    { name: 'align', type: "'start' | 'center' | 'end'", default: "'center'", description: 'Label position when a label/slot is present. start = label then line; end = line then label; center = line, label, line. Unknown values fall back to center.' },
    { name: 'as', type: 'string | Component', description: 'Element to render (reka-ui default is a div).' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single slot child instead of a wrapper.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge onto the root; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Label content (replaces `label`, e.g. an icon plus text). With `asChild` it is the element rendered instead of the wrapper.' }],
  examples: [
    {
      title: 'Horizontal',
      code: `<div class="max-w-sm space-y-3">
  <p class="text-sm font-medium">Perfect Design</p>
  <Separator />
  <p class="text-sm text-muted-foreground">A Vue 3 design system.</p>
</div>`,
    },
    {
      title: 'Vertical in a toolbar',
      code: `<div class="flex h-5 items-center gap-3 text-sm">
  <span>Docs</span>
  <Separator orientation="vertical" />
  <span>Source</span>
  <Separator orientation="vertical" :decorative="false" />
  <span>Releases</span>
</div>`,
    },
    {
      title: 'Dashed and dotted',
      description: 'variant switches the line style; solid is the default.',
      code: `<div class="max-w-sm space-y-4">
  <Separator />
  <Separator variant="dashed" />
  <Separator variant="dotted" />
  <div class="flex h-6 items-center gap-4 text-sm">
    <span>Left</span>
    <Separator variant="dashed" orientation="vertical" />
    <span>Right</span>
  </div>
</div>`,
    },
    {
      title: 'With a label (centred)',
      description: 'An "or" divider between two alternatives.',
      code: `<div class="max-w-sm space-y-3">
  <Button variant="outline" class="w-full">First sample action</Button>
  <Separator label="or" />
  <Button class="w-full">Second sample action</Button>
</div>`,
    },
    {
      title: 'Label alignment',
      description: 'align="start", "center" and "end".',
      code: `<div class="max-w-sm space-y-4">
  <Separator label="Start" align="start" />
  <Separator label="Center" align="center" />
  <Separator label="End" align="end" />
</div>`,
    },
    {
      title: 'Labelled dashed and slot content',
      description: 'Styles combine with labels; the default slot accepts any content.',
      code: `<div class="max-w-sm space-y-4">
  <Separator label="Optional" variant="dashed" align="start" />
  <Separator variant="dotted"><span class="text-xs">Today</span></Separator>
</div>`,
    },
    {
      title: 'Thickness',
      description: 'size sets the line thickness for every variant; the vertical separator uses the same widths.',
      code: `<div class="max-w-sm space-y-4">
  <Separator size="thin" />
  <Separator size="md" />
  <Separator size="thick" />
  <Separator size="md" variant="dashed" />
  <Separator size="thick" variant="dotted" />
  <div class="flex h-6 items-center gap-4 text-sm">
    <span>Thin</span>
    <Separator orientation="vertical" size="thin" />
    <span>Medium</span>
    <Separator orientation="vertical" size="md" />
    <span>Thick</span>
    <Separator orientation="vertical" size="thick" />
    <span>End</span>
  </div>
</div>`,
    },
    {
      title: 'Tones',
      description: 'default, muted, strong and primary, plain and labelled.',
      code: `<div class="max-w-sm space-y-4">
  <Separator tone="default" size="md" />
  <Separator tone="muted" size="md" />
  <Separator tone="strong" size="md" />
  <Separator tone="primary" size="md" />
  <Separator tone="strong" label="Strong" />
  <Separator tone="primary" label="Primary" align="start" variant="dashed" />
</div>`,
    },
    {
      title: 'Vertical with a label',
      code: `<div class="flex h-32 items-center gap-6 text-sm">
  <span>Before</span>
  <Separator label="or" orientation="vertical" />
  <span>After</span>
</div>`,
    },
  ],
  a11y: [
    'Decorative by default (role="none") so screen readers skip the line; label text stays readable.',
    'Use `decorative=false` when the line separates regions of a toolbar or menu: it is then a real `separator` that assistive tech can announce.',
    '`size` and `tone` only change thickness and colour. A thicker or toned filled line adds a border in forced-colors mode, where background colours are replaced, so it stays visible. Tones use the existing border, input and primary tokens; a decorative divider needs no text contrast, a `strong` one meets 3:1 against the page and card surfaces.',
    'The line is a 1px `border` colour fill. Forced-colors mode replaces background tokens, so a filled line also paints `forced-colors:bg-[CanvasText]` (a system colour keeps its value) and the default hairline, labelled lines included, stays visible. Dashed and dotted variants use borders, so they remain visible too.',
    'With `decorative=false` it exposes role="separator"; vertical ones also set aria-orientation. Because separator children are presentational, `label` is also set as aria-label (slot content is not; pass aria-label yourself).',
  ],
  related: ['Skeleton', 'Card'],
  llmNotes: [
    'Give vertical separators an explicit height (`h-5`) or a stretching flex parent.',
    'Keep `decorative` true unless the divider conveys structure.',
    'Use `label="or"` for dividers between alternatives instead of hand-rolled flex + two hr.',
    'Use `variant="dashed"|"dotted"` for style; do not set border classes manually.',
    'Use `size="md"|"thick"` for section breaks and `tone="muted"` inside dense lists; do not set `h-*` or `bg-*` classes by hand.',
    'Do not combine `label` with `asChild`.',
  ],
  replaces: ['shadcn-vue Separator', 'hr / border-b divider divs', 'hand-built "or" divider rows'],
}
export default doc
