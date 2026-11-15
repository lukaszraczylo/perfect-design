<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { NavigationMenuContent as RekaContent, useForwardPropsEmits, type NavigationMenuContentEmits, type NavigationMenuContentProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useEntry } from '../contract'

const props = defineProps<NavigationMenuContentProps & { class?: HTMLAttributes['class'] }>()
useEntry('NavigationMenuItem', 'content', () => true)
const emits = defineEmits<NavigationMenuContentEmits>()
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
</script>

<template>
  <RekaContent
    data-slot="navigation-menu-content"
    v-bind="forwarded"
    :class="
      cn(
        'top-0 start-0 w-full p-2 md:absolute md:w-auto',
        'data-[motion^=from-]:animate-ds-fade-in data-[motion^=to-]:animate-ds-fade-out motion-reduce:animate-none',
        // Without a viewport the content is its own floating surface under the trigger.
        'group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-1.5 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-md group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:text-popover-foreground group-data-[viewport=false]/navigation-menu:shadow-md group-data-[viewport=false]/navigation-menu:z-(--z-dropdown)',
        'group-data-[viewport=false]/navigation-menu:data-[state=open]:animate-ds-pop-in group-data-[viewport=false]/navigation-menu:data-[state=closed]:animate-ds-pop-out',
        props.class,
      )
    "
  >
    <slot />
  </RekaContent>
</template>
