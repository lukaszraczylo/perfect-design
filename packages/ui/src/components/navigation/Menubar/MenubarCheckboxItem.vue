<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  MenubarCheckboxItem as RekaItem,
  MenubarItemIndicator as RekaIndicator,
  useForwardPropsEmits,
  type MenubarCheckboxItemEmits,
  type MenubarCheckboxItemProps,
} from 'reka-ui'
import { faCheck } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import Icon from '../../primitives/Icon/Icon.vue'
import { menuIndicatorItem, menuIndicatorSlot } from '../../overlays/menuStyles'

const props = defineProps<MenubarCheckboxItemProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<MenubarCheckboxItemEmits>()

const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
</script>

<template>
  <RekaItem data-slot="menubar-checkbox-item" v-bind="forwarded" :class="cn(menuIndicatorItem, props.class)">
    <span :class="menuIndicatorSlot">
      <RekaIndicator data-slot="menubar-item-indicator"><Icon :icon="faCheck" size="sm" /></RekaIndicator>
    </span>
    <slot />
  </RekaItem>
</template>
