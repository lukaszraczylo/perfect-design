import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'ContextMenu',
  group: 'overlays',
  subgroup: 'Menus',
  summary: 'Right-click (long-press on touch) menu with items, checkboxes, radios, groups and nested sub menus.',
  description:
    'Compose `ContextMenu` + `ContextMenuTrigger` (the region that reacts to right-click or touch long-press) + `ContextMenuContent`, then reuse the same part set as `DropdownMenu`: `ContextMenuItem`, `ContextMenuCheckboxItem`, `ContextMenuRadioGroup`, `ContextMenuRadioItem`, `ContextMenuLabel`, `ContextMenuSeparator`, `ContextMenuGroup`, `ContextMenuSub`, `SubTrigger`, `SubContent` and `ContextMenuShortcut`. The menu opens at the pointer position. Never make it the only way to reach an action: also expose the action in a visible control (touch and keyboard users). Use `DropdownMenu` for button-triggered menus. `density` (`default` | `compact` | `comfortable`) sets the row spacing and `size` (`sm` | `md` | `lg`) sets the type scale, icon size and minimum width, exactly as on `DropdownMenu`; set them once on `ContextMenu` (or on `ContextMenuContent` to override) and every part and sub menu follows. The defaults are unchanged.',
  props: [
    { name: 'open', type: 'boolean', description: 'Controlled open state (v-model:open).' },
    { name: 'modal', type: 'boolean', default: 'true', description: 'Block pointer interaction outside while open.' },
    { name: 'pressOpenDelay', type: 'number', default: '700', description: 'Touch long-press duration in ms before the menu opens.' },
    { name: 'dir', type: "'ltr' | 'rtl'", description: 'Reading direction (affects sub-menu arrow keys).' },
    { name: 'density', type: "'default' | 'compact' | 'comfortable'", default: "'default'", description: 'Row spacing for every part inside, sub menus included (unknown values fall back to default).' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Type scale, icon size and minimum width for every part inside (unknown values fall back to md).' },
  ],
  emits: [{ name: 'update:open', payload: '[value: boolean]', description: 'Open state changed.' }],
  slots: [{ name: 'default', description: 'ContextMenuTrigger and ContextMenuContent.' }],
  parts: [
    { name: 'ContextMenuTrigger', description: 'Region that opens the menu on right-click / long-press. Renders a span by default; use as-child or `as="div"` for blocks.', props: [{ name: 'disabled', type: 'boolean', default: 'false', description: 'Use the native browser menu instead.' }] },
    {
      name: 'ContextMenuContent',
      description: 'Portalled menu surface (role=menu). Attributes fall through.',
      props: [
        { name: 'side', type: "'top' | 'right' | 'bottom' | 'left'", default: "'right'", description: 'Preferred side of the pointer.' },
        { name: 'align', type: "'start' | 'center' | 'end'", default: "'start'", description: 'Alignment along the side axis.' },
        { name: 'sideOffset', type: 'number', default: '2', description: 'Gap in px between pointer and menu.' },
        { name: 'loop', type: 'boolean', default: 'false', description: 'Wrap keyboard focus from last to first item.' },
        { name: 'density', type: "'default' | 'compact' | 'comfortable'", description: 'Overrides the density set on ContextMenu for this menu (and its sub menus). Adds data-density when not default.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", description: 'Overrides the size set on ContextMenu for this menu (and its sub menus). Adds data-size when not md.' },
        { name: 'class', type: 'string | object | array', description: 'Merged onto the surface.' },
      ],
    },
    {
      name: 'ContextMenuItem',
      description: 'Action row. Emits `select`; closes the menu unless the event is default-prevented.',
      props: [
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Not focusable by pointer, does not fire select.' },
        { name: 'destructive', type: 'boolean', default: 'false', description: 'Destructive colour (data-variant="destructive").' },
        { name: 'inset', type: 'boolean', default: 'false', description: 'Left padding to align with rows that have an indicator.' },
        { name: 'textValue', type: 'string', description: 'Text used for type-ahead when children are not plain text.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last.' },
      ],
    },
    {
      name: 'ContextMenuCheckboxItem',
      description: 'Toggle row with a check indicator (role=menuitemcheckbox). v-model:modelValue.',
      props: [
        { name: 'modelValue', type: "boolean | 'indeterminate'", description: 'Checked state (v-model).' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the row.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last.' },
      ],
    },
    {
      name: 'ContextMenuRadioGroup',
      description: 'Groups radio items (role=group). v-model:modelValue holds the selected value.',
      props: [{ name: 'modelValue', type: 'string', description: 'Selected radio value (v-model).' }],
    },
    {
      name: 'ContextMenuRadioItem',
      description: 'Radio row with a dot indicator (role=menuitemradio).',
      props: [
        { name: 'value', type: 'string', required: true, description: 'Value written to the group when selected.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the row.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last.' },
      ],
    },
    { name: 'ContextMenuLabel', description: 'Non-interactive heading row; supports `inset`.', props: [{ name: 'inset', type: 'boolean', default: 'false', description: 'Align with indicator rows.' }] },
    { name: 'ContextMenuSeparator', description: 'Divider line (role=separator).' },
    { name: 'ContextMenuGroup', description: 'Semantic group (role=group) of related items.' },
    { name: 'ContextMenuSub', description: 'Wraps a SubTrigger + SubContent pair. Supports v-model:open.' },
    { name: 'ContextMenuSubTrigger', description: 'Row that opens a sub menu (ArrowRight / hover); shows a chevron; supports `inset`.' },
    { name: 'ContextMenuSubContent', description: 'Portalled sub-menu surface.' },
    { name: 'ContextMenuShortcut', description: 'Right-aligned keyboard hint text inside an item (decorative).' },
  ],
  examples: [
    {
      title: 'Basic',
      code: `<ContextMenu>
  <ContextMenuTrigger as="div" class="flex h-32 w-72 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
    Right click here
  </ContextMenuTrigger>
  <ContextMenuContent class="w-56">
    <ContextMenuLabel>File</ContextMenuLabel>
    <ContextMenuSeparator />
    <ContextMenuItem>Open <ContextMenuShortcut>⌘O</ContextMenuShortcut></ContextMenuItem>
    <ContextMenuItem>Rename</ContextMenuItem>
    <ContextMenuItem disabled>Share</ContextMenuItem>
    <ContextMenuSub>
      <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Projects</ContextMenuItem>
        <ContextMenuItem>Archive</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
    <ContextMenuSeparator />
    <ContextMenuItem destructive>Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
    },
    {
      title: 'Checkbox and radio items',
      script: `const showHidden = ref(false)
const sort = ref('name')`,
      code: `<ContextMenu>
  <ContextMenuTrigger as="div" class="flex h-24 w-72 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
    hidden={{ showHidden }}, sort={{ sort }}
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuCheckboxItem v-model="showHidden">Show hidden files</ContextMenuCheckboxItem>
    <ContextMenuSeparator />
    <ContextMenuRadioGroup v-model="sort">
      <ContextMenuRadioItem value="name">Sort by name</ContextMenuRadioItem>
      <ContextMenuRadioItem value="date">Sort by date</ContextMenuRadioItem>
    </ContextMenuRadioGroup>
  </ContextMenuContent>
</ContextMenu>`,
      state: () => ({ showHidden: ref(false), sort: ref('name') }),
    },
    {
      title: 'Densities and sizes',
      description: 'Gallery: `density` (default, compact, comfortable) and `size` (sm, md, lg) set once on the root. Right click each area.',
      code: `<div class="flex flex-wrap gap-3">
  <ContextMenu v-for="density in ['default', 'compact', 'comfortable']" :key="density" :density="density">
    <ContextMenuTrigger as="div" class="flex h-20 w-40 items-center justify-center rounded-md border border-dashed px-2 text-center text-sm text-muted-foreground">{{ density }} density</ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuLabel>File</ContextMenuLabel>
      <ContextMenuItem>Open</ContextMenuItem>
      <ContextMenuItem inset>Rename</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem destructive>Delete</ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
  <ContextMenu v-for="size in ['sm', 'md', 'lg']" :key="size" :size="size">
    <ContextMenuTrigger as="div" class="flex h-20 w-40 items-center justify-center rounded-md border border-dashed px-2 text-center text-sm text-muted-foreground">size {{ size }}</ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuLabel>File</ContextMenuLabel>
      <ContextMenuItem>Open <ContextMenuShortcut>Ctrl O</ContextMenuShortcut></ContextMenuItem>
      <ContextMenuItem>Rename</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem destructive>Delete</ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</div>`,
    },
  ],
  a11y: [
    'Density and size change spacing and type only: roles, keyboard map and the 44px coarse-pointer row height are the same in every combination.',
    'Content: role=menu. Items are menuitem, menuitemcheckbox or menuitemradio.',
    'Keyboard: opens wherever the browser fires a contextmenu event (ContextMenu key, Shift+F10). ArrowUp and ArrowDown move (skipping disabled), Home and End jump, ArrowRight and ArrowLeft open and close sub menus, typing jumps to a matching item, Esc closes and returns focus.',
    'Touch: long-press opens it. Always provide a visible alternative for the same actions.',
    'The menu keeps 8px from the viewport edges (collision padding), never grows beyond the available height (it scrolls) and never exceeds the viewport width. Rows are 44px high on coarse pointers. Highlight uses system colours in forced-colors mode. RTL mirrors indicators and chevrons.',
  ],
  related: ['DropdownMenu', 'Popover', 'Command'],
  requires: [
    'Throws a ContractError when the element a `ContextMenuTrigger` renders has no accessible name (an area without text needs `aria-label`).',
  ],
  llmNotes: [
    'ContextMenuTrigger wraps the region that should react to right-click; use as="div" for block regions.',
    'Never put an action ONLY in a context menu; mirror it in a visible control or DropdownMenu.',
    'Run actions with @select on ContextMenuItem; call event.preventDefault() to keep the menu open.',
    'Mark dangerous items with the destructive prop and put them last.',
    'Set density (default, compact, comfortable) and size (sm, md, lg) once on ContextMenu; a value on ContextMenuContent overrides it. Unknown values fall back to default and md.',
  ],
  replaces: ['shadcn-vue ContextMenu'],
}
export default doc
