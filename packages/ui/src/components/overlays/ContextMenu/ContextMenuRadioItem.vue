<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  ContextMenuRadioItem as RekaItem,
  ContextMenuItemIndicator as RekaIndicator,
  useForwardPropsEmits,
  type ContextMenuRadioItemEmits,
  type ContextMenuRadioItemProps,
} from 'reka-ui'
import { faCircle } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import Icon from '../../primitives/Icon/Icon.vue'
import { useMenuLook } from '../menuContext'
import { menuIndicatorItemClass, menuIndicatorSlotClass } from '../menuStyles'

const props = defineProps<ContextMenuRadioItemProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<ContextMenuRadioItemEmits>()

const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
const look = useMenuLook()
</script>

<template>
  <RekaItem data-slot="context-menu-radio-item" v-bind="forwarded" :class="cn(menuIndicatorItemClass(look), props.class)">
    <span :class="cn(menuIndicatorSlotClass(look))">
      <RekaIndicator data-slot="context-menu-item-indicator"><Icon :icon="faCircle" class="size-2 fill-current" /></RekaIndicator>
    </span>
    <slot />
  </RekaItem>
</template>
