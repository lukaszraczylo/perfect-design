<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { MenubarLabel as RekaLabel, useForwardProps, type MenubarLabelProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { menuItemInset, menuLabel } from '../../overlays/menuStyles'

const props = defineProps<MenubarLabelProps & { class?: HTMLAttributes['class']; inset?: boolean }>()
const delegated = computed(() => {
  const { class: _c, inset: _i, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <RekaLabel data-slot="menubar-label" :data-inset="inset ? '' : undefined" v-bind="forwarded" :class="cn(menuLabel, inset && menuItemInset, props.class)">
    <slot />
  </RekaLabel>
</template>
