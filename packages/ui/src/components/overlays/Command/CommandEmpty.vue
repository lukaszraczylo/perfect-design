<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { useRegisterPart } from '../../../lib/contract'
import { useCommand, useCommandSize } from './commandContext'
import { commandEmptyVariants } from './variants'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
useRegisterPart('Command', 'CommandEmpty')
const command = useCommand()
const size = useCommandSize()
</script>

<template>
  <div
    v-if="!command || command.visible.size === 0"
    data-slot="command-empty"
    :class="cn(commandEmptyVariants({ size }), props.class)"
  >
    <slot>No results found.</slot>
  </div>
</template>
