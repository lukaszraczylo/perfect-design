import { ref } from 'vue'
import { faBell, faCircleCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const sample = () => [
  { id: 1, title: 'Deploy finished', description: 'Build #42 is live in production.', time: Date.now() - 5 * 60_000, read: false, tone: 'success', icon: faCircleCheck },
  { id: 2, title: 'New comment on your report', description: '"The numbers match the source."', time: Date.now() - 3 * 3600_000, read: false, icon: faBell },
  { id: 3, title: 'Invoice overdue', time: Date.now() - 2 * 86400_000, read: true, tone: 'danger', icon: faTriangleExclamation },
]

const doc: ComponentDoc = {
  name: 'NotificationList',
  group: 'feedback',
  subgroup: 'Notifications',
  summary: 'Inbox-style list of notifications with unread dots, relative times, mark-as-read, grouping and a collapsible tail.',
  description:
    'Use `NotificationList` for an in-app inbox, a bell dropdown or an activity panel. Each item is `{ id, title, description?, time?, read?, icon?, tone?, href?, group? }`. Times (Date, epoch ms or ISO string) render as relative text via `Intl.RelativeTimeFormat` with the absolute date in the tooltip; any other string (e.g. "just now") is shown as provided and invalid values render nothing. Clicking a row marks it read and emits `select`; "Mark all as read" and per-row dismiss are built in. The list is usable uncontrolled (it updates itself and emits `update:items`) or controlled (`v-model:items` / handle `read`, `read-all`, `dismiss`). Items with a `group` are rendered under headings in order of first appearance. `maxItems` collapses the tail behind Show more; `loading` shows skeleton rows. For transient messages use `Toaster`; for page-level status use `Alert` or `Banner`.',
  status: 'beta',
  props: [
    { name: 'items', type: 'NotificationItem[]', default: '[]', description: 'Notifications (v-model:items). Every item needs a unique string or number `id` and a non-empty `title` (otherwise a ContractError; in production such entries are not shown). Never mutated.' },
    { name: 'appearance', type: "'card' | 'flush'", default: "'card'", description: '`card` is a bordered, rounded surface. `flush` removes the border, radius and fill so the list sits inside a popover, a sheet or another card that already has one. Unknown values fall back to `card`. Non-default values add `data-appearance`.' },
    { name: 'shape', type: "'circle' | 'square'", default: "'circle'", description: 'Shape of the icon bubble: round, or square with the control radius. Unknown values fall back to `circle`. Non-default values add `data-shape`.' },
    { name: 'variant', type: "'default' | 'compact'", default: "'default'", description: 'Density. `compact` uses tighter rows, a smaller icon and single-line descriptions. Unknown values fall back to `default`.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Show skeleton rows instead of the list and set `aria-busy`.' },
    { name: 'loadingCount', type: 'number', default: '3', description: 'Skeleton rows (clamped 0-50).' },
    { name: 'maxItems', type: 'number', description: 'Collapse to this many rows with a Show more button. Non-positive, NaN or Infinity mean unlimited; fractions are floored.' },
    { name: 'dismissible', type: 'boolean', default: 'false', description: 'Show a dismiss (X) button on each row.' },
    { name: 'markReadOnSelect', type: 'boolean', default: 'true', description: 'Clicking an unread row marks it read.' },
    { name: 'showMarkAll', type: 'boolean', default: 'true', description: 'Show Mark all as read while something is unread.' },
    { name: 'now', type: 'number | Date', description: 'Reference time for relative text. Without it the first render shows absolute UTC times (server and client match), then relative text appears after mount and refreshes every 30 s. Set it for fixed output (tests, docs).' },
    { name: 'locale', type: 'string', description: 'BCP 47 locale for relative times; defaults to the `ConfigProvider` locale, then the browser default. Invalid locales fall back to the default.' },
    { name: 'markAllLabel', type: 'string', default: "'Mark all as read'", description: 'Header button label.' },
    { name: 'showMoreLabel', type: 'string', default: "'Show more'", description: 'Label before the hidden count, e.g. "Show more (5)".' },
    { name: 'showLessLabel', type: 'string', default: "'Show less'", description: 'Label when expanded.' },
    { name: 'emptyLabel', type: 'string', default: "'No notifications'", description: 'Default empty-state text (the `empty` slot overrides it).' },
    { name: 'label', type: 'string', default: "'Notifications'", description: 'Accessible name of the list region. Give each list on a page its own name.' },
    { name: 'dismissLabel', type: 'string', default: "'Dismiss'", description: 'Prefix of the dismiss button aria-label ("Dismiss: <title>").' },
    { name: 'loadingLabel', type: 'string', default: "'Loading notifications'", description: 'Screen-reader text while loading.' },
    { name: 'unreadItemLabel', type: 'string', default: "'Unread'", description: 'Screen-reader prefix on unread titles.' },
    { name: 'unreadLabel', type: '(count: number) => string', default: "n => n ? `${n} unread` : 'All caught up'", description: 'Text of the live unread count.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root.' },
  ],
  slots: [
    { name: 'icon', props: '{ item: NotificationItem }', description: 'Custom leading icon/avatar per row (replaces the `icon` field).' },
    { name: 'empty', description: 'Empty state shown when there is nothing to list.' },
  ],
  emits: [
    { name: 'update:items', payload: '[items: NotificationItem[]]', description: 'New list after mark-read, mark-all or dismiss (v-model:items).' },
    { name: 'read', payload: '[id: string | number]', description: 'A single notification was marked read (row click).' },
    { name: 'read-all', payload: '[ids: (string | number)[]]', description: 'Mark all as read pressed; payload lists the ids that were unread.' },
    { name: 'dismiss', payload: '[id: string | number]', description: 'A notification was dismissed.' },
    { name: 'select', payload: '[item: NotificationItem]', description: 'A row was clicked / activated (also fires for read rows).' },
    { name: 'show-more', description: 'The list was expanded with Show more.' },
  ],
  examples: [
    {
      title: 'Minimal',
      code: `<NotificationList label="Notifications, basic" :items="items" class="max-w-md" />`,
      script: `const items = [
  { id: 1, title: 'Deploy finished', description: 'Build #42 is live.', time: Date.now() - 5 * 60_000, read: false },
  { id: 2, title: 'New comment', time: Date.now() - 3 * 3600_000, read: true },
]`,
      state: () => ({ items: sample().slice(0, 2) }),
    },
    {
      title: 'Inbox with icons, links, dismiss and events',
      code: `<NotificationList label="Notifications, with dismiss" v-model:items="items" dismissible class="max-w-md"
  @read="log = 'read ' + $event" @read-all="log = 'read all (' + $event.length + ')'" @dismiss="log = 'dismissed ' + $event" />
<p class="mt-2 text-sm text-muted-foreground">{{ log || 'No events yet' }}</p>`,
      script: `import { ref } from 'vue'
import { faBell, faCircleCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
const items = ref([
  { id: 1, title: 'Deploy finished', description: 'Build #42 is live.', time: Date.now() - 5 * 60_000, read: false, tone: 'success', icon: faCircleCheck },
  { id: 2, title: 'New comment on your report', time: Date.now() - 3 * 3600_000, read: false, icon: faBell, href: '/components/feedback/alert' },
  { id: 3, title: 'Invoice overdue', time: Date.now() - 2 * 86400_000, read: true, tone: 'danger', icon: faTriangleExclamation },
])
const log = ref('')`,
      state: () => ({ items: ref(sample()), log: ref('') }),
    },
    {
      title: 'Variant: compact with groups',
      code: `<NotificationList label="Notifications, compact" variant="compact" :items="items" class="max-w-sm" />`,
      script: `const items = [
  { id: 1, title: 'Build passed', time: Date.now() - 60_000, read: false, group: 'Today' },
  { id: 2, title: 'Review requested', time: Date.now() - 7200_000, read: false, group: 'Today' },
  { id: 3, title: 'Weekly report', time: Date.now() - 4 * 86400_000, read: true, group: 'Earlier' },
]`,
      state: () => ({
        items: [
          { id: 1, title: 'Build passed', time: Date.now() - 60_000, read: false, group: 'Today' },
          { id: 2, title: 'Review requested', time: Date.now() - 7200_000, read: false, group: 'Today' },
          { id: 3, title: 'Weekly report', time: Date.now() - 4 * 86400_000, read: true, group: 'Earlier' },
        ],
      }),
    },
    {
      title: 'Appearance: flush, shape: square',
      description: 'Flush for use inside an existing bordered container; square icon bubbles.',
      code: `<div class="max-w-md rounded-lg border bg-popover p-1">
  <NotificationList label="Notifications, flush" appearance="flush" shape="square" :items="items" :show-mark-all="false" />
</div>`,
      script: `import { faCircleCheck } from '@fortawesome/free-solid-svg-icons'
const items = [{ id: 1, title: 'Deploy finished', time: Date.now() - 5 * 60_000, read: false, tone: 'success', icon: faCircleCheck }]`,
      state: () => ({ items: [{ id: 1, title: 'Deploy finished', time: Date.now() - 5 * 60_000, read: false, tone: 'success', icon: faCircleCheck }] }),
    },
    {
      title: 'Show more',
      code: `<NotificationList label="Notifications, collapsed" :items="items" :max-items="2" class="max-w-md" />`,
      script: `const items = Array.from({ length: 6 }, (_, i) => ({ id: i, title: 'Notification ' + (i + 1), time: Date.now() - i * 3600_000, read: i > 1 }))`,
      state: () => ({ items: Array.from({ length: 6 }, (_, i) => ({ id: i, title: 'Notification ' + (i + 1), time: Date.now() - i * 3600_000, read: i > 1 })) }),
    },
    {
      title: 'Loading and empty',
      code: `<div class="grid gap-4 md:grid-cols-2">
  <NotificationList label="Notifications, loading" loading class="max-w-md" />
  <NotificationList label="Notifications, empty" :items="[]" class="max-w-md"><template #empty>You are all caught up.</template></NotificationList>
</div>`,
    },
  ],
  a11y: [
    'The root is a labelled `region` (override with `aria-label`); each group is a `ul role="list"` of `li role="listitem"`, labelled by its heading.',
    'Rows are native `<button>` (or `<a>` when `href` is set), so Enter and Space activate them; unread rows carry a screen-reader "Unread:" prefix in addition to the visual dot.',
    'The unread count is an `aria-live="polite"` region and updates as items are read, dismissed or marked all read.',
    '`appearance="flush"` removes the list border, so place it inside a container that keeps one (popover, sheet, card); rows keep their dividers. `shape` changes only the radius of the decorative icon bubble.',
    'Dismiss buttons are labelled "Dismiss: <title>"; `loading` sets `aria-busy` and announces a status message; times use `<time datetime>` with an absolute-date tooltip.',
  ],
  related: ['Toaster', 'EmptyState', 'Alert', 'Badge'],
  requires: [
    'Throws a ContractError when a `NotificationList` has a blank `label`, or an item has no `id`, repeats an `id` or has a blank `title`.',
  ],
  llmNotes: [
    'Give every item a unique `id`; bind `v-model:items` for the simplest working inbox.',
    'Use `time` as Date, epoch ms or ISO string; pass `now` for deterministic output.',
    'Use `group` for headings (e.g. Today / Earlier) and `maxItems` to cap long lists.',
    'Use `tone` + `icon` for status colour; never colour rows with hard-coded classes.',
    'Use `appearance="flush"` inside popovers and sheets so the border is not doubled; keep `card` on the page.',
    'Handle `select` to navigate or open details; `href` items render as real links.',
  ],
}

export default doc
