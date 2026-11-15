<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, useSlots } from 'vue'
import { violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { pickColumns } from '../shared/motion'
import { oneOf } from '../shared/pick'
import {
  NUMBERED_STEPS_ALIGNS,
  NUMBERED_STEPS_SHAPES,
  NUMBERED_STEPS_SIZES,
  NUMBERED_STEPS_TONES,
  NUMBERED_STEPS_VARIANTS,
  numberedStepsContentVariants,
  numberedStepsDescriptionVariants,
  numberedStepsItemVariants,
  numberedStepsNumberVariants,
  numberedStepsTitleVariants,
  numberedStepsVariants,
  type NumberedStepsAlign,
  type NumberedStepsColumns,
  type NumberedStepsShape,
  type NumberedStepsSize,
  type NumberedStepsTone,
  type NumberedStepsVariant,
} from './variants'

export interface Step {
  title: string
  description?: string
  /** Image URL shown beside the step (`with-media` variant only). */
  media?: string
  /** Alt text of `media`; empty (decorative) when omitted. */
  mediaAlt?: string
}

export interface NumberedStepsProps extends BaseProps {
  steps?: Step[]
  /** Layout: `default`, `cards`, `timeline`, `horizontal`, `minimal`, `with-media`. Unknown values fall back to `default`. */
  variant?: NumberedStepsVariant
  /** Spacing and type scale of the steps and the marker: `sm`, `md` (the original) or `lg`. Unknown values fall back to `md`. */
  size?: NumberedStepsSize
  /** Colour of the number marker: `primary` (the original), `neutral`, `success` or `info`. Unknown values fall back to `primary`. */
  tone?: NumberedStepsTone
  /** Shape of the marker: `circle` (the original), `rounded` or `square`. The bare number of `minimal` has no box. Unknown values fall back to `circle`. */
  shape?: NumberedStepsShape
  /** Marker position against the text: `start` (the original) or `center`. Ignored by `timeline` and `horizontal`, whose connector lines start at the marker. Unknown values fall back to `start`. */
  align?: NumberedStepsAlign
  /** Columns on large screens (1-4) for `default`, `cards` and `minimal`. Invalid values fall back to 3. */
  columns?: NumberedStepsColumns
  /** Pad numbers to two digits (01, 02...). Numbers are kept because the steps are an ordered sequence. */
  pad?: boolean
  /** Heading level of each step title (1-6). Invalid values fall back to 3. */
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

const props = withDefaults(defineProps<NumberedStepsProps>(), { steps: () => [], variant: 'default', size: 'md', tone: 'primary', shape: 'circle', align: 'start', columns: 3, pad: false, level: 3 })

const slots = useSlots()

defineSlots<{
  /** Replace a whole step's content (number, text and media). */
  step?: (p: { step: Step; index: number; number: string }) => unknown
  /** Custom media for the `with-media` variant; replaces `step.media`. */
  media?: (p: { step: Step; index: number }) => unknown
}>()

// Reports the first step without a title once. The `step` slot replaces the whole step, so it takes over the title too.
onMounted(async () => {
  await nextTick()
  if (slots.step) return
  const i = props.steps.findIndex((s) => !s || typeof s.title !== 'string' || s.title.trim() === '')
  if (i !== -1) violation('NumberedSteps', 'requires-step-title', `requires a non-empty \`title\` on every step (steps[${i}] has none). The title is the step's heading.`)
})

const variant = computed<NumberedStepsVariant>(() => (NUMBERED_STEPS_VARIANTS.includes(props.variant) ? props.variant : 'default'))
const size = computed<NumberedStepsSize>(() => oneOf(props.size, NUMBERED_STEPS_SIZES, 'md'))
const tone = computed<NumberedStepsTone>(() => oneOf(props.tone, NUMBERED_STEPS_TONES, 'primary'))
const shape = computed<NumberedStepsShape>(() => oneOf(props.shape, NUMBERED_STEPS_SHAPES, 'circle'))
const align = computed<NumberedStepsAlign>(() => oneOf(props.align, NUMBERED_STEPS_ALIGNS, 'start'))
/** Timeline and horizontal draw their connector from the marker position, so they always start-align. */
const effectiveAlign = computed<NumberedStepsAlign>(() => (['timeline', 'horizontal'].includes(variant.value) ? 'start' : align.value))
const cols = computed(() => pickColumns(props.columns, [1, 2, 3, 4] as const, 3))
/** Only these variants honour `columns`; the others are single-column (or flow horizontally). */
const effectiveCols = computed<NumberedStepsColumns>(() => (['default', 'cards', 'minimal'].includes(variant.value) ? cols.value : 1))
const tag = computed(() => (Number.isInteger(props.level) && props.level >= 1 && props.level <= 6 ? `h${props.level}` : 'h3'))
const label = (i: number) => (props.pad ? String(i + 1).padStart(2, '0') : String(i + 1))
const classes = computed(() => cn(numberedStepsVariants({ columns: effectiveCols.value, variant: variant.value }), props.class))
const itemClass = (step: Step) => {
  const withMedia = variant.value === 'with-media'
  return cn(numberedStepsItemVariants({ variant: variant.value, size: size.value }), withMedia && !hasMedia(step) && 'md:grid-cols-1')
}
const contentClass = computed(() => numberedStepsContentVariants({ variant: variant.value, size: size.value, align: effectiveAlign.value }))
const numberClass = computed(() => numberedStepsNumberVariants({ variant: variant.value, size: size.value, tone: tone.value, shape: shape.value }))
const titleClass = computed(() => numberedStepsTitleVariants({ size: size.value }))
const descriptionClass = computed(() => numberedStepsDescriptionVariants({ size: size.value }))

const failed = reactive(new Set<number>())
const hasMedia = (step: Step) => !!step?.media
</script>

<template>
  <ol data-slot="numbered-steps" :data-variant="variant" :data-columns="cols" :data-size="size" :data-tone="tone" :data-shape="shape" :data-align="effectiveAlign" :class="classes">
    <li v-for="(step, i) in steps" :key="i" data-slot="numbered-steps-item" :class="itemClass(step)">
      <slot name="step" :step="step" :index="i" :number="label(i)">
        <div data-slot="numbered-steps-content" :class="contentClass">
          <span data-slot="numbered-steps-number" aria-hidden="true" :class="numberClass">{{ label(i) }}</span>
          <div class="min-w-0">
            <component :is="tag" data-slot="numbered-steps-title" :class="titleClass"><span class="sr-only">{{ i + 1 }}. </span>{{ step.title }}</component>
            <p v-if="step.description" data-slot="numbered-steps-description" :class="descriptionClass">{{ step.description }}</p>
          </div>
        </div>
        <figure
          v-if="variant === 'with-media' && ($slots.media || (hasMedia(step) && !failed.has(i)))"
          data-slot="numbered-steps-media"
          :class="cn('m-0 min-w-0 overflow-hidden rounded-lg border bg-muted', i % 2 === 1 && 'md:order-first')"
        >
          <slot name="media" :step="step" :index="i">
            <img :src="step.media" :alt="step.mediaAlt ?? ''" loading="lazy" decoding="async" class="block h-auto w-full object-cover" @error="failed.add(i)" />
          </slot>
        </figure>
      </slot>
    </li>
  </ol>
</template>
