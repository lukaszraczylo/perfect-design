<script setup lang="ts">
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'

const props = defineProps<BaseProps>()
</script>

<template>
  <div data-slot="alert-description" :class="cn('text-sm text-muted-foreground break-words [&_p]:leading-relaxed', props.class)">
    <slot />
  </div>
</template>
