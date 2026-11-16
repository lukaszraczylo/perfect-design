<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, useId, useTemplateRef, watch } from 'vue'
import { useDateLocale } from '../_shared/dateLocale'
import { requireOneOf, violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import { faArrowDown, faChevronDown, faChevronUp } from '../../../lib/icons'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Button from '../../primitives/Button/Button.vue'
import Icon from '../../primitives/Icon/Icon.vue'
import CopyButton from '../_shared/CopyButton.vue'
import { useMountedCheck } from '../_shared/contract'
import { useVirtualWindow } from '../_shared/useVirtualWindow'
import { parseAnsi } from './ansi'
import { buildRecords, LOG_LEVELS, LOG_LEVEL_TEXT, splitMatches, type LogLevel, type LogLine, type LogRecord } from './logs'
import {
  ansiClasses, LOG_CHAR_WIDTH, LOG_ROW_HEIGHT, LOG_ROW_TONE, LOG_VIEWER_DENSITIES, LOG_VIEWER_SIZES, LOG_VIEWER_VARIANTS, logLevelBadgeVariants, logViewerVariants,
  type LogViewerDensity, type LogViewerSize, type LogViewerVariant,
} from './variants'

export interface LogViewerProps extends BaseProps {
  /** The lines: plain strings (a leading level word such as `ERROR` becomes the badge; ANSI colour codes are rendered) or `{ time?, level?, message, source? }`. */
  lines: readonly (string | LogLine)[]
  /** Accessible name of the log. Required (or `aria-label` / `aria-labelledby`). */
  label?: string
  /** Tail mode: stick to the newest line; scrolling up pauses it and shows "Jump to latest". */
  follow?: boolean
  /** Wrap long lines instead of scrolling sideways. */
  wrap?: boolean
  /** Show line numbers. They are also the control that selects a line for copying. */
  lineNumbers?: boolean
  /** Show the time of lines that have one. */
  timestamps?: boolean
  /** Text to search for (case-insensitive). Supports `v-model:query`. */
  query?: string
  /** `filter` (default) hides lines without a match; `highlight` keeps every line and only marks matches. */
  queryMode?: 'filter' | 'highlight'
  /** Levels to show (default all). Lines without a level always show. Supports `v-model:levelFilter`. */
  levelFilter?: readonly LogLevel[]
  /** Keep only the newest N lines; older ones are dropped. */
  maxLines?: number
  /** `plain` (no frame), `panel` (bordered card, default) or `terminal` (heavier ink frame). Unknown values fall back to `panel`. */
  variant?: LogViewerVariant
  /** Text and row size. Unknown values fall back to `md`. */
  size?: LogViewerSize
  /** `comfortable` (default) or `compact` rows. Unknown values fall back to `comfortable`. */
  density?: LogViewerDensity
  /** Show the search, level and copy controls. */
  toolbar?: boolean
  /** Announce new lines to screen readers while following (one throttled polite summary, never the lines themselves). */
  announce?: boolean
  /** Minimum milliseconds between announcements. */
  announceInterval?: number
  /** Height of the whole viewer: a number (px) or any CSS length. Default `20rem`; `class` can set another. */
  height?: number | string
  /** Locale for numbers and times. Falls back to `ConfigProvider`, then `en`. */
  locale?: string
  /** Time zone for times given as Date or epoch milliseconds. Falls back to `ConfigProvider`, then `UTC`. */
  timeZone?: string
}

const props = withDefaults(defineProps<LogViewerProps>(), {
  follow: false,
  wrap: false,
  lineNumbers: true,
  timestamps: true,
  query: '',
  queryMode: 'filter',
  maxLines: undefined,
  variant: 'panel',
  size: 'md',
  density: 'comfortable',
  toolbar: true,
  announce: true,
  announceInterval: 2000,
})
const emit = defineEmits<{
  /** The search text changed. */
  'update:query': [query: string]
  /** The shown levels changed. */
  'update:levelFilter': [levels: LogLevel[]]
  /** Lines were copied. */
  copy: [text: string]
  /** Following paused because the reader scrolled up. */
  pause: []
  /** Following resumed (scrolled to the end, or "Jump to latest"). */
  resume: []
}>()
defineSlots<{ empty(): unknown }>()

const attrs = useAttrs()
useMountedCheck(() => {
  requireOneOf('LogViewer', { label: props.label, 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'] }, 'A log is a named region, e.g. `label="Build output"`.')
  if (!Array.isArray(props.lines)) violation('LogViewer', 'requires-lines', 'requires `lines`, an array of strings or `{ message }` objects (an empty array is fine).')
})

const uid = useId()
const viewport = useTemplateRef<HTMLElement>('viewport')

const variant = computed<LogViewerVariant>(() => (LOG_VIEWER_VARIANTS.includes(props.variant) ? props.variant : 'panel'))
const size = computed<LogViewerSize>(() => (LOG_VIEWER_SIZES.includes(props.size) ? props.size : 'md'))
const density = computed<LogViewerDensity>(() => (LOG_VIEWER_DENSITIES.includes(props.density) ? props.density : 'comfortable'))
const rowHeight = computed(() => LOG_ROW_HEIGHT[density.value][size.value])

const dateLocale = useDateLocale(props)
const built = computed(() => buildRecords(props.lines, props.maxLines, { locale: dateLocale.locale.value, timeZone: dateLocale.timeZone.value }))
const records = computed(() => built.value.records)
const dropped = computed(() => built.value.dropped)
const nf = computed(() => {
  try {
    return new Intl.NumberFormat(dateLocale.locale.value)
  } catch {
    return new Intl.NumberFormat()
  }
})
const fmt = (n: number) => nf.value.format(n)

// ---- filters
const q = ref(props.query ?? '')
watch(() => props.query, (v) => (q.value = v ?? ''))
const levels = ref<Set<LogLevel>>(new Set(props.levelFilter ?? LOG_LEVELS))
watch(() => props.levelFilter, (v) => (levels.value = new Set(v ?? LOG_LEVELS)))
const needle = computed(() => (q.value.trim() ? q.value : ''))
const lowerNeedle = computed(() => needle.value.toLowerCase())
const filterText = computed(() => !!needle.value && props.queryMode !== 'highlight')

const visible = computed<number[] | null>(() => {
  const byLevel = levels.value.size < LOG_LEVELS.length
  if (!byLevel && !filterText.value) return null
  const out: number[] = []
  const list = records.value
  const n = lowerNeedle.value
  for (let i = 0; i < list.length; i++) {
    const r = list[i]
    if (byLevel && r.level && !levels.value.has(r.level)) continue
    if (filterText.value && !r.text.toLowerCase().includes(n)) continue
    out.push(i)
  }
  return out
})
const count = computed(() => (visible.value ? visible.value.length : records.value.length))
const recordAt = (pos: number): LogRecord | undefined => records.value[visible.value ? visible.value[pos] : pos]

const matches = computed<number[]>(() => {
  if (!needle.value) return []
  const out: number[] = []
  for (let pos = 0; pos < count.value; pos++) if (recordAt(pos)!.text.toLowerCase().includes(lowerNeedle.value)) out.push(pos)
  return out
})
const cur = ref(0)
watch([needle, () => props.queryMode, matches], ([n], [prev]) => {
  if (cur.value >= matches.value.length) cur.value = 0
  if (n !== prev) {
    cur.value = 0
    if (n && matches.value.length) void goTo(0)
  }
})
const currentPos = computed(() => (matches.value.length ? matches.value[Math.min(cur.value, matches.value.length - 1)] : -1))
const statusMessage = computed(() => {
  if (needle.value) return matches.value.length ? `Match ${cur.value + 1} of ${matches.value.length}` : 'No matching lines'
  return levels.value.size < LOG_LEVELS.length ? `${fmt(count.value)} lines shown` : ''
})

function onInput(e: Event) {
  q.value = (e.target as HTMLInputElement).value
  emit('update:query', q.value)
}
function clearQuery() {
  q.value = ''
  emit('update:query', '')
}
function toggleLevel(level: LogLevel) {
  const next = new Set(levels.value)
  if (next.has(level)) next.delete(level)
  else next.add(level)
  levels.value = next
  emit('update:levelFilter', LOG_LEVELS.filter((l) => next.has(l)))
}

// ---- windowing
const measuredH = ref(0)
const measuredW = ref(0)
const viewportH = computed(() => measuredH.value || (typeof props.height === 'number' ? props.height : 0))
const win = useVirtualWindow({
  count: () => count.value,
  rowHeight: () => (props.wrap ? undefined : rowHeight.value),
  estimate: (pos) => {
    const chars = recordAt(pos)?.text.length ?? 0
    const perRow = Math.max(12, Math.floor(Math.max(240, measuredW.value - 120) / LOG_CHAR_WIDTH[size.value]))
    return rowHeight.value * Math.max(1, Math.ceil(chars / perRow))
  },
  viewport: () => viewportH.value,
  overscan: 10,
})
watch([() => props.wrap, size, density, measuredW], () => win.reset())
const rows = computed(() => {
  const out: { pos: number; rec: LogRecord }[] = []
  for (let pos = win.range.value.start; pos < win.range.value.end; pos++) {
    const rec = recordAt(pos)
    if (rec) out.push({ pos, rec })
  }
  return out
})

// ---- follow (tail) mode
const paused = ref(false)
const pausedAt = ref(0)
let lastTop = 0
const sticking = computed(() => props.follow && !paused.value)
const newSincePause = computed(() => Math.max(0, props.lines.length - pausedAt.value))

function setTop(top: number) {
  const el = viewport.value
  if (el) el.scrollTop = top
  win.scrollTop.value = top
  lastTop = top
}
function scrollToBottom() {
  const el = viewport.value
  if (!el) return
  setTop(Math.max(0, win.total.value - viewportH.value, el.scrollHeight - el.clientHeight))
}
function pause() {
  if (!props.follow || paused.value) return
  paused.value = true
  pausedAt.value = props.lines.length
  emit('pause')
}
function resume() {
  if (!paused.value) return
  paused.value = false
  emit('resume')
}
function jumpToLatest() {
  resume()
  void nextTick(scrollToBottom)
  viewport.value?.focus()
}
function onScroll() {
  const el = viewport.value
  if (!el) return
  const top = el.scrollTop
  win.scrollTop.value = top
  if (props.follow) {
    const atBottom = el.scrollHeight - el.clientHeight - top <= 4
    if (atBottom) resume()
    else if (top < lastTop - 1) pause()
  }
  lastTop = top
}
watch(() => props.follow, (on) => {
  paused.value = false
  if (on) void nextTick(scrollToBottom)
})
watch(count, () => {
  if (sticking.value) void nextTick(scrollToBottom)
})
onUpdated(() => {
  if (props.wrap) win.measure(viewport.value)
  if (sticking.value) scrollToBottom()
})

// ---- search navigation
async function goTo(i: number) {
  if (!matches.value.length) return
  cur.value = (i + matches.value.length) % matches.value.length
  pause()
  await nextTick()
  setTop(Math.max(0, win.offsetOf(matches.value[cur.value]) - Math.max(0, viewportH.value - rowHeight.value) / 2))
}
const next = () => goTo(cur.value + 1)
const prev = () => goTo(cur.value - 1)
function onViewportKey(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey || e.target !== viewport.value) return
  if (e.key === 'n') void next()
  else if (e.key === 'p') void prev()
}
function onSearchKey(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    void (e.shiftKey ? prev() : next())
  } else if (e.key === 'Escape' && q.value) {
    e.preventDefault()
    clearQuery()
  }
}

// ---- selection and copy
const selected = ref<Set<number>>(new Set())
watch(records, (list) => {
  if (selected.value.size && [...selected.value].some((i) => i >= list.length)) selected.value = new Set([...selected.value].filter((i) => i < list.length))
})
function toggleSelect(index: number) {
  const s = new Set(selected.value)
  if (s.has(index)) s.delete(index)
  else s.add(index)
  selected.value = s
}
const clearSelection = () => (selected.value = new Set())
function copyText(): string {
  if (selected.value.size) return Array.from(selected.value).sort((a, b) => a - b).map((i) => records.value[i].copy).join('\n')
  const out: string[] = []
  for (let pos = 0; pos < count.value; pos++) out.push(recordAt(pos)!.copy)
  return out.join('\n')
}
const copyLabel = computed(() => (selected.value.size ? `Copy ${fmt(selected.value.size)} selected ${selected.value.size === 1 ? 'line' : 'lines'}` : 'Copy visible lines'))

// ---- live announcements: one throttled polite summary, off while paused
const liveText = ref('')
let pending = 0
let lastLength = props.lines?.length ?? 0
let timer: ReturnType<typeof setTimeout> | undefined
function flushLive() {
  timer = undefined
  if (!pending || !sticking.value) return (pending = 0)
  const last = records.value[records.value.length - 1]
  const tail = last ? `${last.level ? `${LOG_LEVEL_TEXT[last.level]}: ` : ''}${last.text.slice(0, 120)}` : ''
  liveText.value = `${fmt(pending)} new ${pending === 1 ? 'line' : 'lines'}. Latest ${tail}`
  pending = 0
}
watch(() => props.lines?.length ?? 0, (len) => {
  const added = len - lastLength
  lastLength = len
  if (added <= 0 || !props.announce || !sticking.value) return
  pending += added
  if (timer === undefined) timer = setTimeout(flushLive, Math.max(0, props.announceInterval))
})
watch(sticking, (on) => {
  if (!on) {
    pending = 0
    liveText.value = ''
  }
})

// ---- measuring
let ro: ResizeObserver | undefined
function measure() {
  const el = viewport.value
  if (!el) return
  measuredH.value = el.clientHeight
  measuredW.value = el.clientWidth
}
onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined' && viewport.value) {
    ro = new ResizeObserver(measure)
    ro.observe(viewport.value)
  }
  if (props.follow) scrollToBottom()
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  ro?.disconnect()
  ro = undefined
})
defineExpose({ scrollToBottom, next, prev, clearSelection })

// ---- rendering helpers
const gutter = computed(() => `${String(dropped.value + records.value.length).length}ch`)
const segments = (rec: LogRecord): { text: string; cls?: string }[] => (rec.ansi ? parseAnsi(rec.raw).map((s) => ({ text: s.text, cls: ansiClasses(s) || undefined })) : [{ text: rec.raw }])
function pieces(text: string) {
  return needle.value ? splitMatches(text, needle.value) : [{ text, match: false }]
}
const rootStyle = computed(() => {
  const h = props.height
  if (h === undefined || h === null || h === '') return undefined
  return { height: typeof h === 'number' ? `${h}px` : h }
})
const classes = computed(() => cn(logViewerVariants({ variant: variant.value, size: size.value }), 'h-80', props.class))
const emptyText = computed(() => (records.value.length === 0 ? 'No log lines yet.' : 'No lines match the current filters.'))
const levelButton = 'inline-flex min-h-6 items-center rounded-md border px-2 text-xs font-medium pointer-coarse:min-h-11 aria-pressed:border-foreground aria-pressed:bg-accent aria-pressed:text-accent-foreground aria-[pressed=false]:text-muted-foreground aria-[pressed=false]:line-through'
</script>

<template>
  <div
    data-slot="log-viewer"
    :data-variant="variant"
    :data-size="size === 'md' ? undefined : size"
    :data-density="density === 'comfortable' ? undefined : density"
    :data-wrap="wrap ? '' : undefined"
    :data-following="follow ? (paused ? 'paused' : 'on') : undefined"
    :style="rootStyle"
    :class="classes"
  >
    <div v-if="toolbar" data-slot="log-viewer-toolbar" role="group" aria-label="Log controls" class="flex shrink-0 flex-wrap items-center gap-2 border-b bg-muted p-2 font-sans text-foreground">
      <input
        :id="`${uid}-search`"
        data-slot="log-viewer-search"
        type="search"
        aria-label="Filter log lines"
        placeholder="Filter lines"
        autocomplete="off"
        :value="q"
        :class="cn('h-8 min-w-32 flex-1 rounded-md border border-input bg-background px-2 text-base text-foreground placeholder:text-muted-foreground md:text-sm pointer-coarse:h-11', focusRing)"
        @input="onInput"
        @keydown="onSearchKey"
      />
      <span data-slot="log-viewer-nav" class="inline-flex items-center gap-1">
        <Button data-slot="log-viewer-prev" variant="ghost" size="icon-sm" aria-label="Previous match" :disabled="matches.length === 0" @click="prev"><Icon :icon="faChevronUp" size="xs" /></Button>
        <Button data-slot="log-viewer-next" variant="ghost" size="icon-sm" aria-label="Next match" :disabled="matches.length === 0" @click="next"><Icon :icon="faChevronDown" size="xs" /></Button>
      </span>
      <span data-slot="log-viewer-count" class="text-xs text-muted-foreground tabular-nums">
        {{ fmt(count) }} of {{ fmt(records.length) }} lines<template v-if="dropped > 0">, newest {{ fmt(records.length) }} kept</template>
      </span>
      <span data-slot="log-viewer-levels" role="group" aria-label="Show levels" class="inline-flex flex-wrap items-center gap-1">
        <button v-for="level in LOG_LEVELS" :key="level" type="button" data-slot="log-viewer-level" :data-level="level" :aria-pressed="levels.has(level)" :class="cn(levelButton, focusRing)" @click="toggleLevel(level)">{{ LOG_LEVEL_TEXT[level] }}</button>
      </span>
      <span class="ms-auto inline-flex items-center gap-1">
        <Button v-if="selected.size" data-slot="log-viewer-clear" variant="ghost" size="xs" class="pointer-coarse:min-h-11" @click="clearSelection">Clear selection</Button>
        <CopyButton :text="copyText" :label="copyLabel" copied-label="Lines copied" @copy="(t) => emit('copy', t)" />
      </span>
    </div>
    <div data-slot="log-viewer-body" class="relative min-h-0 flex-1">
      <div
        ref="viewport"
        data-slot="log-viewer-viewport"
        role="log"
        aria-live="off"
        tabindex="0"
        :aria-label="label"
        :class="cn('size-full overflow-auto font-mono [overflow-anchor:none] [tab-size:4] focus-visible:ring-inset', focusRing)"
        @scroll.passive="onScroll"
        @keydown="onViewportKey"
      >
        <div v-if="count === 0" data-slot="log-viewer-empty" class="p-4 font-sans text-muted-foreground"><slot name="empty">{{ emptyText }}</slot></div>
        <div v-else data-slot="log-viewer-lines" :class="wrap ? 'w-full' : 'w-max min-w-full'" :style="{ paddingTop: `${win.padTop.value}px`, paddingBottom: `${win.padBottom.value}px` }">
          <div
            v-for="row in rows"
            :key="row.rec.index"
            data-slot="log-viewer-line"
            :data-index="row.pos"
            :data-line="dropped + row.rec.index + 1"
            :data-level="row.rec.level"
            :data-selected="selected.has(row.rec.index) ? '' : undefined"
            :data-current="row.pos === currentPos ? '' : undefined"
            :aria-current="row.pos === currentPos ? 'true' : undefined"
            :style="wrap ? { minHeight: `${rowHeight}px` } : { height: `${rowHeight}px` }"
            :class="cn('flex items-start gap-2 pe-3', row.rec.level && LOG_ROW_TONE[row.rec.level], selected.has(row.rec.index) && 'bg-accent text-accent-foreground', row.pos === currentPos && 'outline outline-1 -outline-offset-1 outline-ring')"
          >
            <span v-if="lineNumbers" data-slot="log-viewer-gutter" class="flex shrink-0 items-start justify-end" :style="{ minWidth: gutter }">
              <button
                type="button"
                data-slot="log-viewer-select"
                :aria-pressed="selected.has(row.rec.index)"
                :aria-label="`Select line ${dropped + row.rec.index + 1}`"
                :class="cn('inline-flex min-h-6 min-w-6 items-center justify-end rounded-sm px-1 text-end text-muted-foreground tabular-nums aria-pressed:font-semibold aria-pressed:text-accent-foreground pointer-coarse:min-h-11 pointer-coarse:min-w-11', focusRing)"
                :style="{ minWidth: `calc(${gutter} + 0.5rem)`, minHeight: `${rowHeight}px` }"
                @click="toggleSelect(row.rec.index)"
              >{{ dropped + row.rec.index + 1 }}</button>
            </span>
            <time v-if="timestamps && row.rec.time" data-slot="log-viewer-time" :datetime="row.rec.datetime" class="shrink-0 text-muted-foreground tabular-nums" :style="{ lineHeight: `${rowHeight}px` }">{{ row.rec.time }}</time>
            <span v-if="row.rec.level" data-slot="log-viewer-level-badge" :class="cn(logLevelBadgeVariants(row.rec.level), 'mt-0.5')">{{ LOG_LEVEL_TEXT[row.rec.level] }}</span>
            <span v-if="row.rec.source" data-slot="log-viewer-source" class="shrink-0 text-muted-foreground" :style="{ lineHeight: `${rowHeight}px` }">{{ row.rec.source }}</span>
            <span data-slot="log-viewer-message" :class="cn('min-w-0 flex-1', wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre')" :style="{ lineHeight: `${rowHeight}px` }"
              ><template v-for="(seg, i) in segments(row.rec)" :key="i"
                ><span :class="seg.cls"
                  ><template v-for="(piece, j) in pieces(seg.text)" :key="j"
                    ><mark v-if="piece.match" data-slot="log-viewer-match" :class="row.pos === currentPos ? 'rounded-sm bg-primary text-primary-foreground' : 'rounded-sm bg-accent text-accent-foreground underline decoration-2 underline-offset-2'">{{ piece.text }}</mark
                    ><template v-else>{{ piece.text }}</template></template
                  ></span
                ></template
              ></span
            >
          </div>
        </div>
      </div>
      <button
        v-if="follow && paused"
        type="button"
        data-slot="log-viewer-jump"
        :class="cn('absolute end-4 bottom-3 inline-flex min-h-8 items-center gap-1.5 rounded-md border bg-background px-3 font-sans text-sm font-medium text-foreground shadow-md pointer-coarse:min-h-11', focusRing)"
        @click="jumpToLatest"
      >
        <Icon :icon="faArrowDown" size="xs" />Jump to latest<span v-if="newSincePause > 0" class="text-muted-foreground tabular-nums">({{ fmt(newSincePause) }} new)</span>
      </button>
    </div>
    <p data-slot="log-viewer-status" role="status" class="sr-only">{{ statusMessage }}</p>
    <p data-slot="log-viewer-live" role="status" class="sr-only">{{ liveText }}</p>
  </div>
</template>
