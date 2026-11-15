<script setup lang="ts">
import { computed, nextTick, onMounted, useSlots } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import type { FeatureCardAlign, FeatureCardShape, FeatureCardSize, FeatureCardTone, FeatureCardVariant } from '../FeatureCard/variants'
import SectionHeading from '../SectionHeading/SectionHeading.vue'
import { checkItems, isBlank } from '../shared/itemsContract'
import { pickColumns } from '../shared/motion'
import FeatureGridItems from './FeatureGridItems.vue'
import {
  featureGridDefaultCardVariant,
  featureGridWrapperVariants,
  resolveFeatureGridAlign,
  resolveFeatureGridLayout,
  type FeatureGridColumns,
  type FeatureGridGap,
  resolveFeatureGridGap,
  type FeatureGridLayout,
  type FeatureGridSpan,
} from './variants'
import { resolveFeatureCardVariant } from '../FeatureCard/variants'

export interface FeatureItem {
  icon?: IconDefinition
  title: string
  description?: string
  href?: string
  linkLabel?: string
  external?: boolean
  /** `bento` layout: columns this tile spans (1-4, clamped to `columns`). Invalid values mean 1. */
  span?: FeatureGridSpan
  /** `alternating` layout: image URL shown next to the text. */
  image?: string
  /** `alternating` layout: alt text for `image`. Required with `image`; an empty string marks it decorative. */
  imageAlt?: string
  /** Per-item card variant; wins over the grid's `variant`. */
  variant?: FeatureCardVariant
}

export interface FeatureGridProps extends BaseProps {
  /** Arrangement of the items. Unknown values fall back to `grid`. */
  layout?: FeatureGridLayout
  /** Columns on large screens (2, 3 or 4). Invalid values fall back to 3. Always 1 column on mobile, 2 from `sm`. */
  columns?: FeatureGridColumns
  /** Convenience data source; for custom cards use the default slot instead. */
  items?: FeatureItem[]
  /** Heading level used by the generated cards. */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  /** FeatureCard variant for generated cards. When omitted each layout picks a sensible default. */
  variant?: FeatureCardVariant
  /** Alignment of card content and of the built-in heading. `centered` layout always centres. */
  align?: FeatureCardAlign
  /** Spacing between items: `sm`, `md` (default, each layout's own spacing) or `lg`. Unknown values fall back to `md`. */
  gap?: FeatureGridGap
  /** Size of every generated card (padding and type): `sm`, `md` (default) or `lg`. A card slotted in by hand keeps its own prop. */
  size?: FeatureCardSize
  /** Tone of every generated card: `default`, `muted`, `primary` or `inverted`. */
  tone?: FeatureCardTone
  /** Corner shape of every generated card: `rounded` (default) or `square`. */
  shape?: FeatureCardShape
  /** Built-in SectionHeading (shown when any of eyebrow/title/description/heading slot is set, or layout is `with-heading`). */
  eyebrow?: string
  title?: string
  description?: string
  /** Element level of the built-in heading title. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
}

const props = withDefaults(defineProps<FeatureGridProps>(), { layout: 'grid', columns: 3, items: () => [], level: 3, align: 'left', gap: 'md', size: 'md', tone: 'default', shape: 'rounded', headingLevel: 2 })
const slots = useSlots()

defineSlots<{
  default?: () => unknown
  heading?: () => unknown
  media?: (props: { item: FeatureItem; index: number }) => unknown
}>()

const layout = computed(() => resolveFeatureGridLayout(props.layout))
onMounted(async () => {
  await nextTick()
  if (slots.default) return
  checkItems('FeatureGrid', 'items', props.items, (item) => {
    if (isBlank(item.title)) return { rule: 'requires-title', text: 'requires a non-empty `title`. It is the card heading and the default link name.' }
    if (layout.value === 'alternating' && item.image && !slots.media && typeof item.imageAlt !== 'string') {
      return { rule: 'requires-imageAlt', text: 'requires an `imageAlt` string when it has an `image`. Describe the image, or pass an empty string to mark it decorative.' }
    }
    return undefined
  })
})
const cols = computed(() => pickColumns(props.columns, [2, 3, 4] as const, 3))
const align = computed<FeatureCardAlign>(() => (layout.value === 'centered' ? 'center' : resolveFeatureGridAlign(props.align)))
const cardVariant = computed(() =>
  props.variant === undefined ? featureGridDefaultCardVariant[layout.value] : resolveFeatureCardVariant(props.variant),
)
const gap = computed(() => resolveFeatureGridGap(props.gap))
const hasHeading = computed(() => !!(props.eyebrow || props.title || props.description || slots.heading))
const wrapped = computed(() => layout.value === 'with-heading' || hasHeading.value)
</script>

<template>
  <div v-if="wrapped" data-slot="feature-grid" :data-layout="layout" :data-columns="cols" :data-variant="cardVariant" :data-gap="gap" :data-size="size" :data-tone="tone" :data-shape="shape" :class="cn(featureGridWrapperVariants(), props.class)">
    <slot name="heading">
      <SectionHeading
        v-if="eyebrow || title || description"
        :eyebrow="eyebrow"
        :title="title"
        :description="description"
        :align="align"
        :level="headingLevel"
      />
    </slot>
    <FeatureGridItems
      :root="false"
      :items="items"
      :layout="layout"
      :columns="cols"
      :gap="gap"
      :size="size"
      :tone="tone"
      :shape="shape"
      :level="level"
      :card-variant="cardVariant"
      :align="align"
    >
      <template v-if="slots.default" #default><slot /></template>
      <template v-if="slots.media" #media="m"><slot name="media" v-bind="m" /></template>
    </FeatureGridItems>
  </div>
  <FeatureGridItems
    v-else
    :root="true"
    :data-variant="cardVariant"
    :data-gap="gap"
    :data-size="size"
    :data-tone="tone"
    :data-shape="shape"
    :class="props.class"
    :items="items"
    :layout="layout"
    :columns="cols"
    :gap="gap"
    :size="size"
    :tone="tone"
    :shape="shape"
    :level="level"
    :card-variant="cardVariant"
    :align="align"
  >
    <template v-if="slots.default" #default><slot /></template>
    <template v-if="slots.media" #media="m"><slot name="media" v-bind="m" /></template>
  </FeatureGridItems>
</template>
