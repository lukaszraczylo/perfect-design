<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { NavigationMenuList as RekaList, useForwardProps, type NavigationMenuListProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { duplicates, useEntryRegistry } from '../contract'

const props = defineProps<NavigationMenuListProps & { class?: HTMLAttributes['class'] }>()
useEntryRegistry('NavigationMenuList', (entries) => {
  const dup = duplicates(entries.filter((e) => e.kind === 'item').map((e) => e.value()))
  if (dup.length) violation('NavigationMenuList', 'unique-value', `requires a unique \`value\` on every NavigationMenuItem (duplicate: ${dup.map((v) => `"${v}"`).join(', ')}). Items with the same value open together.`)
})
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
const forwarded = useForwardProps(delegated)
</script>

<template>
  <RekaList
    data-slot="navigation-menu-list"
    v-bind="forwarded"
    :class="cn('group flex flex-1 list-none flex-wrap items-center justify-center gap-1 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch', props.class)"
  >
    <slot />
  </RekaList>
</template>
