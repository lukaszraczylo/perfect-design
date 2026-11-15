<script setup lang="ts">
import { computed, provide, type HTMLAttributes } from 'vue'
import { NavigationMenuRoot, useForwardPropsEmits, type NavigationMenuRootEmits, type NavigationMenuRootProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import NavigationMenuViewport from './NavigationMenuViewport.vue'
import { NAVIGATION_MENU_SIZE_KEY } from './context'
import { NAVIGATION_MENU_SIZES, type NavigationMenuSize } from './variants'

export interface NavigationMenuProps extends NavigationMenuRootProps {
  class?: HTMLAttributes['class']
  /** Render the shared viewport that animates between contents (default). `false` positions each content under its trigger. */
  viewport?: boolean
  /** Height and text size of the triggers and top-level links: `sm` (32px), `md` (36px, default) or `lg` (44px). Unknown values fall back to `md`. */
  size?: NavigationMenuSize
}

const props = withDefaults(defineProps<NavigationMenuProps>(), { viewport: true, size: 'md' })
const size = computed<NavigationMenuSize>(() => (NAVIGATION_MENU_SIZES.includes(props.size as NavigationMenuSize) ? (props.size as NavigationMenuSize) : 'md'))
provide(NAVIGATION_MENU_SIZE_KEY, size)
const emits = defineEmits<NavigationMenuRootEmits>()

const delegated = computed(() => {
  const { class: _c, viewport: _v, size: _s, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
</script>

<template>
  <NavigationMenuRoot
    v-slot="slotProps"
    data-slot="navigation-menu"
    :data-viewport="viewport"
    :data-size="size"
    v-bind="forwarded"
    :class="cn('group/navigation-menu relative flex max-w-max flex-1 items-center justify-center data-[orientation=vertical]:items-start data-[orientation=vertical]:justify-start', props.class)"
  >
    <slot v-bind="slotProps" />
    <NavigationMenuViewport v-if="viewport" />
  </NavigationMenuRoot>
</template>
