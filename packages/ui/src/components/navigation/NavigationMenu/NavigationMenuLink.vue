<script setup lang="ts">
import { computed, inject, ref, type HTMLAttributes } from 'vue'
import { NavigationMenuLink as RekaLink, useForwardPropsEmits, type NavigationMenuLinkEmits, type NavigationMenuLinkProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import { NAVIGATION_MENU_SIZE_KEY } from './context'
import { navigationMenuLinkVariants, navigationMenuTriggerStyle, type NavigationMenuLinkVariant, type NavigationMenuTriggerVariant } from './variants'

const props = defineProps<
  NavigationMenuLinkProps & {
    class?: HTMLAttributes['class']
    /** `content`/`card`/`plain` style rows inside a mega menu; `trigger` renders a top-level link that looks like a trigger. */
    variant?: NavigationMenuLinkVariant | 'trigger'
    /** Trigger look when `variant="trigger"`. */
    triggerVariant?: NavigationMenuTriggerVariant
  }
>()
const link = ref<{ $el?: Element } | null>(null)
useRequireAccessibleName(
  'NavigationMenuLink',
  () => link.value?.$el,
  'Give the link visible text, or `aria-label` when it only shows an icon.',
  () => !!link.value?.$el?.matches?.('a[href],button,[role=link],[role=button]'),
)
const emits = defineEmits<NavigationMenuLinkEmits>()
const delegated = computed(() => {
  const { class: _c, variant: _v, triggerVariant: _t, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
const size = inject(NAVIGATION_MENU_SIZE_KEY, undefined)
const classes = computed(() =>
  cn(props.variant === 'trigger' ? navigationMenuTriggerStyle({ variant: props.triggerVariant, size: size?.value }) : navigationMenuLinkVariants({ variant: props.variant }), props.class),
)
</script>

<template>
  <RekaLink ref="link" data-slot="navigation-menu-link" v-bind="forwarded" :class="classes">
    <slot />
  </RekaLink>
</template>
