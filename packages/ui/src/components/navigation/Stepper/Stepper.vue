<script setup lang="ts">
import { computed, onMounted, ref, useSlots, watch } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import { faCheck, faXmark } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { requireText, violation } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import {
  STEPPER_SIZES,
  STEPPER_VARIANTS,
  stepperBarVariants,
  stepperConnectorVariants,
  stepperIndicatorVariants,
  stepperTextVariants,
  stepperTitleVariants,
  type StepperSize,
  type StepperVariant,
} from './variants'

export type StepStatus = 'complete' | 'current' | 'upcoming' | 'error'

export interface StepperStep {
  /** Stable key; falls back to the index. */
  id?: string | number
  title: string
  description?: string
  /** Explicit status. Unknown values are ignored and derived from the current index. */
  status?: StepStatus
  /** Replaces the step number while the step is current/upcoming. */
  icon?: IconDefinition
  /** Not clickable even when `clickable` is set. */
  disabled?: boolean
  /** Shows "Optional" under the title. */
  optional?: boolean
}

export interface StepperProps extends BaseProps {
  steps: StepperStep[]
  /** Index of the current step, 0-based (v-model:current). Clamped into range. */
  current?: number
  /** Initial index when uncontrolled. */
  defaultCurrent?: number
  orientation?: 'horizontal' | 'vertical'
  /**
   * `numbered` (default): a circle with the step number. `dots`: a smaller circle without numbers or custom icons (check and
   * cross still mark complete and error). `bar`: a progress segment per step. Unknown values fall back to `numbered`.
   */
  variant?: StepperVariant
  /** Marker and text size: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  size?: StepperSize
  /** Render steps as buttons that emit `update:current`. */
  clickable?: boolean
  /** Accessible name of the list. */
  label?: string
  /** Screen-reader text per status. */
  labels?: Partial<Record<StepStatus, string>> & { optional?: string }
}

const STATUSES: readonly StepStatus[] = ['complete', 'current', 'upcoming', 'error']
const DEFAULT_LABELS = { complete: 'Completed', current: 'Current step', upcoming: 'Upcoming', error: 'Error', optional: 'Optional' }

const props = withDefaults(defineProps<StepperProps>(), { current: undefined, defaultCurrent: 0, orientation: 'horizontal', variant: 'numbered', size: 'md', label: 'Progress' })
const emit = defineEmits<{ 'update:current': [index: number] }>()
defineSlots<{ step?: (p: { step: StepperStep; index: number; status: StepStatus }) => unknown }>()

const slots = useSlots()
onMounted(() => {
  const steps: unknown = props.steps
  if (!Array.isArray(steps) || steps.length === 0) {
    violation('Stepper', 'requires-steps', 'requires `steps` with at least one step `{ title }`. A stepper with no steps renders an empty list.')
    return
  }
  const bad = steps.findIndex((s) => !s || typeof s !== 'object')
  if (bad >= 0) violation('Stepper', 'requires-step-object', `requires every step to be an object \`{ title }\` (step ${bad + 1} is not).`)
  // A custom `step` slot draws its own content; the title is still what names the step elsewhere, so only the default rendering needs it.
  if (!slots.step) {
    const missing = steps.findIndex((s) => s && typeof s === 'object' && (typeof s.title !== 'string' || s.title.trim() === ''))
    if (missing >= 0) violation('Stepper', 'requires-title', `requires a non-empty \`title\` on every step (step ${missing + 1} has none). The title is the step's accessible name.`)
  }
  requireText('Stepper', 'label', props.label, 'It names the list, for example "Checkout progress".')
})

const list = computed(() => (Array.isArray(props.steps) ? props.steps.filter((s) => s && typeof s === 'object') : []))
const text = computed(() => ({ ...DEFAULT_LABELS, ...props.labels }))

const inner = ref<unknown>(props.current ?? props.defaultCurrent)
watch(
  () => props.current,
  (c) => {
    if (c !== undefined) inner.value = c
  },
)
const currentIndex = computed(() => {
  const n = list.value.length
  if (n === 0) return -1
  const v = typeof inner.value === 'number' && Number.isFinite(inner.value) ? Math.trunc(inner.value) : 0
  return Math.min(Math.max(v, 0), n - 1)
})

function statusOf(step: StepperStep, index: number): StepStatus {
  if (step.status && STATUSES.includes(step.status)) return step.status
  return index < currentIndex.value ? 'complete' : index === currentIndex.value ? 'current' : 'upcoming'
}

const variant = computed<StepperVariant>(() => (STEPPER_VARIANTS.includes(props.variant as StepperVariant) ? (props.variant as StepperVariant) : 'numbered'))
const size = computed<StepperSize>(() => (STEPPER_SIZES.includes(props.size as StepperSize) ? (props.size as StepperSize) : 'md'))
const orient = computed(() => (props.orientation === 'vertical' ? 'vertical' : 'horizontal'))
const indicatorSize = computed(() => cn(variant.value === 'bar' ? stepperBarVariants({ orientation: orient.value, size: size.value }) : stepperIndicatorVariants({ variant: variant.value, size: size.value })))
const markClass = computed(() => ({ sm: 'size-2.5', md: 'size-3', lg: 'size-3.5' })[size.value])
const barDefault = computed(() => variant.value === 'bar')

/** The bar variant fills a segment instead of drawing a circle with a border. */
const BAR: Record<StepStatus, string> = {
  complete: 'bg-primary',
  current: 'bg-primary',
  upcoming: 'bg-border',
  error: 'bg-destructive',
}

const INDICATOR: Record<StepStatus, string> = {
  complete: 'border-primary bg-primary text-primary-foreground',
  current: 'border-primary bg-background text-primary ring-3 ring-primary/20',
  upcoming: 'border-border bg-background text-muted-foreground',
  error: 'border-destructive bg-destructive text-destructive-foreground',
}

function canClick(step: StepperStep) {
  return props.clickable && !step.disabled
}
function select(step: StepperStep, index: number) {
  if (!canClick(step) || index === currentIndex.value) return
  if (props.current === undefined) inner.value = index
  emit('update:current', index)
}
</script>

<template>
  <ol
    data-slot="stepper"
    :aria-label="label"
    :data-orientation="orientation"
    :data-variant="variant"
    :data-size="size"
    :class="cn('flex w-full', orientation === 'vertical' ? 'flex-col' : 'items-start', barDefault && (orientation === 'vertical' ? 'gap-3' : 'gap-2'), props.class)"
  >
    <li
      v-for="(step, index) in list"
      :key="step.id ?? index"
      data-slot="stepper-step"
      :data-status="statusOf(step, index)"
      :data-orientation="orientation"
      :class="
        barDefault
          ? orientation === 'vertical' ? 'flex' : 'flex min-w-0 flex-1 items-start'
          : orientation === 'vertical' ? 'flex flex-col' : 'flex flex-1 items-start last:flex-none'
      "
    >
      <component
        :is="canClick(step) ? 'button' : 'div'"
        data-slot="stepper-trigger"
        :type="canClick(step) ? 'button' : undefined"
        :aria-current="statusOf(step, index) === 'current' ? 'step' : undefined"
        :class="
          cn(
            'flex items-start gap-3 rounded-md text-start',
            variant === 'dots' && 'gap-2',
            barDefault && (orientation === 'vertical' ? 'items-stretch' : 'w-full min-w-0 flex-col gap-2'),
            canClick(step) && ['cursor-pointer', focusRing],
          )
        "
        @click="select(step, index)"
      >
        <span
          data-slot="stepper-indicator"
          aria-hidden="true"
          :class="cn(indicatorSize, barDefault ? BAR[statusOf(step, index)] : INDICATOR[statusOf(step, index)])"
        >
          <template v-if="variant === 'numbered'">
            <Icon v-if="statusOf(step, index) === 'complete'" :icon="faCheck" />
            <Icon v-else-if="statusOf(step, index) === 'error'" :icon="faXmark" />
            <Icon v-else-if="step.icon" :icon="step.icon" />
            <template v-else>{{ index + 1 }}</template>
          </template>
          <template v-else-if="variant === 'dots'">
            <Icon v-if="statusOf(step, index) === 'complete'" :icon="faCheck" :class="markClass" />
            <Icon v-else-if="statusOf(step, index) === 'error'" :icon="faXmark" :class="markClass" />
          </template>
        </span>
        <span
          data-slot="stepper-text"
          :class="cn(stepperTextVariants({ variant, size }), orientation === 'horizontal' && statusOf(step, index) !== 'current' && 'max-sm:sr-only')"
        >
          <span class="sr-only">{{ text[statusOf(step, index)] }}: </span>
          <slot name="step" :step="step" :index="index" :status="statusOf(step, index)">
            <span :class="cn(stepperTitleVariants({ size }), statusOf(step, index) === 'upcoming' ? 'text-muted-foreground' : 'text-foreground', statusOf(step, index) === 'error' && 'text-destructive', barDefault && 'inline-flex items-center gap-1.5')">
              <template v-if="barDefault">
                <Icon v-if="statusOf(step, index) === 'complete'" :icon="faCheck" aria-hidden="true" class="size-3.5 text-primary" />
                <Icon v-else-if="statusOf(step, index) === 'error'" :icon="faXmark" aria-hidden="true" class="size-3.5" />
              </template>
              {{ step.title }}
            </span>
            <span v-if="step.optional" class="text-xs text-muted-foreground">{{ text.optional }}</span>
            <span v-if="step.description" class="text-xs text-muted-foreground">{{ step.description }}</span>
          </slot>
        </span>
      </component>
      <span
        v-if="index < list.length - 1 && !barDefault"
        data-slot="stepper-separator"
        aria-hidden="true"
        :data-complete="statusOf(step, index) === 'complete' ? '' : undefined"
        :class="cn(stepperConnectorVariants({ orientation: orient, variant, size }), statusOf(step, index) === 'complete' && 'bg-primary')"
      />
    </li>
  </ol>
</template>
