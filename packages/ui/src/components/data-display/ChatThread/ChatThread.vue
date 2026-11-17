<script setup lang="ts" generic="T">
import { computed, nextTick, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, ref, useAttrs, useSlots, watch } from 'vue'
import { useDateLocale } from '../_shared/dateLocale'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { faArrowDown } from '../../../lib/icons'
import type { BaseProps } from '../../../lib/types'
import Button from '../../primitives/Button/Button.vue'
import Icon from '../../primitives/Icon/Icon.vue'
import TypingIndicator from '../../feedback/TypingIndicator/TypingIndicator.vue'
import { useMountedCheck, hasAriaName, hasText } from '../_shared/contract'
import { dayKey, formatDay, toDate, type ChatDateInput } from '../ChatMessage/date'
import { CHAT_THREAD_DENSITIES, chatThreadContentVariants, chatThreadLogClasses, chatThreadVariants, type ChatThreadDensity } from './variants'

export interface ChatThreadLabels {
  /** Jump button text. */
  jump: string
  /** Appended to the jump button as `(3 new)`; receives the number of messages that arrived while scrolled up. */
  unread: (count: number) => string
  /** Load-older button text. */
  loadOlder: string
  /** Load-older button text while `loadingOlder` is set. */
  loadingOlder: string
  /** Typing indicator text. Also announced once when it appears. */
  typing: string
  /** Typing indicator text when `typing` names who is writing. Receives that name. */
  typingBy: (name: string) => string
  /** Empty state text. */
  empty: string
  /** Summary announced when messages arrive. */
  newMessages: (count: number) => string
}

export interface ChatThreadProps<T> extends BaseProps {
  /** Messages as data: each item is drawn by the `message` slot. Omit it and put `ChatMessage` elements in the default slot instead. `null` counts as empty. */
  messages?: readonly T[]
  /** Stable key per message: a property name or a function. Needed to tell appended from prepended messages and for stable DOM; defaults to the index. */
  itemKey?: string | ((item: T, index: number) => string | number)
  /** When a message was sent, for day separators: a property name or a function returning a date, ISO string or timestamp. Items without a valid date join the day before them. */
  itemDate?: string | ((item: T, index: number) => ChatDateInput)
  /** Accessible name of the log. Required: set `label`, `aria-label` or `aria-labelledby`. */
  label?: string
  /** Stick to the bottom while the reader is at the bottom; scrolling up stops it and shows the jump button. Turn off for a plain scrolling list. */
  follow?: boolean
  /** Show the typing or streaming indicator at the end. A string names who is typing ("Mira" reads "Mira is typing"). Announced politely once when it appears. */
  typing?: boolean | string
  /** Spacing: `compact`, `default` or `relaxed`. Unknown values fall back to `default`. */
  density?: ChatThreadDensity
  /** More history exists: shows the load-older control at the top. */
  canLoadOlder?: boolean
  /** A load is in progress: disables the button and blocks repeated requests. */
  loadingOlder?: boolean
  /** Also emit `load-older` once when the reader scrolls to the top. It fires again only after `loadingOlder` ends or the list changes. */
  autoLoadOlder?: boolean
  /** BCP 47 locale for the day labels. Falls back to `ConfigProvider`, then `en`. */
  locale?: string
  /** IANA time zone used to decide which day a message belongs to. Falls back to `ConfigProvider`, then `UTC`. */
  timeZone?: string
  /** The current time, for "Today" and "Yesterday". Defaults to the clock after mount; pass it for tests or server rendering. */
  now?: ChatDateInput
  /** Text to announce politely (debounced), instead of the automatic "N new messages". */
  announcement?: string
  /** Replace any of the built-in texts, for translation. */
  labels?: Partial<ChatThreadLabels>
}

const props = withDefaults(defineProps<ChatThreadProps<T>>(), {
  messages: undefined,
  itemKey: undefined,
  itemDate: undefined,
  label: undefined,
  follow: true,
  typing: false,
  density: 'default',
  canLoadOlder: false,
  loadingOlder: false,
  autoLoadOlder: false,
  locale: undefined,
  timeZone: undefined,
  now: undefined,
  announcement: undefined,
  labels: undefined,
})

const emit = defineEmits<{
  /** More history is wanted: the button was pressed, or the top was reached with `autoLoadOlder`. */
  'load-older': []
  /** The reader started or stopped following the latest message (at the bottom with `follow` on). */
  'follow-change': [following: boolean]
}>()

defineSlots<{
  default(): unknown
  message(props: { message: T; index: number; id: string | number }): unknown
  empty(): unknown
  typing(): unknown
  'load-older'(props: { loading: boolean; load: () => void }): unknown
  day(props: { label: string; date: string }): unknown
}>()

defineOptions({ inheritAttrs: false })

const NEAR_BOTTOM_PX = 8
const AT_TOP_PX = 1
const ANNOUNCE_MS = 1000
const ANNOUNCE_CLEAR_MS = 5000

const DEFAULT_LABELS: ChatThreadLabels = {
  jump: 'Jump to latest',
  unread: (n) => `${n} new`,
  loadOlder: 'Load older messages',
  loadingOlder: 'Loading older messages',
  typing: 'Replying',
  typingBy: (name) => `${name} is typing`,
  empty: 'No messages yet',
  newMessages: (n) => (n === 1 ? '1 new message' : `${n} new messages`),
}
const text = computed<ChatThreadLabels>(() => ({ ...DEFAULT_LABELS, ...(props.labels ?? {}) }))
const typingName = computed(() => (typeof props.typing === 'string' ? props.typing.trim() : ''))
const isTyping = computed(() => props.typing === true || typingName.value !== '')
const typingLabel = computed(() => (typingName.value ? text.value.typingBy(typingName.value) : text.value.typing))

const slots = useSlots()
const attrs = useAttrs()
// `class` and `style` belong to the root; everything else (aria-label, id, data-*) goes to the log element that carries the role.
const logAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})
const logLabel = computed(() => (typeof attrs['aria-label'] === 'string' && attrs['aria-label'] ? attrs['aria-label'] : hasText(props.label) ? props.label : undefined))

useMountedCheck(() => {
  if (!hasText(props.label) && !hasAriaName(attrs)) {
    violation('ChatThread', 'requires-accessible-name', 'needs an accessible name for the log. Set `label`, `aria-label` or `aria-labelledby`.')
  }
  if (props.messages !== undefined && props.messages !== null && !slots.message) {
    violation('ChatThread', 'requires-message-slot', 'needs a `message` slot to draw each item when `messages` is set. Render a `ChatMessage` in it, or omit `messages` and use the default slot.')
  }
})

/* ------------------------------------------------------------------ rows */

const items = computed<readonly T[]>(() => props.messages ?? [])
const dataMode = computed(() => props.messages !== undefined && props.messages !== null)

function read(item: unknown, key: string | ((item: T, index: number) => unknown) | undefined, index: number): unknown {
  if (typeof key === 'function') return key(item as T, index)
  if (typeof key === 'string' && item !== null && typeof item === 'object') return (item as Record<string, unknown>)[key]
  return undefined
}

const dateLocale = useDateLocale(props)
const mounted = ref(false)
// A client-only minute clock keeps "Today" and "Yesterday" correct across midnight; the server and first client render have none.
const CLOCK_MS = 60_000
const tick = ref<Date | null>(null)
let clockTimer: ReturnType<typeof setInterval> | undefined
const clock = computed(() => (props.now !== undefined ? toDate(props.now) : tick.value))

interface Row {
  item: T
  index: number
  key: string | number
  day: { key: string; label: string } | null
}
const rows = computed<Row[]>(() => {
  const out: Row[] = []
  let lastDay = ''
  const now = clock.value
  items.value.forEach((item, index) => {
    const raw = read(item, props.itemKey, index)
    const key = typeof raw === 'string' || typeof raw === 'number' ? raw : index
    const date = toDate(read(item, props.itemDate, index) as ChatDateInput)
    let day: Row['day'] = null
    if (date) {
      const k = dayKey(date, dateLocale.timeZone.value)
      if (k !== lastDay) {
        lastDay = k
        day = { key: k, label: formatDay(date, dateLocale.locale.value, dateLocale.timeZone.value, now) }
      }
    }
    out.push({ item, index, key, day })
  })
  return out
})
const hasContent = computed(() => (dataMode.value ? rows.value.length > 0 : !!slots.default))
const firstKey = computed(() => rows.value[0]?.key)
const lastKey = computed(() => rows.value[rows.value.length - 1]?.key)

/* ------------------------------------------------------------------ follow */

const log = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const atBottom = ref(true)
const unread = ref(0)
const following = computed(() => props.follow && atBottom.value)
const showJump = computed(() => props.follow && !atBottom.value)

function distanceFromBottom(el: HTMLElement): number {
  return el.scrollHeight - el.scrollTop - el.clientHeight
}
function updateBottom() {
  const el = log.value
  if (!el) return
  atBottom.value = distanceFromBottom(el) <= NEAR_BOTTOM_PX
  if (atBottom.value) unread.value = 0
}
function scrollToBottom() {
  const el = log.value
  if (!el) return
  el.scrollTop = el.scrollHeight
  atBottom.value = true
  unread.value = 0
}
function scrollToTop() {
  if (log.value) log.value.scrollTop = 0
  updateBottom()
}
/** The reader asked for the latest: scroll down, resume following and keep focus inside the log (the button disappears). */
function jump() {
  scrollToBottom()
  nextTick(() => log.value?.focus())
}
/** New or growing content: stay at the bottom only if the reader was already there. */
function onContentChange() {
  if (props.follow && atBottom.value) scrollToBottom()
}

watch(following, (value) => emit('follow-change', value))

/* ------------------------------------------------------------------ older messages */

let olderRequested = false
function requestOlder() {
  if (props.loadingOlder) return
  olderRequested = true
  emit('load-older')
}
watch(() => props.loadingOlder, (loading) => {
  if (!loading) olderRequested = false
})
watch(() => props.canLoadOlder, () => {
  olderRequested = false
})

function onScroll() {
  updateBottom()
  const el = log.value
  if (el && props.autoLoadOlder && props.canLoadOlder && !props.loadingOlder && !olderRequested && el.scrollTop <= AT_TOP_PX) requestOlder()
}

function onKeydown(e: KeyboardEvent) {
  if (e.target !== log.value || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
  if (e.key === 'Home') {
    e.preventDefault()
    scrollToTop()
  } else if (e.key === 'End') {
    e.preventDefault()
    scrollToBottom()
  }
}

// Keep the reader's place when older messages are added above, and stay at the bottom when new ones arrive.
let heightBefore = 0
let topBefore = 0
let renderedFirst: string | number | undefined
let renderedLast: string | number | undefined
onBeforeUpdate(() => {
  heightBefore = log.value?.scrollHeight ?? 0
  topBefore = log.value?.scrollTop ?? 0
})
onUpdated(() => {
  const el = log.value
  const prepended = renderedFirst !== undefined && firstKey.value !== renderedFirst && lastKey.value === renderedLast
  if (el && prepended) el.scrollTop = topBefore + (el.scrollHeight - heightBefore)
  renderedFirst = firstKey.value
  renderedLast = lastKey.value
})

/* ------------------------------------------------------------------ announcements */

const announced = ref('')
let pending: { added: number; typing: string; text: string } = { added: 0, typing: '', text: '' }
let announceTimer: ReturnType<typeof setTimeout> | undefined
let clearTimer: ReturnType<typeof setTimeout> | undefined

function flushAnnouncement() {
  announceTimer = undefined
  const message = pending.text || (pending.added > 0 ? text.value.newMessages(pending.added) : pending.typing)
  pending = { added: 0, typing: '', text: '' }
  if (!message) return
  announced.value = message
  clearTimeout(clearTimer)
  clearTimer = setTimeout(() => (announced.value = ''), ANNOUNCE_CLEAR_MS)
}
/** One summary per second at most, however many messages arrived. The text of a streamed message is never announced. */
function scheduleAnnouncement() {
  announceTimer ??= setTimeout(flushAnnouncement, ANNOUNCE_MS)
}

watch(
  () => rows.value.map((r) => r.key),
  (keys, old) => {
    const previousLast = old?.[old.length - 1]
    if (!mounted.value || previousLast === undefined) return
    const at = keys.lastIndexOf(previousLast)
    const added = at === -1 ? 0 : keys.length - 1 - at
    if (added <= 0) return
    if (!atBottom.value) unread.value += added
    pending.added += added
    scheduleAnnouncement()
  },
)
watch(() => (isTyping.value ? typingLabel.value : ''), (label) => {
  if (!label) return
  pending.typing = label
  scheduleAnnouncement()
})
watch(() => props.announcement, (value) => {
  if (!hasText(value)) return
  pending.text = value
  scheduleAnnouncement()
})

/* ------------------------------------------------------------------ lifecycle */

let observer: ResizeObserver | undefined
onMounted(() => {
  mounted.value = true
  tick.value = new Date()
  clockTimer = setInterval(() => (tick.value = new Date()), CLOCK_MS)
  renderedFirst = firstKey.value
  renderedLast = lastKey.value
  if (props.follow) scrollToBottom()
  if (typeof ResizeObserver !== 'undefined' && content.value) {
    observer = new ResizeObserver(onContentChange)
    observer.observe(content.value)
  }
})
onBeforeUnmount(() => {
  clearInterval(clockTimer)
  clockTimer = undefined
  observer?.disconnect()
  observer = undefined
  clearTimeout(announceTimer)
  clearTimeout(clearTimer)
})
watch(rows, () => nextTick(onContentChange), { flush: 'post' })

defineExpose({ scrollToBottom, scrollToTop, log })

const density = computed<ChatThreadDensity>(() => (CHAT_THREAD_DENSITIES.includes(props.density) ? props.density : 'default'))
const rootClasses = computed(() => cn(chatThreadVariants(), props.class))
const contentClasses = computed(() => chatThreadContentVariants({ density: density.value }))
</script>

<template>
  <div data-slot="chat-thread" :data-density="density === 'default' ? undefined : density" :data-following="following ? '' : undefined" :class="rootClasses" :style="attrs.style as never">
    <div
      v-bind="logAttrs"
      ref="log"
      data-slot="chat-thread-log"
      role="log"
      aria-live="off"
      tabindex="0"
      :aria-label="logLabel"
      :aria-busy="isTyping ? 'true' : undefined"
      :class="chatThreadLogClasses"
      @scroll.passive="onScroll"
      @keydown="onKeydown"
    >
      <div ref="content" data-slot="chat-thread-content" :class="contentClasses">
        <div v-if="canLoadOlder" data-slot="chat-thread-older" class="flex justify-center">
          <slot name="load-older" :loading="loadingOlder" :load="requestOlder">
            <Button variant="outline" size="sm" :disabled="loadingOlder" :aria-busy="loadingOlder ? 'true' : undefined" @click="requestOlder">{{ loadingOlder ? text.loadingOlder : text.loadOlder }}</Button>
          </slot>
        </div>

        <template v-if="dataMode && hasContent">
          <template v-for="row in rows" :key="row.key">
            <div v-if="row.day" data-slot="chat-thread-day" class="flex min-w-0 items-center gap-3 text-xs text-muted-foreground">
              <span aria-hidden="true" class="flex-1 border-t border-border" />
              <slot name="day" :label="row.day.label" :date="row.day.key">
                <time :datetime="row.day.key" class="min-w-0 break-words font-medium">{{ row.day.label }}</time>
              </slot>
              <span aria-hidden="true" class="flex-1 border-t border-border" />
            </div>
            <div data-slot="chat-thread-item" :data-index="row.index" class="min-w-0">
              <slot name="message" :message="row.item" :index="row.index" :id="row.key" />
            </div>
          </template>
        </template>
        <slot v-else-if="!dataMode && hasContent" />
        <div v-else data-slot="chat-thread-empty" class="p-4 text-center text-sm text-muted-foreground">
          <slot name="empty">{{ text.empty }}</slot>
        </div>

        <div v-if="isTyping" data-slot="chat-thread-typing" class="flex items-center gap-2 text-sm text-muted-foreground">
          <slot name="typing">
            <TypingIndicator decorative variant="plain" size="sm" :label="typingLabel" />
            <span>{{ typingLabel }}</span>
          </slot>
        </div>
      </div>
    </div>

    <div v-if="showJump" data-slot="chat-thread-jump-area" class="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
      <Button data-slot="chat-thread-jump" variant="outline" size="sm" class="pointer-events-auto bg-background" @click="jump">
        <Icon :icon="faArrowDown" size="xs" />
        {{ text.jump }}
        <span v-if="unread > 0" class="tabular-nums">({{ text.unread(unread) }})</span>
      </Button>
    </div>

    <div data-slot="chat-thread-status" role="status" aria-atomic="true" class="sr-only">{{ announced }}</div>
  </div>
</template>
