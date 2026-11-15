<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import {
  lineClampClasses,
  textPresets,
  textSizes,
  textVariantNames,
  textVariants,
  type TextAlign,
  type TextLeading,
  type TextLines,
  type TextSize,
  type TextTone,
  type TextTransform,
  type TextVariant,
  type TextWeight,
  type TextWrap,
} from './variants'

export interface TextProps extends BaseProps {
  as?: PrimitiveProps['as']
  asChild?: boolean
  /**
   * Preset: `default`, `caption` (xs muted), `label` (sm medium), `overline` (xs muted medium, plain case) or
   * `mono` (sm monospace). Presets only fill `size` / `tone` / `weight` you left unset.
   */
  variant?: TextVariant
  /** Font size. Defaults to the variant's size, else `base`. Unknown values fall back to `base`. */
  size?: TextSize
  /** Text colour. Defaults to the variant's tone, else `default` (inherits). */
  tone?: TextTone
  weight?: TextWeight
  align?: TextAlign
  /** Line height. */
  leading?: TextLeading
  /** Text transform. Discouraged: prefer sentence case and write the text as it should read. */
  transform?: TextTransform
  italic?: boolean
  /** Wrapping: `balance`, `pretty` or `nowrap`. */
  wrap?: TextWrap
  /** Single line with ellipsis. Ignored when `lines` is a valid clamp. */
  truncate?: boolean
  /** Clamp to N lines (1-6) with ellipsis. Values outside 1-6 are ignored. */
  lines?: TextLines | `${TextLines}`
}

const props = withDefaults(defineProps<TextProps>(), {
  as: 'p',
  variant: 'default',
  truncate: false,
  italic: false,
})

const preset = computed(() => textPresets[textVariantNames.includes(props.variant) ? props.variant : 'default'])
const size = computed<TextSize>(() => {
  if (props.size === undefined) return preset.value.size ?? 'base'
  return textSizes.includes(props.size) ? props.size : 'base'
})

const clamp = computed(() => lineClampClasses[Number(props.lines) as TextLines])

const classes = computed(() =>
  cn(
    textVariants({
      size: size.value,
      tone: props.tone ?? preset.value.tone ?? 'default',
      weight: props.weight ?? preset.value.weight,
      align: props.align,
      leading: props.leading,
      transform: props.transform,
      italic: props.italic,
      wrap: props.wrap,
      variant: textVariantNames.includes(props.variant) ? props.variant : 'default',
    }),
    clamp.value ?? (props.truncate ? 'truncate' : ''),
    props.class,
  ),
)
</script>

<template>
  <Primitive data-slot="text" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
