<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  MenubarSubContent as RekaContent,
  MenubarPortal as RekaPortal,
  useForwardPropsEmits,
  type MenubarSubContentEmits,
  type MenubarSubContentProps,
} from 'reka-ui'
import { cn } from '../../../lib/cn'
import { menuSubContent } from '../../overlays/menuStyles'

const props = defineProps<MenubarSubContentProps & { class?: HTMLAttributes['class'] }>()
defineOptions({ inheritAttrs: false })
const emits = defineEmits<MenubarSubContentEmits>()

const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
</script>

<template>
  <RekaPortal>
    <RekaContent data-slot="menubar-sub-content" v-bind="{ ...$attrs, ...forwarded }" :class="cn(menuSubContent, props.class)">
      <slot />
    </RekaContent>
  </RekaPortal>
</template>
