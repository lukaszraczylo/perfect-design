import { ref } from 'vue'
import { faArrowDown, faArrowUp, faCopy, faEllipsis, faEye, faMinus, faPlus, faRotateRight } from '../../../lib/icons'
import type { ComponentDoc } from '../../../docs-types'

const classProp = { name: 'class', type: 'string | object | array', description: 'Merged last (tailwind-merge); wins over internal classes.' }
const asProp = { name: 'as', type: 'string | Component', description: 'Element to render instead of the default.' }
const asChildProp = { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single slot child instead of a wrapper element (reka-ui).' }

const doc: ComponentDoc = {
  name: 'Toolbar',
  group: 'navigation',
  subgroup: 'Menus',
  summary: 'A row or column of related controls that is one tab stop and moves focus with the arrow keys (WAI-ARIA toolbar).',
  description:
    'Compose `Toolbar` with `ToolbarButton`, `ToolbarToggleGroup` + `ToolbarToggleItem`, `ToolbarLink` and `ToolbarSeparator`. Use it when three or more controls act on the same thing (text formatting, zoom, view options) so keyboard users cross them with one Tab stop instead of one per control. Do not use it for site navigation (use `NavigationMenu` or `SidebarNav`), for a menu of commands that open sub menus (use `Menubar`), or for two buttons in a form footer (use plain `Button`s). `variant` is the look of the bar: `plain` (no chrome), `outline` (border), `filled` (muted fill) and `floating` (border, popover surface and the shared medium shadow, for a bar that sits over content). `size` (`sm` 32px, `md` 36px, `lg` 44px) and `density` (`compact`, `default`, `spacious`) are set on the bar and reach every part through context; a part can override `size`. `orientation="vertical"` runs the bar as a column and switches the arrow keys to Up and Down. `overflow` decides what happens when the items do not fit: `wrap` flows onto more lines (default, no hidden controls), `scroll` keeps one line and scrolls inside the bar; use `scroll` only when a single line matters, because items past the edge are out of sight until focus or a swipe brings them in. The bar needs an accessible name (`aria-label` or `aria-labelledby`); icon-only buttons and toggle items need their own. `toolbarVariants`, `toolbarButtonVariants`, `toolbarToggleItemVariants`, `toolbarLinkVariants`, `toolbarToggleGroupVariants` and `toolbarSeparatorVariants` are exported for reuse (wrap them in `cn()` when you add classes).',
  props: [
    { name: 'variant', type: "'plain' | 'outline' | 'filled' | 'floating'", default: "'plain'", description: 'Look of the bar. Unknown values fall back to `plain`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Item height: 32px, 36px or 44px (all 44px on coarse pointers). Unknown values fall back to `md`.' },
    { name: 'density', type: "'compact' | 'default' | 'spacious'", default: "'default'", description: 'Padding of the bar and inline padding of the items. Targets stay at least 24px in every density. Unknown values fall back to `default`.' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Direction of the items and of the arrow keys. Sets `aria-orientation`.' },
    { name: 'gap', type: "'none' | 'sm' | 'md'", default: "'sm'", description: 'Space between items (0, 4px, 8px). Unknown values fall back to `sm`.' },
    { name: 'overflow', type: "'wrap' | 'scroll'", default: "'wrap'", description: '`wrap` flows items onto more lines; `scroll` keeps one line and scrolls inside the bar. Unknown values fall back to `wrap`.' },
    { name: 'dir', type: "'ltr' | 'rtl'", description: 'Reading direction. In `rtl` the horizontal arrow keys swap and the bar mirrors.' },
    { name: 'loop', type: 'boolean', default: 'true', description: 'Wrap keyboard focus from the last item to the first and back.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Element to render.' },
    asChildProp,
    classProp,
  ],
  slots: [{ name: 'default', description: 'ToolbarButton, ToolbarToggleGroup, ToolbarLink and ToolbarSeparator.' }],
  parts: [
    {
      name: 'ToolbarButton',
      description: 'An action button (type=button). Part of the roving focus sequence. Disabled buttons stay in the DOM and are skipped by the arrow keys.',
      props: [
        { name: 'size', type: "'sm' | 'md' | 'lg'", description: 'Overrides the size of the bar for this button.' },
        { name: 'tone', type: "'neutral' | 'primary'", default: "'neutral'", description: '`primary` is a solid fill for the one main action of the bar. Unknown values fall back to `neutral`.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the button.' },
        asProp,
        asChildProp,
        classProp,
      ],
    },
    {
      name: 'ToolbarToggleGroup',
      description: 'Related toggle items (role=group). `single` behaves like radio buttons (role=radio, aria-checked), `multiple` like pressed buttons (aria-pressed). Name it with `aria-label` when its purpose is not clear from the items.',
      props: [
        { name: 'type', type: "'single' | 'multiple'", default: "'single'", description: 'One pressed item at a time (string value) or any number (string[] value).' },
        { name: 'modelValue', type: 'string | string[]', description: 'Pressed value(s) (v-model). Leave undefined for uncontrolled use.' },
        { name: 'defaultValue', type: 'string | string[]', description: 'Initial value(s) when uncontrolled.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables every item.' },
        asProp,
        asChildProp,
        classProp,
      ],
    },
    {
      name: 'ToolbarToggleItem',
      description: 'A toggle button inside `ToolbarToggleGroup`. A pressed item shows a foreground border (2px and underlined in forced-colors mode) as well as a fill, so the state is never colour alone.',
      props: [
        { name: 'value', type: 'string', required: true, description: 'Value reported to the group. Must be non-empty and unique in the group.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", description: 'Overrides the size of the bar for this item.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the item.' },
        asProp,
        asChildProp,
        classProp,
      ],
    },
    {
      name: 'ToolbarLink',
      description: 'A link in the bar (an `a` by default, underlined so it is told apart from buttons without colour). Space activates it, as on a button.',
      props: [{ name: 'size', type: "'sm' | 'md' | 'lg'", description: 'Overrides the size of the bar for this link.' }, asProp, asChildProp, classProp],
    },
    {
      name: 'ToolbarSeparator',
      description: 'Divider between groups of controls (role=separator). It runs across the bar: a vertical line in a horizontal bar, a horizontal line in a vertical one. Drawn as a border so it survives forced-colors mode. Not focusable.',
      props: [asProp, asChildProp, classProp],
    },
  ],
  examples: [
    {
      title: 'Minimal',
      description: 'Three buttons, one tab stop. Tab enters the bar, the arrow keys move between buttons, Tab leaves.',
      code: `<Toolbar aria-label="Document actions">
  <ToolbarButton>New</ToolbarButton>
  <ToolbarButton>Open</ToolbarButton>
  <ToolbarButton>Save</ToolbarButton>
</Toolbar>`,
    },
    {
      title: 'Formatting with toggle groups',
      description: 'A `multiple` group (each item pressed on its own) and a `single` group (one at a time), both with v-model, split by a separator. The pressed state is a fill and a border.',
      script: `const marks = ref(['bold'])
const align = ref('left')`,
      state: () => ({ marks: ref<string[]>(['bold']), align: ref('left') }),
      code: `<div class="space-y-3">
  <Toolbar aria-label="Text formatting" variant="outline">
    <ToolbarToggleGroup v-model="marks" type="multiple" aria-label="Character style">
      <ToolbarToggleItem value="bold" class="font-bold">Bold</ToolbarToggleItem>
      <ToolbarToggleItem value="italic" class="italic">Italic</ToolbarToggleItem>
      <ToolbarToggleItem value="underline" class="underline">Underline</ToolbarToggleItem>
    </ToolbarToggleGroup>
    <ToolbarSeparator />
    <ToolbarToggleGroup v-model="align" type="single" aria-label="Alignment">
      <ToolbarToggleItem value="left">Left</ToolbarToggleItem>
      <ToolbarToggleItem value="center">Center</ToolbarToggleItem>
      <ToolbarToggleItem value="right">Right</ToolbarToggleItem>
    </ToolbarToggleGroup>
  </Toolbar>
  <p class="text-sm text-muted-foreground">Style: {{ marks.join(', ') || 'none' }}. Alignment: {{ align || 'none' }}.</p>
</div>`,
    },
    {
      title: 'Vertical with icon-only buttons',
      description: '`orientation="vertical"` runs the bar as a column and moves focus with Up and Down. Icon-only buttons carry `aria-label`.',
      script: `import { faPlus, faMinus, faRotateRight, faEye } from '@perfect-design/ui'`,
      state: () => ({ faPlus, faMinus, faRotateRight, faEye }),
      code: `<Toolbar aria-label="Canvas controls" orientation="vertical" variant="floating">
  <ToolbarButton aria-label="Zoom in"><Icon :icon="faPlus" /></ToolbarButton>
  <ToolbarButton aria-label="Zoom out"><Icon :icon="faMinus" /></ToolbarButton>
  <ToolbarSeparator />
  <ToolbarButton aria-label="Reset view"><Icon :icon="faRotateRight" /></ToolbarButton>
  <ToolbarButton aria-label="Preview" disabled><Icon :icon="faEye" /></ToolbarButton>
</Toolbar>`,
    },
    {
      title: 'Variants',
      description: '`plain`, `outline`, `filled` and `floating`. `filled` presses to the page surface; `floating` uses the popover surface, a border and the shared medium shadow.',
      code: `<div class="flex flex-col items-start gap-4">
  <Toolbar v-for="variant in ['plain', 'outline', 'filled', 'floating']" :key="variant" :variant="variant" :aria-label="'Variant ' + variant">
    <ToolbarButton>{{ variant }}</ToolbarButton>
    <ToolbarToggleGroup type="multiple" :default-value="['on']" aria-label="Sample toggles">
      <ToolbarToggleItem value="on">On</ToolbarToggleItem>
      <ToolbarToggleItem value="off">Off</ToolbarToggleItem>
    </ToolbarToggleGroup>
    <ToolbarSeparator />
    <ToolbarButton tone="primary">Save</ToolbarButton>
  </Toolbar>
</div>`,
    },
    {
      title: 'Sizes and density',
      description: '`size` sets the item height, `density` the padding of the bar and items. Targets stay at least 24px; coarse pointers get 44px.',
      code: `<div class="flex flex-col items-start gap-4">
  <Toolbar v-for="size in ['sm', 'md', 'lg']" :key="size" :size="size" variant="outline" :aria-label="'Size ' + size">
    <ToolbarButton>Size {{ size }}</ToolbarButton>
    <ToolbarButton>Cut</ToolbarButton>
    <ToolbarButton>Paste</ToolbarButton>
  </Toolbar>
  <Toolbar v-for="density in ['compact', 'default', 'spacious']" :key="density" :density="density" variant="filled" :aria-label="'Density ' + density">
    <ToolbarButton>{{ density }}</ToolbarButton>
    <ToolbarButton>Cut</ToolbarButton>
    <ToolbarButton>Paste</ToolbarButton>
  </Toolbar>
</div>`,
    },
    {
      title: 'Overflow: wrap and scroll',
      description: 'In a narrow container `wrap` flows onto a second line and every control stays visible; `scroll` keeps one line and scrolls inside the bar. The bar is the tab stop either way, and focus scrolls the active item into view.',
      code: `<div class="flex max-w-xs flex-col gap-4">
  <Toolbar overflow="wrap" variant="outline" aria-label="Wrapping toolbar">
    <ToolbarButton v-for="n in 8" :key="n">Tool {{ n }}</ToolbarButton>
  </Toolbar>
  <Toolbar overflow="scroll" variant="outline" aria-label="Scrolling toolbar">
    <ToolbarButton v-for="n in 8" :key="n">Tool {{ n }}</ToolbarButton>
  </Toolbar>
</div>`,
    },
    {
      title: 'Right to left',
      description: '`dir="rtl"` mirrors the layout and swaps ArrowLeft and ArrowRight. Wrap the bar in an element with the same `dir` and a `lang`.',
      code: `<div dir="rtl" lang="ar">
  <Toolbar dir="rtl" variant="outline" aria-label="إجراءات المستند">
    <ToolbarButton>جديد</ToolbarButton>
    <ToolbarButton>فتح</ToolbarButton>
    <ToolbarSeparator />
    <ToolbarButton tone="primary">حفظ</ToolbarButton>
  </Toolbar>
</div>`,
    },
    {
      title: 'Links, icons and an action menu button',
      description: 'A `ToolbarLink` joins the same focus sequence. Icon buttons need `aria-label`; a button with a visible label and an icon is named by its text.',
      script: `import { faCopy, faArrowUp, faArrowDown, faEllipsis } from '@perfect-design/ui'`,
      state: () => ({ faCopy, faArrowUp, faArrowDown, faEllipsis }),
      code: `<Toolbar aria-label="Row actions" variant="filled" size="sm">
  <ToolbarButton aria-label="Move up"><Icon :icon="faArrowUp" /></ToolbarButton>
  <ToolbarButton aria-label="Move down"><Icon :icon="faArrowDown" /></ToolbarButton>
  <ToolbarButton><Icon :icon="faCopy" />Duplicate</ToolbarButton>
  <ToolbarSeparator />
  <ToolbarLink href="/components/navigation/toolbar">Toolbar docs</ToolbarLink>
  <ToolbarButton aria-label="More actions"><Icon :icon="faEllipsis" /></ToolbarButton>
</Toolbar>`,
    },
  ],
  a11y: [
    'Root has role=toolbar and aria-orientation; it needs `aria-label` or `aria-labelledby`. Use one toolbar per related set of controls; a page with several toolbars needs distinct names.',
    'The bar is a single tab stop (roving tabindex, from reka-ui): Tab moves focus into the bar, to the item that last had focus (the first one at first), and Tab again leaves it. Shift+Tab leaves backwards.',
    'Keyboard: ArrowRight/ArrowLeft move between items in a horizontal bar (swapped in `rtl`), ArrowDown/ArrowUp in a vertical bar, Home and End jump to the first and last item, and `loop` (on by default) wraps. Enter and Space press a button, toggle an item or follow a link. Disabled items are skipped.',
    '`ToolbarToggleGroup type="multiple"` items expose aria-pressed; `type="single"` items expose role=radio with aria-checked. A pressed item has a fill and a foreground border; in forced-colors mode the border is 2px and the label is underlined.',
    'Targets are at least 32px tall (24px floor in the dense style packs) and 44px on coarse pointers. Focus uses the shared ring, which stays an outline in forced-colors mode.',
    'Scroll overflow: the scrolling bar is itself focusable (it is the tab stop and hands focus to an item), so keyboard users can reach it, and the browser scrolls a focused item into view. No extra `tabindex` is added, so the roving sequence is unchanged. Wrap mode keeps every control visible and is the safer default on a 320px screen.',
    'Transitions are removed under prefers-reduced-motion. Separators are borders, so they stay visible in forced-colors mode; they are not focusable and are not announced as controls.',
  ],
  related: ['Menubar', 'ToggleGroup', 'Button', 'Tabs'],
  requires: [
    'Throws a ContractError when `Toolbar` has no accessible name (`aria-label` or `aria-labelledby`).',
    'Throws a ContractError when an icon-only `ToolbarButton` has no accessible name (text or `aria-label`).',
    'Throws a ContractError when an icon-only `ToolbarToggleItem` has no accessible name (text or `aria-label`).',
    'Throws a ContractError when a `ToolbarToggleItem` has a blank `value`.',
    'Throws a ContractError when a `ToolbarLink` has no accessible name (text or `aria-label`).',
  ],
  llmNotes: [
    'Always give Toolbar an aria-label (or aria-labelledby). Always give an icon-only ToolbarButton or ToolbarToggleItem an aria-label.',
    'Use ToolbarToggleGroup with v-model for on/off or one-of-many controls; type="multiple" holds a string[], type="single" a string.',
    'Give every ToolbarToggleItem a unique non-empty value.',
    'Put related controls next to each other and divide groups with ToolbarSeparator; do not put form fields, long text or menus that need Tab inside a toolbar.',
    'Do not add tabindex to parts and do not nest a Toolbar in a Toolbar: roving focus is handled for you.',
    'Prefer overflow="wrap" (default). Use overflow="scroll" only when the bar must stay on one line, and keep the most important controls first.',
    'Use orientation="vertical" for a column of tools; the separator and arrow keys follow it.',
    'Parts must be rendered inside Toolbar; outside it reka-ui throws a missing-context error.',
    'Use Menubar for application menus with sub menus, ToggleGroup for a standalone group of toggles outside a toolbar.',
  ],
  replaces: ['shadcn-vue Toolbar', 'hand-rolled button rows with manual arrow-key handling'],
}

export default doc
