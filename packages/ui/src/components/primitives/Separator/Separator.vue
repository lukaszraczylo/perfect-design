<script setup lang="ts">
import { useSlots } from 'vue'
import { Separator as RekaSeparator, type SeparatorProps as RekaSeparatorProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import {
  separatorLabelledVariants,
  separatorLabelVariants,
  separatorLineVariants,
  separatorVariants,
  type SeparatorAlign,
  type SeparatorSize,
  type SeparatorTone,
  type SeparatorVariant,
} from './variants'

export interface SeparatorProps extends BaseProps {
  orientation?: 'horizontal' | 'vertical'
  /** Purely visual (role="none"). Set `false` to expose role="separator" to assistive tech. */
  decorative?: boolean
  /** Line style: `solid` (default), `dashed` or `dotted`. Unknown values fall back to solid. */
  variant?: SeparatorVariant
  /** Line thickness: `thin` (1px, default), `md` (2px) or `thick` (3px). Unknown values fall back to thin. */
  size?: SeparatorSize
  /** Colour: `default`, `muted` (half strength), `strong` (form-control border colour) or `primary`. Unknown values fall back to default. */
  tone?: SeparatorTone
  /** Text shown on the line (e.g. "or"). The default slot does the same with arbitrary content. Ignored with `asChild`. */
  label?: string
  /** Where the label sits: `start`, `center` (default) or `end`. Unknown values fall back to center. */
  align?: SeparatorAlign
  as?: RekaSeparatorProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<SeparatorProps>(), {
  orientation: 'horizontal',
  decorative: true,
  variant: 'solid',
  size: 'thin',
  tone: 'default',
  label: undefined,
  align: 'center',
})

defineSlots<{
  /** Label content (replaces `label`). With `asChild` it is the element to render instead. */
  default?: () => unknown
}>()

const slots = useSlots()
const VARIANTS: readonly SeparatorVariant[] = ['solid', 'dashed', 'dotted']
const SIZES: readonly SeparatorSize[] = ['thin', 'md', 'thick']
const TONES: readonly SeparatorTone[] = ['default', 'muted', 'strong', 'primary']
const ALIGNS: readonly SeparatorAlign[] = ['start', 'center', 'end']

// Evaluated at render time because slots are not reactive.
const labelled = () => !props.asChild && (!!props.label || !!slots.default)
const variant = () => (VARIANTS.includes(props.variant) ? props.variant : 'solid')
const size = () => (SIZES.includes(props.size) ? props.size : 'thin')
const tone = () => (TONES.includes(props.tone) ? props.tone : 'default')
const align = () => (ALIGNS.includes(props.align) ? props.align : 'center')
const orientation = () => (props.orientation === 'vertical' ? 'vertical' : 'horizontal')

const rootClasses = () =>
  labelled() ? cn(separatorLabelledVariants(), props.class) : cn(separatorVariants({ variant: variant(), size: size(), tone: tone() }), props.class)
const lineClasses = () => cn(separatorLineVariants({ variant: variant(), orientation: orientation(), size: size(), tone: tone() }))
const labelClasses = () => cn(separatorLabelVariants({ tone: tone() }))
// Role "separator" hides its children from assistive tech, so expose the text as the name.
const ariaLabel = () => (labelled() && !props.decorative && props.label && !slots.default ? props.label : undefined)
</script>

<template>
  <RekaSeparator
    data-slot="separator"
    :orientation="orientation()"
    :decorative="decorative"
    :as="as"
    :as-child="asChild"
    :data-align="labelled() ? align() : undefined"
    :aria-label="ariaLabel()"
    :class="rootClasses()"
  >
    <template v-if="labelled()">
      <span v-if="align() !== 'start'" data-slot="separator-line" :data-orientation="orientation()" :class="lineClasses()" />
      <span data-slot="separator-label" :class="labelClasses()"><slot>{{ label }}</slot></span>
      <span v-if="align() !== 'end'" data-slot="separator-line" :data-orientation="orientation()" :class="lineClasses()" />
    </template>
    <slot v-else />
  </RekaSeparator>
</template>
