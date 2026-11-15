<script setup lang="ts">
import { computed, inject } from 'vue'
import { ToolbarSeparator as RekaToolbarSeparator, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { TOOLBAR_KEY } from './context'
import { toolbarSeparatorVariants } from './variants'

export interface ToolbarSeparatorProps extends BaseProps {
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = defineProps<ToolbarSeparatorProps>()

const ctx = inject(TOOLBAR_KEY, null)
const barOrientation = computed(() => ctx?.orientation.value ?? 'horizontal')
// The line runs across the bar: vertical in a horizontal bar. reka-ui passes the bar orientation straight through, which
// would announce a horizontal separator in a horizontal bar, so the perpendicular value is set explicitly.
const lineOrientation = computed(() => (barOrientation.value === 'horizontal' ? 'vertical' : 'horizontal'))
const classes = computed(() => cn(toolbarSeparatorVariants({ orientation: barOrientation.value }), props.class))
</script>

<template>
  <RekaToolbarSeparator
    data-slot="toolbar-separator"
    :as="as"
    :as-child="asChild"
    :aria-orientation="lineOrientation"
    :data-orientation="lineOrientation"
    :class="classes"
  />
</template>
