<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  ContextMenuContent as RekaContent,
  ContextMenuPortal as RekaPortal,
  useForwardPropsEmits,
  type ContextMenuContentEmits,
  type ContextMenuContentProps,
} from 'reka-ui'
import { cn } from '../../../lib/cn'
import { provideMenuLook } from '../menuContext'
import { menuContentClass, type MenuDensity, type MenuSize } from '../menuStyles'

const props = withDefaults(defineProps<ContextMenuContentProps & { class?: HTMLAttributes['class']; density?: MenuDensity; size?: MenuSize }>(), { collisionPadding: 8 })
defineOptions({ inheritAttrs: false })

const emits = defineEmits<ContextMenuContentEmits>()

const delegated = computed(() => {
  const { class: _c, density: _d, size: _s, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)

// A value set here wins over the one on ContextMenu; unset values are inherited.
const look = provideMenuLook(props, true)
</script>

<template>
  <RekaPortal>
    <RekaContent
      data-slot="context-menu-content"
      :data-density="look.density === 'default' ? undefined : look.density"
      :data-size="look.size === 'md' ? undefined : look.size"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn(menuContentClass(look), props.class)"
    >
      <slot />
    </RekaContent>
  </RekaPortal>
</template>
