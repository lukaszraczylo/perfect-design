<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { MenubarSeparator as RekaSeparator, useForwardProps, type MenubarSeparatorProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { menuSeparator } from '../../overlays/menuStyles'

const props = defineProps<MenubarSeparatorProps & { class?: HTMLAttributes['class'] }>()
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <RekaSeparator data-slot="menubar-separator" v-bind="forwarded" :class="cn(menuSeparator, props.class)" />
</template>
