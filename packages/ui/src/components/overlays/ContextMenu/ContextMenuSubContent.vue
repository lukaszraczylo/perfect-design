<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  ContextMenuSubContent as RekaContent,
  ContextMenuPortal as RekaPortal,
  useForwardPropsEmits,
  type ContextMenuSubContentEmits,
  type ContextMenuSubContentProps,
} from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useMenuLook } from '../menuContext'
import { menuContentClass } from '../menuStyles'

const props = withDefaults(defineProps<ContextMenuSubContentProps & { class?: HTMLAttributes['class'] }>(), { collisionPadding: 8 })
defineOptions({ inheritAttrs: false })

const emits = defineEmits<ContextMenuSubContentEmits>()

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
      data-slot="context-menu-sub-content"
      :data-density="look.density === 'default' ? undefined : look.density"
      :data-size="look.size === 'md' ? undefined : look.size"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn(menuContentClass(look, true), props.class)"
    >
      <slot />
    </RekaContent>
  </RekaPortal>
</template>
