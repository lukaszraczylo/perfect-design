<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots } from 'vue'
import { violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { clampNumber, prefersReducedMotion } from '../shared/motion'
import {
  MARQUEE_DEFAULT_DURATION,
  MARQUEE_DIRECTIONS,
  MARQUEE_GAPS,
  MARQUEE_SIZES,
  MARQUEE_SPEEDS,
  marqueeCopyVariants,
  marqueeItemVariants,
  marqueeTrackVariants,
  marqueeVariants,
  marqueeViewportVariants,
  type MarqueeDirection,
  type MarqueeGap,
  type MarqueeSize,
  type MarqueeSpeed,
} from './variants'

export interface MarqueeProps extends BaseProps {
  /** Simple text items; use the default slot for richer content (logos, badges). */
  items?: string[]
  /** Seconds for one full loop. Non-positive or invalid values are ignored (falls back to `speed`, then 30). Wins over `speed`. */
  duration?: number
  /** Preset for `duration`: `slow` = 60s, `normal` = 30s, `fast` = 15s per loop. Ignored when a valid `duration` is given. */
  speed?: MarqueeSpeed
  /** `left` / `right` scroll horizontally; `up` / `down` scroll vertically (give the strip a height with `class`, default `h-64`). Unknown values fall back to `left`. */
  direction?: MarqueeDirection
  /** Pause while hovered or focused within. */
  pauseOnHover?: boolean
  /** Space between items: `none`, `sm` (1rem), `md` (2rem) or `lg` (3rem). Unknown values fall back to `md`. */
  gap?: MarqueeGap
  /** Fade the strip out at both ends with a mask. */
  fade?: boolean
  /** Text size of `items`: `sm`, `md` or `lg`. Slot content is not affected. */
  size?: MarqueeSize
  /** Optional accessible name for the group. */
  label?: string
  /** Show the pause/resume button (WCAG 2.2.2: moving content longer than 5 seconds must be pausable). Turn off only when the strip is paused by other means. */
  pausable?: boolean
  /** Paused state (`v-model:paused`). Leave undefined for uncontrolled use. */
  paused?: boolean
  /** Text of the button while the strip moves. */
  pauseLabel?: string
  /** Text of the button while the strip is paused. */
  playLabel?: string
  /** Accessible name of the strip when it becomes a manually scrollable row (reduced motion). */
  scrollLabel?: string
}

const props = withDefaults(defineProps<MarqueeProps>(), {
  items: () => [],
  duration: undefined,
  speed: undefined,
  direction: 'left',
  pauseOnHover: true,
  gap: 'md',
  fade: true,
  size: 'md',
  pausable: true,
  paused: undefined,
  pauseLabel: 'Pause scrolling',
  playLabel: 'Resume scrolling',
  scrollLabel: 'Scrollable content',
})
const slots = useSlots()
const emit = defineEmits<{ 'update:paused': [paused: boolean] }>()

const innerPaused = ref(false)
const isPaused = computed(() => props.paused ?? innerPaused.value)
function toggle() {
  const next = !isPaused.value
  innerPaused.value = next
  emit('update:paused', next)
}

// With prefers-reduced-motion the CSS stops the animation and the viewport becomes a scrollable row: it must then be focusable and named.
const reduced = ref(false)
let query: MediaQueryList | null = null
const onChange = () => (reduced.value = !!query?.matches)
onMounted(() => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
  query = window.matchMedia('(prefers-reduced-motion: reduce)')
  onChange()
  query.addEventListener?.('change', onChange)
})
onBeforeUnmount(() => query?.removeEventListener?.('change', onChange))

// WCAG 2.2.2: moving content needs a pause mechanism. Without the button it is only acceptable when the strip does not
// move (reduced motion, nothing to show) or the app controls `paused` itself (`v-model:paused` wired to its own control).
onMounted(async () => {
  await nextTick()
  const moves = !prefersReducedMotion() && (props.items.length > 0 || !!slots.default)
  if (props.pausable === false && props.paused === undefined && moves) {
    violation('Marquee', 'requires-pausable', 'requires a way to pause: keep `pausable` on, or bind `v-model:paused` to your own control. Moving content that lasts longer than 5 seconds must be pausable (WCAG 2.2.2).')
  }
})

const own = (map: object, key: unknown) => typeof key === 'string' && Object.prototype.hasOwnProperty.call(map, key)
const direction = computed<MarqueeDirection>(() => (MARQUEE_DIRECTIONS.includes(props.direction) ? props.direction : 'left'))
const vertical = computed(() => direction.value === 'up' || direction.value === 'down')
const reverse = computed(() => direction.value === 'right' || direction.value === 'down')
const axis = computed(() => (vertical.value ? 'vertical' : 'horizontal'))
const seconds = computed(() => {
  if (typeof props.duration === 'number' && Number.isFinite(props.duration) && props.duration > 0) return clampNumber(props.duration, 0.1, 86400, MARQUEE_DEFAULT_DURATION)
  return own(MARQUEE_SPEEDS, props.speed) ? MARQUEE_SPEEDS[props.speed as MarqueeSpeed] : MARQUEE_DEFAULT_DURATION
})
const gap = computed(() => (own(MARQUEE_GAPS, props.gap) ? MARQUEE_GAPS[props.gap as MarqueeGap] : MARQUEE_GAPS.md))
const size = computed<MarqueeSize>(() => (MARQUEE_SIZES.includes(props.size) ? props.size : 'md'))
const classes = computed(() => cn(marqueeVariants({ axis: axis.value }), props.class))
const viewportClass = computed(() => marqueeViewportVariants({ axis: axis.value, fade: props.fade !== false }))
const trackStyle = computed(() => (isPaused.value ? { animationPlayState: 'paused' } : undefined))
const trackClass = computed(() => marqueeTrackVariants({ axis: axis.value }))
const copyClass = computed(() => marqueeCopyVariants({ axis: axis.value }))
const itemClass = computed(() => marqueeItemVariants({ size: size.value }))
const vars = computed(() => ({ '--pd-marquee-duration': `${seconds.value}s`, '--pd-marquee-gap': gap.value }))
const copyStyle = computed(() => ({ gap: 'var(--pd-marquee-gap)', [vertical.value ? 'paddingBlockEnd' : 'paddingInlineEnd']: 'var(--pd-marquee-gap)' }))
const buttonClass = cn('inline-flex min-h-6 items-center rounded-md border bg-background px-2 text-xs font-medium text-foreground hover:bg-accent pointer-coarse:min-h-11', focusRing)
</script>

<template>
  <div
    data-slot="marquee"
    :role="label ? 'group' : undefined"
    :aria-label="label"
    :data-direction="direction"
    :data-size="size"
    :data-vertical="vertical ? '' : undefined"
    :data-reverse="reverse ? '' : undefined"
    :data-pause-on-hover="pauseOnHover ? '' : undefined"
    :data-fade="fade !== false ? '' : undefined"
    :data-paused="isPaused ? '' : undefined"
    :class="classes"
    :style="vars"
  >
    <div
      data-slot="marquee-viewport"
      :class="viewportClass"
      :role="reduced ? 'group' : undefined"
      :aria-label="reduced ? scrollLabel : undefined"
      :tabindex="reduced ? 0 : undefined"
    >
      <div data-slot="marquee-track" :class="trackClass" :style="trackStyle">
        <div data-slot="marquee-content" :class="copyClass" :style="copyStyle">
          <slot>
            <span v-for="(item, i) in items" :key="i" :class="itemClass">{{ item }}</span>
          </slot>
        </div>
        <div data-slot="marquee-clone" aria-hidden="true" :class="[copyClass, 'pd-marquee-clone']" :style="copyStyle">
          <slot>
            <span v-for="(item, i) in items" :key="i" :class="itemClass">{{ item }}</span>
          </slot>
        </div>
      </div>
    </div>
    <div v-if="pausable" data-slot="marquee-controls" class="flex shrink-0 justify-end motion-reduce:hidden">
      <button type="button" data-slot="marquee-toggle" :class="buttonClass" @click="toggle">
        {{ isPaused ? playLabel : pauseLabel }}
      </button>
    </div>
  </div>
</template>

