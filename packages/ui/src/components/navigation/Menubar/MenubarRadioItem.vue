<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  MenubarRadioItem as RekaItem,
  MenubarItemIndicator as RekaIndicator,
  useForwardPropsEmits,
  type MenubarRadioItemEmits,
  type MenubarRadioItemProps,
} from 'reka-ui'
import { faCircle } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import Icon from '../../primitives/Icon/Icon.vue'
import { menuIndicatorItem, menuIndicatorSlot } from '../../overlays/menuStyles'

const props = defineProps<MenubarRadioItemProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<MenubarRadioItemEmits>()

const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
</script>

<template>
  <RekaItem data-slot="menubar-radio-item" v-bind="forwarded" :class="cn(menuIndicatorItem, props.class)">
    <span :class="menuIndicatorSlot">
      <RekaIndicator data-slot="menubar-item-indicator"><Icon :icon="faCircle" class="size-2 fill-current" /></RekaIndicator>
    </span>
    <slot />
  </RekaItem>
</template>
