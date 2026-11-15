<script setup lang="ts">
import { computed, nextTick, onMounted, useSlots } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import BlogCard, { type BlogPost } from '../BlogCard/BlogCard.vue'
import {
  BLOG_APPEARANCES,
  BLOG_SHAPES,
  BLOG_SIZES,
  BLOG_VARIANTS,
  type BlogCardAppearance,
  type BlogCardShape,
  type BlogCardSize,
  type BlogCardVariant,
} from '../BlogCard/variants'
import { blogPostProblem } from '../BlogCard/contract'
import { checkItems, ItemsChecked } from '../shared/itemsContract'
import { pickColumns } from '../shared/motion'
import { oneOf } from '../shared/pick'
import { BLOG_GRID_GAPS, BLOG_GRID_LAYOUTS, blogGridVariants, type BlogGridColumns, type BlogGridGap, type BlogGridLayout } from './variants'

/** A post for the generated cards. `size`, `shape` and `appearance` on a post win over the grid's own values. */
export interface BlogGridItem extends BlogPost {
  size?: BlogCardSize
  shape?: BlogCardShape
  appearance?: BlogCardAppearance
}

export interface BlogGridProps extends BaseProps {
  /** Columns on large screens (1, 2, 3 or 4). Invalid values fall back to 3. Always 1 column on mobile, 2 from `sm`. */
  columns?: BlogGridColumns
  /** Card variant forwarded to every generated card. Unknown values fall back to `vertical`. */
  variant?: BlogCardVariant
  /** `grid`: equal cards. `featured`: the first post is a full-width `featured` card, the rest follow in the grid. Unknown values fall back to `grid`. */
  layout?: BlogGridLayout
  /** Space between cards: `sm`, `md` (the original) or `lg`. Unknown values fall back to `md`. */
  gap?: BlogGridGap
  /** Padding and title scale of the generated cards (`sm` | `md` | `lg`). Unknown values fall back to `md`. A custom default slot renders its own cards. */
  size?: BlogCardSize
  /** Corners of the generated cards (`rounded` | `square`). Unknown values fall back to `rounded`. */
  shape?: BlogCardShape
  /** Surface of the generated cards (`card` | `plain` | `filled`). Unknown values fall back to `card`. */
  appearance?: BlogCardAppearance
  /** Posts to render. For custom cards use the default slot instead. */
  items?: BlogGridItem[]
  /** Heading level used by the generated cards. */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  /** BCP 47 locale forwarded to the cards for date formatting. */
  locale?: string
}

const props = withDefaults(defineProps<BlogGridProps>(), { columns: 3, variant: 'vertical', layout: 'grid', gap: 'md', size: 'md', shape: 'rounded', appearance: 'card', items: () => [], level: 3, locale: 'en-US' })

const slots = useSlots()
onMounted(async () => {
  await nextTick()
  if (!slots.default) checkItems('BlogGrid', 'items', props.items, (post) => blogPostProblem(post))
})
const cols = computed(() => pickColumns(props.columns, [1, 2, 3, 4] as const, 3))
const variant = computed<BlogCardVariant>(() => (BLOG_VARIANTS.includes(props.variant) ? props.variant : 'vertical'))
const layout = computed<BlogGridLayout>(() => (BLOG_GRID_LAYOUTS.includes(props.layout) ? props.layout : 'grid'))
const gap = computed<BlogGridGap>(() => oneOf(props.gap, BLOG_GRID_GAPS, 'md'))
const size = computed<BlogCardSize>(() => oneOf(props.size, BLOG_SIZES, 'md'))
const shape = computed<BlogCardShape>(() => oneOf(props.shape, BLOG_SHAPES, 'rounded'))
const appearance = computed<BlogCardAppearance>(() => oneOf(props.appearance, BLOG_APPEARANCES, 'card'))
const posts = computed(() => (Array.isArray(props.items) ? props.items.filter(Boolean) : []))
/** Real list semantics only when the grid renders its own cards. */
const asList = computed(() => !slots.default && posts.value.length > 0)
const classes = computed(() => cn(blogGridVariants({ columns: cols.value, gap: gap.value }), props.class))

/** The post's own look wins over the grid's. */
function cardProps(post: BlogGridItem): BlogGridItem {
  return { ...post, size: post.size ?? size.value, shape: post.shape ?? shape.value, appearance: post.appearance ?? appearance.value }
}

function cardVariant(index: number): BlogCardVariant {
  return layout.value === 'featured' && index === 0 ? 'featured' : variant.value
}
</script>

<template>
  <component
    :is="asList ? 'ul' : 'div'"
    data-slot="blog-grid"
    :role="asList ? 'list' : undefined"
    :data-columns="cols"
    :data-layout="layout"
    :data-variant="variant"
    :data-gap="gap"
    :data-size="size"
    :data-shape="shape"
    :data-appearance="appearance"
    :class="classes"
  >
    <slot>
      <li
        v-for="(post, i) in posts"
        :key="`${i}-${post.title}`"
        data-slot="blog-grid-item"
        :class="layout === 'featured' && i === 0 ? 'col-span-full' : undefined"
      >
        <ItemsChecked><BlogCard v-bind="cardProps(post)" :variant="cardVariant(i)" :level="level" :locale="locale" class="h-full" /></ItemsChecked>
      </li>
      <div v-if="!posts.length && $slots.empty" data-slot="blog-grid-empty" class="col-span-full">
        <slot name="empty" />
      </div>
    </slot>
  </component>
</template>
