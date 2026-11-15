<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { ContextMenuSeparator as RekaSeparator, useForwardProps, type ContextMenuSeparatorProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useMenuLook } from '../menuContext'
import { menuSeparatorClass } from '../menuStyles'

const props = defineProps<ContextMenuSeparatorProps & { class?: HTMLAttributes['class'] }>()
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
const look = useMenuLook()
</script>

<template>
  <RekaSeparator data-slot="context-menu-separator" v-bind="forwarded" :class="cn(menuSeparatorClass(look), props.class)" />
</template>
