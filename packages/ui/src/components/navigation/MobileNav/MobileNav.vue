<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cn } from '../../../lib/cn'
import { requireText, violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { hasProp } from '../contract'

export interface MobileNavProps extends BaseProps {
  /** Open state (v-model:open). */
  open?: boolean
  /** Initial state when uncontrolled. */
  defaultOpen?: boolean
  /** `dropdown` slides down under its positioned parent (e.g. AppHeader); `sheet` is a fixed side panel with overlay and focus trap. */
  variant?: 'dropdown' | 'sheet'
  /** Accessible name of the panel. */
  label?: string
  /** Close when a link (`a[href]`) or `[data-mobile-nav-close]` element inside is clicked. */
  closeOnNavigate?: boolean
  id?: string
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<MobileNavProps>(), { open: undefined, defaultOpen: false, variant: 'dropdown', label: 'Navigation', closeOnNavigate: true })
const emit = defineEmits<{ 'update:open': [open: boolean] }>()
defineSlots<{ default?: (p: { close: () => void }) => unknown }>()

const controlled = hasProp('open')
onMounted(() => {
  requireText('MobileNav', 'label', props.label, 'Every panel needs its own name, for example "Site menu".')
  if (!controlled && !props.defaultOpen) {
    violation('MobileNav', 'requires-open', 'requires `v-model:open` (or `default-open`). The panel has no trigger of its own, so nothing else can open it; wire your menu button to `open`, or use AppHeader and its `mobile` slot.')
  }
})

const inner = ref(props.open ?? props.defaultOpen)
watch(
  () => props.open,
  (o) => {
    if (o !== undefined) inner.value = o
  },
)
const isOpen = computed(() => inner.value)
const isSheet = computed(() => props.variant === 'sheet')

const panel = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

function setOpen(next: boolean) {
  if (next === inner.value) return
  if (props.open === undefined) inner.value = next
  emit('update:open', next)
}
const close = () => setOpen(false)

function focusables(): HTMLElement[] {
  return panel.value ? [...panel.value.querySelectorAll<HTMLElement>(FOCUSABLE)] : []
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    close()
    return
  }
  if (e.key === 'Tab' && isSheet.value) {
    const items = focusables()
    if (!items.length) {
      e.preventDefault()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (e.shiftKey && (active === first || active === panel.value)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

function onPanelClick(e: MouseEvent) {
  if (!props.closeOnNavigate) return
  const el = e.target instanceof Element ? e.target.closest('a[href],[data-mobile-nav-close]') : null
  if (el) close()
}

// A panel that renders already open (defaultOpen / initial v-model) must not steal focus on page load,
// so focus only moves on a later open and returns on close.
onMounted(() => {
  if (isOpen.value) document.addEventListener('keydown', onKeydown)
})
watch(
  isOpen,
  async (open) => {
    if (typeof document === 'undefined') return
    if (open) {
      previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      ;(focusables()[0] ?? panel.value)?.focus()
    } else {
      document.removeEventListener('keydown', onKeydown)
      previouslyFocused?.focus()
      previouslyFocused = null
    }
  },
)
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <template v-if="isOpen">
    <div v-if="isSheet" data-slot="mobile-nav-overlay" aria-hidden="true" class="fixed inset-0 z-(--z-overlay) bg-scrim animate-ds-fade-in motion-reduce:animate-none" @click="close" />
    <div
      :id="id"
      ref="panel"
      data-slot="mobile-nav"
      data-state="open"
      :data-variant="variant"
      :role="isSheet ? 'dialog' : 'navigation'"
      :aria-modal="isSheet ? 'true' : undefined"
      :aria-label="label"
      v-bind="$attrs"
      tabindex="-1"
      :class="
        cn(
          'outline-none',
          isSheet
            ? 'fixed inset-y-0 start-0 z-(--z-modal) w-72 max-w-5/6 overflow-y-auto overscroll-contain border-e bg-background p-4 shadow-lg animate-ds-slide-in-left rtl:animate-ds-slide-in-right motion-reduce:animate-none'
            : 'absolute inset-x-0 top-full z-(--z-sticky) max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain border-b bg-background p-4 shadow-md animate-ds-fade-in motion-reduce:animate-none',
          props.class,
        )
      "
      @click="onPanelClick"
    >
      <slot :close="close" />
    </div>
  </template>
</template>
