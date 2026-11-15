<script setup lang="ts">
/**
 * Internal: the list container of FeatureGrid (used as the root, or nested under a heading). Not exported.
 * Generated items are a real <ul> with <li> children. Custom slot content is a plain grid <div> (no list role), because
 * arbitrary children cannot be guaranteed to be listitems (axe aria-required-children).
 */
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import FeatureCard from '../FeatureCard/FeatureCard.vue'
import { ItemsChecked } from '../shared/itemsContract'
import type { FeatureCardAlign, FeatureCardShape, FeatureCardSize, FeatureCardTone, FeatureCardVariant } from '../FeatureCard/variants'
import type { FeatureItem } from './FeatureGrid.vue'
import { bentoSpanClass, featureGridRowVariants, featureGridVariants, type FeatureGridColumns, type FeatureGridGap, type FeatureGridLayout } from './variants'

interface Props extends BaseProps {
  items: FeatureItem[]
  layout: FeatureGridLayout
  columns: FeatureGridColumns
  level: 1 | 2 | 3 | 4 | 5 | 6
  /** Already resolved card variant (consumer value or the layout default). */
  cardVariant: FeatureCardVariant
  align: FeatureCardAlign
  gap: FeatureGridGap
  size: FeatureCardSize
  tone: FeatureCardTone
  shape: FeatureCardShape
  /** True when this element is the component root (data-slot="feature-grid"). */
  root: boolean
}

const props = defineProps<Props>()
const classes = computed(() => cn(featureGridVariants({ layout: props.layout, columns: props.columns, gap: props.gap }), props.class))

const entries = computed(() =>
  props.items
    .filter((item) => !!item && typeof item === 'object')
    .map((item, index) => {
      const { icon, title, description, href, linkLabel, external } = item
      return {
        item,
        index,
        key: `${index}-${item.title}`,
        card: { icon, title, description, href, linkLabel, external },
        variant: item.variant ?? props.cardVariant,
        media: typeof item.image === 'string' && item.image !== '',
      }
    }),
)
</script>

<template>
  <component :is="$slots.default ? 'div' : 'ul'" :role="$slots.default ? undefined : 'list'" :data-slot="root ? 'feature-grid' : 'feature-grid-items'" :data-layout="layout" :data-columns="columns" :class="classes">
    <slot>
      <template v-if="layout === 'alternating'">
        <li
          v-for="e in entries"
          :key="e.key"
          data-slot="feature-grid-row"
          :data-reversed="e.index % 2 === 1 ? '' : undefined"
          :class="featureGridRowVariants({ media: e.media || !!$slots.media })"
        >
          <ItemsChecked><FeatureCard v-bind="e.card" :variant="e.variant" :align="align" :size="size" :tone="tone" :shape="shape" :level="level" /></ItemsChecked>
          <div
            v-if="e.media || $slots.media"
            data-slot="feature-grid-media"
            :class="cn('overflow-hidden rounded-lg border bg-muted', e.index % 2 === 1 && 'md:order-first')"
          >
            <slot name="media" :item="e.item" :index="e.index">
              <img :src="e.item.image" :alt="e.item.imageAlt ?? ''" loading="lazy" decoding="async" class="aspect-video size-full object-cover" />
            </slot>
          </div>
        </li>
      </template>
      <template v-else>
        <li v-for="e in entries" :key="e.key" data-slot="feature-grid-item" :class="cn('flex min-w-0', layout === 'bento' && bentoSpanClass(e.item.span, columns))">
          <ItemsChecked><FeatureCard v-bind="e.card" :variant="e.variant" :align="align" :size="size" :tone="tone" :shape="shape" :level="level" class="w-full" /></ItemsChecked>
        </li>
      </template>
    </slot>
  </component>
</template>
