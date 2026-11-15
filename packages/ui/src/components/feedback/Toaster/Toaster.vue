<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { cn } from '../../../lib/cn'
import { requireText } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { useToastStore, type Toast } from '../../../stores/toast'
import { checkAfterMount } from '../requireContent'
import { pick } from '../pick'
import ToastItem from '../ToastItem/ToastItem.vue'
import { TOAST_APPEARANCES, TOAST_LAYOUTS, type ToastAppearance, type ToastLayout } from '../ToastItem/variants'
import { TOASTER_POSITION_CLASSES as POSITIONS, type ToasterPosition } from './positions'

export type { ToasterPosition }

export interface ToasterProps extends BaseProps {
  position?: ToasterPosition
  /** Keep toasts on screen while the pointer is over or focus is inside the stack. */
  pauseOnHover?: boolean
  /** Accessible name of the notifications region. */
  label?: string
  /** Show a countdown bar on every toast that has a finite duration. It freezes while the stack is held. */
  showProgress?: boolean
  /** Render toasts without their leading status icon. */
  hideIcons?: boolean
  /** Card layout of every toast: `default`, `compact` (dense) or `inline` (action at the end of the row). */
  layout?: ToastLayout
  /** Surface of every toast: `default` (popover with a tone border), `soft` (tinted) or `solid` (filled). */
  appearance?: ToastAppearance
}

/** How long toasts that expired while hovered stay visible after the pointer leaves. */
const RELEASE_DELAY_MS = 1000

const props = withDefaults(defineProps<ToasterProps>(), { position: 'bottom-right', pauseOnHover: true, label: 'Notifications', showProgress: false, hideIcons: false, layout: 'default', appearance: 'default' })

// The region is a landmark: blank would leave it unnamed. Toast titles are enforced by the store (`push` throws) and ToastItem.
checkAfterMount(() => requireText('Toaster', 'label', props.label, 'It is the accessible name of the notifications region.'))

const store = useToastStore()
// The store owns the dismissal timers and cannot pause them. While hovered we keep a snapshot of the
// visible toasts so ones that expire under the pointer stay put until it has left for RELEASE_DELAY_MS.
const held = ref<Toast[]>([])
/** True while the pointer / focus is inside the stack: freezes the progress bars. */
const hovering = ref(false)
let releaseTimer: ReturnType<typeof setTimeout> | undefined

const resolvedPosition = computed<ToasterPosition>(() => (Object.hasOwn(POSITIONS, props.position) ? props.position : 'bottom-right'))
const resolvedLayout = computed<ToastLayout>(() => pick(props.layout, TOAST_LAYOUTS, 'default'))
const resolvedAppearance = computed<ToastAppearance>(() => pick(props.appearance, TOAST_APPEARANCES, 'default'))
const current = computed<Toast[]>(() => {
  if (!held.value.length) return store.toasts
  const heldIds = new Set(held.value.map((t) => t.id))
  return [...held.value, ...store.toasts.filter((t) => !heldIds.has(t.id))]
})
// DOM order == visual order: newest nearest the screen edge the stack is anchored to.
const displayed = computed(() => (resolvedPosition.value.startsWith('top') ? [...current.value].reverse() : current.value))

function pause() {
  if (!props.pauseOnHover) return
  clearTimeout(releaseTimer)
  releaseTimer = undefined
  hovering.value = true
  held.value = [...current.value]
}
function resume() {
  hovering.value = false
  if (!props.pauseOnHover || !held.value.length) return
  clearTimeout(releaseTimer)
  releaseTimer = setTimeout(() => {
    held.value = []
    releaseTimer = undefined
  }, RELEASE_DELAY_MS)
}
function onFocusOut(e: FocusEvent) {
  const root = e.currentTarget as HTMLElement
  if (e.relatedTarget instanceof Node && root.contains(e.relatedTarget)) return
  resume()
}
const region = ref<HTMLElement | null>(null)
/** Element that had focus before focus entered the stack, so it can get focus back. */
let outsideFocus: HTMLElement | null = null
function onFocusIn(e: FocusEvent) {
  const root = e.currentTarget as HTMLElement
  if (e.relatedTarget instanceof HTMLElement && !root.contains(e.relatedTarget)) outsideFocus = e.relatedTarget
  pause()
}
async function dismiss(id: string) {
  const items = region.value ? Array.from(region.value.querySelectorAll<HTMLElement>('[data-slot="toast"]')) : []
  const at = items.findIndex((el) => el.contains(document.activeElement))
  held.value = held.value.filter((t) => t.id !== id)
  store.dismiss(id)
  if (at < 0) return
  // The dismissed toast had focus: move it to the next remaining toast, else back to where it was.
  await nextTick()
  const rest = Array.from(region.value?.querySelectorAll<HTMLElement>('[data-slot="toast"]') ?? [])
  const next = rest[Math.min(at, rest.length - 1)]?.querySelector<HTMLElement>('button')
  if (next) next.focus()
  else if (outsideFocus?.isConnected) outsideFocus.focus()
}

/** Escape on a focused toast dismisses that toast (and moves focus on, like the close button). */
function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || e.defaultPrevented || !region.value) return
  const items = Array.from(region.value.querySelectorAll<HTMLElement>('[data-slot="toast"]'))
  const at = items.findIndex((el) => el.contains(document.activeElement))
  const target = at < 0 ? undefined : displayed.value[at]
  if (!target) return
  e.preventDefault()
  void dismiss(target.id)
}

// Announcements go through two persistent, visually hidden live regions inside the (named) region, so
// screen readers reliably speak new toasts once. Warning and danger use the assertive one. Only the
// visible text is announced, plus "Actions available" when the toast has an action button.
const politeText = ref('')
const assertiveText = ref('')
const seen = new Set<string>(store.toasts.map((t) => t.id))
function announceText(t: Toast) {
  return [t.title, t.description].filter(Boolean).join('. ') + (t.action ? '. Actions available' : '')
}
watch(
  () => store.toasts.map((t) => t.id),
  async () => {
    const fresh = store.toasts.filter((t) => !seen.has(t.id))
    for (const id of [...seen]) if (!store.toasts.some((t) => t.id === id)) seen.delete(id)
    if (!fresh.length) return
    for (const t of fresh) seen.add(t.id)
    const urgent = fresh.filter((t) => t.variant === 'danger' || t.variant === 'warning').map(announceText)
    const calm = fresh.filter((t) => t.variant !== 'danger' && t.variant !== 'warning').map(announceText)
    // Clear first so an identical message is announced again.
    politeText.value = ''
    assertiveText.value = ''
    await nextTick()
    politeText.value = calm.join('. ')
    assertiveText.value = urgent.join('. ')
  },
)

onBeforeUnmount(() => clearTimeout(releaseTimer))
</script>

<template>
  <section
    ref="region"
    data-slot="toaster"
    role="region"
    :aria-label="label"
    :data-position="resolvedPosition"
    :data-layout="resolvedLayout === 'default' ? undefined : resolvedLayout"
    :data-appearance="resolvedAppearance === 'default' ? undefined : resolvedAppearance"
    :class="cn('pointer-events-none fixed z-(--z-toast) flex w-full max-w-sm flex-col gap-2 p-4', POSITIONS[resolvedPosition], props.class)"
    @mouseenter="pause"
    @mouseleave="resume"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @keydown="onKeydown"
  >
    <div data-slot="toaster-status" role="status" class="sr-only">{{ politeText }}</div>
    <div data-slot="toaster-alert" role="alert" class="sr-only">{{ assertiveText }}</div>
    <ToastItem
      v-for="t in displayed"
      :key="t.id"
      :title="t.title"
      :description="t.description"
      :variant="t.variant"
      :action="t.action"
      :progress="showProgress"
      :duration="t.duration"
      :paused="hovering"
      :hide-icon="hideIcons"
      :layout="resolvedLayout"
      :appearance="resolvedAppearance"
      :announce="false"
      @dismiss="dismiss(t.id)"
    />
  </section>
</template>
