<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  DropdownMenuContent as RekaContent,
  DropdownMenuPortal as RekaPortal,
  useForwardPropsEmits,
  type DropdownMenuContentEmits,
  type DropdownMenuContentProps,
} from 'reka-ui'
import { cn } from '../../../lib/cn'
import { provideMenuLook } from '../menuContext'
import { menuContentClass, type MenuDensity, type MenuSize } from '../menuStyles'

const props = withDefaults(defineProps<DropdownMenuContentProps & { class?: HTMLAttributes['class']; density?: MenuDensity; size?: MenuSize }>(), { sideOffset: 4, align: 'start', collisionPadding: 8 })
defineOptions({ inheritAttrs: false })

const emits = defineEmits<DropdownMenuContentEmits>()

const delegated = computed(() => {
  const { class: _c, density: _d, size: _s, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)

// A value set here wins over the one on DropdownMenu; unset values are inherited.
const look = provideMenuLook(props, true)
</script>

<template>
  <RekaPortal>
    <RekaContent
      data-slot="dropdown-menu-content"
      :data-density="look.density === 'default' ? undefined : look.density"
      :data-size="look.size === 'md' ? undefined : look.size"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn(menuContentClass(look), props.class)"
    >
      <slot />
    </RekaContent>
  </RekaPortal>
</template>
