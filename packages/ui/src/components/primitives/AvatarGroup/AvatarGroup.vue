<script setup lang="ts">
import { computed, h, provide, useSlots } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useMediaBlur } from '../../../lib/media-blur'
import type { BaseProps } from '../../../lib/types'
import Avatar from '../Avatar/Avatar.vue'
import { avatarGroupKey } from '../Avatar/context'
import { avatarVariants, type AvatarShape, type AvatarSize, type AvatarStatus } from '../Avatar/variants'
import { flattenVNodes } from './flatten'
import { avatarGroupVariants, type AvatarGroupDensity, type AvatarGroupLayout } from './variants'

export interface AvatarGroupItem {
  src?: string
  name?: string
  alt?: string
  fallback?: string
  status?: AvatarStatus
}

export interface AvatarGroupProps extends BaseProps {
  /** Avatars as data. Rendered before any slotted Avatar children. */
  items?: AvatarGroupItem[]
  /** Maximum avatars shown; the rest collapse into a `+N` bubble. Omit (or pass a negative/NaN) for no limit. */
  max?: number
  size?: AvatarSize
  shape?: AvatarShape
  /** Privacy blur on every avatar in the group; the `+N` count stays readable. Wins over `ConfigProvider blurMedia`; an Avatar's own `blurred` wins over the group. */
  blurred?: boolean
  /** `stacked` overlaps the avatars (default); `spaced` puts them side by side with a gap and lets them wrap. */
  layout?: AvatarGroupLayout
  /** Stacked: how far the avatars overlap. Spaced: the gap between them. `compact`, `default` or `loose`. */
  density?: AvatarGroupDensity
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<AvatarGroupProps>(), { items: () => [], blurred: undefined, size: 'md', shape: 'circle', layout: 'stacked', density: 'default', as: 'div' })
const slots = useSlots()

provide(avatarGroupKey, { size: () => props.size, shape: () => props.shape, blurred: () => props.blurred })
const blurred = useMediaBlur(() => props.blurred)

const SIZES: readonly AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
const SHAPES: readonly AvatarShape[] = ['circle', 'rounded', 'square']
const size = computed<AvatarSize>(() => (SIZES.includes(props.size) ? props.size : 'md'))
const shape = computed<AvatarShape>(() => (SHAPES.includes(props.shape) ? props.shape : 'circle'))
const LAYOUTS: readonly AvatarGroupLayout[] = ['stacked', 'spaced']
const DENSITIES: readonly AvatarGroupDensity[] = ['compact', 'default', 'loose']
const layout = computed<AvatarGroupLayout>(() => (LAYOUTS.includes(props.layout) ? props.layout : 'stacked'))
const density = computed<AvatarGroupDensity>(() => (DENSITIES.includes(props.density) ? props.density : 'default'))
const classes = computed(() => cn(avatarGroupVariants({ layout: layout.value, size: size.value, density: density.value }), props.class))

/** Normalised limit: undefined = unlimited. */
const limit = computed(() => (typeof props.max === 'number' && Number.isFinite(props.max) && props.max >= 0 ? Math.floor(props.max) : undefined))

const Content = () => {
  const nodes = [...props.items.map((item) => h(Avatar, { ...item })), ...flattenVNodes(slots.default?.())]
  const visible = limit.value === undefined ? nodes : nodes.slice(0, limit.value)
  const hidden = nodes.length - visible.length
  if (hidden > 0) {
    visible.push(
      h(
        'span',
        {
          'data-slot': 'avatar-group-overflow',
          role: 'img',
          'aria-label': `${hidden} more`,
          class: cn(avatarVariants({ size: size.value, shape: shape.value }), 'tabular-nums'),
        },
        `+${hidden}`,
      ),
    )
  }
  return visible
}
</script>

<template>
  <Primitive data-slot="avatar-group" :as="as" role="group" :data-blurred="blurred ? '' : undefined" :class="classes"><Content /></Primitive>
</template>
