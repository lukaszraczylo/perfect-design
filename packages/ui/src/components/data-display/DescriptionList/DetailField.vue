<script setup lang="ts">
import { computed } from 'vue'
import { requireText } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { useMountedCheck } from '../_shared/contract'
import CopyButton from '../_shared/CopyButton.vue'

export interface DetailFieldProps extends BaseProps {
  label: string
  /** Value to display; the default slot wins when provided. */
  value?: string | number | null
  copyable?: boolean
  /** Type scale: `sm` (12px value), `md` (14px, default) or `lg` (16px). Unknown values behave as `md`. */
  size?: 'sm' | 'md' | 'lg'
  /** Shown when the value is empty. */
  emptyText?: string
}

const props = withDefaults(defineProps<DetailFieldProps>(), { size: 'md', emptyText: '–' })
defineEmits<{ copy: [text: string] }>()

useMountedCheck(() => requireText('DetailField', 'label', props.label, 'It is the term of the field, e.g. `label="Region"`.'))

const text = computed(() => (props.value === null || props.value === undefined || props.value === '' ? '' : String(props.value)))
const SIZES = { sm: ['text-xs', 'text-xs'], md: ['text-sm', 'text-xs'], lg: ['text-base', 'text-sm'] } as const
const size = computed(() => (props.size in SIZES ? props.size : 'md'))
const classes = computed(() => cn('flex flex-col gap-0.5', SIZES[size.value][0], props.class))
const labelClasses = computed(() => cn(SIZES[size.value][1], 'font-medium text-muted-foreground'))
</script>

<template>
  <dl data-slot="detail-field" :data-size="size === 'md' ? undefined : size" :class="classes">
    <dt data-slot="detail-field-label" :class="labelClasses">{{ label }}</dt>
    <dd data-slot="detail-field-value" class="flex min-w-0 items-center gap-1.5 break-words font-medium text-foreground">
      <span class="min-w-0"><slot>{{ text || emptyText }}</slot></span>
      <CopyButton v-if="copyable && text" :text="text" :label="`Copy ${label}`" @copy="(t) => $emit('copy', t)" />
    </dd>
  </dl>
</template>
