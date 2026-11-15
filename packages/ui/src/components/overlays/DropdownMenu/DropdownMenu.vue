<script setup lang="ts">
import { computed } from 'vue'
import { DropdownMenuRoot, useForwardPropsEmits, type DropdownMenuRootEmits, type DropdownMenuRootProps } from 'reka-ui'
import { provideMenuLook } from '../menuContext'
import type { MenuDensity, MenuSize } from '../menuStyles'

const props = defineProps<DropdownMenuRootProps & { density?: MenuDensity; size?: MenuSize }>()
const emits = defineEmits<DropdownMenuRootEmits>()

const delegated = computed(() => {
  const { density: _d, size: _s, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)

provideMenuLook(props)
</script>

<template>
  <DropdownMenuRoot data-slot="dropdown-menu" v-bind="forwarded">
    <slot />
  </DropdownMenuRoot>
</template>
