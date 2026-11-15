<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { NavigationMenuItem as RekaItem, useForwardProps, type NavigationMenuItemProps } from 'reka-ui'
import { onMounted } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { isBlank, useEntry, useEntryRegistry } from '../contract'

const props = defineProps<NavigationMenuItemProps & { class?: HTMLAttributes['class'] }>()
const inList = useEntry('NavigationMenuList', 'item', () => props.value)
onMounted(() => {
  if (!inList) violation('NavigationMenuItem', 'requires-list', 'requires a parent NavigationMenuList. Nest NavigationMenu > NavigationMenuList > NavigationMenuItem.')
})
useEntryRegistry('NavigationMenuItem', (entries) => {
  const trigger = entries.some((e) => e.kind === 'trigger')
  const content = entries.some((e) => e.kind === 'content')
  if (trigger !== content) violation('NavigationMenuItem', 'requires-trigger-content-pair', `requires a NavigationMenuTrigger and a NavigationMenuContent together (this item has ${trigger ? 'a trigger but no content' : 'content but no trigger'}). For a plain link use NavigationMenuLink alone.`)
  if (trigger && content && isBlank(props.value)) violation('NavigationMenuItem', 'requires-value', 'requires a unique `value` when it holds a NavigationMenuTrigger and NavigationMenuContent. The value links the trigger to its content.')
})
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <RekaItem data-slot="navigation-menu-item" v-bind="forwarded" :class="cn('relative', props.class)">
    <slot />
  </RekaItem>
</template>
