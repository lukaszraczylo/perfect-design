<script setup lang="ts">
import { faEllipsis } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'

const props = defineProps<BaseProps & { label?: string }>()
</script>

<template>
  <button
    data-slot="breadcrumb-ellipsis"
    type="button"
    :aria-label="label ?? 'Show hidden items'"
    :class="cn('inline-flex size-6 items-center justify-center rounded-sm motion-safe:transition-colors hover:text-foreground pointer-coarse:size-10', focusRing, props.class)"
  >
    <slot><Icon :icon="faEllipsis" /></slot>
  </button>
</template>
