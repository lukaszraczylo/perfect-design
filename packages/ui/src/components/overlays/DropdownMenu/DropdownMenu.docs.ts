import { ref } from 'vue'
import { faEllipsis } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'DropdownMenu',
  group: 'overlays',
  subgroup: 'Menus',
  summary: 'Menu of actions opened from a button, with items, checkboxes, radios, groups and nested sub menus.',
  description:
    'Compose `DropdownMenu` + `DropdownMenuTrigger` + `DropdownMenuContent` and fill it with `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuGroup`, `DropdownMenuSub`, `SubTrigger`, `SubContent` and `DropdownMenuShortcut`. Items fire `select` (call `event.preventDefault()` to keep the menu open). Use for lists of ACTIONS; use `Select` (forms) for choosing a value and `Popover` for arbitrary content. Density: `density="compact"` (on `DropdownMenu`, or on `DropdownMenuContent` to override) tightens every row, label, separator and the surface padding for toolbars, table row actions and dense admin UIs; it propagates to all items and sub menus through provide/inject, so you set it once. `density="comfortable"` does the opposite: roomier rows for touch-first or sparse menus. `size` (`sm` | `md` | `lg`) sets the type scale, icon size and minimum width independently of the density; `md` is the default. The default density and size are unchanged. For a right-click menu use `ContextMenu`.',
  props: [
    { name: 'open', type: 'boolean', description: 'Controlled open state (v-model:open).' },
    { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Initial state when uncontrolled.' },
    { name: 'modal', type: 'boolean', default: 'true', description: 'Block pointer interaction outside while open.' },
    { name: 'dir', type: "'ltr' | 'rtl'", description: 'Reading direction (affects sub-menu arrow keys).' },
    { name: 'density', type: "'default' | 'compact' | 'comfortable'", default: "'default'", description: 'Row spacing for every part inside, sub menus included (unknown values fall back to default).' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Type scale, icon size and minimum width for every part inside (unknown values fall back to md).' },
  ],
  emits: [{ name: 'update:open', payload: '[value: boolean]', description: 'Open state changed.' }],
  slots: [{ name: 'default', description: 'DropdownMenuTrigger and DropdownMenuContent.' }],
  parts: [
    { name: 'DropdownMenuTrigger', description: 'Opens the menu (use as-child on a Button). Enter, Space and ArrowDown also open it.' },
    {
      name: 'DropdownMenuContent',
      description: 'Portalled menu surface (role=menu). Attributes fall through.',
      props: [
        { name: 'side', type: "'top' | 'right' | 'bottom' | 'left'", default: "'bottom'", description: 'Preferred side of the trigger.' },
        { name: 'align', type: "'start' | 'center' | 'end'", default: "'start'", description: 'Alignment along the side axis.' },
        { name: 'sideOffset', type: 'number', default: '4', description: 'Gap in px between trigger and menu.' },
        { name: 'loop', type: 'boolean', default: 'false', description: 'Wrap keyboard focus from last to first item.' },
        { name: 'density', type: "'default' | 'compact' | 'comfortable'", description: 'Overrides the density set on DropdownMenu for this menu (and its sub menus). Adds data-density when not default.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", description: 'Overrides the size set on DropdownMenu for this menu (and its sub menus). Adds data-size when not md.' },
        { name: 'class', type: 'string | object | array', description: 'Merged onto the surface.' },
      ],
    },
    {
      name: 'DropdownMenuItem',
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
      name: 'DropdownMenuCheckboxItem',
      description: 'Toggle row with a check indicator (role=menuitemcheckbox). v-model:modelValue.',
      props: [
        { name: 'modelValue', type: "boolean | 'indeterminate'", description: 'Checked state (v-model).' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the row.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last.' },
      ],
    },
    {
      name: 'DropdownMenuRadioGroup',
      description: 'Groups radio items (role=group). v-model:modelValue holds the selected value.',
      props: [{ name: 'modelValue', type: 'string', description: 'Selected radio value (v-model).' }],
    },
    {
      name: 'DropdownMenuRadioItem',
      description: 'Radio row with a dot indicator (role=menuitemradio).',
      props: [
        { name: 'value', type: 'string', required: true, description: 'Value written to the group when selected.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the row.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last.' },
      ],
    },
    { name: 'DropdownMenuLabel', description: 'Non-interactive heading row; supports `inset`.', props: [{ name: 'inset', type: 'boolean', default: 'false', description: 'Align with indicator rows.' }] },
    { name: 'DropdownMenuSeparator', description: 'Divider line (role=separator).' },
    { name: 'DropdownMenuGroup', description: 'Semantic group (role=group) of related items.' },
    { name: 'DropdownMenuSub', description: 'Wraps a SubTrigger + SubContent pair. Supports v-model:open.' },
    { name: 'DropdownMenuSubTrigger', description: 'Row that opens a sub menu (ArrowRight / hover); shows a chevron; supports `inset`.' },
    { name: 'DropdownMenuSubContent', description: 'Portalled sub-menu surface.' },
    { name: 'DropdownMenuShortcut', description: 'Right-aligned keyboard hint text inside an item (decorative).' },
  ],
  examples: [
    {
      title: 'Actions',
      code: `<DropdownMenu>
  <DropdownMenuTrigger as-child>
    <Button variant="outline" size="icon" aria-label="Open menu"><Icon :icon="faEllipsis" /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent class="w-56">
    <DropdownMenuLabel>My account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuItem>Profile <DropdownMenuShortcut>⌘P</DropdownMenuShortcut></DropdownMenuItem>
      <DropdownMenuItem>Settings <DropdownMenuShortcut>⌘,</DropdownMenuShortcut></DropdownMenuItem>
      <DropdownMenuItem disabled>Billing</DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Invite</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem>Email</DropdownMenuItem>
        <DropdownMenuItem>Link</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuSeparator />
    <DropdownMenuItem destructive>Delete account</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
      script: `import { faEllipsis } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faEllipsis }),
    },
    {
      title: 'Checkbox and radio items',
      script: `const showToolbar = ref(true)
const density = ref('comfortable')`,
      code: `<div class="flex items-center gap-3">
  <DropdownMenu>
    <DropdownMenuTrigger as-child><Button variant="outline">View</Button></DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuLabel>Appearance</DropdownMenuLabel>
      <DropdownMenuCheckboxItem v-model="showToolbar">Show toolbar</DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup v-model="density">
        <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
  <span class="text-sm text-muted-foreground">toolbar={{ showToolbar }}, density={{ density }}</span>
</div>`,
      state: () => ({ showToolbar: ref(true), density: ref('comfortable') }),
    },
    {
      title: 'Compact density',
      description: '`density="compact"` on `DropdownMenu` shrinks rows, labels, separators and padding for every item and sub menu inside. Touch targets stay 44px on coarse pointers.',
      script: `const showToolbar = ref(true)
const density = ref('comfortable')`,
      code: `<DropdownMenu density="compact">
  <DropdownMenuTrigger as-child><Button variant="outline" size="sm">Compact menu</Button></DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Row actions</DropdownMenuLabel>
    <DropdownMenuItem>Edit <DropdownMenuShortcut>⌘E</DropdownMenuShortcut></DropdownMenuItem>
    <DropdownMenuItem inset>Duplicate</DropdownMenuItem>
    <DropdownMenuCheckboxItem v-model="showToolbar">Pinned</DropdownMenuCheckboxItem>
    <DropdownMenuRadioGroup v-model="density">
      <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem>Inbox</DropdownMenuItem>
        <DropdownMenuItem>Archive</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuSeparator />
    <DropdownMenuItem destructive>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
      state: () => ({ showToolbar: ref(true), density: ref('comfortable') }),
    },
    {
      title: 'Densities and sizes',
      description: 'Gallery: `density` sets the row spacing (default, compact, comfortable) and `size` sets the type scale (sm, md, lg). Each menu is labelled by its trigger.',
      code: `<div class="flex flex-wrap items-center gap-2">
  <DropdownMenu v-for="density in ['default', 'compact', 'comfortable']" :key="density" :density="density">
    <DropdownMenuTrigger as-child><Button variant="outline" size="sm">{{ density }} density</Button></DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuLabel>Row actions</DropdownMenuLabel>
      <DropdownMenuItem>Edit</DropdownMenuItem>
      <DropdownMenuItem inset>Duplicate</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem destructive>Delete</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
  <DropdownMenu v-for="size in ['sm', 'md', 'lg']" :key="size" :size="size">
    <DropdownMenuTrigger as-child><Button variant="outline" size="sm">size {{ size }}</Button></DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuLabel>Row actions</DropdownMenuLabel>
      <DropdownMenuItem>Edit <DropdownMenuShortcut>Ctrl E</DropdownMenuShortcut></DropdownMenuItem>
      <DropdownMenuItem>Duplicate</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem destructive>Delete</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>`,
    },
    {
      title: 'Density override on the content',
      description: 'Set `density` on `DropdownMenuContent` to override the root, e.g. a compact menu inside an otherwise default-density app region.',
      code: `<DropdownMenu>
  <DropdownMenuTrigger as-child><Button variant="outline" size="sm">Compact via content</Button></DropdownMenuTrigger>
  <DropdownMenuContent density="compact">
    <DropdownMenuItem>Rename</DropdownMenuItem>
    <DropdownMenuItem>Share</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem destructive>Remove</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
    },
  ],
  a11y: [
    'Density and size change spacing and type only: roles, keyboard map and the 44px coarse-pointer row height are the same in every combination.',
    'Trigger: aria-haspopup=menu, aria-expanded. Content: role=menu. Items are menuitem, menuitemcheckbox or menuitemradio.',
    'Keyboard: Enter, Space and ArrowDown open. ArrowUp and ArrowDown move (skipping disabled), Home and End jump, ArrowRight and ArrowLeft open and close sub menus, typing jumps to a matching item, Esc closes and returns focus to the trigger.',
    'Icon-only triggers need an aria-label.',
    'The menu keeps 8px from the viewport edges (collision padding), scrolls when taller than the available space and never exceeds the viewport width. Rows are 44px high on coarse pointers. Highlight uses system colours in forced-colors mode. RTL mirrors indicators and chevrons.',
  ],
  related: ['ContextMenu', 'Popover', 'Command'],
  requires: [
    'Throws a ContractError when the element a `DropdownMenuTrigger` renders has no accessible name (an icon-only button needs `aria-label`).',
  ],
  llmNotes: [
    'Use DropdownMenuTrigger as-child on a Button; give icon-only triggers an aria-label.',
    'Run actions with @select on DropdownMenuItem; call event.preventDefault() to keep the menu open.',
    'Mark dangerous items with the destructive prop and put them last, after a DropdownMenuSeparator.',
    'Use DropdownMenuCheckboxItem/RadioGroup with v-model; do not simulate toggles with plain items.',
    'Menus are for actions, not form value selection; use Select for that.',
    'Use density="compact" on DropdownMenu for dense UIs (table row actions, toolbars); it applies to all items and sub menus. Default density is the right choice for primary navigation-like menus and touch-first screens.',
    'Unknown density or size values fall back to default and md; a density or size on DropdownMenuContent overrides the one on DropdownMenu.',
    'Use density="comfortable" for touch-first menus and size="sm" or "lg" to match the type scale around the trigger.',
  ],
  replaces: ['shadcn-vue DropdownMenu'],
}
export default doc
