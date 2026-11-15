<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { menuShortcut } from '../../overlays/menuStyles'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <span data-slot="menubar-shortcut" :class="cn(menuShortcut, props.class)">
    <slot />
  </span>
</template>
