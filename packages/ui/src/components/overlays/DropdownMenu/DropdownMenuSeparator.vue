<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { DropdownMenuSeparator as RekaSeparator, useForwardProps, type DropdownMenuSeparatorProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useMenuLook } from '../menuContext'
import { menuSeparatorClass } from '../menuStyles'

const props = defineProps<DropdownMenuSeparatorProps & { class?: HTMLAttributes['class'] }>()
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)

const look = useMenuLook()
</script>

<template>
  <RekaSeparator data-slot="dropdown-menu-separator" v-bind="forwarded" :class="cn(menuSeparatorClass(look), props.class)" />
</template>
