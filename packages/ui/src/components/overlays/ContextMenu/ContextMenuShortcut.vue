<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { useMenuLook } from '../menuContext'
import { menuShortcutClass } from '../menuStyles'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
const look = useMenuLook()
</script>

<template>
  <span data-slot="context-menu-shortcut" :class="cn(menuShortcutClass(look), props.class)">
    <slot />
  </span>
</template>
