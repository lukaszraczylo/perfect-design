<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue'
import { cn } from '../../../lib/cn'
import { accessibleName, violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import Button from '../../primitives/Button/Button.vue'
import { computeTourPosition, isTourPlacement, resolveTourTarget, type TourPlacement, type TourPosition, type TourRect } from './position'
import { tourCardVariants, tourSizes, tourVariantNames, type TourSize, type TourVariant } from './variants'

export interface TourStep {
  /** Element to highlight: CSS selector, element, or getter. Missing/invalid/hidden targets show a centred card without highlight. `null` marks a step that is centred on purpose; leaving it out is a contract error. */
  target: string | HTMLElement | (() => HTMLElement | null) | null
  title: string
  description?: string
  /** Preferred side of the target for the card. Flips when it does not fit. Overrides the `placement` prop. */
  placement?: TourPlacement
}

export interface TourProps extends BaseProps {
  /** Ordered steps. Empty list renders nothing. */
  steps?: TourStep[]
  /** Whether the tour is showing (v-model:open). Uncontrolled when omitted. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Current step index (v-model:step). Uncontrolled when omitted. Clamped into range. */
  step?: number
  /** Initial step index when uncontrolled. */
  defaultStep?: number
  /** Default card placement relative to the target. */
  placement?: TourPlacement
  /** Card width: `sm`, `md` (default), `lg`. */
  size?: TourSize
  /** Card look: `default`, `compact` (tighter) or `dots` (one dot per step instead of the progress text). */
  variant?: TourVariant
  /** Gap in px between spotlight and card. */
  offset?: number
  /** Extra px of spotlight around the target. */
  padding?: number
  /** Show the "2 / 5" progress text. */
  showProgress?: boolean
  /** Show the skip button (hidden on the last step, where Finish closes the tour). */
  showSkip?: boolean
  /** Esc skips the tour. */
  closeOnEscape?: boolean
  /** Clicking the dimmed backdrop skips the tour. */
  closeOnOverlayClick?: boolean
  /** Scroll each target into view when its step is shown. */
  scrollIntoView?: boolean
  /** Teleport the overlay to `body`. Set false to render in place. */
  teleport?: boolean
  nextLabel?: string
  prevLabel?: string
  skipLabel?: string
  finishLabel?: string
  /** Builds the progress text from the 1-based current step and total. */
  progressFormat?: (current: number, total: number) => string
  /** Extra classes for the popover card (the `class` prop targets the overlay root). */
  cardClass?: BaseProps['class']
}

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<TourProps>(), {
  steps: () => [],
  open: undefined,
  defaultOpen: false,
  step: undefined,
  defaultStep: 0,
  placement: 'bottom',
  size: 'md',
  variant: 'default',
  offset: 12,
  padding: 6,
  showProgress: true,
  showSkip: true,
  closeOnEscape: true,
  closeOnOverlayClick: false,
  scrollIntoView: true,
  teleport: true,
  nextLabel: 'Next',
  prevLabel: 'Back',
  skipLabel: 'Skip',
  finishLabel: 'Finish',
  progressFormat: (current: number, total: number) => `${current} / ${total}`,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:step': [value: number]
  next: [index: number]
  prev: [index: number]
  skip: [index: number]
  finish: []
}>()

const slots = useSlots()
const uid = useId()
const titleId = `${uid}-title`
const descId = `${uid}-desc`
const progressId = `${uid}-progress`

const innerOpen = ref(props.defaultOpen)
const innerStep = ref(props.defaultStep)
const isOpen = computed(() => (props.open !== undefined ? !!props.open : innerOpen.value))
const list = computed(() => (Array.isArray(props.steps) ? props.steps.filter((s) => s && typeof s === 'object') : []))
const total = computed(() => list.value.length)
const index = computed(() => {
  const raw = Math.trunc(Number(props.step !== undefined ? props.step : innerStep.value))
  return Number.isFinite(raw) ? Math.min(Math.max(raw, 0), Math.max(total.value - 1, 0)) : 0
})
const visible = computed(() => isOpen.value && total.value > 0)
const current = computed<TourStep>(() => list.value[index.value] ?? { title: '' })
const isFirst = computed(() => index.value === 0)
const isLast = computed(() => index.value >= total.value - 1)
const progressText = computed(() => props.progressFormat(index.value + 1, total.value))
const hasDescription = computed(() => !!current.value.description)
const describedBy = computed(() => [hasDescription.value || slots.description ? descId : '', props.showProgress ? progressId : ''].filter(Boolean).join(' ') || undefined)
const sizeKey = computed<TourSize>(() => (tourSizes.includes(props.size) ? props.size : 'md'))
const variantKey = computed<TourVariant>(() => (tourVariantNames.includes(props.variant) ? props.variant : 'default'))
const slotProps = computed(() => ({ step: current.value, index: index.value, total: total.value }))

function setOpen(value: boolean) {
  innerOpen.value = value
  emit('update:open', value)
}
function setStep(value: number) {
  innerStep.value = value
  emit('update:step', value)
}

function next() {
  if (!visible.value) return
  if (isLast.value) return finish()
  const to = index.value + 1
  setStep(to)
  emit('next', to)
}
function prev() {
  if (!visible.value || isFirst.value) return
  const to = index.value - 1
  setStep(to)
  emit('prev', to)
}
function skip() {
  if (!visible.value) return
  const at = index.value
  setOpen(false)
  setStep(0)
  emit('skip', at)
}
function finish() {
  if (!visible.value) return
  setOpen(false)
  setStep(0)
  emit('finish')
}
/** Open the tour, optionally at a given step. */
function start(at = 0) {
  setStep(at)
  setOpen(true)
}

const cardRef = ref<HTMLElement | null>(null)
/** Four opaque scrim panels around the spotlight (a hole in the scrim without a shadow trick). */
const scrimBoxes = computed(() => {
  const s = spotlight.value
  if (!s) return []
  const top = Math.max(0, s.top)
  const left = Math.max(0, s.left)
  const bottom = Math.max(top, s.top + s.height)
  const right = Math.max(left, s.left + s.width)
  const px = (n: number) => `${n}px`
  return [
    { top: '0', left: '0', right: '0', height: px(top) },
    { top: px(bottom), left: '0', right: '0', bottom: '0' },
    { top: px(top), left: '0', width: px(left), height: px(bottom - top) },
    { top: px(top), left: px(right), right: '0', height: px(bottom - top) },
  ]
})
const spotlight = ref<TourRect | null>(null)
const position = ref<TourPosition>({ top: 0, left: 0, placement: 'center' })
let previousFocus: HTMLElement | null = null
let listening = false

function reducedMotion() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function measure() {
  if (typeof window === 'undefined' || !visible.value) return
  const el = resolveTourTarget(current.value.target)
  const r = el ? el.getBoundingClientRect() : null
  const pad = Number.isFinite(props.padding) ? props.padding : 0
  spotlight.value =
    r && (r.width > 0 || r.height > 0)
      ? { top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 }
      : null
  const card = cardRef.value?.getBoundingClientRect()
  position.value = computeTourPosition(
    spotlight.value,
    { width: card?.width ?? 0, height: card?.height ?? 0 },
    { width: window.innerWidth, height: window.innerHeight },
    isTourPlacement(current.value.placement) ? current.value.placement : props.placement,
    Number.isFinite(props.offset) ? props.offset : 12,
  )
}

function focusCard() {
  cardRef.value?.focus({ preventScroll: true })
}

async function showStep(refocus: boolean) {
  const el = resolveTourTarget(current.value.target)
  if (el && props.scrollIntoView && typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' })
  }
  await nextTick()
  measure()
  if (refocus) focusCard()
}

const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

function onKeydown(e: KeyboardEvent) {
  if (!visible.value || e.defaultPrevented) return
  if (e.key === 'Escape') {
    if (!props.closeOnEscape) return
    e.preventDefault()
    skip()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    next()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prev()
  } else if (e.key === 'Tab' && cardRef.value) {
    const items = Array.from(cardRef.value.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (!items.length) return e.preventDefault()
    const active = document.activeElement
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && (active === first || active === cardRef.value)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    } else if (!cardRef.value.contains(active)) {
      e.preventDefault()
      first.focus()
    }
  }
}

function listen(on: boolean) {
  if (typeof window === 'undefined' || listening === on) return
  listening = on
  const method = on ? 'addEventListener' : 'removeEventListener'
  window[method]('resize', measure)
  window[method]('scroll', measure, { capture: true, passive: true })
  document[method]('keydown', onKeydown as EventListener)
}

function onOpen() {
  previousFocus = typeof document !== 'undefined' && document.activeElement instanceof HTMLElement ? document.activeElement : null
  listen(true)
  void showStep(true)
}
function onClose() {
  listen(false)
  const el = previousFocus
  previousFocus = null
  if (el && el.isConnected) el.focus({ preventScroll: true })
}

// Contract: every step has a title and says where it points (`target`, or `target: null` for a deliberately centred card),
// and the card ends up with an accessible name. Checked each time the tour opens (async: Vue routes the error to its handler).
async function checkContract() {
  list.value.forEach((step, i) => {
    if (!step.title?.trim() && !slots.title) {
      violation('Tour', 'requires-step-title', `step ${i + 1} requires a non-empty \`title\` (it is the accessible name of the tour dialog), or a \`title\` slot.`)
    }
    if (step.target === undefined) {
      violation('Tour', 'requires-step-target', `step ${i + 1} requires a \`target\` (selector, element or getter), or \`target: null\` for a step that is meant to be centred.`)
    }
  })
  await nextTick()
  if (cardRef.value && !accessibleName(cardRef.value)) {
    violation('Tour', 'requires-accessible-name', 'needs an accessible name for the tour dialog. Give the current step a `title`.')
  }
}

watch(visible, (v) => (v ? onOpen() : onClose()), { flush: 'post' })
watch(visible, (v) => (v ? checkContract() : undefined), { flush: 'post' })
watch([index, () => current.value.target], () => visible.value && void showStep(true), { flush: 'post' })
watch(
  () => [props.placement, props.padding, props.offset, sizeKey.value, variantKey.value, current.value.placement],
  () => visible.value && void nextTick(measure),
  { flush: 'post' },
)
onMounted(() => {
  if (!visible.value) return
  onOpen()
  return checkContract()
})
onBeforeUnmount(() => {
  listen(false)
  if (visible.value) onClose()
})

function onBackdropClick() {
  if (props.closeOnOverlayClick) skip()
}

defineExpose({ start, next, prev, skip, finish })
</script>

<template>
  <Teleport to="body" :disabled="!teleport">
    <div v-if="visible" v-bind="$attrs" data-slot="tour" :class="cn('fixed inset-0 z-(--z-overlay)', props.class)">
      <div data-slot="tour-backdrop" aria-hidden="true" :class="cn('fixed inset-0', !spotlight && 'bg-scrim')" @click="onBackdropClick">
        <template v-if="spotlight">
          <div v-for="(box, i) in scrimBoxes" :key="i" data-slot="tour-scrim" class="absolute bg-scrim" :style="box" />
        </template>
      </div>
      <div
        v-if="spotlight"
        data-slot="tour-spotlight"
        aria-hidden="true"
        class="pointer-events-none fixed rounded-md ring-2 ring-ring motion-safe:transition-[top,left,width,height] motion-safe:duration-200 forced-colors:outline-2 forced-colors:outline-solid"
        :style="{ top: `${spotlight.top}px`, left: `${spotlight.left}px`, width: `${spotlight.width}px`, height: `${spotlight.height}px` }"
      />
      <div
        ref="cardRef"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        data-slot="tour-card"
        :data-placement="position.placement"
        :data-step="index"
        :data-variant="variantKey === 'default' ? undefined : variantKey"
        :aria-labelledby="titleId"
        :aria-describedby="describedBy"
        :class="cn(tourCardVariants({ size: sizeKey, variant: variantKey }), cardClass)"
        :style="{ top: `${position.top}px`, left: `${position.left}px` }"
      >
        <h2 :id="titleId" data-slot="tour-title" class="text-sm leading-snug font-semibold">
          <slot name="title" v-bind="slotProps">{{ current.title }}</slot>
        </h2>
        <p v-if="hasDescription || $slots.description" :id="descId" data-slot="tour-description" class="text-sm text-muted-foreground">
          <slot name="description" v-bind="slotProps">{{ current.description }}</slot>
        </p>
        <div data-slot="tour-footer" class="flex flex-wrap items-center justify-between gap-2">
          <span v-if="showProgress" :id="progressId" data-slot="tour-progress" class="text-xs text-muted-foreground tabular-nums">
            <template v-if="variantKey === 'dots'">
              <span class="sr-only">{{ progressText }}</span>
              <span aria-hidden="true" class="flex items-center gap-1.5">
                <span
                  v-for="n in total"
                  :key="n"
                  data-slot="tour-dot"
                  :data-active="n - 1 === index ? '' : undefined"
                  :class="n - 1 === index ? 'size-2 rounded-full border border-primary bg-primary forced-colors:border-[Highlight] forced-colors:bg-[Highlight]' : 'size-2 rounded-full border border-muted-foreground'"
                />
              </span>
            </template>
            <template v-else>{{ progressText }}</template>
          </span>
          <div class="ms-auto flex items-center gap-2">
            <Button v-if="showSkip && !isLast" data-slot="tour-skip" variant="ghost" size="sm" @click="skip">{{ skipLabel }}</Button>
            <Button v-if="!isFirst" data-slot="tour-prev" variant="outline" size="sm" @click="prev">{{ prevLabel }}</Button>
            <Button data-slot="tour-next" size="sm" @click="next">{{ isLast ? finishLabel : nextLabel }}</Button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
