<script setup lang="ts">
import { ref } from 'vue'
import { CollapsibleTrigger as RekaTrigger, type CollapsibleTriggerProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRegisterPart, useRequireAccessibleName } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'

const props = defineProps<CollapsibleTriggerProps & BaseProps>()
useRegisterPart('Collapsible', 'CollapsibleTrigger')
const trigger = ref<{ $el?: Element } | null>(null)
// Only controls that take their name from content are checked: an `as-child` custom element is the author's to name.
useRequireAccessibleName(
  'CollapsibleTrigger',
  () => trigger.value?.$el,
  'Give the trigger visible text, or `aria-label` when it only shows an icon.',
  () => !!trigger.value?.$el?.matches?.('button,a[href],summary,[role=button]'),
)
</script>

<template>
  <RekaTrigger ref="trigger" data-slot="collapsible-trigger" :as="as" :as-child="asChild" :class="cn(props.class)">
    <slot />
  </RekaTrigger>
</template>
