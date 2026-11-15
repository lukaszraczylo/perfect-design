<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import { faXmark } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { requireText } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import type { ToastVariant } from '../../../stores/toast'
import Icon from '../../primitives/Icon/Icon.vue'
import { checkAfterMount } from '../requireContent'
import { toneIcons, type FeedbackTone } from '../tones'
import { pick } from '../pick'
import {
  TOAST_APPEARANCES,
  TOAST_LAYOUTS,
  toastIconVariants,
  toastProgressVariants,
  toastVariants,
  type ToastAppearance,
  type ToastLayout,
} from './variants'

export interface ToastItemProps extends BaseProps {
  title: string
  description?: string
  variant?: ToastVariant
  /** `default` (action under the text), `compact` (dense card, smaller type) or `inline` (action at the end of the row). */
  layout?: ToastLayout
  /** Surface: `default` (popover surface with a tone border), `soft` (tinted) or `solid` (filled with the tone colour and its foreground). */
  appearance?: ToastAppearance
  /** Optional action button rendered under the text (or at the end of the row with `layout="inline"`). */
  action?: { label: string; onClick: () => void }
  dismissLabel?: string
  /** Replace the default status icon of the variant. */
  icon?: IconDefinition
  /** Render without the leading icon. */
  hideIcon?: boolean
  /** Show a countdown bar along the bottom edge that drains over `duration`. Needs a finite `duration` > 0. */
  progress?: boolean
  /** Countdown length in ms for the progress bar. The component only visualises it; it never dismisses itself. */
  duration?: number
  /** Freeze the progress bar (e.g. while the pointer is over the toast stack). */
  paused?: boolean
  /** Make the toast its own live region (`alert` for warning/danger, `status` otherwise). `Toaster` turns this off and announces through one persistent region instead. */
  announce?: boolean
}

const props = withDefaults(defineProps<ToastItemProps>(), { variant: 'default', layout: 'default', appearance: 'default', dismissLabel: 'Dismiss notification', announce: true })
const emit = defineEmits<{
  /** Close button or action was used. */
  dismiss: []
  /** The action button was clicked (fires after `action.onClick`). */
  action: []
}>()

// Same rule as the toast store (`push` throws on a blank title); the dismiss button and the action are controls and need names.
checkAfterMount(() => {
  requireText('ToastItem', 'title', props.title, 'It is the visible message of the toast.')
  requireText('ToastItem', 'dismissLabel', props.dismissLabel, 'It is the accessible name of the dismiss (X) button.')
  if (props.action) requireText('ToastItem', 'action.label', props.action.label, 'It is the text of the action button.')
})

const VARIANTS: readonly ToastVariant[] = ['default', 'success', 'warning', 'danger', 'info']
const resolvedVariant = computed<ToastVariant>(() => (VARIANTS.includes(props.variant) ? props.variant : 'default'))
const urgent = computed(() => resolvedVariant.value === 'danger' || resolvedVariant.value === 'warning')
const resolvedIcon = computed(() => props.icon ?? toneIcons[(resolvedVariant.value === 'default' ? 'neutral' : resolvedVariant.value) as FeedbackTone])
const showBar = computed(() => !!props.progress && typeof props.duration === 'number' && Number.isFinite(props.duration) && props.duration > 0)

// Countdown: a Web Animation on the bar (pausable, reduced-motion aware, cancelled on unmount). Without
// Element.animate support the bar simply renders full.
const bar = ref<HTMLElement | null>(null)
let animation: Animation | undefined
function stopBar() {
  animation?.cancel()
  animation = undefined
}
function startBar() {
  stopBar()
  const el = bar.value
  if (!el || !showBar.value || typeof el.animate !== 'function') return
  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  animation = el.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: props.duration, easing: 'linear', fill: 'forwards' })
  if (props.paused) animation.pause()
}
onMounted(startBar)
watch(
  () => [showBar.value, props.duration],
  async () => {
    await nextTick()
    startBar()
  },
)
watch(
  () => props.paused,
  (paused) => {
    if (!animation) return
    if (paused) animation.pause()
    else if (animation.playState === 'paused') animation.play()
  },
)
onBeforeUnmount(stopBar)
const resolvedLayout = computed<ToastLayout>(() => pick(props.layout, TOAST_LAYOUTS, 'default'))
const resolvedAppearance = computed<ToastAppearance>(() => pick(props.appearance, TOAST_APPEARANCES, 'default'))
const classes = computed(() =>
  cn(toastVariants({ variant: resolvedVariant.value, layout: resolvedLayout.value, appearance: resolvedAppearance.value }), props.class),
)
const solid = computed(() => resolvedAppearance.value === 'solid')
const actionClasses = computed(() =>
  cn(
    'inline-flex h-7 w-fit shrink-0 items-center rounded-md border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground pointer-coarse:h-10',
    resolvedLayout.value === 'inline' ? 'whitespace-nowrap' : 'mt-1',
    focusRing,
  ),
)

function onAction() {
  try {
    props.action?.onClick()
  } finally {
    emit('action')
    emit('dismiss')
  }
}
</script>

<template>
  <div
    data-slot="toast"
    :data-variant="resolvedVariant"
    :data-layout="resolvedLayout === 'default' ? undefined : resolvedLayout"
    :data-appearance="resolvedAppearance === 'default' ? undefined : resolvedAppearance"
    :role="announce ? (urgent ? 'alert' : 'status') : undefined"
    :aria-atomic="announce ? 'true' : undefined"
    :class="classes"
  >
    <span v-if="!hideIcon" data-slot="toast-icon" :class="toastIconVariants({ variant: resolvedVariant, appearance: resolvedAppearance })"><Icon :icon="resolvedIcon" /></span>
    <div data-slot="toast-body" class="grid min-w-0 flex-1 gap-1">
      <div data-slot="toast-title" class="font-medium leading-snug break-words">{{ title }}</div>
      <div v-if="description" data-slot="toast-description" :class="cn('break-words', solid ? 'text-current' : 'text-muted-foreground')">{{ description }}</div>
      <button v-if="action && resolvedLayout !== 'inline'" type="button" data-slot="toast-action" :class="actionClasses" @click="onAction">
        {{ action.label }}
      </button>
    </div>
    <button v-if="action && resolvedLayout === 'inline'" type="button" data-slot="toast-action" :class="actionClasses" @click="onAction">
      {{ action.label }}
    </button>
    <button
      type="button"
      data-slot="toast-dismiss"
      :aria-label="dismissLabel"
      :class="cn('absolute end-2 top-2 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground pointer-coarse:size-10', solid && 'text-current hover:text-foreground', focusRing)"
      @click="emit('dismiss')"
    >
      <Icon :icon="faXmark" />
    </button>
    <div v-if="showBar" data-slot="toast-progress" aria-hidden="true" class="absolute inset-x-0 -bottom-px h-1 overflow-hidden rounded-b-lg bg-foreground/10 motion-reduce:hidden">
      <div ref="bar" data-slot="toast-progress-bar" :class="toastProgressVariants({ variant: resolvedVariant, appearance: resolvedAppearance })" />
    </div>
  </div>
</template>
