<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { DropdownMenuItem as RekaItem, useForwardPropsEmits, type DropdownMenuItemEmits, type DropdownMenuItemProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useMenuLook } from '../menuContext'
import { menuItemClass } from '../menuStyles'

const props = defineProps<DropdownMenuItemProps & { class?: HTMLAttributes['class']; destructive?: boolean; inset?: boolean }>()
const emits = defineEmits<DropdownMenuItemEmits>()

const delegated = computed(() => {
  const { class: _c, destructive: _d, inset: _i, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)

const look = useMenuLook()
</script>

<template>
  <RekaItem
    data-slot="dropdown-menu-item"
    :data-inset="inset ? '' : undefined"
    :data-variant="destructive ? 'destructive' : undefined"
    v-bind="forwarded"
    :class="cn(menuItemClass(look, { destructive, inset }), props.class)"
  >
    <slot />
  </RekaItem>
</template>
