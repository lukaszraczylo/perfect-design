<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { skeletonLinesVariants, skeletonVariants, type SkeletonAnimation, type SkeletonShape } from './variants'

export interface SkeletonProps extends BaseProps {
  /**
   * `text` line, `circle`/`avatar` round, `rect` block, `rounded` large-radius card/image,
   * `pill` badge/button/chip, `lines` multi-line paragraph (see `lines`).
   */
  shape?: SkeletonShape
  /** `none`, `pulse` (default) or `shimmer` (deprecated alias of `pulse`). The animation is disabled under prefers-reduced-motion. */
  animation?: SkeletonAnimation
  /** Deprecated alias for `animation="shimmer"` (which now pulses). Ignored when `animation` is set. */
  shimmer?: boolean
  /** Number of lines for `shape="lines"` (1..20, default 3). The last line is shorter when there are 2 or more. */
  lines?: number
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<SkeletonProps>(), { shape: 'rect', animation: undefined, shimmer: false, lines: 3, as: 'div' })
const SHAPES: readonly SkeletonShape[] = ['text', 'circle', 'rect', 'rounded', 'pill', 'avatar', 'lines']
const ANIMATIONS: readonly SkeletonAnimation[] = ['none', 'pulse', 'shimmer']
const DEFAULT_LINES = 3
const MAX_LINES = 20

// Unknown values fall back instead of rendering an unstyled element.
const shape = computed<SkeletonShape>(() => (SHAPES.includes(props.shape) ? props.shape : 'rect'))
const animation = computed<SkeletonAnimation>(() =>
  props.animation && ANIMATIONS.includes(props.animation) ? props.animation : props.shimmer ? 'shimmer' : 'pulse',
)
const lineCount = computed(() => {
  const n = Math.floor(Number(props.lines))
  return Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_LINES) : DEFAULT_LINES
})

const isLines = computed(() => shape.value === 'lines')
const classes = computed(() =>
  cn(isLines.value ? skeletonLinesVariants() : skeletonVariants({ shape: shape.value, animation: animation.value }), props.class),
)
const lineClasses = computed(() => skeletonVariants({ shape: 'lines', animation: animation.value }))
const shimmerAttr = computed(() => (animation.value === 'shimmer' ? '' : undefined))
</script>

<template>
  <Primitive v-if="isLines" data-slot="skeleton" :as="as" aria-hidden="true" :data-shimmer="shimmerAttr" :class="classes">
    <div
      v-for="i in lineCount"
      :key="i"
      data-slot="skeleton-line"
      :class="cn(lineClasses, i === lineCount && lineCount > 1 && 'w-3/4')"
    />
  </Primitive>
  <Primitive v-else data-slot="skeleton" :as="as" aria-hidden="true" :data-shimmer="shimmerAttr" :class="classes" />
</template>
