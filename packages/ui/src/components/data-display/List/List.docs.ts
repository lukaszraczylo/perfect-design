import { ref } from 'vue'
import { faFile, faFolder } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const classProp = { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' }

const doc: ComponentDoc = {
  name: 'List',
  group: 'data-display',
  subgroup: 'Lists',
  summary: 'Vertical list of rows with leading/trailing slots, dividers and optional interactivity.',
  description:
    'Use `List` + `ListItem` for simple vertical collections: files, members, recent activity, settings rows. Each item has `leading` (icon/avatar), default (title), `description` and `trailing` (badge, button, meta) slots. Set `interactive` on items that are clickable; for navigation render the item as a link (`as="a"`) or put a link inside. Variants: `plain` (no dividers; for short lists inside another surface), `divided` (hairline dividers; the default), `card` (each row is its own bordered card, for selectable/sortable entries), `interactive` (divided rows that are all hoverable, focusable and keyboard-activatable), `with-avatar` (roomier rows with an unmuted leading slot for an `Avatar`, medium-weight title). `size` (`sm`, `md`, `lg`) sets row padding and text size for every row; `gap` (`none`, `sm`, `md`, `lg`) spaces rows in `plain` and `card` lists (divided variants are separated by their rule and ignore it). For tabular data with columns use `Table`/`DataTable`; for chronological events use `Timeline`.',
  status: 'stable',
  props: [
    { name: 'as', type: 'string | Component', default: "'ul'", description: 'Element to render (`ol` for ordered).' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the single slot child instead of a wrapper.' },
    { name: 'variant', type: "'plain' | 'divided' | 'card' | 'interactive' | 'with-avatar'", description: 'Row presentation, shared with every `ListItem` inside. When omitted the `divided` prop decides (dividers by default); unknown values behave as omitted.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Row padding and text size, shared with every `ListItem`: `sm` 12px text, `md` 14px, `lg` 16px with roomier rows. Unknown values fall back to `md`.' },
    { name: 'gap', type: "'none' | 'sm' | 'md' | 'lg'", description: 'Space between rows (0, 4px, 8px, 16px). Only `plain` and `card` lists use it; `card` rows keep 8px when it is not set. Divided variants ignore it. Unknown values behave as unset.' },
    { name: 'marker', type: "'none' | 'disc' | 'decimal'", default: "'none'", description: 'Real list markers for hand-authored bulleted or numbered text (legal text, feature bullets). The list becomes a plain block with logical start padding and muted markers; `variant`, `divided` and `gap` do not apply and rows drop their flex layout. `decimal` renders an `ol` unless `as` is set. Unknown values behave as `none`.' },
    { name: 'divided', type: 'boolean', default: 'true', description: 'Dividers between items. Only used when `variant` is not set.' },
    { name: 'bordered', type: 'boolean', default: 'false', description: 'Rounded border around the list.' },
    classProp,
  ],
  slots: [{ name: 'default', description: '`ListItem` children.' }],
  parts: [
    {
      name: 'ListItem',
      description: 'One row. Slots: `leading`, default, `description`, `trailing`.',
      props: [
        { name: 'as', type: 'string | Component', default: "'li'", description: 'Element to render.' },
        { name: 'asChild', type: 'boolean', default: 'false', description: 'Render the slot child; leading/trailing layout is skipped.' },
        { name: 'interactive', type: 'boolean', default: 'false', description: 'Hover/focus styles, tabindex=0 and Enter/Space activation (non-native elements). Defaults to true inside `<List variant="interactive">`; `:interactive="false"` opts a row out.' },
        { name: 'selected', type: 'boolean', default: 'false', description: 'Highlight and set aria-current.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Dim and block clicks/keys.' },
        classProp,
      ],
    },
  ],
  examples: [
    {
      title: 'Bulleted and numbered text',
      description: '`marker` draws real list markers for hand-authored text. Sample terms.',
      code: `<div class="flex flex-wrap gap-8">
  <List marker="disc" class="max-w-xs">
    <ListItem>Sample feature one</ListItem>
    <ListItem>Sample feature two</ListItem>
  </List>
  <List marker="decimal" class="max-w-xs">
    <ListItem>Sample first step</ListItem>
    <ListItem>Sample second step</ListItem>
  </List>
</div>`,
    },
    {
      title: 'Simple list',
      code: `<List bordered class="max-w-sm">
  <ListItem>Overview</ListItem>
  <ListItem>Settings</ListItem>
  <ListItem>Members</ListItem>
</List>`,
    },
    {
      title: 'Leading, description, trailing and interactive',
      code: `<List bordered class="max-w-md">
  <ListItem interactive>
    <template #leading><Icon :icon="faFolder" /></template>
    src
    <template #description>12 files</template>
    <template #trailing><Badge variant="secondary">Dir</Badge></template>
  </ListItem>
  <ListItem interactive selected>
    <template #leading><Icon :icon="faFile" /></template>
    README.md
    <template #description>Updated today</template>
    <template #trailing><Button size="xs" variant="outline" class="text-foreground">Open</Button></template>
  </ListItem>
  <ListItem disabled>Archived.zip</ListItem>
</List>`,
      state: () => ({ faFolder, faFile }),
    },
    {
      title: 'Plain',
      description: 'No dividers or surfaces.',
      code: `<List variant="plain" class="max-w-sm"><ListItem>Overview</ListItem><ListItem>Settings</ListItem><ListItem>Members</ListItem></List>`,
    },
    {
      title: 'Divided',
      description: 'Hairline dividers (the default), optionally framed with `bordered`.',
      code: `<List variant="divided" bordered class="max-w-sm"><ListItem>Overview</ListItem><ListItem>Settings</ListItem><ListItem>Members</ListItem></List>`,
    },
    {
      title: 'Card rows',
      description: 'Each row is a bordered card; `selected` still highlights.',
      code: `<List variant="card" class="max-w-md">
  <ListItem><template #leading><Icon :icon="faFolder" /></template>Backups<template #trailing><Badge variant="secondary">3</Badge></template></ListItem>
  <ListItem selected><template #leading><Icon :icon="faFile" /></template>Reports<template #trailing><Badge variant="secondary">12</Badge></template></ListItem>
</List>`,
      state: () => ({ faFolder, faFile }),
    },
    {
      title: 'Interactive rows',
      description: 'Every row gets hover/focus styles and Enter/Space activation; opt a row out with `:interactive="false"`.',
      script: `const picked = ref('')`,
      state: () => {
        const picked = ref('')
        return { picked }
      },
      code: `<div class="max-w-sm space-y-2">
  <List variant="interactive" bordered>
    <ListItem @click="picked = 'Profile'">Profile</ListItem>
    <ListItem @click="picked = 'Billing'">Billing</ListItem>
    <ListItem :interactive="false">Read-only row</ListItem>
  </List>
  <p class="text-sm text-muted-foreground">Last opened: {{ picked || 'nothing yet' }}</p>
</div>`,
    },
    {
      title: 'Size gallery: sm, md, lg',
      description: 'Row padding and text size for the whole list.',
      code: `<div class="grid max-w-3xl gap-4 sm:grid-cols-3">
  <List size="sm" bordered><ListItem>Small row<template #description>12px text</template></ListItem><ListItem>Another row</ListItem></List>
  <List size="md" bordered><ListItem>Medium row<template #description>14px text</template></ListItem><ListItem>Another row</ListItem></List>
  <List size="lg" bordered><ListItem>Large row<template #description>16px text</template></ListItem><ListItem>Another row</ListItem></List>
</div>`,
    },
    {
      title: 'Gap gallery: none, sm, md, lg',
      description: '`gap` spaces the rows of `plain` and `card` lists.',
      code: `<div class="grid max-w-3xl gap-4 sm:grid-cols-2">
  <List variant="card" gap="none"><ListItem>Card, gap none</ListItem><ListItem>Second card</ListItem></List>
  <List variant="card" gap="sm"><ListItem>Card, gap sm</ListItem><ListItem>Second card</ListItem></List>
  <List variant="card" gap="md"><ListItem>Card, gap md</ListItem><ListItem>Second card</ListItem></List>
  <List variant="card" gap="lg"><ListItem>Card, gap lg</ListItem><ListItem>Second card</ListItem></List>
  <List variant="plain" gap="lg"><ListItem>Plain, gap lg</ListItem><ListItem>Second row</ListItem></List>
</div>`,
    },
    {
      title: 'With avatar',
      description: 'Roomier rows; the leading slot is not muted, so Avatars keep their colours.',
      code: `<List variant="with-avatar" bordered class="max-w-md">
  <ListItem>
    <template #leading><Avatar alt="" fallback="A" /></template>
    Sample member A
    <template #description>member-a@example.com</template>
    <template #trailing><Badge variant="secondary">Admin</Badge></template>
  </ListItem>
  <ListItem>
    <template #leading><Avatar alt="" fallback="B" /></template>
    Sample member B
    <template #description>member-b@example.com</template>
  </ListItem>
</List>`,
    },
  ],
  a11y: [
    'Explicit `role="list"` is set so lists keep list semantics in Safari even with list-style removed.',
    'Interactive non-native items get `tabindex=0` and respond to Enter/Space; prefer `as="a"`/`as="button"` for real navigation/actions.',
    '`selected` sets `aria-current`; `disabled` sets `aria-disabled`.',
    'Rows are flat: no accent stripe or hover movement. Selection is a background plus `aria-current`, not colour alone. Slot text inherits a muted colour: give a Button inside `trailing` its own `text-foreground` on selected rows.',
    '`size` and `gap` change spacing and text only. Interactive rows keep at least a 28px height at `sm`, above the 24px minimum target.',
    'Keyboard: Tab reaches interactive rows (and links or buttons inside them); Enter or Space activates a non-native row. Dividers and rows reflow at any width.',
  ],
  related: ['Card', 'Timeline', 'DescriptionList', 'Table'],
  requires: [
    'Throws a ContractError when a `ListItem` is rendered outside a `List` (a plain `ul`, `ol` or `role="list"` parent also counts).',
  ],
  llmNotes: [
    'Use `marker="disc"` or `"decimal"` for prose-like bulleted or numbered text; leave it unset for rows with slots and dividers.',
    'Use `leading`/`trailing` slots instead of custom flex wrappers inside ListItem.',
    'Choose the look with `variant` on List (not per row): `card` for separated entries, `with-avatar` for people lists, `interactive` when every row is clickable.',
    'Set `size` and `gap` on List, not per row; `gap` only affects `plain` and `card`.',
    'Make an item interactive only if it does something; navigation should be a link.',
    'Do not place block-level layout (cards) inside ListItem; use Card grid instead.',
  ],
  replaces: ['hand-rolled List markup in app code'],
}
export default doc
