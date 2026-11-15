<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { affixVariants, type AffixVariant } from './variants'

defineOptions({ inheritAttrs: false })

export interface AffixProps extends BaseProps {
  /** Distance in px from the top of the scroll container at which the content sticks. Defaults to 0 unless only `offsetBottom` is set. Non-finite numbers are ignored. */
  offsetTop?: number
  /** Distance in px from the bottom of the scroll container (pins to the bottom edge). Used for stuck detection only when `offsetTop` is not set. Non-finite numbers are ignored. */
  offsetBottom?: number
  /** z-index: a number, or any CSS value such as `var(--z-overlay)`. Defaults to the `--z-sticky` token. */
  zIndex?: number | string
  /** Look while stuck: `plain`, `elevated` (shadow + background) or `bordered` (background + edge border). Unknown values fall back to `plain`. */
  variant?: AffixVariant
  /** Render as a normal block: no sticky positioning, no observer, never stuck. */
  disabled?: boolean
  /** Scroll container the content sticks in: an element or a CSS selector. `null` / not found = the viewport. */
  root?: HTMLElement | string | null
}

const props = withDefaults(defineProps<AffixProps>(), {
  offsetTop: undefined,
  offsetBottom: undefined,
  zIndex: undefined,
  variant: 'plain',
  disabled: false,
  root: null,
})

const emit = defineEmits<{
  /** The stuck state flipped. Only emitted on changes, never for the initial not-stuck state. */
  change: [stuck: boolean]
}>()

defineSlots<{ default?: (props: { stuck: boolean }) => unknown }>()

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

const hasTop = computed(() => finite(props.offsetTop))
const hasBottom = computed(() => finite(props.offsetBottom))
/** Which edge it pins to for stuck detection. */
const edge = computed<'top' | 'bottom'>(() => (hasBottom.value && !hasTop.value ? 'bottom' : 'top'))
const topPx = computed(() => (finite(props.offsetTop) ? props.offsetTop : 0))
const bottomPx = computed(() => (finite(props.offsetBottom) ? props.offsetBottom : 0))
const variant = computed<AffixVariant>(() => (props.variant === 'elevated' || props.variant === 'bordered' ? props.variant : 'plain'))

const customZ = computed(() => {
  const z = props.zIndex
  if (typeof z === 'number') return Number.isFinite(z) ? String(z) : undefined
  return typeof z === 'string' && z.trim() ? z.trim() : undefined
})

const style = computed(() => {
  if (props.disabled) return undefined
  const s: Record<string, string> = {}
  if (edge.value === 'top' || hasTop.value) s.top = `${topPx.value}px`
  if (hasBottom.value) s.bottom = `${bottomPx.value}px`
  if (customZ.value) s.zIndex = customZ.value
  return s
})

const classes = computed(() =>
  cn(
    !props.disabled && 'sticky',
    !props.disabled && !customZ.value && 'z-(--z-sticky)',
    affixVariants({ variant: variant.value, position: edge.value }),
    props.class,
  ),
)

const stuck = ref(false)
const topSentinel = ref<HTMLElement | null>(null)
const bottomSentinel = ref<HTMLElement | null>(null)
const sentinel = computed(() => (edge.value === 'top' ? topSentinel.value : bottomSentinel.value))
let observer: IntersectionObserver | null = null
let removeFallback: (() => void) | null = null
let alive = false

function setStuck(next: boolean) {
  if (next === stuck.value) return
  stuck.value = next
  emit('change', next)
}

function resolveRoot(): HTMLElement | null {
  const r = props.root
  if (typeof r === 'string') {
    try {
      return r ? document.querySelector<HTMLElement>(r) : null
    } catch {
      return null
    }
  }
  return r ?? null
}

function disconnect() {
  observer?.disconnect()
  observer = null
  removeFallback?.()
  removeFallback = null
}

function connect() {
  disconnect()
  const el = sentinel.value
  if (!alive || !el || props.disabled || typeof window === 'undefined') {
    if (props.disabled) setStuck(false)
    return
  }
  const rootEl = resolveRoot()
  const top = edge.value === 'top'
  const offset = top ? topPx.value : bottomPx.value
  if (typeof IntersectionObserver === 'function') {
    try {
      const io = new IntersectionObserver(
        (entries) => {
          const e = entries[entries.length - 1]
          if (!e) return
          const rb = e.rootBounds
          const mid = rb ? rb.top + rb.height / 2 : window.innerHeight / 2
          const before = top ? e.boundingClientRect.top < mid : e.boundingClientRect.top > mid
          setStuck(!e.isIntersecting && before)
        },
        { root: rootEl, rootMargin: top ? `${-offset}px 0px 0px 0px` : `0px 0px ${-offset}px 0px` },
      )
      io.observe(el)
      observer = io
      return
    } catch {
      /* unsupported options: scroll fallback */
    }
  }
  const target: HTMLElement | Window = rootEl ?? window
  const update = () => {
    const r = el.getBoundingClientRect()
    const box = rootEl ? rootEl.getBoundingClientRect() : { top: 0, bottom: window.innerHeight }
    setStuck(top ? r.top < box.top + offset : r.top > box.bottom - offset)
  }
  target.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update, { passive: true })
  removeFallback = () => {
    target.removeEventListener('scroll', update)
    window.removeEventListener('resize', update)
  }
  update()
}


// A selector that matches nothing silently falls back to the viewport, so a scroll container that is not found is a mistake.
function checkRoot() {
  const r = props.root
  if (typeof r !== 'string' || !r) return
  if (!resolveRoot()) {
    violation('Affix', 'root-not-found', `has \`root\` "${r}" but no element in the page matches it, so it would watch the viewport instead. Pass an existing scroll container (element or valid selector), or leave \`root\` unset.`)
  }
}

onMounted(() => {
  alive = true
  connect()
})
onMounted(async () => {
  await nextTick()
  if (!props.disabled) checkRoot()
})
watch(() => [props.disabled, props.root, edge.value, topPx.value, bottomPx.value] as const, connect, { flush: 'post' })
onBeforeUnmount(() => {
  alive = false
  disconnect()
})
</script>

<template>
  <span v-if="edge === 'top' && !disabled" ref="topSentinel" data-slot="affix-sentinel" aria-hidden="true" class="pointer-events-none -mb-px block h-px w-full" />
  <div
    data-slot="affix"
    :data-edge="edge"
    :data-stuck="stuck ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :class="classes"
    :style="style"
    v-bind="$attrs"
  >
    <slot :stuck="stuck" />
  </div>
  <span v-if="edge === 'bottom' && !disabled" ref="bottomSentinel" data-slot="affix-sentinel" aria-hidden="true" class="pointer-events-none -mt-px block h-px w-full" />
</template>
