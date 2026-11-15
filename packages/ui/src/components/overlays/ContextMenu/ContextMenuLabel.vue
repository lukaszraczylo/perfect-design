<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { ContextMenuLabel as RekaLabel, useForwardProps, type ContextMenuLabelProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useMenuLook } from '../menuContext'
import { menuLabelClass } from '../menuStyles'

const props = defineProps<ContextMenuLabelProps & { class?: HTMLAttributes['class']; inset?: boolean }>()
const delegated = computed(() => {
  const { class: _c, inset: _i, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
const look = useMenuLook()
</script>

<template>
  <RekaLabel
    data-slot="context-menu-label"
    :data-inset="inset ? '' : undefined"
    v-bind="forwarded"
    :class="cn(menuLabelClass(look, { inset }), props.class)"
  >
    <slot />
  </RekaLabel>
</template>
