<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  DropdownMenuSubContent as RekaContent,
  DropdownMenuPortal as RekaPortal,
  useForwardPropsEmits,
  type DropdownMenuSubContentEmits,
  type DropdownMenuSubContentProps,
} from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useMenuLook } from '../menuContext'
import { menuContentClass } from '../menuStyles'

const props = withDefaults(defineProps<DropdownMenuSubContentProps & { class?: HTMLAttributes['class'] }>(), { collisionPadding: 8 })
defineOptions({ inheritAttrs: false })

const emits = defineEmits<DropdownMenuSubContentEmits>()

const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)

const look = useMenuLook()
</script>

<template>
  <RekaPortal>
    <RekaContent
      data-slot="dropdown-menu-sub-content"
      :data-density="look.density === 'default' ? undefined : look.density"
      :data-size="look.size === 'md' ? undefined : look.size"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn(menuContentClass(look, true), props.class)"
    >
      <slot />
    </RekaContent>
  </RekaPortal>
</template>
