<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type ComponentPublicInstance } from 'vue'
import { cn } from '../../../lib/cn'
import type { AsTag, BaseProps } from '../../../lib/types'
import { clampNumber, prefersReducedMotion } from '../shared/motion'
import { oneOf } from '../shared/pick'
import {
  SECTION_REVEAL_DISTANCES,
  SECTION_REVEAL_EFFECTS,
  SECTION_REVEAL_SPEEDS,
  sectionRevealVariants,
  type SectionRevealDistance,
  type SectionRevealEffect,
  type SectionRevealSpeed,
} from './variants'

export interface SectionRevealProps extends BaseProps {
  as?: AsTag
  /**
   * Turn the reveal on. Off by default: the component then renders a plain element with no classes, no observer and
   * no hidden state. Use it for at most one orchestrated moment on a page, never on every section (LLMSlop M1).
   */
  enabled?: boolean
  /** Reveal only the first time (true) or re-hide when scrolled out of view (false). */
  once?: boolean
  /** Fraction of the element that must be visible (0-1). Invalid values fall back to 0.15. */
  threshold?: number
  rootMargin?: string
  /** Delay before the transition starts, in ms (stagger siblings). Invalid values fall back to 0. */
  delay?: number
  /**
   * `fade-up` (default) fades and rises, `fade-down` fades and drops, `fade` only fades, `slide-left` and `slide-right`
   * fade in from the left or right (physical sides, not mirrored in RTL). Unknown values fall back to `fade-up`.
   */
  effect?: SectionRevealEffect
  /** How far the hidden state is offset: `sm` (0.5rem), `md` (1rem) or `lg` (2rem). Ignored by `fade`. Unknown values fall back to `md`. */
  distance?: SectionRevealDistance
  /** Transition length: `fast` (300ms), `normal` (700ms) or `slow` (1000ms). Unknown values fall back to `normal`. */
  speed?: SectionRevealSpeed
}

const props = withDefaults(defineProps<SectionRevealProps>(), {
  as: 'div',
  enabled: false,
  once: true,
  threshold: 0.15,
  rootMargin: '0px 0px -8% 0px',
  delay: 0,
  effect: 'fade-up',
  distance: 'md',
  speed: 'normal',
})
const emit = defineEmits<{ reveal: [] }>()

const el = ref<HTMLElement | ComponentPublicInstance | null>(null)
// Start revealed so server-rendered / no-JS / no-IntersectionObserver output is always visible.
const revealed = ref(true)
let observer: IntersectionObserver | null = null

const target = (): Element | null => {
  const v = el.value as (ComponentPublicInstance & { $el?: Element }) | Element | null
  return v ? ((v as ComponentPublicInstance).$el ?? (v as Element)) : null
}

function disconnect() {
  observer?.disconnect()
  observer = null
}

onMounted(() => {
  const node = target()
  if (!props.enabled || !node || typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) return
  // Content that is already on screen when mounted is never hidden: no flash, and no cost to the largest paint.
  const rect = node.getBoundingClientRect()
  if (rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0) return
  revealed.value = false
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (!revealed.value) emit('reveal')
          revealed.value = true
          if (props.once) disconnect()
        } else if (!props.once) {
          revealed.value = false
        }
      }
    },
    { threshold: clampNumber(props.threshold, 0, 1, 0.15), rootMargin: props.rootMargin },
  )
  observer.observe(node)
})
onBeforeUnmount(disconnect)

const delayMs = computed(() => clampNumber(props.delay, 0, Number.MAX_SAFE_INTEGER, 0))
const effect = computed(() => oneOf(props.effect, SECTION_REVEAL_EFFECTS, 'fade-up'))
const distance = computed(() => oneOf(props.distance, SECTION_REVEAL_DISTANCES, 'md'))
const speed = computed(() => oneOf(props.speed, SECTION_REVEAL_SPEEDS, 'normal'))
const classes = computed(() =>
  props.enabled
    ? cn(sectionRevealVariants({ effect: effect.value, distance: distance.value, speed: speed.value, revealed: revealed.value }), props.class)
    : cn(props.class),
)
</script>

<template>
  <component
    :is="as"
    ref="el"
    data-slot="section-reveal"
    :data-revealed="revealed ? 'true' : 'false'"
    :data-effect="enabled ? effect : undefined"
    :data-distance="enabled ? distance : undefined"
    :data-speed="enabled ? speed : undefined"
    :class="classes"
    :style="enabled && delayMs ? { transitionDelay: `${delayMs}ms` } : undefined"
  >
    <slot />
  </component>
</template>
