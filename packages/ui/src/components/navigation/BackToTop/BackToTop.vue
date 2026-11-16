<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useWindowScroll } from '../../../lib/use-helpers'
import { faArrowUp } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import Button from '../../primitives/Button/Button.vue'
import Icon from '../../primitives/Icon/Icon.vue'
import {
  BACK_TO_TOP_BUTTON_SIZE,
  BACK_TO_TOP_SIZES,
  BACK_TO_TOP_VARIANTS,
  backToTopVariants,
  type BackToTopSize,
  type BackToTopVariant,
} from './variants'

export interface BackToTopProps extends BaseProps {
  /** Scroll distance in px after which the button appears. Invalid or negative values fall back to 300. */
  threshold?: number
  /** Accessible name. */
  label?: string
  /** Smooth scrolling (ignored when the user prefers reduced motion). */
  smooth?: boolean
  /** `button` (default, icon-only circle) or `pill` (arrow plus the visible label). Unknown values fall back to `button`. */
  variant?: BackToTopVariant
  /** `sm`, `md` (default) or `lg`: 36px, 44px and 56px circles, or 32px, 36px and 44px high pills. Unknown values fall back to `md`. */
  size?: BackToTopSize
}

const props = withDefaults(defineProps<BackToTopProps>(), { threshold: 300, label: 'Back to top', smooth: true, variant: 'button', size: 'md' })
defineSlots<{ default?: () => unknown }>()

const { y } = useWindowScroll()
const variant = computed<BackToTopVariant>(() => (BACK_TO_TOP_VARIANTS.includes(props.variant as BackToTopVariant) ? (props.variant as BackToTopVariant) : 'button'))
const size = computed<BackToTopSize>(() => (BACK_TO_TOP_SIZES.includes(props.size as BackToTopSize) ? (props.size as BackToTopSize) : 'md'))
const buttonSize = computed(() => BACK_TO_TOP_BUTTON_SIZE[variant.value][size.value])
const classes = computed(() => cn(backToTopVariants({ variant: variant.value, size: size.value }), props.class))

const limit = computed(() => (Number.isFinite(props.threshold) && props.threshold >= 0 ? props.threshold : 300))
const visible = computed(() => y.value > limit.value)

const root = ref<{ $el?: Element } | null>(null)
// A focused control that unmounts drops focus to <body>; hand it to the top of the page instead.
watch(
  visible,
  (v) => {
    const el = root.value?.$el
    if (v || !(el instanceof HTMLElement) || !el.contains(document.activeElement)) return
    const top = document.querySelector<HTMLElement>('main, [role="main"]') ?? document.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6')
    if (!top) return
    if (!top.hasAttribute('tabindex')) top.setAttribute('tabindex', '-1')
    top.focus({ preventScroll: true })
  },
  { flush: 'pre' },
)

function toTop() {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: props.smooth && !reduce ? 'smooth' : 'auto' })
}
</script>

<template>
  <Button
    v-if="visible"
    ref="root"
    data-slot="back-to-top"
    variant="secondary"
    :data-variant="variant"
    :data-size="size"
    :size="buttonSize"
    :aria-label="label"
    :title="label"
    :class="classes"
    @click="toTop"
  >
    <slot><Icon :icon="faArrowUp" /><span v-if="variant === 'pill'" data-slot="back-to-top-label">{{ label }}</span></slot>
  </Button>
</template>
