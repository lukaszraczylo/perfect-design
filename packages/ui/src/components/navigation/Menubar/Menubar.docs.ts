import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const classProp = { name: 'class', type: 'string | object | array', description: 'Merged last (tailwind-merge).' }

const doc: ComponentDoc = {
  name: 'Menubar',
  group: 'navigation',
  subgroup: 'Menus',
  summary: 'Desktop-style horizontal menu bar (File, Edit, View) whose menus open from triggers with full keyboard roving.',
  description:
    'Compose `Menubar` > `MenubarMenu` > `MenubarTrigger` + `MenubarContent` and fill the content with `MenubarItem`, `MenubarCheckboxItem`, `MenubarRadioGroup` with `MenubarRadioItem`, `MenubarLabel`, `MenubarSeparator`, `MenubarGroup`, `MenubarSub` with `MenubarSubTrigger` and `MenubarSubContent` and `MenubarShortcut`. Once one menu is open, hovering or arrowing to a neighbouring trigger switches menus. Item styling is shared with `DropdownMenu`/`ContextMenu`. Use it for application command bars (editors, dashboards). Use `DropdownMenu` for a single action menu, `NavigationMenu` for site navigation links, `Command` for a search palette. Built on reka-ui `Menubar*`.',
  props: [
    { name: 'modelValue', type: 'string', description: 'Value of the open menu (v-model). Empty string = all closed.' },
    { name: 'defaultValue', type: 'string', description: 'Menu opened initially when uncontrolled.' },
    { name: 'loop', type: 'boolean', default: 'false', description: 'Wrap arrow-key focus from the last trigger to the first.' },
    { name: 'dir', type: "'ltr' | 'rtl'", description: 'Reading direction (swaps horizontal arrows).' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Height of the bar and size of its triggers: 32px, 36px or 44px. Unknown values fall back to `md`. The menus that open from it keep the shared menu styling.' },
    classProp,
  ],
  emits: [{ name: 'update:modelValue', payload: '[value: string]', description: 'The open menu changed ("" when all closed).' }],
  slots: [{ name: 'default', description: 'One or more MenubarMenu.', props: '{ modelValue: string }' }],
  parts: [
    { name: 'MenubarMenu', description: 'Pairs one trigger with its content. Renderless. Give it a unique `value`.', props: [{ name: 'value', type: 'string', description: 'Identity used by v-model; becomes the trigger id. Auto-generated when omitted.' }] },
    { name: 'MenubarTrigger', description: 'Bar button that opens its menu (role=menuitem, aria-haspopup=menu). Enter/Space/ArrowDown open.', props: [{ name: 'disabled', type: 'boolean', default: 'false', description: 'Not focusable by pointer, cannot open.' }, classProp] },
    {
      name: 'MenubarContent',
      description: 'Portalled menu surface (role=menu). Attributes fall through.',
      props: [
        { name: 'align', type: "'start' | 'center' | 'end'", default: "'start'", description: 'Alignment along the trigger.' },
        { name: 'sideOffset', type: 'number', default: '8', description: 'Gap in px between trigger and menu.' },
        { name: 'alignOffset', type: 'number', default: '-4', description: 'Offset along the alignment axis.' },
        { name: 'loop', type: 'boolean', default: 'false', description: 'Wrap item focus inside the menu.' },
        classProp,
      ],
    },
    {
      name: 'MenubarItem',
      description: 'Action row. Emits `select`; closes the menubar unless the event is default-prevented.',
      props: [
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Does not fire select.' },
        { name: 'destructive', type: 'boolean', default: 'false', description: 'Destructive colour (data-variant="destructive").' },
        { name: 'inset', type: 'boolean', default: 'false', description: 'Left padding aligning with indicator rows.' },
        { name: 'textValue', type: 'string', description: 'Text used for type-ahead when children are not plain text.' },
        classProp,
      ],
    },
    {
      name: 'MenubarCheckboxItem',
      description: 'Toggle row with check indicator (role=menuitemcheckbox). v-model.',
      props: [{ name: 'modelValue', type: "boolean | 'indeterminate'", description: 'Checked state (v-model).' }, { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the row.' }, classProp],
    },
    { name: 'MenubarRadioGroup', description: 'Groups radio items (role=group). v-model holds the selected value.', props: [{ name: 'modelValue', type: 'string', description: 'Selected value (v-model).' }] },
    {
      name: 'MenubarRadioItem',
      description: 'Radio row with dot indicator (role=menuitemradio).',
      props: [{ name: 'value', type: 'string', required: true, description: 'Value written to the group.' }, { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the row.' }, classProp],
    },
    { name: 'MenubarLabel', description: 'Non-interactive heading; supports `inset`.', props: [{ name: 'inset', type: 'boolean', default: 'false', description: 'Align with indicator rows.' }, classProp] },
    { name: 'MenubarSeparator', description: 'Divider line (role=separator).', props: [classProp] },
    { name: 'MenubarGroup', description: 'Semantic group (role=group) of related items.' },
    { name: 'MenubarSub', description: 'Wraps a SubTrigger + SubContent pair. Supports v-model:open.' },
    { name: 'MenubarSubTrigger', description: 'Row opening a sub menu (ArrowRight / hover); shows a chevron; supports `inset`.', props: [{ name: 'inset', type: 'boolean', default: 'false', description: 'Align with indicator rows.' }, classProp] },
    { name: 'MenubarSubContent', description: 'Portalled sub-menu surface.', props: [classProp] },
    { name: 'MenubarShortcut', description: 'Right-aligned keyboard hint text inside an item (decorative).', props: [classProp] },
  ],
  examples: [
    {
      title: 'Application menu',
      code: `<Menubar aria-label="Application menu">
  <MenubarMenu value="file">
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>New tab <MenubarShortcut>Ctrl+T</MenubarShortcut></MenubarItem>
      <MenubarItem>New window <MenubarShortcut>Ctrl+N</MenubarShortcut></MenubarItem>
      <MenubarItem disabled>New incognito window</MenubarItem>
      <MenubarSeparator />
      <MenubarSub>
        <MenubarSubTrigger>Share</MenubarSubTrigger>
        <MenubarSubContent>
          <MenubarItem>Email link</MenubarItem>
          <MenubarItem>Messages</MenubarItem>
        </MenubarSubContent>
      </MenubarSub>
      <MenubarSeparator />
      <MenubarItem destructive>Close window <MenubarShortcut>Ctrl+W</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu value="edit">
    <MenubarTrigger>Edit</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Undo <MenubarShortcut>Ctrl+Z</MenubarShortcut></MenubarItem>
      <MenubarItem>Redo <MenubarShortcut>Ctrl+Shift+Z</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
    },
    {
      title: 'Sizes',
      description: 'Gallery of `sm`, `md` and `lg`.',
      code: `<div class="flex flex-col items-start gap-3">
  <Menubar v-for="size in ['sm', 'md', 'lg']" :key="size" :size="size" :aria-label="'Menu bar ' + size">
    <MenubarMenu :value="'file-' + size"><MenubarTrigger>File {{ size }}</MenubarTrigger><MenubarContent><MenubarItem>Open</MenubarItem></MenubarContent></MenubarMenu>
    <MenubarMenu :value="'edit-' + size"><MenubarTrigger>Edit</MenubarTrigger><MenubarContent><MenubarItem>Undo</MenubarItem></MenubarContent></MenubarMenu>
  </Menubar>
</div>`,
    },
    {
      title: 'Checkbox and radio items',
      script: `const showBookmarks = ref(true)
const profile = ref('b')`,
      state: () => ({ showBookmarks: ref(true), profile: ref('b') }),
      code: `<div class="flex flex-col gap-3">
  <Menubar aria-label="View options">
    <MenubarMenu value="view">
      <MenubarTrigger>View</MenubarTrigger>
      <MenubarContent>
        <MenubarLabel>Toolbars</MenubarLabel>
        <MenubarCheckboxItem v-model="showBookmarks">Always show bookmarks</MenubarCheckboxItem>
        <MenubarSeparator />
        <MenubarLabel>Profiles</MenubarLabel>
        <MenubarRadioGroup v-model="profile">
          <MenubarRadioItem value="a">Profile A</MenubarRadioItem>
          <MenubarRadioItem value="b">Profile B</MenubarRadioItem>
        </MenubarRadioGroup>
      </MenubarContent>
    </MenubarMenu>
  </Menubar>
  <span class="text-sm text-muted-foreground">bookmarks={{ showBookmarks }}, profile={{ profile }}</span>
</div>`,
    },
    {
      title: 'Controlled (v-model)',
      script: `const open = ref('')`,
      state: () => ({ open: ref('') }),
      code: `<div class="flex flex-col gap-3">
  <Menubar v-model="open" loop aria-label="Controlled menu">
    <MenubarMenu value="file"><MenubarTrigger>File</MenubarTrigger><MenubarContent><MenubarItem>Open</MenubarItem></MenubarContent></MenubarMenu>
    <MenubarMenu value="help"><MenubarTrigger>Help</MenubarTrigger><MenubarContent><MenubarItem>About</MenubarItem></MenubarContent></MenubarMenu>
  </Menubar>
  <span class="text-sm text-muted-foreground">open = "{{ open }}"</span>
</div>`,
    },
  ],
  a11y: [
    'Root has role=menubar; triggers are role=menuitem with aria-haspopup=menu and aria-expanded; content is role=menu with menuitem / menuitemcheckbox / menuitemradio rows.',
    'Keyboard: ArrowLeft/Right move between triggers (swapped in RTL, wraps with `loop`); Enter/Space/ArrowDown open; inside a menu ArrowUp/Down move (skipping disabled), ArrowRight/Left open/close sub menus or step to the neighbouring menu, Home/End jump, type-ahead; Escape closes and returns focus to the trigger.',
    'Give the bar an aria-label. Do not set `id` on MenubarTrigger: the menu `value` is its id.',
    'Disabled triggers and items stay in the DOM with data-disabled and are skipped by keyboard.',
    'Shortcut text is a visual hint only; wire the real keyboard shortcut in your app. Triggers and rows are 44px high on coarse pointers (24px minimum on the `sm` bar), the bar scrolls inside itself at narrow widths, and highlighted rows use system colours in forced-colors mode.',
  ],
  related: ['DropdownMenu', 'ContextMenu', 'NavigationMenu', 'Command'],
  requires: [
    'Throws a ContractError when `Menubar` has no accessible name (`aria-label` or `aria-labelledby`).',
    'Throws a ContractError when two `MenubarMenu`s share a `value`, or a menu has a blank `value`.',
    'Throws a ContractError when a `MenubarMenu` has no `MenubarTrigger` or no `MenubarContent`.',
    'Throws a ContractError when a `MenubarTrigger` has no accessible name (text or `aria-label`).',
  ],
  llmNotes: [
    'Always wrap each trigger and its content in MenubarMenu with a unique `value`.',
    'Run actions with @select on MenubarItem; call event.preventDefault() to keep the menu open.',
    'Use destructive on dangerous items and place them last after a MenubarSeparator.',
    'Use MenubarCheckboxItem / MenubarRadioGroup with v-model for toggles and single choices.',
    'Menubar is for application commands; use NavigationMenu for site links and DropdownMenu for one standalone menu.',
    'Do not set `id` on MenubarTrigger. Add aria-label to the Menubar.',
  ],
  replaces: ['shadcn-vue Menubar'],
}
export default doc
