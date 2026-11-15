<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { leadAligns, leadSizes, leadTones, leadVariants, type LeadAlign, type LeadSize, type LeadTone } from './variants'

export interface LeadProps extends BaseProps {
  /** Font size: `md`, `lg` (default) or `xl`. Unknown values fall back to `lg`. */
  size?: LeadSize
  /** Text colour: `muted` (default) or `foreground`. Unknown values fall back to `muted`. */
  tone?: LeadTone
  /** Text alignment: `start` (default) or `center`. Unknown values fall back to `start`. */
  align?: LeadAlign
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<LeadProps>(), { size: 'lg', tone: 'muted', align: 'start', as: 'p' })

const size = computed<LeadSize>(() => (leadSizes.includes(props.size) ? props.size : 'lg'))
const tone = computed<LeadTone>(() => (leadTones.includes(props.tone) ? props.tone : 'muted'))
const align = computed<LeadAlign>(() => (leadAligns.includes(props.align) ? props.align : 'start'))
const classes = computed(() => cn(leadVariants({ size: size.value, tone: tone.value, align: align.value }), props.class))
</script>

<template>
  <Primitive data-slot="lead" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
