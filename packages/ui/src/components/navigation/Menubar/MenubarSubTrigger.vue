<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { MenubarSubTrigger as RekaTrigger, useForwardProps, type MenubarSubTriggerProps } from 'reka-ui'
import { faChevronRight } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import Icon from '../../primitives/Icon/Icon.vue'
import { menuItem, menuItemInset } from '../../overlays/menuStyles'

const props = defineProps<MenubarSubTriggerProps & { class?: HTMLAttributes['class']; inset?: boolean }>()
const delegated = computed(() => {
  const { class: _c, inset: _i, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <RekaTrigger
    data-slot="menubar-sub-trigger"
    :data-inset="inset ? '' : undefined"
    v-bind="forwarded"
    :class="cn(menuItem, inset && menuItemInset, props.class)"
  >
    <slot />
    <Icon :icon="faChevronRight" size="sm" class="ms-auto text-muted-foreground rtl:rotate-180" />
  </RekaTrigger>
</template>
