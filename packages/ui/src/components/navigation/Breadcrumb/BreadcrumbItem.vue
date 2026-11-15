<script setup lang="ts">
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'

const props = defineProps<BaseProps>()
</script>

<template>
  <li data-slot="breadcrumb-item" :class="cn('inline-flex items-center gap-1.5', props.class)">
    <slot />
  </li>
</template>
