<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  MenubarContent as RekaContent,
  MenubarPortal as RekaPortal,
  useForwardPropsEmits,
  type MenubarContentEmits,
  type MenubarContentProps,
} from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRegisterPart } from '../../../lib/contract'
import { menuContent } from '../../overlays/menuStyles'

useRegisterPart('MenubarMenu', 'MenubarContent')
const props = withDefaults(defineProps<MenubarContentProps & { class?: HTMLAttributes['class'] }>(), { sideOffset: 8, alignOffset: -4, align: 'start' })
defineOptions({ inheritAttrs: false })
const emits = defineEmits<MenubarContentEmits>()

const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
</script>

<template>
  <RekaPortal>
    <RekaContent data-slot="menubar-content" v-bind="{ ...$attrs, ...forwarded }" :class="cn(menuContent, 'min-w-48', props.class)">
      <slot />
    </RekaContent>
  </RekaPortal>
</template>
