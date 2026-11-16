<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { duplicates } from '../contract'
import {
  TOC_SIZES,
  TOC_VARIANTS,
  tocLinkVariants,
  tocListVariants,
  tocTitleVariants,
  tocVariants,
  type TableOfContentsSize,
  type TableOfContentsVariant,
} from './variants'

export interface TocItem {
  /** `id` of the heading/section element in the page. */
  id: string
  label: string
  /** Heading level (1-6). Indentation is relative to the shallowest level present. Invalid values count as the shallowest. */
  level?: number
}

export interface TableOfContentsProps extends BaseProps {
  items: TocItem[]
  /** Active section id (v-model). Tracked automatically when omitted. */
  modelValue?: string
  /** Heading shown above the list; empty string hides it. */
  title?: string
  /** Pixels reserved at the top of the viewport (sticky header height) when deciding which section is active. */
  offset?: number
  /** Smooth scrolling on click (ignored when the user prefers reduced motion). */
  smooth?: boolean
  /** `line` (default), `rail` (thicker rule) or `boxed` (a card, the current entry filled). Unknown values fall back to `line`. */
  variant?: TableOfContentsVariant
  /** Text size: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  size?: TableOfContentsSize
}

const props = withDefaults(defineProps<TableOfContentsProps>(), { modelValue: undefined, title: 'On this page', offset: 80, smooth: true, variant: 'line', size: 'md' })
const emit = defineEmits<{ 'update:modelValue': [id: string]; select: [id: string] }>()

const list = computed(() =>
  (Array.isArray(props.items) ? props.items : []).filter((i) => i && typeof i.id === 'string' && i.id !== '' && typeof i.label === 'string'),
)
const baseLevel = computed(() => Math.min(6, ...list.value.map((i) => (Number.isInteger(i.level) && i.level! >= 1 && i.level! <= 6 ? i.level! : 6))))
const INDENT = ['ps-3', 'ps-6', 'ps-9', 'ps-12', 'ps-14', 'ps-16'] as const
function indentOf(item: TocItem): string {
  const lvl = Number.isInteger(item.level) && item.level! >= 1 && item.level! <= 6 ? item.level! : baseLevel.value
  return INDENT[Math.min(Math.max(lvl - baseLevel.value, 0), INDENT.length - 1)]
}

const variant = computed<TableOfContentsVariant>(() => (TOC_VARIANTS.includes(props.variant as TableOfContentsVariant) ? (props.variant as TableOfContentsVariant) : 'line'))
const size = computed<TableOfContentsSize>(() => (TOC_SIZES.includes(props.size as TableOfContentsSize) ? (props.size as TableOfContentsSize) : 'md'))

const tracked = ref<string | undefined>(undefined)
const activeId = computed(() => props.modelValue ?? tracked.value)
function setActive(id: string) {
  if (activeId.value === id) return
  tracked.value = id
  emit('update:modelValue', id)
}

let observer: IntersectionObserver | null = null
const visible = new Set<string>()

function disconnect() {
  observer?.disconnect()
  observer = null
  visible.clear()
}

function observe() {
  disconnect()
  if (typeof IntersectionObserver === 'undefined' || typeof document === 'undefined') return
  const targets = list.value.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => el !== null)
  if (!targets.length) return
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target.id)
        else visible.delete(e.target.id)
      }
      const first = list.value.find((i) => visible.has(i.id))
      if (first) setActive(first.id)
    },
    // The top band under the sticky header counts as "reading"; the bottom 60% of the viewport does not.
    { rootMargin: `-${Math.max(0, props.offset)}px 0px -60% 0px`, threshold: 0 },
  )
  for (const el of targets) observer.observe(el)
}

function syncFromHash() {
  if (typeof location === 'undefined') return
  let id = location.hash.slice(1)
  try {
    id = decodeURIComponent(id)
  } catch {
    /* malformed escape: look the id up as written */
  }
  if (id && list.value.some((i) => i.id === id)) setActive(id)
}

// Only the shape of `items` is checked: whether each id exists in the page is not, because routes render later.
function checkItems() {
  const items: unknown = props.items
  if (!Array.isArray(items) || items.length === 0) {
    violation('TableOfContents', 'requires-items', 'requires `items` with at least one entry `{ id, label }`. Render the table of contents once the headings are known.')
    return
  }
  const bad = items.findIndex((i) => !i || typeof i.id !== 'string' || i.id === '' || typeof i.label !== 'string' || i.label.trim() === '')
  if (bad >= 0) violation('TableOfContents', 'requires-id-label', `requires a non-empty \`id\` and \`label\` on every item (item ${bad + 1} lacks one). The id is the heading's \`id\` in the page.`)
  const dup = duplicates(items.map((i) => i?.id))
  if (dup.length) violation('TableOfContents', 'unique-id', `requires a unique \`id\` per item (duplicate: ${dup.map((d) => `"${d}"`).join(', ')}).`)
}

onMounted(async () => {
  checkItems()
  syncFromHash()
  window.addEventListener('hashchange', syncFromHash)
  await nextTick()
  observe()
})
watch([() => list.value.map((i) => i.id).join('\u0000'), () => props.offset], () => nextTick(observe))
onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncFromHash)
  disconnect()
})

function onClick(e: MouseEvent, item: TocItem) {
  const el = typeof document === 'undefined' ? null : document.getElementById(item.id)
  if (el) {
    e.preventDefault()
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: props.smooth && !reduce ? 'smooth' : 'auto', block: 'start' })
    try {
      history.replaceState(history.state, '', `#${encodeURIComponent(item.id)}`)
    } catch {
      /* history unavailable (sandboxed iframe): scrolling still worked */
    }
  }
  setActive(item.id)
  emit('select', item.id)
}
</script>

<template>
  <nav data-slot="table-of-contents" :aria-label="title || 'Table of contents'" :data-variant="variant" :data-size="size" :class="cn(tocVariants({ variant, size }), props.class)">
    <p v-if="title" data-slot="table-of-contents-title" :class="cn(tocTitleVariants({ size }))">{{ title }}</p>
    <ul :class="cn(tocListVariants({ variant }))">
      <li v-for="item in list" :key="item.id" data-slot="table-of-contents-item">
        <a
          :href="`#${item.id}`"
          data-slot="table-of-contents-link"
          :aria-current="activeId === item.id ? 'location' : undefined"
          :data-active="activeId === item.id ? '' : undefined"
          :class="cn(tocLinkVariants({ variant }), indentOf(item))"
          @click="onClick($event, item)"
        >{{ item.label }}</a>
      </li>
    </ul>
  </nav>
</template>
