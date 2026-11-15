<script setup lang="ts">
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'

const props = defineProps<BaseProps>()
</script>

<template>
  <div data-slot="alert-title" :class="cn('font-medium leading-snug tracking-tight break-words', props.class)">
    <slot />
  </div>
</template>
