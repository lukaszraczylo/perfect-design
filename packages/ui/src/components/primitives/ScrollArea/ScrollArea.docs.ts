import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'ScrollArea',
  group: 'primitives',
  subgroup: 'Layout helpers',
  summary: 'Scrollable region with consistent, themed scrollbars across browsers.',
  description:
    'Use `ScrollArea` for bounded lists, logs, code panels and side panels where native scrollbars look inconsistent. Give it a bounded size (`h-64`, `max-h-80` via `class`, or a flex/grid parent). Native keyboard, wheel and touch scrolling are preserved, and the viewport is always keyboard focusable (reka-ui sets `tabindex="0"`). Pass `label` to name it. `type` controls when bars show: `hover` (default), `scroll`, `auto` (only when overflowing) or `always`. For horizontal overflow set `horizontal`. Use `ScrollBar` directly only when composing custom layouts inside a reka ScrollAreaRoot.\n\n' +
    '**Scrollbar thickness** (`size`): `sm` (6px), `md` (10px, default) and `lg` (16px, easier to grab). **Scrollbar look** (`variant`): `default` (transparent track, faint thumb), `track` (a visible muted track behind a solid thumb, so the scroll extent is readable) and `solid` (a solid thumb with no track, for content where the faint thumb is hard to see). When the bars appear is still `type`; `variant` and `size` only change how they look. Unknown values fall back to `md` and `default`. `scrollBarVariants` returns the bar classes for custom layouts.',
  status: 'stable',
  parts: [
    {
      name: 'ScrollBar',
      description: 'Themed scrollbar with a thumb. Rendered automatically by ScrollArea; must be a descendant of a reka-ui ScrollAreaRoot.',
      props: [
        { name: 'orientation', type: "'vertical' | 'horizontal'", default: "'vertical'", description: 'Axis the bar controls.' },
        { name: 'forceMount', type: 'boolean', description: 'Keep the bar mounted regardless of overflow state.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Bar thickness: 6px, 10px or 16px. Unknown values fall back to md.' },
        { name: 'variant', type: "'default' | 'track' | 'solid'", default: "'default'", description: 'Look: faint thumb, visible track plus solid thumb, or solid thumb. Unknown values fall back to default.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
      ],
    },
  ],
  props: [
    { name: 'type', type: "'hover' | 'scroll' | 'auto' | 'always'", default: "'hover'", description: 'When scrollbars are visible.' },
    { name: 'scrollHideDelay', type: 'number', default: '600', description: 'ms before bars hide again (hover / scroll types).' },
    { name: 'vertical', type: 'boolean', default: 'true', description: 'Render the vertical scrollbar.' },
    { name: 'horizontal', type: 'boolean', default: 'false', description: 'Render the horizontal scrollbar (for content wider than the area).' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Scrollbar thickness: 6px, 10px or 16px. Applies to both bars. Unknown values fall back to md.' },
    { name: 'variant', type: "'default' | 'track' | 'solid'", default: "'default'", description: 'Scrollbar look: default (faint thumb), track (visible muted track behind a solid thumb) or solid (solid thumb). Unknown values fall back to default.' },
    { name: 'label', type: 'string', description: 'Accessible name of the viewport. With a label the viewport is exposed as a `region` with that name; it is a tab stop either way.' },
    { name: 'viewportClass', type: 'string | object | array', description: 'Classes for the inner viewport (padding, max-height).' },
    { name: 'as', type: 'string | Component', description: 'Root element (default div).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last onto the root; set the size here (`h-64 w-72`).' },
  ],
  slots: [{ name: 'default', description: 'Scrollable content.' }],
  examples: [
    {
      title: 'Vertical list',
      code: `<ScrollArea type="always" label="Sample item list" class="h-40 w-full max-w-64 rounded-md border" viewport-class="p-3">
  <div class="space-y-2">
    <div v-for="n in 20" :key="n" class="flex items-center justify-between text-sm">
      <span>Item {{ n }}</span>
      <Badge variant="secondary">{{ n * 3 }}</Badge>
    </div>
  </div>
</ScrollArea>`,
    },
    {
      title: 'Horizontal overflow',
      code: `<ScrollArea type="always" label="Sample tag row" horizontal :vertical="false" class="w-full max-w-72 rounded-md border">
  <div class="flex w-max gap-2 p-3">
    <Badge v-for="n in 20" :key="n" variant="outline">Tag {{ n }}</Badge>
  </div>
</ScrollArea>`,
    },
    {
      title: 'Scrollbar variants',
      description: 'default, track and solid, with type="always" so the bars are visible.',
      code: `<div class="flex flex-wrap gap-4">
  <ScrollArea type="always" label="Default scrollbar" variant="default" class="h-32 w-40 rounded-md border" viewport-class="p-3">
    <p v-for="n in 12" :key="n" class="text-sm">Row {{ n }}</p>
  </ScrollArea>
  <ScrollArea type="always" label="Track scrollbar" variant="track" class="h-32 w-40 rounded-md border" viewport-class="p-3">
    <p v-for="n in 12" :key="n" class="text-sm">Row {{ n }}</p>
  </ScrollArea>
  <ScrollArea type="always" label="Solid scrollbar" variant="solid" class="h-32 w-40 rounded-md border" viewport-class="p-3">
    <p v-for="n in 12" :key="n" class="text-sm">Row {{ n }}</p>
  </ScrollArea>
</div>`,
    },
    {
      title: 'Scrollbar sizes',
      description: 'sm, md and lg thickness, vertical and horizontal.',
      code: `<div class="flex flex-wrap gap-4">
  <ScrollArea type="always" label="Small scrollbar" size="sm" variant="track" class="h-32 w-40 rounded-md border" viewport-class="p-3">
    <p v-for="n in 12" :key="n" class="text-sm">Row {{ n }}</p>
  </ScrollArea>
  <ScrollArea type="always" label="Medium scrollbar" size="md" variant="track" class="h-32 w-40 rounded-md border" viewport-class="p-3">
    <p v-for="n in 12" :key="n" class="text-sm">Row {{ n }}</p>
  </ScrollArea>
  <ScrollArea type="always" label="Large scrollbar" size="lg" variant="track" class="h-32 w-40 rounded-md border" viewport-class="p-3">
    <p v-for="n in 12" :key="n" class="text-sm">Row {{ n }}</p>
  </ScrollArea>
  <ScrollArea type="always" label="Large horizontal scrollbar" size="lg" variant="solid" horizontal :vertical="false" class="w-full max-w-72 rounded-md border">
    <div class="flex w-max gap-2 p-3">
      <Badge v-for="n in 20" :key="n" variant="outline">Tag {{ n }}</Badge>
    </div>
  </ScrollArea>
</div>`,
    },
  ],
  a11y: [
    'Uses native scrolling inside the viewport, so wheel, touch and keyboard scrolling keep working.',
    'Keyboard: the viewport is a Tab stop (`tabindex="0"`, set by reka-ui), so Arrow keys, Page Up/Down, Home and End scroll it; the focus ring is drawn inset so the root `overflow-hidden` does not clip it.',
    'With `label`, the focusable viewport is exposed as `role="region"` with that name; without it only the tab stop exists, so always pass `label` for content that matters.',
    '`size` and `variant` only restyle the bars: the viewport stays the focusable, named scroller. The `track` and `solid` thumbs use the muted foreground colour (at least 4.5:1 on the background, card and muted surfaces) and a border in forced-colors mode; the default thumb is `bg-input` (the form-control border colour, 3:1 against the background and card surfaces in light and dark, about 3.1:1 and 3.4:1 measured in Chrome) and darkens to the muted foreground on hover; it is lighter than the solid thumbs but no longer a faint hint, and it is still not the only way to scroll. Use `lg` where a thicker bar is easier to grab; bars never replace the keyboard path.',
    'Scrollbars are decorative, hidden from assistive tech by reka-ui, and have no motion beyond fade.',
    'Responsive: size it with `w-full max-w-*` so it never forces horizontal scroll of the page at 320px.',
  ],
  related: ['Card', 'Dialog', 'VisuallyHidden'],
  llmNotes: [
    'Always bound the height or width (`class="h-64"`), otherwise nothing scrolls.',
    'Always pass `label` so the focusable viewport has a name.',
    'Use `horizontal` (and `:vertical="false"` if needed) only for content wider than the area; use `w-max` on the inner row.',
    'Use `viewport-class` for padding so scrollbars stay at the edge.',
    'Use `variant="track"` or `"solid"` when the faint default thumb is too subtle; use `size="lg"` for touch-first panels. Do not add `::-webkit-scrollbar` CSS.',
    'Prefer `type="auto"` or `always` on touch-first or test pages where hover is unavailable.',
  ],
  replaces: ['shadcn-vue ScrollArea', 'custom overflow-auto + ::-webkit-scrollbar CSS'],
}
export default doc
