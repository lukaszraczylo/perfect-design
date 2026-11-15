<script setup lang="ts">
import { computed, inject, ref, type HTMLAttributes } from 'vue'
import { NavigationMenuTrigger as RekaTrigger, useForwardProps, type NavigationMenuTriggerProps } from 'reka-ui'
import { faChevronDown } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import { useEntry } from '../contract'
import Icon from '../../primitives/Icon/Icon.vue'
import { NAVIGATION_MENU_SIZE_KEY } from './context'
import { navigationMenuTriggerStyle, type NavigationMenuTriggerVariant } from './variants'

const props = defineProps<
  NavigationMenuTriggerProps & {
    class?: HTMLAttributes['class']
    variant?: NavigationMenuTriggerVariant
    /** Hide the trailing chevron. */
    hideChevron?: boolean
  }
>()
useEntry('NavigationMenuItem', 'trigger', () => true)
const trigger = ref<{ $el?: Element } | null>(null)
useRequireAccessibleName('NavigationMenuTrigger', () => trigger.value?.$el, 'Give the trigger visible text, or `aria-label` when it only shows an icon.')
const size = inject(NAVIGATION_MENU_SIZE_KEY, undefined)
const classes = computed(() => cn(navigationMenuTriggerStyle({ variant: props.variant, size: size?.value }), props.class))
const delegated = computed(() => {
  const { class: _c, variant: _v, hideChevron: _h, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <RekaTrigger ref="trigger" data-slot="navigation-menu-trigger" v-bind="forwarded" :class="classes">
    <slot />
    <Icon
      v-if="!hideChevron"
      :icon="faChevronDown"
      size="sm"
      data-slot="navigation-menu-trigger-icon"
      class="relative top-px transition-transform duration-200 group-data-[state=open]/trigger:rotate-180 motion-reduce:transition-none"
    />
  </RekaTrigger>
</template>
