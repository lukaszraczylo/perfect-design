import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'
import { useHotkeys } from '../../../lib/hotkeys'

const sampleShortcuts = `[
  { keys: 'mod+k', description: 'Search the catalogue', group: 'Navigation' },
  { keys: 'g then d', description: 'Go to the dashboard', group: 'Navigation' },
  { keys: 'g then o', description: 'Go to orders', group: 'Navigation' },
  { keys: 'n', description: 'Create a shipment', group: 'Shipments' },
  { keys: 'shift+e', description: 'Export the selected rows', group: 'Shipments' },
]`

const doc: ComponentDoc = {
  name: 'ShortcutsDialog',
  group: 'overlays',
  subgroup: 'Modals',
  summary: 'Help dialog that lists the keyboard shortcuts of a page, grouped, with keys drawn as Kbd chips. Opens with `?` by default.',
  description:
    'Use it once per page or app shell. Shortcuts come from two places: everything registered with the `useHotkeys` composable (listed automatically, grouped by `group`, with its `description`), and an optional `shortcuts` array for display-only entries such as combos the browser owns. Entries without a description are not listed.\n\n' +
    '`useHotkeys(map | array | getter, options?)` registers combos for the life of a component: `"mod+k"` (`mod` is Cmd on macOS and Ctrl elsewhere), plain keys (`"?"`, `"esc"`, `"f5"`), and sequences joined with `then` (`"g then d"`, up to 5 steps, `timeout` ms between steps, default 1000). It listens on the document, or on one element with `target`. Events that come from inputs, textareas, selects and contenteditable elements are ignored unless `allowInInputs` is set. Events that are already `defaultPrevented`, and (unless `allowInModal` is set) key presses outside an open `aria-modal="true"` dialog, are ignored too. `shift+1` matches the physical digit key; Alt+letter matches the character the layout produces. `preventDefault` defaults to true. Invalid combos (empty, modifier-only, unknown key names, longer than 5 steps) are ignored and warned about in development. Two shortcuts that collide (same combo, or one sequence starting another) warn in development and are silent in production. Write punctuation as the character it produces (`"?"`, not `"shift+/"`). The registry is filled on mount in the browser only, so server rendering is safe. `listHotkeys()`, `useRegisteredHotkeys()`, `parseHotkey()` and `formatHotkey()` are exported for custom help screens.\n\n' +
    'Variations: `size` (`sm` | `md` | `lg` | `xl`) is the max width from the `sm` breakpoint up; `layout` is `list` (one column) or `columns` (two columns from `sm` up, pair with `size="lg"`); `density` is `comfortable` or `compact`; `headingLevel` sets the level of the group names (the dialog title is an h2). Open it with the `hotkey`, with a `trigger` slot, or with `v-model:open`. While it is open, other registered shortcuts still run: disable them with their `enabled` option if they would act on the page behind the dialog. Use `Command` for a searchable palette and `Dialog` for anything that is not a shortcut list.',
  status: 'beta',
  props: [
    { name: 'title', type: 'string', required: true, description: 'Accessible name and visible heading of the dialog. Throws a ContractError when blank.' },
    { name: 'description', type: 'string', description: 'Supporting text under the title (aria-describedby).' },
    { name: 'open', type: 'boolean', default: 'false', description: 'Open state (v-model:open). Uncontrolled when omitted.' },
    { name: 'hotkey', type: 'string', default: "'?'", description: 'Combo that opens the dialog, e.g. `?` or `mod+/`. An empty string turns it off. An invalid combo throws a ContractError.' },
    { name: 'hotkeyLabel', type: 'string', default: "'Show keyboard shortcuts'", description: 'Description the dialog\'s own shortcut gets in the list.' },
    { name: 'registered', type: 'boolean', default: 'true', description: 'Also list every shortcut registered with `useHotkeys` on the page.' },
    { name: 'shortcuts', type: 'ShortcutItem[]', default: '[]', description: 'Display-only entries: `{ keys, description, group? }`. Invalid combos and blank descriptions are skipped. Duplicates of registered entries are merged.' },
    { name: 'emptyText', type: 'string', default: "'No keyboard shortcuts are registered on this page.'", description: 'Shown when nothing is listed.' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Max width from the `sm` breakpoint up: max-w-sm, max-w-lg, max-w-2xl, max-w-4xl. Unknown values fall back to md.' },
    { name: 'layout', type: "'list' | 'columns'", default: "'list'", description: '`list` stacks the groups in one column; `columns` uses two columns from the `sm` breakpoint up. Unknown values fall back to list.' },
    { name: 'density', type: "'comfortable' | 'compact'", default: "'comfortable'", description: 'Row padding, text size and key chip size. Unknown values fall back to comfortable.' },
    { name: 'headingLevel', type: '3 | 4 | 5 | 6', default: '3', description: 'Heading level of the group names. Unknown values fall back to 3.' },
    { name: 'class', type: 'string | object | array', description: 'Merged onto the dialog panel (wins over internal classes).' },
  ],
  slots: [{ name: 'trigger', description: 'Element that opens the dialog (rendered as the trigger; use a Button).' }],
  emits: [{ name: 'update:open', payload: '[value: boolean]', description: 'Open state changed.' }],
  examples: [
    {
      title: 'Registered shortcuts',
      description: 'Shortcuts registered with `useHotkeys` appear in the dialog with their group and description. Press `?` (outside a text field) or use the button.',
      script: `const last = ref('none')
useHotkeys({
  'mod+k': { handler: () => (last.value = 'search'), description: 'Search the catalogue', group: 'Navigation' },
  'g then d': { handler: () => (last.value = 'dashboard'), description: 'Go to the dashboard', group: 'Navigation' },
  'g then o': { handler: () => (last.value = 'orders'), description: 'Go to orders', group: 'Navigation' },
  n: { handler: () => (last.value = 'new shipment'), description: 'Create a shipment', group: 'Shipments' },
})`,
      code: `<div class="flex flex-wrap items-center gap-3">
  <ShortcutsDialog title="Keyboard shortcuts" description="Shortcuts for the Kestrel Freight console. Sample data.">
    <template #trigger><Button variant="outline">Show shortcuts</Button></template>
  </ShortcutsDialog>
  <p role="status" class="text-sm text-muted-foreground">Last shortcut: {{ last }}</p>
</div>`,
      state: () => {
        const last = ref('none')
        useHotkeys({
          'mod+k': { handler: () => (last.value = 'search'), description: 'Search the catalogue', group: 'Navigation' },
          'g then d': { handler: () => (last.value = 'dashboard'), description: 'Go to the dashboard', group: 'Navigation' },
          'g then o': { handler: () => (last.value = 'orders'), description: 'Go to orders', group: 'Navigation' },
          n: { handler: () => (last.value = 'new shipment'), description: 'Create a shipment', group: 'Shipments' },
        })
        return { last }
      },
    },
    {
      title: 'Display-only list',
      description: 'With `registered` off and `hotkey` empty the dialog shows only the `shortcuts` you pass. Open it with `v-model:open`.',
      script: `const open = ref(false)
const shortcuts = ${sampleShortcuts}`,
      code: `<div>
  <Button variant="outline" @click="open = true">Open the list</Button>
  <ShortcutsDialog v-model:open="open" title="Console shortcuts" hotkey="" :registered="false" :shortcuts="shortcuts" />
</div>`,
      state: () => ({
        open: ref(false),
        shortcuts: [
          { keys: 'mod+k', description: 'Search the catalogue', group: 'Navigation' },
          { keys: 'g then d', description: 'Go to the dashboard', group: 'Navigation' },
          { keys: 'g then o', description: 'Go to orders', group: 'Navigation' },
          { keys: 'n', description: 'Create a shipment', group: 'Shipments' },
          { keys: 'shift+e', description: 'Export the selected rows', group: 'Shipments' },
        ],
      }),
    },
    {
      title: 'Two columns',
      description: '`layout="columns"` places the groups side by side from the `sm` breakpoint up; use a wider `size`.',
      script: `const shortcuts = ${sampleShortcuts}`,
      code: `<ShortcutsDialog title="Shortcuts in two columns" hotkey="" :registered="false" :shortcuts="shortcuts" layout="columns" size="lg">
  <template #trigger><Button variant="outline">Columns</Button></template>
</ShortcutsDialog>`,
      state: () => ({
        shortcuts: [
          { keys: 'mod+k', description: 'Search the catalogue', group: 'Navigation' },
          { keys: 'g then d', description: 'Go to the dashboard', group: 'Navigation' },
          { keys: 'g then o', description: 'Go to orders', group: 'Navigation' },
          { keys: 'n', description: 'Create a shipment', group: 'Shipments' },
          { keys: 'shift+e', description: 'Export the selected rows', group: 'Shipments' },
        ],
      }),
    },
    {
      title: 'Compact density',
      description: '`density="compact"` tightens the rows and shrinks the key chips for long lists.',
      script: `const shortcuts = ${sampleShortcuts}`,
      code: `<ShortcutsDialog title="Compact shortcuts" hotkey="" :registered="false" :shortcuts="shortcuts" density="compact">
  <template #trigger><Button variant="outline">Compact</Button></template>
</ShortcutsDialog>`,
      state: () => ({
        shortcuts: [
          { keys: 'mod+k', description: 'Search the catalogue', group: 'Navigation' },
          { keys: 'g then d', description: 'Go to the dashboard', group: 'Navigation' },
          { keys: 'g then o', description: 'Go to orders', group: 'Navigation' },
          { keys: 'n', description: 'Create a shipment', group: 'Shipments' },
          { keys: 'shift+e', description: 'Export the selected rows', group: 'Shipments' },
        ],
      }),
    },
    {
      title: 'Sizes',
      description: 'Gallery of `size` values: sm, md (default), lg and xl set the max width from the `sm` breakpoint up.',
      script: `const shortcuts = [{ keys: 'mod+k', description: 'Search the catalogue' }]`,
      code: `<div class="flex flex-wrap gap-2">
  <ShortcutsDialog v-for="size in ['sm', 'md', 'lg', 'xl']" :key="size" :title="'Size ' + size" hotkey="" :registered="false" :shortcuts="shortcuts" :size="size">
    <template #trigger><Button variant="outline">{{ size }}</Button></template>
  </ShortcutsDialog>
</div>`,
      state: () => ({ shortcuts: [{ keys: 'mod+k', description: 'Search the catalogue' }] }),
    },
    {
      title: 'Another hotkey and heading level',
      description: '`hotkey` changes the opening combo; `headingLevel` sets the level of the group names when the page outline needs it.',
      script: `const open = ref(false)
const shortcuts = [{ keys: 'esc', description: 'Close the dialog', group: 'Dialog' }]`,
      code: `<div class="flex flex-wrap items-center gap-3">
  <ShortcutsDialog v-model:open="open" title="Help" hotkey="mod+/" :registered="false" :shortcuts="shortcuts" :heading-level="4" description="Press Ctrl+/ or Cmd+/ to open this list from anywhere." />
  <Button variant="outline" @click="open = true">Open help</Button>
  <span class="text-sm text-muted-foreground">Shortcut: <KbdGroup :keys="['Ctrl', '/']" separator="+" /></span>
</div>`,
      state: () => ({ open: ref(false), shortcuts: [{ keys: 'esc', description: 'Close the dialog', group: 'Dialog' }] }),
    },
    {
      title: 'Scoped shortcuts with useHotkeys',
      description: 'With `target`, the shortcuts only work while focus is inside that element. Focus the region, then press `j` or `k`, or `g` then `r` to reset.',
      script: `const region = ref(null)
const count = ref(0)
useHotkeys(
  {
    j: () => count.value++,
    k: () => count.value--,
    'g then r': () => (count.value = 0),
  },
  { target: region, group: 'Counter' },
)`,
      code: `<div ref="region" role="group" aria-label="Counter shortcuts" tabindex="0" class="max-w-sm rounded-md border p-4 text-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring">
  <p>Count: <span class="tabular-nums font-semibold">{{ count }}</span></p>
  <p class="text-muted-foreground">Focus here, then press <Kbd>j</Kbd> or <Kbd>k</Kbd>.</p>
</div>`,
      state: () => {
        const region = ref<HTMLElement | null>(null)
        const count = ref(0)
        useHotkeys({ j: () => count.value++, k: () => count.value--, 'g then r': () => (count.value = 0) }, { target: region, group: 'Counter' })
        return { region, count }
      },
    },
  ],
  a11y: [
    'Built on Dialog: role=dialog, focus is trapped and returns to the trigger on close, Esc closes, the title names it.',
    'Each shortcut is a list item; groups are lists named by their heading. The visual key chips are hidden from assistive technology and replaced by a spoken form such as "Control plus K" or "G then D".',
    'Shortcuts never fire while focus is in a text field (WCAG 2.1.4); use `allowInInputs` only for combos with a modifier.',
    'A single-character shortcut can be turned off or remapped by the app through `enabled` or `hotkey`. Do not register single printable keys without a way to turn them off.',
    'Key chips are 24px high (20px in compact density); the list is read-only, so no pointer target size applies to the rows.',
  ],
  requires: [
    'Throws a ContractError when `title` is empty or missing.',
    'Throws a ContractError when `hotkey` is not a valid key combination (use an empty string to turn it off).',
  ],
  llmNotes: [
    'Render one ShortcutsDialog per app; register shortcuts with useHotkeys and give each a `description` and `group` so it is listed.',
    'Always set `title`. Use `hotkey=""` for a second dialog on the same page: two dialogs with the same hotkey conflict.',
    'Write combos as "mod+k", "g then d", "?" or "esc". `mod` is Cmd on macOS and Ctrl elsewhere. Never write "shift+/" for "?".',
    'Do not register single-key shortcuts that act while typing: the composable ignores inputs unless `allowInInputs` is set.',
    'Use `registered` false plus `shortcuts` for a fixed list; use `hidden` on a registration to keep it out of the list.',
    'Disable page shortcuts with `enabled` while a modal is open if they would act on content behind it.',
  ],
  related: ['Dialog', 'Command', 'Kbd', 'AlertDialog'],
}

export default doc
