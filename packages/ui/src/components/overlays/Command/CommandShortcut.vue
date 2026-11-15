<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { menuShortcut } from '../menuStyles'
import { useCommandSize } from './commandContext'
import { commandShortcutVariants } from './variants'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
const size = useCommandSize()
</script>

<template>
  <span data-slot="command-shortcut" :class="cn(menuShortcut, commandShortcutVariants({ size }), props.class)">
    <slot />
  </span>
</template>
