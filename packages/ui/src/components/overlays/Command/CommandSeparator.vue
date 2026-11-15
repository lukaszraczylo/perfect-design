<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { menuSeparator } from '../menuStyles'
import { useCommand } from './commandContext'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
const command = useCommand()
</script>

<template>
  <div
    v-if="!command || !command.shouldFilter.value || !command.search.value"
    data-slot="command-separator"
    role="presentation"
    aria-hidden="true"
    :class="cn(menuSeparator, props.class)"
  />
</template>
