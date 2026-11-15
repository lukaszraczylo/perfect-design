<script setup lang="ts">
import { computed, inject } from 'vue'
import { CollapsibleContent as RekaContent, type CollapsibleContentProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { useRegisterPart } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { COLLAPSIBLE_SIZE_KEY } from './context'
import { collapsibleContentVariants } from './variants'

const props = defineProps<CollapsibleContentProps & BaseProps>()
useRegisterPart('Collapsible', 'CollapsibleContent')
const sizeCtx = inject(COLLAPSIBLE_SIZE_KEY, undefined)
const classes = computed(() => cn(collapsibleContentVariants({ size: sizeCtx?.value }), props.class))
const delegated = computed(() => {
  const { class: _c, ...rest } = props
  return rest
})
</script>

<template>
  <RekaContent
    data-slot="collapsible-content"
    v-bind="delegated"
    :class="classes"
  >
    <slot />
  </RekaContent>
</template>
