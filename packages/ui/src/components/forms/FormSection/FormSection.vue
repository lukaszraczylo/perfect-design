<script setup lang="ts">
import { computed, onMounted, useAttrs, useId, useSlots, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { formSectionFieldsVariants, formSectionVariants } from './variants'

export interface FormSectionProps {
  /** Section title, rendered as a heading and used as the landmark name. Use the `title` slot for rich content. */
  title?: string
  /** Help text under the title. Use the `description` slot for rich content. */
  description?: string
  /** Heading level 1-6. Invalid values fall back to 3. */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  /** Number of field columns (1-4); collapses responsively (1 on mobile, 2 from `sm`, 3-4 from `lg`). Invalid values fall back to 1. */
  columns?: 1 | 2 | 3 | 4
  /** `stacked`: header above the fields. `split`: header beside the fields from the `lg` breakpoint. `card`: stacked inside a bordered panel. */
  variant?: 'stacked' | 'split' | 'card'
  /** Spacing and title size: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  size?: 'sm' | 'md' | 'lg'
  /** Draw a bottom border to separate consecutive sections. */
  divider?: boolean
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<FormSectionProps>(), {
  title: undefined,
  description: undefined,
  level: 3,
  columns: 1,
  variant: 'stacked',
  size: 'md',
  divider: false,
})
const slots = useSlots()
const attrs = useAttrs()
const uid = useId()
const titleId = `${uid}-title`
const descId = `${uid}-desc`

const hasTitle = computed(() => !!props.title || !!slots.title)
onMounted(() => {
  if (!hasTitle.value && !attrs['aria-label'] && !attrs['aria-labelledby']) {
    violation('FormSection', 'requires-title', 'requires a `title` (prop or slot) or an `aria-label` / `aria-labelledby`, because it renders a named `section` landmark. Add `title="..."`.')
  }
})
const hasDescription = computed(() => !!props.description || !!slots.description)
const hasAside = computed(() => !!slots.aside)
const hasHeader = computed(() => hasTitle.value || hasDescription.value || hasAside.value)
const tag = computed(() => `h${Number.isInteger(props.level) && props.level >= 1 && props.level <= 6 ? props.level : 3}`)
const variant = computed(() => (props.variant === 'split' || props.variant === 'card' ? props.variant : 'stacked'))
const size = computed(() => (props.size === 'sm' || props.size === 'lg' ? props.size : 'md'))
const TITLE = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' } as const
const columns = computed(() => ([1, 2, 3, 4] as const).find((c) => c === Number(props.columns)) ?? 1)
const classes = computed(() => cn(formSectionVariants({ variant: variant.value, size: size.value, divider: !!props.divider }), props.class))
</script>

<template>
  <section
    data-slot="form-section"
    :data-variant="variant"
    :data-size="size"
    :aria-labelledby="hasTitle ? titleId : undefined"
    :aria-describedby="hasDescription ? descId : undefined"
    :class="classes"
  >
    <header v-if="hasHeader" data-slot="form-section-header" class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div data-slot="form-section-heading" class="grid min-w-0 gap-1">
        <component :is="tag" v-if="hasTitle" :id="titleId" data-slot="form-section-title" :class="cn(TITLE[size], 'leading-snug font-semibold')">
          <slot name="title">{{ title }}</slot>
        </component>
        <p v-if="hasDescription" :id="descId" data-slot="form-section-description" class="text-sm text-muted-foreground">
          <slot name="description">{{ description }}</slot>
        </p>
      </div>
      <div v-if="hasAside" data-slot="form-section-aside" class="flex shrink-0 items-center gap-2">
        <slot name="aside" />
      </div>
    </header>
    <div data-slot="form-section-fields" :class="cn(formSectionFieldsVariants({ columns, variant, size }))">
      <slot />
    </div>
  </section>
</template>
