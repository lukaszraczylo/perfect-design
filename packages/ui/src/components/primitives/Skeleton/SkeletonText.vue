<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { BaseProps } from '../../../lib/types'
import Skeleton from './Skeleton.vue'
import type { SkeletonAnimation } from './variants'

export interface SkeletonTextProps extends BaseProps {
  /** Number of lines (1..20, default 3). The last line is shorter when there are 2 or more. */
  lines?: number
  animation?: SkeletonAnimation
  as?: PrimitiveProps['as']
}

withDefaults(defineProps<SkeletonTextProps>(), { lines: 3, animation: undefined, as: 'div' })
</script>

<template>
  <Skeleton data-slot="skeleton-text" shape="lines" :lines="lines" :animation="animation" :as="as" :class="$props.class" />
</template>
