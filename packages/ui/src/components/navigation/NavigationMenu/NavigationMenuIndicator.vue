<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { NavigationMenuIndicator as RekaIndicator, useForwardProps, type NavigationMenuIndicatorProps } from 'reka-ui'
import { cn } from '../../../lib/cn'

const props = defineProps<NavigationMenuIndicatorProps & { class?: HTMLAttributes['class'] }>()
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <RekaIndicator
    data-slot="navigation-menu-indicator"
    v-bind="forwarded"
    :class="
      cn(
        'absolute top-full left-0 z-1 flex h-1.5 w-(--reka-navigation-menu-indicator-size) translate-x-(--reka-navigation-menu-indicator-position) items-end justify-center overflow-hidden data-[orientation=vertical]:top-0 data-[orientation=vertical]:left-full data-[orientation=vertical]:h-(--reka-navigation-menu-indicator-size) data-[orientation=vertical]:w-1.5 data-[orientation=vertical]:translate-x-0 data-[orientation=vertical]:translate-y-(--reka-navigation-menu-indicator-position) data-[orientation=vertical]:items-center data-[orientation=vertical]:justify-start data-[state=hidden]:animate-ds-fade-out data-[state=visible]:animate-ds-fade-in motion-reduce:animate-none',
        props.class,
      )
    "
  >
    <div class="relative top-3/5 size-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
  </RekaIndicator>
</template>
