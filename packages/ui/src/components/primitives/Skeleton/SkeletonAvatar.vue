<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { pick } from '../../feedback/pick'
import Skeleton from './Skeleton.vue'
import { skeletonAvatarVariants, type SkeletonAnimation, type SkeletonAvatarShape, type SkeletonAvatarSize } from './variants'

export interface SkeletonAvatarProps extends BaseProps {
  /** sm 32px, md 40px (default), lg 48px, xl 64px. Unknown values fall back to md. */
  size?: SkeletonAvatarSize
  /** `circle` (default) or `square` (rounded-md, for logos and app icons). */
  shape?: SkeletonAvatarShape
  animation?: SkeletonAnimation
}

const props = withDefaults(defineProps<SkeletonAvatarProps>(), { size: 'md', shape: 'circle', animation: undefined })
const SIZES: readonly SkeletonAvatarSize[] = ['sm', 'md', 'lg', 'xl']
const SHAPES: readonly SkeletonAvatarShape[] = ['circle', 'square']

const classes = computed(() =>
  cn(skeletonAvatarVariants({ size: pick(props.size, SIZES, 'md'), shape: pick(props.shape, SHAPES, 'circle') }), props.class),
)
</script>

<template>
  <Skeleton data-slot="skeleton-avatar" shape="avatar" :animation="animation" :class="classes" />
</template>
