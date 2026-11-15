<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { MenubarItem as RekaItem, useForwardPropsEmits, type MenubarItemEmits, type MenubarItemProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { menuItem, menuItemDestructive, menuItemInset } from '../../overlays/menuStyles'

const props = defineProps<MenubarItemProps & { class?: HTMLAttributes['class']; destructive?: boolean; inset?: boolean }>()
const emits = defineEmits<MenubarItemEmits>()

const delegated = computed(() => {
  const { class: _c, destructive: _d, inset: _i, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
</script>

<template>
  <RekaItem
    data-slot="menubar-item"
    :data-inset="inset ? '' : undefined"
    :data-variant="destructive ? 'destructive' : undefined"
    v-bind="forwarded"
    :class="cn(menuItem, destructive && menuItemDestructive, inset && menuItemInset, props.class)"
  >
    <slot />
  </RekaItem>
</template>
