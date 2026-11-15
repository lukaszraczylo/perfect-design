<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useId, useSlots } from 'vue'
import { violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import { faCircleCheck, faCircleInfo, faCircleXmark, faTriangleExclamation } from '../../../lib/icons'
import type { IconDefinition } from '../../../lib/icons-tools'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Avatar from '../../primitives/Avatar/Avatar.vue'
import { getInitials } from '../../primitives/Avatar/context'
import Button from '../../primitives/Button/Button.vue'
import Icon from '../../primitives/Icon/Icon.vue'
import { hasAriaName, hasText, useMountedCheck } from '../_shared/contract'
import { formatRelative, makeFormatters, toDate } from './format'
import {
  ACTIVITY_FEED_DENSITIES,
  ACTIVITY_FEED_SIZES,
  ACTIVITY_FEED_TONES,
  ACTIVITY_FEED_VARIANTS,
  activityFeedItemVariants,
  activityFeedMarkerVariants,
  activityFeedToneIconVariants,
  activityFeedVariants,
  type ActivityFeedDensity,
  type ActivityFeedSize,
  type ActivityFeedTone,
  type ActivityFeedVariant,
} from './variants'

export interface ActivityEvent {
  /** Unique, stable id (string or number). Used for keys and for the expanded state. */
  id: string | number
  /** Who did it, e.g. "Deploy bot". Shown in bold and used for the avatar initials. */
  actor?: string
  /** What happened, as a short phrase: "published release 1.4". */
  action: string
  /** What it happened to: a name, shown in bold after the action. */
  target?: string
  /** When: a Date, epoch milliseconds or an ISO date string. A value that is not a date is shown as given. */
  time: string | number | Date
  /** Icon in the marker. Non-neutral tones get a default icon when this is omitted. */
  icon?: IconDefinition
  /** Marker tone. Also written as text for assistive technology and shown as an icon. */
  tone?: ActivityFeedTone
  /** Group heading for `variant="grouped"`. Without it the event is grouped by its calendar day. */
  group?: string
  /** Extra text revealed by a "Show details" button. */
  details?: string
}

export interface ActivityFeedProps extends BaseProps {
  /** The events, in the order to show them (newest first or oldest first is your choice). */
  events?: readonly ActivityEvent[] | null
  /** Accessible name of the feed. Required (or pass `aria-label` / `aria-labelledby`). */
  label?: string
  /** `list` (default, ruled rows with avatars), `timeline` (markers joined by a line), `compact` (one tight line per event, no avatars) or `grouped` (list under a heading per day or `group`). Unknown values fall back to `list`. */
  variant?: ActivityFeedVariant
  /** Text size: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  size?: ActivityFeedSize
  /** Row spacing: `comfortable` (default) or `compact`. Unknown values fall back to `comfortable`. */
  density?: ActivityFeedDensity
  /** Show an initials avatar for events with an `actor` (`list` and `grouped`). */
  showAvatars?: boolean
  /** The reference time for relative text. With it the text renders at once (server-safe); without it the current time is read after mount. */
  now?: Date | string | number
  /** Relative text ("2 hours ago") for events up to a week old. Off: always the absolute date and time. */
  relative?: boolean
  /** BCP 47 locale for dates and relative text. Defaults to the runtime locale. */
  locale?: string
  /** IANA time zone for dates and day groups, e.g. `UTC`. Defaults to the runtime zone. */
  timeZone?: string
  /** Heading level of the group headings in `grouped`, 2 to 6. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  /** More events exist: shows the load more button (or the `load-more` slot). */
  hasMore?: boolean
  /** The next page is loading: the button is disabled and the feed is `aria-busy`. */
  loading?: boolean
  /** Text of the load more button. */
  loadMoreLabel?: string
  /** Ids of the events whose details are open (`v-model:expanded`). Leave undefined for uncontrolled use. */
  expanded?: readonly (string | number)[]
}

const props = withDefaults(defineProps<ActivityFeedProps>(), {
  events: () => [],
  variant: 'list',
  size: 'md',
  density: 'comfortable',
  showAvatars: true,
  relative: true,
  headingLevel: 3,
  hasMore: false,
  loading: false,
  loadMoreLabel: 'Load more activity',
})
const emit = defineEmits<{
  /** The load more button was pressed. */
  'load-more': []
  /** An event's details were opened or closed. */
  toggle: [event: { id: string | number; expanded: boolean }]
  /** New list of open ids (for `v-model:expanded`). */
  'update:expanded': [ids: (string | number)[]]
}>()
const slots = useSlots()
defineSlots<{
  empty(): unknown
  'load-more'(props: { loading: boolean }): unknown
  details(props: { event: ActivityEvent }): unknown
}>()

const attrs = useAttrs()
const uid = useId()

/* -------------------------------------------------------------------------- contract */
const list = computed<readonly ActivityEvent[]>(() => (Array.isArray(props.events) ? props.events : []))
useMountedCheck(
  () => {
    if (!hasText(props.label) && !hasAriaName(attrs)) {
      violation('ActivityFeed', 'requires-accessible-name', 'needs an accessible name. Set `label` (for example `label="Project activity"`), `aria-label` or `aria-labelledby`.')
    }
    const seen = new Set<string | number>()
    list.value.forEach((e, i) => {
      const idOk = (typeof e?.id === 'string' && e.id.trim() !== '') || (typeof e?.id === 'number' && Number.isFinite(e.id))
      if (!idOk) violation('ActivityFeed', 'requires-event-id', `event ${i + 1} needs an \`id\` (a non-empty string or a number) that is unique in \`events\`.`)
      else if (seen.has(e.id)) violation('ActivityFeed', 'requires-unique-event-id', `event ids must be unique, but ${JSON.stringify(e.id)} appears twice (event ${i + 1}). Duplicate ids break keys and the open/closed state.`)
      seen.add(e?.id)
      if (!hasText(e?.action)) violation('ActivityFeed', 'requires-action', `event ${i + 1}${idOk ? ` (${JSON.stringify(e.id)})` : ''} needs \`action\`, the text that says what happened.`)
    })
  },
  [() => props.events, () => props.label],
)

/* -------------------------------------------------------------------------- appearance */
const variant = computed<ActivityFeedVariant>(() => (ACTIVITY_FEED_VARIANTS.includes(props.variant) ? props.variant : 'list'))
const size = computed<ActivityFeedSize>(() => (ACTIVITY_FEED_SIZES.includes(props.size) ? props.size : 'md'))
const density = computed<ActivityFeedDensity>(() => (ACTIVITY_FEED_DENSITIES.includes(props.density) ? props.density : 'comfortable'))
const level = computed(() => (Number.isInteger(props.headingLevel) && props.headingLevel >= 2 && props.headingLevel <= 6 ? props.headingLevel : 3))
const avatars = computed(() => props.showAvatars && (variant.value === 'list' || variant.value === 'grouped'))
const AVATAR_SIZES = { sm: 'xs', md: 'sm', lg: 'md' } as const

/* -------------------------------------------------------------------------- time */
const fmt = computed(() => makeFormatters(props.locale, props.timeZone))
const mountedNow = ref<Date | null>(null)
let timer: ReturnType<typeof setInterval> | undefined
const referenceNow = computed<Date | null>(() => (props.now !== undefined && props.now !== null ? toDate(props.now) : mountedNow.value))
onMounted(() => {
  if (props.now !== undefined && props.now !== null) return
  mountedNow.value = new Date()
  // Keep "5 minutes ago" honest while the page stays open.
  timer = setInterval(() => (mountedNow.value = new Date()), 60_000)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  timer = undefined
})

interface Row {
  key: string
  index: number
  event: ActivityEvent
  tone: ActivityFeedTone
  toneText: string
  icon: IconDefinition | undefined
  summary: string
  initials: string
  timeText: string
  datetime: string | undefined
  title: string | undefined
  detailsId: string
}
const TONE_TEXT: Record<ActivityFeedTone, string> = { neutral: '', primary: '', success: 'Success', warning: 'Warning', danger: 'Error', info: 'Info' }
const TONE_ICON: Partial<Record<ActivityFeedTone, IconDefinition>> = { success: faCircleCheck, warning: faTriangleExclamation, danger: faCircleXmark, info: faCircleInfo }

const rows = computed<Row[]>(() => {
  const used = new Set<string>()
  const f = fmt.value
  const now = props.relative ? referenceNow.value : null
  return list.value.filter((e) => e && typeof e === 'object').map((event, index) => {
    let key = String(event.id ?? index)
    while (used.has(key)) key += '~'
    used.add(key)
    const tone = ACTIVITY_FEED_TONES.includes(event.tone as ActivityFeedTone) ? (event.tone as ActivityFeedTone) : 'neutral'
    const date = toDate(event.time)
    const absolute = date ? f.absolute.format(date) : hasText(event.time) || typeof event.time === 'number' ? String(event.time) : ''
    const rel = date && now ? formatRelative(date, now, f.relative) : null
    const actor = hasText(event.actor) ? event.actor.trim() : ''
    return {
      key,
      index,
      event,
      tone,
      toneText: TONE_TEXT[tone],
      icon: event.icon ?? TONE_ICON[tone],
      summary: [actor, event.action, event.target].filter((s) => hasText(s)).join(' '),
      initials: getInitials(actor),
      timeText: rel ?? absolute,
      datetime: date ? date.toISOString() : undefined,
      title: rel && absolute ? absolute : undefined,
      detailsId: `${uid}-details-${index}`,
    }
  })
})

/* -------------------------------------------------------------------------- grouping */
interface Section {
  key: string
  title: string | null
  headingId: string
  rows: Row[]
}
const sections = computed<Section[]>(() => {
  if (variant.value !== 'grouped') return [{ key: 'all', title: null, headingId: '', rows: rows.value }]
  const map = new Map<string, Section>()
  for (const row of rows.value) {
    const explicit = hasText(row.event.group) ? row.event.group.trim() : ''
    const date = toDate(row.event.time)
    const title = explicit || (date ? fmt.value.day.format(date) : 'Undated')
    let section = map.get(title)
    if (!section) map.set(title, (section = { key: title, title, headingId: `${uid}-group-${map.size}`, rows: [] }))
    section.rows.push(row)
  }
  return [...map.values()]
})

/* -------------------------------------------------------------------------- expanded details */
const own = ref<(string | number)[]>([])
const open = computed<readonly (string | number)[]>(() => (Array.isArray(props.expanded) ? props.expanded : own.value))
const isOpen = (id: string | number) => open.value.includes(id)
const hasDetails = (row: Row) => hasText(row.event.details) || !!slots.details
function toggle(row: Row) {
  const id = row.event.id
  const next = isOpen(id) ? open.value.filter((x) => x !== id) : [...open.value, id]
  if (!Array.isArray(props.expanded)) own.value = next
  emit('update:expanded', next)
  emit('toggle', { id, expanded: next.includes(id) })
}

const classes = computed(() => cn(activityFeedVariants({ variant: variant.value, size: size.value, density: density.value }), props.class))
const markerClass = (row: Row) => activityFeedMarkerVariants({ tone: row.tone, size: size.value })
const itemClass = computed(() => activityFeedItemVariants({ variant: variant.value, density: density.value }))
const toggleClass = cn('-ms-1.5 mt-0.5 inline-flex min-h-6 items-center rounded-sm px-1.5 text-xs text-primary underline-offset-4 hover:underline pointer-coarse:min-h-11', focusRing)
</script>

<template>
  <div
    data-slot="activity-feed"
    role="group"
    :aria-label="label"
    :aria-busy="loading ? 'true' : undefined"
    :data-variant="variant === 'list' ? undefined : variant"
    :data-size="size === 'md' ? undefined : size"
    :data-density="density === 'comfortable' ? undefined : density"
    :class="classes"
  >
    <div v-if="rows.length === 0" data-slot="activity-feed-empty" class="rounded-md border border-dashed p-4 text-center text-muted-foreground">
      <slot name="empty">No activity yet.</slot>
    </div>
    <template v-else>
      <div
        v-for="section in sections"
        :key="section.key"
        :data-slot="section.title === null ? 'activity-feed-section' : 'activity-feed-group'"
        :role="section.title === null ? undefined : 'group'"
        :aria-labelledby="section.title === null ? undefined : section.headingId"
        class="min-w-0"
      >
        <component :is="`h${level}`" v-if="section.title !== null" :id="section.headingId" data-slot="activity-feed-group-title" class="mb-1 break-words text-sm font-semibold text-foreground">{{ section.title }}</component>
        <ol data-slot="activity-feed-list" role="list" class="m-0 min-w-0 list-none p-0">
          <li
            v-for="row in section.rows"
            :key="row.key"
            data-slot="activity-feed-item"
            :data-tone="row.tone === 'neutral' ? undefined : row.tone"
            :data-expanded="isOpen(row.event.id) ? '' : undefined"
            :class="itemClass"
          >
            <div v-if="variant !== 'compact'" data-slot="activity-feed-lead" class="flex shrink-0 flex-col items-center">
              <Avatar v-if="avatars && row.initials" data-slot="activity-feed-avatar" alt="" :fallback="row.initials" :size="AVATAR_SIZES[size]" />
              <span v-else data-slot="activity-feed-marker" aria-hidden="true" :class="markerClass(row)">
                <Icon v-if="row.icon" :icon="row.icon" size="xs" />
                <span v-else class="size-1.5 rounded-full bg-current" />
              </span>
              <span v-if="variant === 'timeline'" data-slot="activity-feed-connector" aria-hidden="true" class="mt-1 w-px grow bg-border group-last/item:hidden" />
            </div>
            <div data-slot="activity-feed-body" class="min-w-0 flex-1">
              <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p data-slot="activity-feed-text" class="m-0 min-w-0 grow break-words text-foreground">
                  <span v-if="row.toneText" data-slot="activity-feed-tone" class="sr-only">{{ row.toneText }}.</span>
                  <Icon v-if="variant === 'compact' && row.icon" :icon="row.icon" size="xs" :class="cn(activityFeedToneIconVariants({ tone: row.tone }), 'me-1')" />
                  <Icon v-else-if="avatars && row.initials && row.icon" :icon="row.icon" size="xs" :class="cn(activityFeedToneIconVariants({ tone: row.tone }), 'me-1')" />
                  <bdi v-if="row.event.actor && row.event.actor.trim()" data-slot="activity-feed-actor" class="font-medium">{{ row.event.actor }}</bdi>
                  {{ ' ' }}<span data-slot="activity-feed-action">{{ row.event.action }}</span>
                  <template v-if="row.event.target">{{ ' ' }}<bdi data-slot="activity-feed-target" class="font-medium">{{ row.event.target }}</bdi></template>
                </p>
                <time v-if="row.timeText" data-slot="activity-feed-time" :datetime="row.datetime" :title="row.title" class="shrink-0 text-xs tabular-nums text-muted-foreground">{{ row.timeText }}</time>
              </div>
              <template v-if="hasDetails(row)">
                <button
                  type="button"
                  data-slot="activity-feed-toggle"
                  :aria-expanded="isOpen(row.event.id) ? 'true' : 'false'"
                  :aria-controls="isOpen(row.event.id) ? row.detailsId : undefined"
                  :class="toggleClass"
                  @click="toggle(row)"
                >{{ isOpen(row.event.id) ? 'Hide details' : 'Show details' }}<span class="sr-only"> for {{ row.summary }}</span></button>
                <div v-if="isOpen(row.event.id)" :id="row.detailsId" data-slot="activity-feed-details" class="mt-1 whitespace-pre-wrap break-words border-s ps-3 text-muted-foreground">
                  <slot name="details" :event="row.event">{{ row.event.details }}</slot>
                </div>
              </template>
            </div>
          </li>
        </ol>
      </div>
    </template>
    <div v-if="hasMore" data-slot="activity-feed-more" class="mt-3 flex justify-center">
      <slot name="load-more" :loading="loading">
        <Button data-slot="activity-feed-load-more" variant="outline" size="sm" :loading="loading" @click="emit('load-more')">{{ loadMoreLabel }}</Button>
      </slot>
    </div>
    <span data-slot="activity-feed-status" role="status" class="sr-only">{{ loading ? 'Loading more activity.' : '' }}</span>
  </div>
</template>
