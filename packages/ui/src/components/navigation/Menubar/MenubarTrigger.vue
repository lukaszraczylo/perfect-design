<script setup lang="ts">
import { computed, inject, ref, type HTMLAttributes } from 'vue'
import { MenubarTrigger as RekaTrigger, useForwardProps, type MenubarTriggerProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRegisterPart, useRequireAccessibleName } from '../../../lib/contract'
import { MENUBAR_SIZE_KEY } from './context'
import { menubarTriggerVariants } from './variants'

const props = defineProps<MenubarTriggerProps & { class?: HTMLAttributes['class'] }>()
useRegisterPart('MenubarMenu', 'MenubarTrigger')
const trigger = ref<{ $el?: Element } | null>(null)
useRequireAccessibleName('MenubarTrigger', () => trigger.value?.$el, 'Give the trigger visible text, or `aria-label` when it only shows an icon.')
const size = inject(MENUBAR_SIZE_KEY, undefined)
const classes = computed(() => cn(menubarTriggerVariants({ size: size?.value }), props.class))
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <RekaTrigger
    ref="trigger"
    data-slot="menubar-trigger"
    v-bind="forwarded"
    :class="classes"
  >
    <slot />
  </RekaTrigger>
</template>
