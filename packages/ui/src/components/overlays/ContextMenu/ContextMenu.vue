<script setup lang="ts">
import { computed } from 'vue'
import { ContextMenuRoot, useForwardPropsEmits, type ContextMenuRootEmits, type ContextMenuRootProps } from 'reka-ui'
import { provideMenuLook } from '../menuContext'
import type { MenuDensity, MenuSize } from '../menuStyles'

const props = defineProps<ContextMenuRootProps & { density?: MenuDensity; size?: MenuSize }>()
const emits = defineEmits<ContextMenuRootEmits>()

const delegated = computed(() => {
  const { density: _d, size: _s, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)

provideMenuLook(props)
</script>

<template>
  <ContextMenuRoot data-slot="context-menu" v-bind="forwarded">
    <slot />
  </ContextMenuRoot>
</template>
