<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { TabsList as RekaList, type TabsListProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { TABS_OPTIONS_KEY } from './context'
import { tabsListVariants } from './variants'

const props = defineProps<TabsListProps & BaseProps>()
const list = ref<{ $el?: Element } | null>(null)
useRequireAccessibleName('TabsList', () => list.value?.$el, 'Add `aria-label` (or `aria-labelledby`) to TabsList, for example `<TabsList aria-label="Account settings">`.')
const injected = inject(TABS_OPTIONS_KEY, undefined)
const classes = computed(() => cn(tabsListVariants({ variant: injected?.value.variant, size: injected?.value.size, fullWidth: injected?.value.fullWidth }), props.class))
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
</script>

<template>
  <RekaList ref="list" data-slot="tabs-list" v-bind="delegated" :class="classes">
    <slot />
  </RekaList>
</template>
