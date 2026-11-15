<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { faXmark } from '../../../lib/icons'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import { fill } from './format'
import { DEFAULT_LABELS } from './types'
import { filterChipRemoveVariants, filterChipVariants, normalizeFilterSize, normalizeFilterVariant, type FilterBarSize, type FilterBarVariant } from './variants'

export interface FilterChipProps extends BaseProps {
  /** Text of the chip ("Status is Open"). The default slot overrides it. Required: it also names the remove button. */
  label?: string
  /** `default`, `compact` or `inline`. Unknown values fall back to `default`. */
  variant?: FilterBarVariant
  /** Text size: `sm`, `md` (default) or `lg`. */
  size?: FilterBarSize
  /** Show the remove button. Delete and Backspace on it remove the chip too. */
  removable?: boolean
  /** Blocks removal. */
  disabled?: boolean
  /** Accessible name of the remove button. Defaults to "Remove filter: <label>". */
  removeLabel?: string
  /** Element to render. `li` inside a list. */
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<FilterChipProps>(), { variant: 'default', size: 'md', removable: true, as: 'span' })
const emit = defineEmits<{ remove: [] }>()

const labelEl = ref<HTMLElement | null>(null)
onMounted(async () => {
  await nextTick()
  if (!labelEl.value?.textContent?.trim()) {
    violation('FilterChip', 'requires-label', 'requires a non-empty `label` (or default slot text). The chip shows it and names its remove button after it. Pass `label="Status is Open"`.')
  }
})

const classes = computed(() => cn(filterChipVariants({ variant: normalizeFilterVariant(props.variant), size: normalizeFilterSize(props.size) }), props.class))
const removeName = computed(() => props.removeLabel?.trim() || fill(DEFAULT_LABELS.remove, { filter: props.label?.trim() ?? '' }).replace(/:\s*$/, ''))

function remove() {
  if (!props.disabled) emit('remove')
}
function onKeydown(e: KeyboardEvent) {
  if (props.removable && (e.key === 'Delete' || e.key === 'Backspace') && (e.target as HTMLElement | null)?.matches('[data-slot="filter-chip-remove"]')) {
    e.preventDefault()
    remove()
  }
}
</script>

<template>
  <Primitive data-slot="filter-chip" :as="as" :data-variant="normalizeFilterVariant(variant)" :data-disabled="disabled ? '' : undefined" :class="classes" @keydown="onKeydown">
    <span ref="labelEl" data-slot="filter-chip-label" class="min-w-0 break-words py-0.5"><slot>{{ label }}</slot></span>
    <button
      v-if="removable"
      type="button"
      data-slot="filter-chip-remove"
      :aria-label="removeName"
      aria-keyshortcuts="Delete Backspace"
      :disabled="disabled"
      :class="filterChipRemoveVariants()"
      @click="remove"
    >
      <Icon :icon="faXmark" size="xs" />
    </button>
  </Primitive>
</template>
