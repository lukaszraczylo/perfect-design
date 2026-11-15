import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'ResizablePanels',
  group: 'layout',
  subgroup: 'Page structure',
  summary: 'Two or more panels separated by draggable, keyboard-accessible handles; sizes are percentages that always add up to 100.',
  description:
    'Use `ResizablePanels` for IDE-style layouts: a file tree next to an editor, a master/detail view, a console under a preview. Put `ResizablePanel` and `ResizableHandle` as alternating direct children (panel, handle, panel, ...). Sizes are percentages with `defaultSize` / `minSize` / `maxSize` per panel; they are always normalised to sum 100 and clamped, whatever you pass (NaN, negative, sums other than 100). Bind `v-model:sizes` to read or control the layout, or set `storageKey` to remember it in localStorage. A panel can be `collapsible`. Dragging uses pointer events (mouse, touch and pen); the handle is a focusable `separator` with arrow-key, Shift, Home / End and Enter support. For a fixed, non-resizable split use `SplitLayout`. The root fills its parent (`h-full w-full`): give it a height with `class`. For an exact server-rendered first paint give every panel a `defaultSize`; sizes are finalised right after mount.',
  status: 'stable',
  parts: [
    {
      name: 'ResizablePanel',
      description: 'A sized region. Direct child of `ResizablePanels`; its content scrolls / clips independently (`overflow-hidden` by default, override with `class`).',
      props: [
        { name: 'defaultSize', type: 'number', description: 'Initial size in percent. Missing or invalid values (NaN, negative) share the remaining space equally.' },
        { name: 'minSize', type: 'number', default: '0', description: 'Minimum size in percent.' },
        { name: 'maxSize', type: 'number', default: '100', description: 'Maximum size in percent (never below minSize).' },
        { name: 'collapsible', type: 'boolean', default: 'false', description: 'Collapses to `collapsedSize` when dragged below half of `minSize`, or with Enter on an adjacent handle. Sets `data-collapsed`.' },
        { name: 'collapsedSize', type: 'number', default: '0', description: 'Size in percent while collapsed (0 .. minSize).' },
        { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
      ],
    },
    {
      name: 'ResizableHandle',
      description: 'The draggable divider (`role="separator"`) between two panels. Exposes `aria-valuenow` (size of the preceding panel), `aria-valuemin`, `aria-valuemax`.',
      props: [
        { name: 'variant', type: "'line' | 'bar'", default: "'line'", description: '`line` = hairline with a wide hit area; `bar` = thicker muted track.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Visible thickness. `line`: sm and md 1px, lg 2px. `bar`: sm 4px, md 8px, lg 12px. The 24px hit area never changes. Unknown values fall back to `md`.' },
        { name: 'label', type: 'string', description: 'Accessible name of the separator. Required: `label`, `aria-label` or `aria-labelledby` must say which panels it resizes.' },
        { name: 'grip', type: 'boolean', default: 'false', description: 'Show a small grip in the middle. The default slot replaces it.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable this handle only: leaves the tab order, gets `aria-disabled`, ignores pointer and keys.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
      ],
    },
  ],
  props: [
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: '`horizontal` lays panels in a row (the handles are vertical bars); `vertical` stacks them. Unknown values fall back to horizontal.' },
    { name: 'sizes', type: 'number[]', description: 'Controlled sizes in percent (`v-model:sizes`), one per panel in DOM order. Ignored while its length differs from the panel count; normalised and clamped.' },
    { name: 'storageKey', type: 'string', description: 'localStorage key. Layout is restored after mount and saved after each completed resize. Missing / throwing storage and corrupt JSON are ignored.' },
    { name: 'step', type: 'number', default: '5', description: 'Arrow-key step in percent. Invalid values fall back to 5.' },
    { name: 'largeStep', type: 'number', default: '20', description: 'Step in percent while Shift is held. Invalid values fall back to 20.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable every handle.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes (e.g. `h-64`).' },
  ],
  slots: [{ name: 'default', description: 'ResizablePanel and ResizableHandle children, alternating.' }],
  emits: [
    { name: 'update:sizes', payload: '[sizes: number[]]', description: 'Layout changed by the user (drag, keyboard, collapse) or via `setSizes`.' },
    { name: 'resizeStart', description: 'A pointer drag started.' },
    { name: 'resizeEnd', payload: '[sizes: number[]]', description: 'A pointer drag ended (also on cancel).' },
  ],
  examples: [
    {
      title: 'Side by side',
      description: 'Two panels with a sidebar that cannot get too small or too large.',
      code: `<ResizablePanels class="h-40 rounded-md border">
  <ResizablePanel :default-size="30" :min-size="15" :max-size="60"><div class="p-3 text-sm">Sidebar</div></ResizablePanel>
  <ResizableHandle aria-label="Resize sidebar" />
  <ResizablePanel :default-size="70"><div class="p-3 text-sm">Sample content</div></ResizablePanel>
</ResizablePanels>`,
    },
    {
      title: 'Vertical with a grip',
      code: `<ResizablePanels orientation="vertical" class="h-56 rounded-md border">
  <ResizablePanel :default-size="65"><div class="p-3 text-sm">Preview</div></ResizablePanel>
  <ResizableHandle grip aria-label="Resize console" />
  <ResizablePanel :default-size="35" :min-size="10"><div class="p-3 text-sm">Console</div></ResizablePanel>
</ResizablePanels>`,
    },
    {
      title: 'Three panels, v-model:sizes',
      description: 'The model always holds one number per panel and sums to 100.',
      script: 'const sizes = ref([25, 50, 25])',
      code: `<div class="grid gap-2">
  <ResizablePanels v-model:sizes="sizes" class="h-32 rounded-md border">
    <ResizablePanel :min-size="10"><div class="p-3 text-sm">A</div></ResizablePanel>
    <ResizableHandle aria-label="Resize A and B" />
    <ResizablePanel :min-size="10"><div class="p-3 text-sm">B</div></ResizablePanel>
    <ResizableHandle aria-label="Resize B and C" />
    <ResizablePanel :min-size="10"><div class="p-3 text-sm">C</div></ResizablePanel>
  </ResizablePanels>
  <p class="text-sm text-muted-foreground">{{ sizes.map((s) => Math.round(s)).join(' / ') }}</p>
</div>`,
      state: () => ({ sizes: ref([25, 50, 25]) }),
    },
    {
      title: 'Collapsible and persisted',
      description: 'Drag the sidebar narrow to collapse it, or focus the handle and press Enter. The layout is remembered under `storageKey`.',
      code: `<ResizablePanels storage-key="pd-docs-resizable-demo" class="h-40 rounded-md border">
  <ResizablePanel :default-size="30" :min-size="20" collapsible><div class="p-3 text-sm">Collapsible sidebar</div></ResizablePanel>
  <ResizableHandle aria-label="Resize sidebar (Enter toggles)" />
  <ResizablePanel :default-size="70"><div class="p-3 text-sm">Content</div></ResizablePanel>
</ResizablePanels>`,
    },
    {
      title: 'Handle sizes',
      description: 'The bar handle at `sm`, `md` and `lg`, then a 2px line handle. Only the visible thickness changes.',
      code: `<div class="grid gap-4">
  <ResizablePanels class="h-16 rounded-md border">
    <ResizablePanel><div class="p-2 text-sm">bar sm</div></ResizablePanel>
    <ResizableHandle variant="bar" size="sm" aria-label="Small bar handle" />
    <ResizablePanel><div class="p-2 text-sm">bar sm</div></ResizablePanel>
  </ResizablePanels>
  <ResizablePanels class="h-16 rounded-md border">
    <ResizablePanel><div class="p-2 text-sm">bar lg</div></ResizablePanel>
    <ResizableHandle variant="bar" size="lg" aria-label="Large bar handle" />
    <ResizablePanel><div class="p-2 text-sm">bar lg</div></ResizablePanel>
  </ResizablePanels>
  <ResizablePanels class="h-16 rounded-md border">
    <ResizablePanel><div class="p-2 text-sm">line lg</div></ResizablePanel>
    <ResizableHandle size="lg" aria-label="Thick line handle" />
    <ResizablePanel><div class="p-2 text-sm">line lg</div></ResizablePanel>
  </ResizablePanels>
</div>`,
    },
    {
      title: 'Handle variants and disabled',
      code: `<div class="grid gap-4">
  <ResizablePanels class="h-20 rounded-md border">
    <ResizablePanel><div class="p-2 text-sm">line</div></ResizablePanel>
    <ResizableHandle variant="line" aria-label="Line handle" />
    <ResizablePanel><div class="p-2 text-sm">line</div></ResizablePanel>
  </ResizablePanels>
  <ResizablePanels class="h-20 rounded-md border">
    <ResizablePanel><div class="p-2 text-sm">bar</div></ResizablePanel>
    <ResizableHandle variant="bar" aria-label="Bar handle" />
    <ResizablePanel><div class="p-2 text-sm">bar</div></ResizablePanel>
  </ResizablePanels>
  <ResizablePanels class="h-20 rounded-md border">
    <ResizablePanel><div class="p-2 text-sm">locked</div></ResizablePanel>
    <ResizableHandle disabled aria-label="Locked handle" />
    <ResizablePanel><div class="p-2 text-sm">locked</div></ResizablePanel>
  </ResizablePanels>
</div>`,
    },
  ],
  a11y: [
    'Each handle is `role="separator"` with `tabindex="0"`, `aria-orientation` (a horizontal row of panels has VERTICAL separators), `aria-valuenow` (size % of the preceding panel), `aria-valuemin` and `aria-valuemax`.',
    'Keyboard: Arrow keys along the layout axis resize by `step` (Shift = `largeStep`); Home / End jump to the smallest / largest size reachable; Enter toggles a collapsible neighbour. Arrows flip in right-to-left containers.',
    'Always give handles an `aria-label` that says what they resize (the `label` prop; default "Resize panels"). Disabled handles leave the tab order and set `aria-disabled`.',
    'Pointer target: the 1px line handle has a 24px-wide invisible hit area (WCAG 2.5.8); the keyboard alternative to dragging is the Arrow/Home/End map above (WCAG 2.5.7).',
    'Focus shows as a ring-coloured handle plus a transparent outline, so it is visible in forced-colors mode. The `line` handle fills with `CanvasText` there (hover, focus and drag included) and the `bar` handle draws a border, because forced-colors mode drops background tokens; the idle outline that `outline-hidden` would add is removed so the divider stays a clean line. Panels stay side by side at every width; give the root a sensible `min-w-0` parent so it does not overflow at 320px.',
    'Handle `size` changes the visible thickness only: the 24px hit area, keyboard map and `aria-value*` attributes are identical at every size. Prefer `lg` when the divider is the main control of the layout.',
    'Handle transitions and hover colours respect `prefers-reduced-motion`.',
  ],
  related: ['SplitLayout', 'AppShell', 'Slider'],
  requires: [
    'Throws a ContractError when ResizablePanels has no ResizablePanel, starts or ends with a ResizableHandle, or has two panels or two handles in a row.',
    'Throws a ContractError when a ResizableHandle has none of `label`, `aria-label` and `aria-labelledby`.',
    'Throws a ContractError when a ResizablePanel or ResizableHandle is used outside ResizablePanels.',
  ],
  llmNotes: [
    'Children of ResizablePanels must alternate ResizablePanel, ResizableHandle, ResizablePanel ...; never put two handles in a row.',
    'Give ResizablePanels an explicit height (`class="h-64"`) or a sized parent; the root is `h-full w-full`.',
    'Sizes are percentages summing to 100; do not compute pixel widths yourself.',
    'Use `v-model:sizes` with an array whose length equals the panel count, or `storage-key` for persistence; not both.',
    'Add `aria-label` to every ResizableHandle.',
    'For a static split use SplitLayout instead.',
  ],
}

export default doc
