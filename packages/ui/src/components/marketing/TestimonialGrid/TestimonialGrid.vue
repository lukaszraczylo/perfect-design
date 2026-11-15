<script setup lang="ts">
import { computed, nextTick, onMounted, useSlots } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { checkItems, ItemsChecked } from '../shared/itemsContract'
import { pickColumns } from '../shared/motion'
import Testimonial from '../Testimonial/Testimonial.vue'
import { testimonialProblem } from '../Testimonial/contract'
import { resolveTestimonialShape, resolveTestimonialSize, resolveTestimonialTone, resolveTestimonialVariant, type TestimonialShape, type TestimonialSize, type TestimonialTone, type TestimonialVariant } from '../Testimonial/variants'
import { TESTIMONIAL_GRID_LAYOUTS, resolveTestimonialGridGap, testimonialGridVariants, type TestimonialGridColumns, type TestimonialGridGap, type TestimonialGridLayout } from './variants'

export interface TestimonialItem {
  quote?: string
  author?: string
  role?: string
  avatar?: string
  avatarAlt?: string
  /** Star rating 0-5 (halves allowed). */
  rating?: number
}

export interface TestimonialGridProps extends BaseProps {
  /** Convenience data source; for custom content use the default slot instead. */
  items?: TestimonialItem[]
  /** `grid` (rows, equal height), `masonry` (CSS columns, natural height) or `columns` (side-by-side on `md`+, stacked below). Unknown values fall back to `grid`. */
  layout?: TestimonialGridLayout
  /** Max columns on large screens (1, 2 or 3) for `grid` and `masonry`; ignored by `columns`. Invalid values fall back to 3. */
  columns?: TestimonialGridColumns
  /** Variant of every generated Testimonial. Unknown values fall back to `card`. */
  variant?: TestimonialVariant
  /** Spacing between testimonials: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  gap?: TestimonialGridGap
  /** Quote and padding scale of every generated Testimonial: `sm`, `md` (default) or `lg`. */
  size?: TestimonialSize
  /** Surface of every generated Testimonial: `default`, `muted`, `primary` or `inverted`. */
  tone?: TestimonialTone
  /** Corners of every generated Testimonial: `rounded` (default) or `square`. */
  shape?: TestimonialShape
}

const props = withDefaults(defineProps<TestimonialGridProps>(), { items: () => [], layout: 'grid', columns: 3, variant: 'card', gap: 'md', size: 'md', tone: 'default', shape: 'rounded' })

const slots = useSlots()
onMounted(async () => {
  await nextTick()
  if (!slots.default) checkItems('TestimonialGrid', 'items', props.items, (item) => testimonialProblem(item))
})
const layout = computed<TestimonialGridLayout>(() => ((TESTIMONIAL_GRID_LAYOUTS as readonly unknown[]).includes(props.layout) ? props.layout : 'grid'))
const cols = computed(() => pickColumns(props.columns, [1, 2, 3] as const, 3))
const variant = computed(() => resolveTestimonialVariant(props.variant))
const gap = computed(() => resolveTestimonialGridGap(props.gap))
const size = computed(() => resolveTestimonialSize(props.size))
const tone = computed(() => resolveTestimonialTone(props.tone))
const shape = computed(() => resolveTestimonialShape(props.shape))
/** Native list semantics only when the grid renders its own testimonials (each wrapped in an <li>). */
const asList = computed(() => !slots.default && Array.isArray(props.items) && props.items.length > 0)
const classes = computed(() => cn(testimonialGridVariants({ layout: layout.value, columns: cols.value, gap: gap.value }), props.class))
</script>

<template>
  <component :is="asList ? 'ul' : 'div'" data-slot="testimonial-grid" :role="asList ? 'list' : undefined" :data-layout="layout" :data-columns="cols" :data-variant="variant" :data-gap="gap" :data-size="size" :data-tone="tone" :data-shape="shape" :class="classes">
    <slot>
      <li v-for="(item, i) in items" :key="`${i}-${item.author ?? ''}`" data-slot="testimonial-grid-item">
        <ItemsChecked><Testimonial v-bind="item" :variant="variant" :size="size" :tone="tone" :shape="shape" class="h-full" /></ItemsChecked>
      </li>
    </slot>
  </component>
</template>
