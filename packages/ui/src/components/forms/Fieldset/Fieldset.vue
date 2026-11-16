<script setup lang="ts">
import { computed, onMounted, useAttrs, useId, useSlots, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'

export interface FieldsetProps {
  /** Legend text. Use the `legend` slot for rich content. */
  legend?: string
  /** Helper text under the legend, linked to the fieldset via `aria-describedby`. */
  description?: string
  /** `plain` has no chrome; `card` draws a bordered, padded box; `filled` a padded box on the secondary surface; `divided` a single top rule. */
  variant?: 'plain' | 'card' | 'filled' | 'divided'
  /** Legend and description text size and the gap between the fields: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  size?: 'sm' | 'md' | 'lg'
  /** Native disabled: disables every descendant control. */
  disabled?: boolean
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<FieldsetProps>(), { variant: 'plain', size: 'md' })
const slots = useSlots()
defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const describedBy = computed(() => [hasDescription.value ? descriptionId : '', attrs['aria-describedby'] as string | undefined].filter(Boolean).join(' ') || undefined)

const uid = useId()
const descriptionId = `fieldset-${uid}-description`
const hasLegend = computed(() => !!props.legend || !!slots.legend)
const hasDescription = computed(() => !!props.description || !!slots.description)
// A fieldset without a legend has no accessible name (WCAG 1.3.1).
onMounted(() => {
  if (!hasLegend.value && !attrs['aria-label'] && !attrs['aria-labelledby']) {
    violation('Fieldset', 'requires-legend', 'requires a `legend` (prop or slot) or an `aria-label` / `aria-labelledby`. Add `legend="..."` so the group has an accessible name.')
  }
})
const VARIANTS = {
  plain: '',
  card: 'rounded-lg border bg-card p-4 text-card-foreground',
  filled: 'rounded-lg bg-secondary p-4 text-secondary-foreground',
  divided: 'border-t pt-5',
} as const
const SIZES = {
  sm: { legend: 'text-xs', description: 'text-xs', gap: 'gap-3' },
  md: { legend: 'text-sm', description: 'text-sm', gap: 'gap-5' },
  lg: { legend: 'text-base', description: 'text-sm', gap: 'gap-6' },
} as const
const variant = computed<keyof typeof VARIANTS>(() => (Object.hasOwn(VARIANTS, props.variant) ? props.variant : 'plain'))
const size = computed<keyof typeof SIZES>(() => (Object.hasOwn(SIZES, props.size) ? props.size : 'md'))
const classes = computed(() => cn('m-0 min-w-0 border-0 p-0', VARIANTS[variant.value], props.disabled && 'opacity-60', props.class))
</script>

<template>
  <fieldset
    v-bind="$attrs"
    data-slot="fieldset"
    :data-variant="variant"
    :data-size="size"
    :data-disabled="disabled ? '' : undefined"
    :disabled="disabled || undefined"
    :aria-describedby="describedBy"
    :class="classes"
  >
    <legend
      v-if="hasLegend"
      data-slot="fieldset-legend"
      :class="cn('mb-1 px-0', SIZES[size].legend, 'leading-none font-semibold', variant === 'filled' ? 'text-secondary-foreground' : 'text-foreground', variant !== 'plain' && variant !== 'divided' && 'float-left w-full')"
    >
      <slot name="legend">{{ legend }}</slot>
    </legend>
    <p v-if="hasDescription" :id="descriptionId" data-slot="fieldset-description" :class="cn('clear-both mb-3', SIZES[size].description, variant === 'filled' ? 'text-secondary-foreground' : 'text-muted-foreground')">
      <slot name="description">{{ description }}</slot>
    </p>
    <div data-slot="fieldset-content" :class="cn('clear-both flex flex-col', SIZES[size].gap)">
      <slot />
    </div>
  </fieldset>
</template>
