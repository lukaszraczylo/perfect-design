<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { ContextMenuSubTrigger as RekaTrigger, useForwardProps, type ContextMenuSubTriggerProps } from 'reka-ui'
import { faChevronRight } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import Icon from '../../primitives/Icon/Icon.vue'
import { useMenuLook } from '../menuContext'
import { menuItemClass } from '../menuStyles'

const props = defineProps<ContextMenuSubTriggerProps & { class?: HTMLAttributes['class']; inset?: boolean }>()
const delegated = computed(() => {
  const { class: _c, inset: _i, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
const look = useMenuLook()
</script>

<template>
  <RekaTrigger
    data-slot="context-menu-sub-trigger"
    :data-inset="inset ? '' : undefined"
    v-bind="forwarded"
    :class="cn(menuItemClass(look, { inset }), props.class)"
  >
    <slot />
    <Icon :icon="faChevronRight" size="sm" class="ml-auto text-muted-foreground rtl:mr-auto rtl:ml-0 rtl:rotate-180" />
  </RekaTrigger>
</template>
