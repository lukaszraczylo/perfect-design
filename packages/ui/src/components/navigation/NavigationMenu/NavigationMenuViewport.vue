<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { NavigationMenuViewport as RekaViewport, useForwardProps, type NavigationMenuViewportProps } from 'reka-ui'
import { cn } from '../../../lib/cn'

const props = defineProps<NavigationMenuViewportProps & { class?: HTMLAttributes['class'] }>()
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <div
    data-slot="navigation-menu-viewport-wrapper"
    class="absolute top-full start-0 isolate z-(--z-dropdown) flex justify-center group-data-[orientation=vertical]/navigation-menu:top-0 group-data-[orientation=vertical]/navigation-menu:start-full group-data-[orientation=vertical]/navigation-menu:justify-start"
  >
    <RekaViewport
      data-slot="navigation-menu-viewport"
      v-bind="forwarded"
      :class="
        cn(
          'relative mt-1.5 h-(--reka-navigation-menu-viewport-height) w-full origin-top overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md md:w-(--reka-navigation-menu-viewport-width)',
          'group-data-[orientation=vertical]/navigation-menu:mt-0 group-data-[orientation=vertical]/navigation-menu:ms-1.5',
          'data-[state=open]:animate-ds-pop-in data-[state=closed]:animate-ds-pop-out motion-reduce:animate-none',
          props.class,
        )
      "
    />
  </div>
</template>
