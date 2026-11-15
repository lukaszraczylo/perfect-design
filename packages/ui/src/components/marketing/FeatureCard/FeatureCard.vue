<script setup lang="ts">
import { computed, nextTick, onMounted, useSlots } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import { faArrowUpRightFromSquare } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import { isBlank, parentChecksItems } from '../shared/itemsContract'
import { linkAttrs } from '../shared/motion'
import {
  featureCardBodyVariants,
  featureCardDescriptionVariants,
  featureCardIconSize,
  featureCardIconVariants,
  featureCardLinkVariants,
  featureCardTitleVariants,
  featureCardVariants,
  resolveFeatureCardAlign,
  resolveFeatureCardShape,
  resolveFeatureCardSize,
  resolveFeatureCardTone,
  resolveFeatureCardVariant,
  type FeatureCardAlign,
  type FeatureCardShape,
  type FeatureCardSize,
  type FeatureCardTone,
  type FeatureCardVariant,
} from './variants'

export interface FeatureCardProps extends BaseProps {
  icon?: IconDefinition
  /** Required (non-empty) unless the `title` slot is used: it is the card heading and names the link. */
  title?: string
  description?: string
  /** When set, a link is rendered at the bottom of the card. */
  href?: string
  /** Link text. Defaults to `Read about <title>` (or `Read more` without a title). Say what happens. */
  linkLabel?: string
  /** Open the link in a new tab with rel=noopener noreferrer. */
  external?: boolean
  /** Heading level of the title (1-6). Invalid values fall back to 3. */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  /** Visual style. Unknown values fall back to `card`. */
  variant?: FeatureCardVariant
  /** Text/content alignment. Unknown values fall back to `left`. */
  align?: FeatureCardAlign
  /** Padding and type scale: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  size?: FeatureCardSize
  /** Surface: `default` (the variant's own), `muted`, `primary` or `inverted`. Unboxed variants gain a padded box when a tone is set. Unknown values fall back to `default`. */
  tone?: FeatureCardTone
  /** Corners: `rounded` (default) or `square`. Unknown values fall back to `rounded`. */
  shape?: FeatureCardShape
}

const props = withDefaults(defineProps<FeatureCardProps>(), { linkLabel: undefined, level: 3, variant: 'card', align: 'left', size: 'md', tone: 'default', shape: 'rounded' })

const slots = useSlots()
const quiet = parentChecksItems()
onMounted(async () => {
  await nextTick()
  if (!quiet && isBlank(props.title) && !slots.title) {
    violation('FeatureCard', 'requires-title', 'requires a non-empty `title` (or the `title` slot). The title is the card heading and the default link name.')
  }
})

const tag = computed(() => (Number.isInteger(props.level) && props.level >= 1 && props.level <= 6 ? `h${props.level}` : 'h3'))
const variant = computed(() => resolveFeatureCardVariant(props.variant))
const align = computed(() => resolveFeatureCardAlign(props.align))
const size = computed(() => resolveFeatureCardSize(props.size))
const tone = computed(() => resolveFeatureCardTone(props.tone))
const shape = computed(() => resolveFeatureCardShape(props.shape))
const classes = computed(() => cn(featureCardVariants({ variant: variant.value, align: align.value, size: size.value, tone: tone.value, shape: shape.value }), props.class))
const titleClasses = computed(() => featureCardTitleVariants({ size: size.value }))
const descriptionClasses = computed(() => featureCardDescriptionVariants({ size: size.value, tone: tone.value }))
const linkClasses = computed(() =>
  cn('mt-auto inline-flex min-h-6 w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline pointer-coarse:min-h-11', featureCardLinkVariants({ tone: tone.value }), focusRing),
)
const linkText = computed(() => props.linkLabel || (props.title ? `Read about ${props.title}` : 'Read more'))
const iconClasses = computed(() => featureCardIconVariants({ variant: variant.value, tone: tone.value, shape: shape.value }))
const bodyClasses = computed(() => featureCardBodyVariants({ variant: variant.value, align: align.value }))
</script>

<template>
  <div data-slot="feature-card" :data-variant="variant" :data-align="align" :data-size="size" :data-tone="tone" :data-shape="shape" :class="classes">
    <div v-if="icon || $slots.icon" data-slot="feature-card-icon" :class="iconClasses">
      <slot name="icon"><Icon v-if="icon" :icon="icon" :size="featureCardIconSize[variant]" /></slot>
    </div>
    <div v-if="title || $slots.title || description || $slots.default || href" data-slot="feature-card-body" :class="bodyClasses">
      <component :is="tag" v-if="title || $slots.title" data-slot="feature-card-title" :class="titleClasses">
        <slot name="title">{{ title }}</slot>
      </component>
      <p v-if="description || $slots.default" data-slot="feature-card-description" :class="descriptionClasses">
        <slot>{{ description }}</slot>
      </p>
      <a
        v-if="href"
        data-slot="feature-card-link"
        :href="href"
        v-bind="linkAttrs(external)"
        :class="linkClasses"
      >
        {{ linkText }}
        <Icon v-if="external" :icon="faArrowUpRightFromSquare" size="sm" />
        <span v-if="external" class="sr-only">(opens in a new tab)</span>
      </a>
    </div>
  </div>
</template>
