<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { subscribeClock, normalizeInterval } from './clock'
import {
  formatAbsolute,
  formatRelative,
  parseDateTime,
  resolveLocale,
  toMillis,
  type DateStyle,
  type RelativeNumeric,
  type RelativeUnitStyle,
  type MomentInput,
  type TimeStyle,
} from './format'
import type { RelativeUnit } from './units'
import {
  relativeTimeSizes,
  relativeTimeTones,
  relativeTimeVariantNames,
  relativeTimeVariants,
  type RelativeTimeSize,
  type RelativeTimeTone,
  type RelativeTimeVariant,
} from './variants'

export interface RelativeTimeProps extends BaseProps {
  /** The moment: Date, epoch milliseconds or an ISO 8601 string. Anything invalid renders `fallback`. */
  datetime: Date | number | string
  /**
   * The reference moment (Date, epoch ms or ISO string). Pins the output: no clock is read and `updateInterval` is
   * ignored. Use it in tests, docs and server rendering. Without it the first render shows the absolute date and the
   * relative text appears after mount, so server and client markup match.
   */
  now?: MomentInput
  /** BCP 47 tag. Defaults to `en`, not the browser locale, so server and client render the same text. */
  locale?: string
  /** `auto` writes "yesterday" / "tomorrow" where the language has a word, `always` writes "1 day ago". */
  numeric?: RelativeNumeric
  /** Width of the unit names: `long` ("3 minutes ago"), `short` ("3 min. ago") or `narrow`. Named `unitStyle` because `style` is the Vue inline-style attribute. */
  unitStyle?: RelativeUnitStyle
  /** Smallest unit used. Closer times read as 0 of it. */
  minUnit?: RelativeUnit
  /** Largest unit used. `day` gives "400 days ago" instead of "1 year ago". */
  maxUnit?: RelativeUnit
  /** Milliseconds between live updates (250 to 2147483647). 0 or invalid: no updates. All instances share one timer. */
  updateInterval?: number
  /** Put the absolute date in the `title` attribute. A `title` you pass yourself wins. */
  showTitle?: boolean
  dateStyle?: DateStyle
  /** `none` leaves the time of day out. */
  timeStyle?: TimeStyle
  /** IANA zone for the absolute date, e.g. `UTC`. Before mount it is `UTC` when not given, so server and client agree. */
  timeZone?: string
  /** Text shown when `datetime` is not a valid moment. */
  fallback?: string
  variant?: RelativeTimeVariant
  size?: RelativeTimeSize
  tone?: RelativeTimeTone
}

const props = withDefaults(defineProps<RelativeTimeProps>(), {
  locale: 'en',
  numeric: 'auto',
  unitStyle: 'long',
  minUnit: 'second',
  maxUnit: 'year',
  updateInterval: 0,
  showTitle: true,
  dateStyle: 'medium',
  timeStyle: 'short',
  fallback: 'Unknown time',
  variant: 'plain',
  size: 'inherit',
  tone: 'default',
})

const mounted = ref(false)
const clock = ref<number | null>(null)

const date = computed(() => parseDateTime(props.datetime))
const pinned = computed(() => toMillis(props.now) !== null)
const nowMs = computed(() => toMillis(props.now) ?? clock.value)
const locale = computed(() => resolveLocale(props.locale))

const absolute = computed(() =>
  formatAbsolute(date.value, {
    locale: locale.value,
    dateStyle: props.dateStyle,
    timeStyle: props.timeStyle,
    timeZone: props.timeZone ?? (mounted.value ? undefined : 'UTC'),
  }),
)
const relative = computed(() =>
  nowMs.value === null
    ? null
    : formatRelative(date.value, nowMs.value, {
        locale: locale.value,
        numeric: props.numeric,
        unitStyle: props.unitStyle,
        minUnit: props.minUnit,
        maxUnit: props.maxUnit,
      }),
)

const state = computed(() => (!date.value ? 'invalid' : relative.value === null ? 'absolute' : 'relative'))
const text = computed(() => (state.value === 'invalid' ? props.fallback : (relative.value ?? absolute.value)))
const iso = computed(() => date.value?.toISOString())
const title = computed(() => (props.showTitle && date.value ? absolute.value : undefined))

const classes = computed(() =>
  cn(
    relativeTimeVariants({
      variant: relativeTimeVariantNames.includes(props.variant) ? props.variant : 'plain',
      size: relativeTimeSizes.includes(props.size) ? props.size : 'inherit',
      tone: relativeTimeTones.includes(props.tone) ? props.tone : 'default',
    }),
    props.class,
  ),
)

let unsubscribe: (() => void) | null = null
function sync() {
  unsubscribe?.()
  unsubscribe = null
  if (!mounted.value || pinned.value) return
  clock.value = Date.now()
  if (normalizeInterval(props.updateInterval) > 0) unsubscribe = subscribeClock(props.updateInterval, (t) => (clock.value = t))
}
onMounted(() => {
  mounted.value = true
  sync()
})
watch([pinned, () => props.updateInterval], sync)
onBeforeUnmount(() => unsubscribe?.())
</script>

<template>
  <time
    data-slot="relative-time"
    :datetime="iso"
    :title="title"
    :lang="locale"
    dir="auto"
    :data-state="state"
    :class="classes"
  >{{ text }}</time>
</template>
