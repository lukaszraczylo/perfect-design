<script setup lang="ts">
import { faCheck } from '../../../lib/icons'
import Icon from '../../primitives/Icon/Icon.vue'

defineProps<{ label: string; detail?: string }>()
</script>

<template>
  <span data-slot="tiered-pricing-marker" class="inline-flex flex-wrap items-center gap-1 font-medium text-foreground">
    <Icon :icon="faCheck" size="xs" class="text-primary" />
    <span>{{ label }}</span>
    <span v-if="detail" class="font-normal text-muted-foreground">({{ detail }})</span>
  </span>
</template>
