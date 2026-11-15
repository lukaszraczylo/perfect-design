<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { TabsTrigger as RekaTrigger, type TabsTriggerProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRequireAccessibleName } from '../../../lib/contract'
import { useEntry } from '../contract'
import type { BaseProps } from '../../../lib/types'
import { TABS_OPTIONS_KEY } from './context'
import { tabsTriggerVariants } from './variants'

const props = defineProps<TabsTriggerProps & BaseProps>()
useEntry('Tabs', 'trigger', () => props.value)
const trigger = ref<{ $el?: Element } | null>(null)
useRequireAccessibleName('TabsTrigger', () => trigger.value?.$el, 'Give the tab visible text, or `aria-label` when it only shows an icon.')
const injected = inject(TABS_OPTIONS_KEY, undefined)
const classes = computed(() => cn(tabsTriggerVariants({ variant: injected?.value.variant, size: injected?.value.size, fullWidth: injected?.value.fullWidth }), props.class))
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
</script>

<template>
  <RekaTrigger ref="trigger" data-slot="tabs-trigger" v-bind="delegated" :class="classes">
    <slot />
  </RekaTrigger>
</template>
