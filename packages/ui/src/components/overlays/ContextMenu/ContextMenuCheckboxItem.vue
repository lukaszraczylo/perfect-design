<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  ContextMenuCheckboxItem as RekaItem,
  ContextMenuItemIndicator as RekaIndicator,
  useForwardPropsEmits,
  type ContextMenuCheckboxItemEmits,
  type ContextMenuCheckboxItemProps,
} from 'reka-ui'
import { faCheck } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import Icon from '../../primitives/Icon/Icon.vue'
import { useMenuLook } from '../menuContext'
import { menuIndicatorItemClass, menuIndicatorSlotClass } from '../menuStyles'

const props = defineProps<ContextMenuCheckboxItemProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<ContextMenuCheckboxItemEmits>()

const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
const look = useMenuLook()
</script>

<template>
  <RekaItem data-slot="context-menu-checkbox-item" v-bind="forwarded" :class="cn(menuIndicatorItemClass(look), props.class)">
    <span :class="cn(menuIndicatorSlotClass(look))">
      <RekaIndicator data-slot="context-menu-item-indicator"><Icon :icon="faCheck" size="sm" /></RekaIndicator>
    </span>
    <slot />
  </RekaItem>
</template>
