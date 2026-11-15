<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { cn } from '../../../lib/cn'
import { faCheck, faXmark } from '../../../lib/icons'
import { requireText, violation } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { IconDefinition } from '../../../lib/icons-tools'
import type { BaseProps } from '../../../lib/types'
import Button from '../../primitives/Button/Button.vue'
import Icon from '../../primitives/Icon/Icon.vue'
import { checkAfterMount } from '../requireContent'
import { toTone, type FeedbackTone } from '../tones'
import { formatNotificationTime, type NotificationTime } from './time'
import { pick } from '../pick'
import {
  NOTIFICATION_LIST_APPEARANCES,
  NOTIFICATION_LIST_SHAPES,
  notificationItemVariants,
  notificationListVariants,
  notificationToneVariants,
  type NotificationListAppearance,
  type NotificationListShape,
  type NotificationListVariant,
} from './variants'

export type NotificationId = string | number

export interface NotificationItem {
  /** Unique id. Items with a missing id are ignored; later duplicates are dropped. */
  id: NotificationId
  title: string
  description?: string
  /** Date, epoch ms or ISO string (shown relative); any other string is shown as provided. */
  time?: NotificationTime
  read?: boolean
  /** Leading icon inside a tone-tinted bubble. */
  icon?: IconDefinition
  /** Tone of the icon bubble. Unknown values fall back to `neutral`. */
  tone?: FeedbackTone
  /** Makes the row a link (`javascript:` URLs are ignored). */
  href?: string
  /** Optional group heading; items with the same value render under one heading. */
  group?: string
}

export interface NotificationListProps extends BaseProps {
  /** Notifications (v-model:items). Marking read / dismissing updates the list locally and emits. */
  items?: NotificationItem[]
  /** Density: `default` or `compact`. */
  variant?: NotificationListVariant
  /** `card` (default, bordered rounded surface) or `flush` (no border, radius or fill, for use inside a popover, sheet or card). */
  appearance?: NotificationListAppearance
  /** Shape of the icon bubble: `circle` (default) or `square` (control radius). */
  shape?: NotificationListShape
  /** Show skeleton rows instead of the list. */
  loading?: boolean
  /** Number of skeleton rows. */
  loadingCount?: number
  /** Collapse to this many rows with a Show more button. Invalid / non-positive values mean unlimited. */
  maxItems?: number
  /** Render a dismiss (X) button on each row. */
  dismissible?: boolean
  /** Clicking a row marks it as read. */
  markReadOnSelect?: boolean
  /** Show the Mark all as read button when something is unread. */
  showMarkAll?: boolean
  /** Reference time (ms or Date) for relative formatting; defaults to the current time. */
  now?: number | Date
  /** BCP 47 locale for relative times. */
  locale?: string
  markAllLabel?: string
  showMoreLabel?: string
  showLessLabel?: string
  emptyLabel?: string
  dismissLabel?: string
  loadingLabel?: string
  /** Screen-reader text next to the unread dot. */
  unreadItemLabel?: string
  /** Accessible name of the list region. Give each list on a page its own name. */
  label?: string
  /** Text of the live count in the header. */
  unreadLabel?: (count: number) => string
}

const props = withDefaults(defineProps<NotificationListProps>(), {
  items: () => [],
  variant: 'default',
  appearance: 'card',
  shape: 'circle',
  loadingCount: 3,
  maxItems: undefined,
  markReadOnSelect: true,
  showMarkAll: true,
  now: undefined,
  locale: undefined,
  markAllLabel: 'Mark all as read',
  showMoreLabel: 'Show more',
  showLessLabel: 'Show less',
  emptyLabel: 'No notifications',
  dismissLabel: 'Dismiss',
  label: 'Notifications',
  loadingLabel: 'Loading notifications',
  unreadItemLabel: 'Unread',
  unreadLabel: (count: number) => (count > 0 ? `${count} unread` : 'All caught up'),
})

const emit = defineEmits<{
  'update:items': [items: NotificationItem[]]
  read: [id: NotificationId]
  'read-all': [ids: NotificationId[]]
  dismiss: [id: NotificationId]
  select: [item: NotificationItem]
  'show-more': []
}>()

const uid = useId()

// Contract: the list region is named, and every item has a non-empty title and an id that no other item uses
// (items without an id, or with a repeated one, would otherwise be dropped without a trace).
function checkList() {
  requireText('NotificationList', 'label', props.label, 'It is the accessible name of the list region; give each list on a page its own name.')
  const seen = new Set<unknown>()
  for (const [i, item] of (Array.isArray(props.items) ? props.items : []).entries()) {
    const at = `item ${i + 1}`
    if (!item || typeof item !== 'object') continue
    if ((typeof item.id !== 'string' && typeof item.id !== 'number') || item.id === '') {
      violation('NotificationList', 'requires-item-id', `${at} requires an \`id\` (a string or number). Items without one are not shown.`)
    } else if (seen.has(item.id)) {
      violation('NotificationList', 'unique-item-id', `${at} repeats the id ${JSON.stringify(item.id)}. Ids must be unique, later duplicates are not shown.`)
    }
    seen.add(item.id)
    if (typeof item.title !== 'string' || !item.title.trim()) {
      violation('NotificationList', 'requires-item-title', `${at} requires a non-empty \`title\`; it is the name of the row.`)
    }
  }
}
checkAfterMount(checkList)
watch(
  () => props.items,
  async () => {
    await nextTick()
    checkList()
  },
  { deep: true },
)

// Local override so the list works uncontrolled; any change of the `items` prop wins again.
const override = ref<NotificationItem[] | null>(null)
watch(() => props.items, () => (override.value = null), { deep: true })
const source = computed<NotificationItem[]>(() => override.value ?? (Array.isArray(props.items) ? props.items : []))

function commit(next: NotificationItem[]) {
  override.value = next
  emit('update:items', next)
}

const variant = computed<NotificationListVariant>(() => (props.variant === 'compact' ? 'compact' : 'default'))
const appearance = computed<NotificationListAppearance>(() => pick(props.appearance, NOTIFICATION_LIST_APPEARANCES, 'card'))
const shape = computed<NotificationListShape>(() => pick(props.shape, NOTIFICATION_LIST_SHAPES, 'circle'))
const nowMs = computed(() => (props.now instanceof Date ? props.now.getTime() : typeof props.now === 'number' && Number.isFinite(props.now) ? props.now : Date.now()))
const safeHref = (href: unknown) => (typeof href === 'string' && href.trim() && !/^\s*javascript:/i.test(href) ? href : undefined)

const rows = computed(() => {
  const seen = new Set<NotificationId>()
  const out = []
  for (const raw of source.value) {
    if (!raw || typeof raw !== 'object') continue
    const id = raw.id
    if ((typeof id !== 'string' && typeof id !== 'number') || seen.has(id)) continue
    seen.add(id)
    const time = formatNotificationTime(raw.time, nowMs.value, props.locale)
    out.push({
      raw,
      id,
      key: `${typeof id}:${id}`,
      title: String(raw.title ?? ''),
      description: raw.description ? String(raw.description) : '',
      read: !!raw.read,
      tone: toTone(raw.tone),
      icon: raw.icon,
      href: safeHref(raw.href),
      group: typeof raw.group === 'string' && raw.group.trim() ? raw.group.trim() : '',
      time,
    })
  }
  return out
})
type Row = (typeof rows.value)[number]

const unreadCount = computed(() => rows.value.filter((r) => !r.read).length)
const limit = computed(() => (typeof props.maxItems === 'number' && Number.isFinite(props.maxItems) && props.maxItems >= 1 ? Math.floor(props.maxItems) : Infinity))
const expanded = ref(false)
const collapsible = computed(() => rows.value.length > limit.value)
const shown = computed(() => (expanded.value || !collapsible.value ? rows.value : rows.value.slice(0, limit.value)))
const hiddenCount = computed(() => rows.value.length - shown.value.length)

const groups = computed(() => {
  const map = new Map<string, Row[]>()
  for (const r of shown.value) {
    const list = map.get(r.group)
    if (list) list.push(r)
    else map.set(r.group, [r])
  }
  return [...map].map(([label, items], i) => ({ label, items, id: `${uid}-g${i}` }))
})
const skeletons = computed(() => Array.from({ length: Math.min(Math.max(Math.trunc(props.loadingCount) || 0, 0), 50) }, (_, i) => i))

function markRead(row: Row) {
  commit(source.value.map((i) => (i && typeof i === 'object' && i.id === row.id ? { ...i, read: true } : i)))
  emit('read', row.id)
}
function select(row: Row) {
  emit('select', row.raw)
  if (props.markReadOnSelect && !row.read) markRead(row)
}
function markAll() {
  const ids = rows.value.filter((r) => !r.read).map((r) => r.id)
  if (!ids.length) return
  commit(source.value.map((i) => (i && typeof i === 'object' && !i.read ? { ...i, read: true } : i)))
  emit('read-all', ids)
}
function dismiss(row: Row) {
  commit(source.value.filter((i) => !(i && typeof i === 'object' && i.id === row.id)))
  emit('dismiss', row.id)
}
function toggleExpanded() {
  expanded.value = !expanded.value
  if (expanded.value) emit('show-more')
}

const rowButton = cn('flex min-w-0 flex-1 items-start gap-3 rounded-md text-start', focusRing)
const dismissButton = cn(
  'inline-flex size-7 shrink-0 items-center justify-center rounded-md pointer-coarse:size-10 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground',
  focusRing,
)
</script>

<template>
  <div
    data-slot="notification-list"
    :data-variant="variant === 'default' ? undefined : variant"
    :data-appearance="appearance === 'card' ? undefined : appearance"
    :data-shape="shape === 'circle' ? undefined : shape"
    :aria-busy="loading ? 'true' : undefined"
    :aria-label="label"
    role="region"
    :class="cn(notificationListVariants({ variant, appearance }), props.class)"
  >
    <div v-if="!loading" data-slot="notification-list-header" class="flex items-center justify-between gap-2 border-b px-4 py-2">
      <p data-slot="notification-list-count" aria-live="polite" aria-atomic="true" class="font-medium tabular-nums">{{ unreadLabel(unreadCount) }}</p>
      <Button
        v-if="showMarkAll && unreadCount > 0"
        data-slot="notification-list-mark-all"
        variant="ghost"
        size="xs"
        :icon-start="faCheck"
        @click="markAll"
      >
        {{ markAllLabel }}
      </Button>
    </div>

    <template v-if="loading">
      <span data-slot="notification-list-loading" role="status" class="sr-only">{{ loadingLabel }}</span>
      <ul role="list" aria-hidden="true" class="m-0 list-none p-0">
        <li v-for="n in skeletons" :key="n" data-slot="notification-list-skeleton" role="listitem" :class="notificationItemVariants({ variant })">
          <span class="mt-1 size-2 shrink-0" />
          <span :class="cn(notificationToneVariants({ variant, shape }), 'animate-pulse')" />
          <span class="grid flex-1 gap-1.5">
            <span class="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <span class="h-3 w-full animate-pulse rounded bg-muted" />
          </span>
        </li>
      </ul>
    </template>

    <div v-else-if="rows.length === 0" data-slot="notification-list-empty" role="status" class="px-4 py-8 text-center text-muted-foreground">
      <slot name="empty">{{ emptyLabel }}</slot>
    </div>

    <template v-else>
      <section v-for="g in groups" :key="g.id" data-slot="notification-list-group">
        <h3
          v-if="g.label"
          :id="g.id"
          data-slot="notification-list-group-heading"
          class="border-b bg-muted/40 px-4 py-1.5 text-xs font-medium text-muted-foreground"
        >
          {{ g.label }}
        </h3>
        <ul role="list" :aria-labelledby="g.label ? g.id : undefined" class="m-0 list-none p-0">
          <li
            v-for="row in g.items"
            :key="row.key"
            role="listitem"
            data-slot="notification-list-item"
            :data-read="row.read ? 'true' : 'false'"
            :class="notificationItemVariants({ variant, read: row.read })"
          >
            <component
              :is="row.href ? 'a' : 'button'"
              :href="row.href"
              :type="row.href ? undefined : 'button'"
              data-slot="notification-list-item-main"
              :class="rowButton"
              @click="select(row)"
            >
              <span
                data-slot="notification-list-dot"
                aria-hidden="true"
                :class="cn('mt-1.5 size-2 shrink-0 rounded-full', row.read ? 'bg-transparent' : 'bg-primary')"
              />
              <span v-if="$slots.icon || row.icon" data-slot="notification-list-icon" :class="notificationToneVariants({ tone: row.tone, variant, shape })">
                <slot name="icon" :item="row.raw"><Icon v-if="row.icon" :icon="row.icon" /></slot>
              </span>
              <span class="grid min-w-0 flex-1 gap-0.5">
                <span data-slot="notification-list-title" :class="cn('truncate', row.read ? 'text-muted-foreground' : 'font-semibold text-foreground')">
                  <span v-if="!row.read" class="sr-only">{{ unreadItemLabel }}: </span>{{ row.title }}
                </span>
                <span
                  v-if="row.description"
                  data-slot="notification-list-description"
                  :class="cn('text-muted-foreground', variant === 'compact' ? 'truncate' : 'line-clamp-2')"
                >
                  {{ row.description }}
                </span>
                <component
                  :is="row.time.iso ? 'time' : 'span'"
                  v-if="row.time.text"
                  data-slot="notification-list-time"
                  :datetime="row.time.iso ?? undefined"
                  :title="row.time.title || undefined"
                  class="text-xs text-muted-foreground tabular-nums"
                >
                  {{ row.time.text }}
                </component>
              </span>
            </component>
            <button
              v-if="dismissible"
              type="button"
              data-slot="notification-list-dismiss"
              :aria-label="`${dismissLabel}: ${row.title}`"
              :class="dismissButton"
              @click="dismiss(row)"
            >
              <Icon :icon="faXmark" size="sm" />
            </button>
          </li>
        </ul>
      </section>
      <div v-if="collapsible" data-slot="notification-list-footer" class="border-t p-1">
        <Button data-slot="notification-list-more" variant="ghost" size="sm" block :aria-expanded="expanded" @click="toggleExpanded">
          {{ expanded ? showLessLabel : `${showMoreLabel} (${hiddenCount})` }}
        </Button>
      </div>
    </template>
  </div>
</template>
