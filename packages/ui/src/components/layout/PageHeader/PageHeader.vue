<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { useScrollable } from '../../primitives/ScrollArea/scrollable'
import {
  pageHeaderBackgrounds,
  pageHeaderTitleVariants,
  pageHeaderVariantNames,
  pageHeaderVariants,
  type PageHeaderAlign,
  type PageHeaderBackground,
  type PageHeaderVariant,
} from './variants'

export interface PageHeaderProps extends BaseProps {
  /** Page title text. Use the `title` slot for rich content. */
  title?: string
  /** Supporting text under the title. Use the `description` slot for rich content. */
  description?: string
  /** Element used for the title. Keep `h1` unless the page already has one. */
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'p'
  /**
   * Layout preset. `default`: heading left, actions right. `centered`: everything centred. `compact`: tighter spacing and a
   * smaller title (dense pages, nested views). `hero`: banner with a `background`. Unknown values fall back to `default`.
   */
  variant?: PageHeaderVariant
  /** Centre the content for any variant (`variant="centered"` implies it). Unknown values fall back to `start`. */
  align?: PageHeaderAlign
  /** Hero only: `muted` (default), `primary` (flat primary colour) or `image` (needs `backgroundImage`; without it falls back to `muted`). Unknown values, including the removed `gradient`, fall back to `muted`. */
  background?: PageHeaderBackground
  /** Hero only: image URL drawn behind the content under a translucent overlay. Selects `background="image"` when `background` is not set. Decorative (empty alt). */
  backgroundImage?: string
  /** Renders a "back" link above the title pointing here. Use the `back` slot for a router link. Empty values render nothing. */
  backHref?: string
  /** Text of the back link. */
  backLabel?: string
  /** Accessible name of the `tabs` row while it overflows and scrolls horizontally (then it is a focusable region). */
  tabsLabel?: string
  /** Stick to the top of the scroll container with an opaque background and bottom border. */
  sticky?: boolean
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<PageHeaderProps>(), {
  titleAs: 'h1',
  variant: 'default',
  sticky: false,
  backLabel: 'Back',
  tabsLabel: 'Tabs',
  as: 'header',
})
const slots = useSlots()
const tabsEl = ref<HTMLElement | null>(null)
// The tabs row scrolls sideways on narrow screens: it is a Tab stop only while it actually overflows.
const tabsScrollable = useScrollable(tabsEl)

const hasTitle = computed(() => !!props.title || !!slots.title)
const hasDescription = computed(() => !!props.description || !!slots.description)

const variant = computed<PageHeaderVariant>(() => (pageHeaderVariantNames.includes(props.variant) ? props.variant : 'default'))
const isHero = computed(() => variant.value === 'hero')
const center = computed(() => variant.value === 'centered' || props.align === 'center')

const image = computed(() => (isHero.value && props.backgroundImage ? props.backgroundImage : undefined))
const background = computed<PageHeaderBackground | undefined>(() => {
  if (!isHero.value) return undefined
  const wanted = props.background && pageHeaderBackgrounds.includes(props.background) ? props.background : undefined
  if (wanted === 'image' || (!wanted && image.value)) return image.value ? 'image' : 'muted'
  return wanted ?? 'muted'
})
const onPrimary = computed(() => background.value === 'primary')

const classes = computed(() => cn(pageHeaderVariants({ sticky: props.sticky, variant: variant.value, background: background.value }), props.class))
const titleClasses = computed(() => cn(pageHeaderTitleVariants({ variant: variant.value })))
const muted = computed(() => (onPrimary.value ? 'text-primary-foreground' : 'text-muted-foreground'))
const rowClasses = computed(() =>
  center.value ? 'flex flex-col items-center gap-3' : 'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
)
const headingClasses = computed(() => cn('flex min-w-0 flex-col gap-1', center.value && 'items-center'))
const actionsClasses = computed(() => cn('flex shrink-0 flex-wrap items-center gap-2', center.value && 'justify-center'))
const backClasses = computed(() =>
  cn(
    'inline-flex w-fit items-center gap-1 rounded-sm text-sm transition-colors',
    onPrimary.value ? 'text-primary-foreground hover:underline' : 'text-muted-foreground hover:text-foreground',
    focusRing,
  ),
)
</script>

<template>
  <Primitive
    data-slot="page-header"
    :as="as"
    :data-sticky="sticky ? '' : undefined"
    :data-variant="variant === 'default' ? undefined : variant"
    :class="classes"
  >
    <template v-if="isHero">
      <img
        v-if="image"
        data-slot="page-header-background-image"
        :src="image"
        alt=""
        aria-hidden="true"
        class="absolute inset-0 -z-20 size-full object-cover"
      />
      <div v-if="image" data-slot="page-header-overlay" aria-hidden="true" class="absolute inset-0 -z-10 bg-background/70" />
      <div v-if="$slots.background" data-slot="page-header-background" class="absolute inset-0 -z-10">
        <slot name="background" />
      </div>
    </template>
    <div v-if="$slots.back" data-slot="page-header-back" :class="cn('flex', center && 'justify-center')">
      <slot name="back" />
    </div>
    <a v-else-if="backHref" data-slot="page-header-back" :href="backHref" :class="backClasses">
      <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="size-4">
        <path d="M10 3.5 5.5 8l4.5 4.5" />
      </svg>
      {{ backLabel }}
    </a>
    <div v-if="$slots.breadcrumb" data-slot="page-header-breadcrumb" :class="cn('text-sm', muted)">
      <slot name="breadcrumb" />
    </div>
    <div :class="rowClasses">
      <div data-slot="page-header-heading" :class="headingClasses">
        <component :is="titleAs" v-if="hasTitle" data-slot="page-header-title" :class="titleClasses">
          <slot name="title">{{ title }}</slot>
        </component>
        <div v-if="hasDescription" data-slot="page-header-description" :class="cn('text-sm', muted, center && 'max-w-2xl text-balance')">
          <slot name="description">{{ description }}</slot>
        </div>
      </div>
      <div v-if="$slots.actions" data-slot="page-header-actions" :class="actionsClasses">
        <slot name="actions" />
      </div>
    </div>
    <div
      v-if="$slots.tabs"
      ref="tabsEl"
      data-slot="page-header-tabs"
      :tabindex="tabsScrollable ? 0 : undefined"
      :role="tabsScrollable ? 'region' : undefined"
      :aria-label="tabsScrollable ? tabsLabel : undefined"
      :class="cn('min-w-0 overflow-x-auto', focusRing, center && 'self-stretch')"
    >
      <slot name="tabs" />
    </div>
  </Primitive>
</template>
