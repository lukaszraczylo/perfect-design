<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { faClockRotateLeft, faRotateRight } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import Button from '../../primitives/Button/Button.vue'
import Icon from '../../primitives/Icon/Icon.vue'
import { useConfig } from '../../layout/ConfigProvider/config'
import { subscribeClock } from '../../typography/RelativeTime/clock'
import { checkAfterMount } from '../requireContent'
import { pick } from '../pick'
import { formatRelativeTime, toTimestamp, type RelativeTimeInput } from './formatRelativeTime'
import {
  STALE_NOTICE_TONES,
  STALE_NOTICE_VARIANTS,
  staleNoticeIconVariants,
  staleNoticeVariants,
  type StaleNoticeResolvedTone,
  type StaleNoticeTone,
  type StaleNoticeVariant,
} from './variants'

export interface StaleNoticeProps extends BaseProps {
  /** Look: `default` (bordered box), `inline` (icon and text only), `banner` (full-width strip) or `pill` (small chip). */
  variant?: StaleNoticeVariant
  /** Colour: `auto` (default) is `warning` once stale and `neutral` while fresh; `neutral`, `info`, `success`, `warning` or `danger` force it. */
  tone?: StaleNoticeTone
  /** When the data was last refreshed: Date, epoch milliseconds or a date string. */
  timestamp?: RelativeTimeInput
  /** Age in ms after which the data counts as stale and the notice turns to the warning style. Default 5 minutes. */
  staleAfter?: number
  /** Re-render interval in ms so the relative time keeps moving. `0` disables ticking. */
  interval?: number
  /** Text before the relative time. */
  label?: string
  /** Text shown while stale. */
  staleLabel?: string
  /** Render nothing until the data is stale. */
  hideWhenFresh?: boolean
  /** Show a refresh button that emits `refresh`. */
  refreshable?: boolean
  refreshLabel?: string
  /** Spinner + disabled refresh button. */
  refreshing?: boolean
  /** BCP 47 tag. Defaults to the `ConfigProvider` locale, then `en`. */
  locale?: string
}

const props = withDefaults(defineProps<StaleNoticeProps>(), {
  variant: 'default',
  tone: 'auto',
  staleAfter: 5 * 60_000,
  interval: 30_000,
  label: 'Last updated',
  staleLabel: 'Data may be out of date.',
  refreshLabel: 'Refresh',
  locale: undefined,
})
const emit = defineEmits<{ refresh: [] }>()

// Before mount there is no clock: the notice renders the absolute time and counts as fresh, so server and client match.
const mounted = ref(false)
const now = ref(0)
const config = useConfig()
const locale = computed(() => props.locale ?? config.value.locale ?? 'en')
let unsubscribe: (() => void) | undefined

function stop() {
  unsubscribe?.()
  unsubscribe = undefined
}
function start() {
  stop()
  now.value = Date.now()
  if (Number.isFinite(props.interval) && props.interval > 0) unsubscribe = subscribeClock(props.interval, (t) => (now.value = t))
}
onMounted(() => {
  mounted.value = true
  start()
})
watch(() => props.interval, () => mounted.value && start())
onBeforeUnmount(stop)

const ts = computed(() => toTimestamp(props.timestamp))
const valid = computed(() => !Number.isNaN(ts.value))
// A missing or unparsable timestamp would show "unknown" and look like stale data of unknown age: report the real cause.
function checkTimestamp() {
  if (!valid.value) {
    violation('StaleNotice', 'requires-timestamp', 'requires a valid `timestamp` (a Date, epoch milliseconds or a parsable date string). Pass the time of the last successful fetch.')
  }
}
checkAfterMount(checkTimestamp)
watch(
  () => props.timestamp,
  async () => {
    await nextTick()
    checkTimestamp()
  },
)
const absolute = computed(() => (valid.value ? new Date(ts.value).toLocaleString(locale.value, mounted.value ? undefined : { timeZone: 'UTC' }) : undefined))
const relative = computed(() => (!valid.value ? '' : mounted.value ? formatRelativeTime(ts.value, now.value, locale.value) : (absolute.value ?? '')))
const stale = computed(() => !valid.value || (mounted.value && now.value - ts.value > props.staleAfter))
const resolvedVariant = computed<StaleNoticeVariant>(() => pick(props.variant, STALE_NOTICE_VARIANTS, 'default'))
const resolvedTone = computed<StaleNoticeTone>(() => pick(props.tone, STALE_NOTICE_TONES, 'auto'))
const effectiveTone = computed<StaleNoticeResolvedTone>(() => (resolvedTone.value === 'auto' ? (stale.value ? 'warning' : 'neutral') : resolvedTone.value))
const iso = computed(() => (valid.value ? new Date(ts.value).toISOString() : undefined))
const show = computed(() => !(props.hideWhenFresh && !stale.value))

function refresh() {
  if (props.refreshing) return
  emit('refresh')
}
</script>

<template>
  <div
    v-if="show"
    data-slot="stale-notice"
    :data-stale="stale ? '' : undefined"
    role="status"
    :data-variant="resolvedVariant === 'default' ? undefined : resolvedVariant"
    :data-tone="resolvedTone === 'auto' ? undefined : resolvedTone"
    :class="cn(staleNoticeVariants({ variant: resolvedVariant, tone: effectiveTone }), props.class)"
  >
    <Icon :icon="faClockRotateLeft" :class="staleNoticeIconVariants({ tone: effectiveTone }) || undefined" />
    <span data-slot="stale-notice-text" class="min-w-0 break-words">
      <template v-if="stale && valid">{{ staleLabel }} </template>
      {{ label }}
      <time v-if="valid" :datetime="iso" :title="absolute" class="tabular-nums">{{ relative }}</time>
      <span v-else>unknown</span>
    </span>
    <Button v-if="refreshable" data-slot="stale-notice-refresh" size="xs" variant="outline" class="ms-auto" :loading="refreshing" @click="refresh">
      <Icon v-if="!refreshing" :icon="faRotateRight" />
      {{ refreshLabel }}
    </Button>
  </div>
</template>
