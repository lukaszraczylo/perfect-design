import { ref } from 'vue'
import { faCalendar, faGear, faUser } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Command',
  group: 'overlays',
  subgroup: 'Menus',
  summary: 'Searchable command palette: an input that filters a keyboard-navigable list of items. Inline or inside a modal `CommandDialog`.',
  description:
    'Compose `Command` + `CommandInput` + `CommandList` (+ `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut`, `CommandSeparator`). Items are filtered as the user types: every whitespace-separated word of the search must appear (case-insensitive) in the item `value` or its `keywords`. ArrowUp/ArrowDown move the highlight (disabled items are skipped, focus stays in the input), Enter runs the highlighted item via its `select` event, and the first match is highlighted automatically while typing. Use `CommandDialog` for a global Cmd/Ctrl+K palette. Set `shouldFilter` to false to filter yourself (async/server search). `variant` sets where it sits: `palette` (default) is borderless and fills its surface (a `CommandDialog` or a popover); `inline` adds a border and a light shadow so the command list can sit in a page like a card. `size` (`sm` | `md` | `lg`) sets the height of the search row, the row padding and type, and the maximum list height; `CommandDialog` takes the same `size` and also sets its width. Defaults are unchanged. Use `DropdownMenu` for fixed action lists and `Select` or `Combobox` (forms) for picking a form value.',
  props: [
    { name: 'defaultValue', type: 'string | string[]', description: 'Initially selected value(s) when uncontrolled (reka-ui Listbox).' },
    { name: 'multiple', type: 'boolean', description: 'Allow selecting more than one item.' },
    { name: 'orientation', type: "'vertical' | 'horizontal'", description: 'Arrow-key direction (reka-ui Listbox).' },
    { name: 'dir', type: "'ltr' | 'rtl'", description: 'Reading direction for keyboard navigation.' },
    { name: 'disabled', type: 'boolean', description: 'Disable the whole list.' },
    { name: 'selectionBehavior', type: "'toggle' | 'replace'", description: 'How selection behaves in multiple mode (reka-ui).' },
    { name: 'by', type: 'string | ((a: unknown, b: unknown) => boolean)', description: 'How to compare object values.' },
    { name: 'asChild', type: 'boolean', description: 'Render the single slot child instead of a wrapper element.' },
    { name: 'as', type: 'string | Component', description: 'Element or component to render as.' },
    { name: 'name', type: 'string', description: 'Form field name when the list takes part in a form.' },
    { name: 'required', type: 'boolean', description: 'Mark the list required inside a form.' },
    { name: 'search', type: 'string', default: "''", description: 'Search text (v-model:search).' },
    { name: 'modelValue', type: 'string | number | object', description: 'Last selected item value (v-model). Prefer the item `select` event for actions.' },
    { name: 'shouldFilter', type: 'boolean', default: 'true', description: 'Filter items by the search text. Turn off for custom/async filtering.' },
    { name: 'loop', type: 'boolean', default: 'true', description: 'Wrap keyboard highlight from last to first item.' },
    { name: 'highlightOnHover', type: 'boolean', default: 'true', description: 'Highlight the item under the pointer.' },
    { name: 'variant', type: "'palette' | 'inline'", default: "'palette'", description: 'Surface: `palette` fills its container without a border, `inline` adds a border and light shadow (unknown values fall back to palette). Adds data-variant when inline.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Search row height, row padding and type, and list max height (unknown values fall back to md). Adds data-size when not md.' },
    { name: 'class', type: 'string | object | array', description: 'Merged onto the root.' },
  ],
  emits: [
    { name: 'update:search', payload: '[value: string]', description: 'Search text changed.' },
    { name: 'update:modelValue', payload: '[value: AcceptableValue]', description: 'An item was selected.' },
  ],
  slots: [{ name: 'default', description: 'CommandInput and CommandList.' }],
  parts: [
    { name: 'CommandInput', description: 'Search field with a magnifier icon. Native input attributes (placeholder, aria-label, disabled) fall through.' },
    {
      name: 'CommandList',
      description: 'Scrollable listbox (max-h-80) that contains the groups and items.',
      props: [{ name: 'label', type: 'string', default: "'Results'", description: 'Accessible name of the listbox. Ignored when `aria-labelledby` is passed.' }],
    },
    { name: 'CommandEmpty', description: 'Shown only when no item matches. Default text "No results found."' },
    {
      name: 'CommandGroup',
      description: 'Labelled group; hidden while none of its items match.',
      props: [{ name: 'heading', type: 'string', description: 'Group heading text.' }],
    },
    {
      name: 'CommandItem',
      description: 'Selectable row (role=option). Emits `select`.',
      props: [
        { name: 'value', type: 'string | number | object', required: true, description: 'Identity and primary search text (objects are only searchable through keywords).' },
        { name: 'keywords', type: 'string[]', description: 'Extra search terms that are not visible.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Skipped by keyboard navigation and cannot be selected.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last.' },
      ],
    },
    { name: 'CommandShortcut', description: 'Right-aligned keyboard hint inside an item (decorative).' },
    { name: 'CommandSeparator', description: 'Divider between groups; hidden while a search is active.' },
    {
      name: 'CommandDialog',
      description: 'Modal wrapper: Dialog + sr-only title/description + a Command. Put CommandInput/CommandList inside. Supports v-model:open and v-model:search.',
      props: [
        { name: 'open', type: 'boolean', description: 'Controlled open state (v-model:open).' },
        { name: 'title', type: 'string', default: "'Command palette'", description: 'Screen-reader title.' },
        { name: 'description', type: 'string', default: "'Search for a command and press Enter to run it.'", description: 'Screen-reader description.' },
        { name: 'shouldFilter', type: 'boolean', default: 'true', description: 'Forwarded to Command.' },
        { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Dialog max width from the sm breakpoint (28rem, 36rem, 42rem) and the Command size inside (unknown values fall back to md).' },
        { name: 'class', type: 'string | object | array', description: 'Merged onto the dialog panel.' },
      ],
    },
  ],
  examples: [
    {
      title: 'Inline command list',
      code: `<Command class="max-w-md rounded-lg border shadow-md">
  <CommandInput placeholder="Type a command or search..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Suggestions">
      <CommandItem value="calendar"><Icon :icon="faCalendar" />Calendar</CommandItem>
      <CommandItem value="profile" :keywords="['account', 'user']"><Icon :icon="faUser" />Profile <CommandShortcut>⌘P</CommandShortcut></CommandItem>
      <CommandItem value="billing" disabled>Billing (disabled)</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Settings">
      <CommandItem value="settings"><Icon :icon="faGear" />Settings <CommandShortcut>⌘,</CommandShortcut></CommandItem>
    </CommandGroup>
  </CommandList>
</Command>`,
      script: `import { faCalendar, faGear, faUser } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faCalendar, faGear, faUser }),
    },
    {
      title: 'Variants and sizes',
      description: 'Gallery: `variant="inline"` adds a border and light shadow for use in a page; `size` sm, md and lg change the row height, type and list height.',
      code: `<div class="flex flex-col gap-4">
  <Command variant="inline" class="max-w-md">
    <CommandInput placeholder="Inline variant" aria-label="Search inline commands" />
    <CommandList label="Inline results">
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandItem value="inline-one">First command</CommandItem>
      <CommandItem value="inline-two">Second command</CommandItem>
    </CommandList>
  </Command>
  <Command v-for="size in ['sm', 'md', 'lg']" :key="size" variant="inline" :size="size" class="max-w-md">
    <CommandInput :placeholder="'Size ' + size" :aria-label="'Search size ' + size" />
    <CommandList :label="'Results size ' + size">
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading="Commands">
        <CommandItem :value="'open-' + size">Open file <CommandShortcut>Ctrl O</CommandShortcut></CommandItem>
        <CommandItem :value="'save-' + size">Save file</CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
</div>`,
    },
    {
      title: 'Command palette dialog',
      script: `const open = ref(false)
const picked = ref('none')`,
      code: `<div class="flex items-center gap-3">
  <Button variant="outline" @click="open = true">Open palette</Button>
  <span class="text-sm text-muted-foreground">picked: {{ picked }}</span>
</div>
<CommandDialog v-model:open="open" title="Quick actions" description="Search and run an action">
  <CommandInput placeholder="Search actions..." />
  <CommandList>
    <CommandEmpty>Nothing found.</CommandEmpty>
    <CommandGroup heading="Actions">
      <CommandItem value="new-file" @select="picked = 'new-file'; open = false">New file</CommandItem>
      <CommandItem value="open-settings" :keywords="['preferences']" @select="picked = 'settings'; open = false">Open settings</CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>`,
      state: () => ({ open: ref(false), picked: ref('none') }),
    },
  ],
  a11y: [
    'CommandInput is the combobox-style text field (default aria-label "Search", override it). CommandList is a named listbox (`label`, default "Results") and items are role=option. The highlighted option is exposed through aria-activedescendant.',
    'Keyboard: type to filter. ArrowUp and ArrowDown move the highlight (disabled items are skipped, it wraps). Home and End jump. Enter selects. Esc closes a CommandDialog.',
    'Size and variant change spacing, type and the border only. The input name, listbox name, option roles, keyboard map and live status region are the same in every combination; `lg` uses 16px input text.',
    'Separators are decorative (hidden from assistive tech), so the listbox contains only options and groups.',
    'A visually hidden status region reports the number of results, or "No results found.", as the search changes. CommandEmpty is the visible counterpart.',
    'CommandDialog is a labelled modal dialog (title and description are screen-reader only).',
  ],
  related: ['Dialog', 'DropdownMenu', 'Combobox'],
  requires: [
    'Throws a ContractError when a `Command` renders no `CommandEmpty` (it has a default message, and an empty search must be announced).',
    'Throws a ContractError when a `CommandItem` has no `value` (or a blank one), or shares its `value` with another item in the same `Command`.',
    'Throws a ContractError when `CommandInput` or `CommandList` has no accessible name (they default to "Search" and "Results"; blanking them throws).',
    'Throws a ContractError when `CommandDialog` has a blank `title` (it is the screen-reader name of the dialog).',
  ],
  llmNotes: [
    'Run actions with @select on CommandItem (close the dialog yourself with v-model:open).',
    'Every CommandItem needs a unique value; searchable text is the value plus keywords, not the rendered label, so use a descriptive value or add keywords.',
    'Always render a CommandEmpty so empty results are announced.',
    'For a global Cmd/Ctrl+K shortcut register the keydown listener in your app and toggle CommandDialog v-model:open (and remove the listener on unmount).',
    'Use shouldFilter=false when results come from the server.',
    'Use variant="inline" for a command list placed in a page (border and shadow); the default palette variant is for CommandDialog and popovers. size (sm, md, lg) and variant fall back to md and palette when unknown.',
  ],
  replaces: ['hand-rolled Command markup in app code'],
}
export default doc
