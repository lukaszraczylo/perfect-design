<script setup lang="ts">
import { computed, nextTick, reactive, ref, useTemplateRef, watch } from 'vue'
import { cn } from '../../../lib/cn'
import { faCheck, faChevronRight, faCopy } from '../../../lib/icons'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import { useClipboard } from '../../../lib/use-helpers'
import Icon from '../../primitives/Icon/Icon.vue'
import { JSON_VIEWER_MAX_AUTO_DEPTH, buildRows, collectExpandablePaths, type JsonViewerRow } from './jsonTree'
import { JSON_VIEWER_SIZES, JSON_VIEWER_VARIANTS, jsonViewerValueVariants, jsonViewerVariants, type JsonViewerSize, type JsonViewerVariant } from './variants'

export interface JsonViewerCopyEvent {
  /** The copied JSON path, e.g. `$.users[0].name`. */
  path: string
  /** False when the clipboard was unavailable or rejected. */
  ok: boolean
}

export interface JsonViewerProps extends BaseProps {
  /** Any value: objects, arrays, Map, Set, Date, BigInt, functions, circular graphs... Replace it (do not mutate) to update the view. */
  value?: unknown
  /** Levels opened initially when `v-model:expanded` is not used. 0 = fully collapsed, 1 = root only. Capped at 32. */
  defaultExpandDepth?: number
  /** Children rendered per container before a "Show N more" row. Invalid values fall back to 100. */
  maxItems?: number
  /** Strings longer than this are truncated with an ellipsis (full text in the tooltip). */
  maxStringLength?: number
  /** Label shown on the root row. */
  rootLabel?: string
  /** Show a copy-path button on every row (the `c` key always works). */
  showCopy?: boolean
  variant?: JsonViewerVariant
  size?: JsonViewerSize
  /** Accessible name of the tree. */
  label?: string
}

const props = withDefaults(defineProps<JsonViewerProps>(), {
  defaultExpandDepth: 1,
  maxItems: 100,
  maxStringLength: 120,
  showCopy: true,
  variant: 'default',
  size: 'md',
  label: 'JSON',
})
/** Paths of open containers (`v-model:expanded`). Leave unbound for uncontrolled use driven by `defaultExpandDepth`. */
const expanded = defineModel<string[]>('expanded')
const emit = defineEmits<{
  /** A path copy finished. */
  copy: [event: JsonViewerCopyEvent]
}>()

const root = useTemplateRef<HTMLElement>('root')
const extra = reactive(new Map<string, number>())
const focusedKey = ref<string | null>(null)
const copiedPath = ref<string | null>(null)
const { copy, copied } = useClipboard()
watch(copied, (v) => {
  if (!v) copiedPath.value = null
})

const depthLimit = computed(() => {
  const d = Number(props.defaultExpandDepth)
  return Number.isNaN(d) ? 1 : Math.min(Math.max(Math.floor(d), 0), JSON_VIEWER_MAX_AUTO_DEPTH)
})
const itemLimit = computed(() => {
  const n = Number(props.maxItems)
  return Number.isNaN(n) || n < 1 ? 100 : Math.floor(n)
})
const stringLimit = computed(() => {
  const n = Number(props.maxStringLength)
  return Number.isNaN(n) || n < 1 ? 120 : Math.floor(n)
})
const expandedSet = computed(() => (Array.isArray(expanded.value) ? new Set(expanded.value) : null))

const rows = computed<JsonViewerRow[]>(() =>
  buildRows(props.value, {
    expanded: expandedSet.value,
    defaultDepth: depthLimit.value,
    maxItems: itemLimit.value,
    maxStringLength: stringLimit.value,
    extra,
    rootLabel: props.rootLabel,
  }),
)
const tabbableKey = computed(() => (focusedKey.value !== null && rows.value.some((r) => r.key === focusedKey.value) ? focusedKey.value : rows.value[0].key))

function currentPaths(): string[] {
  return expanded.value ?? collectExpandablePaths(props.value, depthLimit.value)
}
function setOpen(path: string, open: boolean) {
  const cur = currentPaths()
  expanded.value = open ? [...cur.filter((p) => p !== path), path] : cur.filter((p) => p !== path)
}
function toggle(row: JsonViewerRow) {
  if (row.kind === 'node' && row.expandable) setOpen(row.path, !row.expanded)
}
function showMore(row: JsonViewerRow) {
  extra.set(row.path, (extra.get(row.path) ?? 0) + row.chunk)
}
/** Toggle a node or reveal more children; the first newly revealed row takes the old "more" row's position and gets focus. */
function activate(row: JsonViewerRow, index: number) {
  if (row.kind !== 'more') return toggle(row)
  showMore(row)
  void nextTick(() => focusIndex(index))
}

function expandAll() {
  expanded.value = collectExpandablePaths(props.value, Infinity)
}
function collapseAll() {
  expanded.value = []
}
defineExpose({ expandAll, collapseAll })

async function copyPath(path: string) {
  const ok = await copy(path)
  copiedPath.value = ok ? path : null
  emit('copy', { path, ok })
}

function focusIndex(i: number) {
  const key = rows.value[Math.min(Math.max(i, 0), rows.value.length - 1)].key
  focusedKey.value = key
  void nextTick(() => root.value?.querySelectorAll<HTMLElement>('[data-slot="json-viewer-row"]')[rows.value.findIndex((r) => r.key === key)]?.focus())
}

function rowFromEvent(e: Event): { row: JsonViewerRow; index: number } | null {
  const key = (e.target as HTMLElement | null)?.closest?.('[data-slot="json-viewer-row"]')?.getAttribute('data-row-key')
  const index = rows.value.findIndex((r) => r.key === key)
  return index < 0 ? null : { row: rows.value[index], index }
}

function onKeydown(e: KeyboardEvent) {
  if ((e.target as HTMLElement | null)?.closest?.('[data-slot="json-viewer-copy"]')) return // native button behaviour
  const hit = rowFromEvent(e)
  if (!hit || e.altKey || e.ctrlKey || e.metaKey) return
  const { row, index } = hit
  switch (e.key) {
    case 'ArrowDown':
      focusIndex(index + 1)
      break
    case 'ArrowUp':
      focusIndex(index - 1)
      break
    case 'Home':
      focusIndex(0)
      break
    case 'End':
      focusIndex(rows.value.length - 1)
      break
    case 'ArrowRight':
      if (row.kind !== 'node' || !row.expandable) return
      if (!row.expanded) setOpen(row.path, true)
      else focusIndex(index + 1)
      break
    case 'ArrowLeft':
      if (row.kind === 'node' && row.expanded) setOpen(row.path, false)
      else if (row.parentKey !== undefined) focusIndex(rows.value.findIndex((r) => r.key === row.parentKey))
      break
    case 'Enter':
    case ' ':
      activate(row, index)
      break
    case 'c':
      if (row.kind !== 'node') return
      void copyPath(row.path)
      break
    default:
      return
  }
  e.preventDefault()
}

function onClick(e: MouseEvent) {
  const hit = rowFromEvent(e)
  if (hit) {
    focusedKey.value = hit.row.key
    activate(hit.row, hit.index)
  }
}
function onFocusin(e: FocusEvent) {
  const hit = rowFromEvent(e)
  if (hit) focusedKey.value = hit.row.key
}

const variant = computed<JsonViewerVariant>(() => (JSON_VIEWER_VARIANTS.includes(props.variant) ? props.variant : 'default'))
const size = computed<JsonViewerSize>(() => (JSON_VIEWER_SIZES.includes(props.size) ? props.size : 'md'))
const classes = computed(() => cn(jsonViewerVariants({ variant: variant.value, size: size.value }), props.class))
</script>

<template>
  <div ref="root" data-slot="json-viewer" role="tree" :aria-label="label" :class="classes" @keydown="onKeydown" @click="onClick" @focusin="onFocusin">
    <div
      v-for="row in rows"
      :key="row.key"
      data-slot="json-viewer-row"
      role="treeitem"
      :data-row-key="row.key"
      :data-kind="row.kind"
      :aria-level="row.depth + 1"
      :aria-posinset="row.posinset"
      :aria-setsize="row.setsize"
      :aria-expanded="row.expandable ? (row.expanded ? 'true' : 'false') : undefined"
      :aria-disabled="row.kind === 'note' ? 'true' : undefined"
      :tabindex="tabbableKey === row.key ? 0 : -1"
      :style="{ paddingInlineStart: `${row.depth * 1 + 0.25}rem` }"
      :class="
        cn(
          'group/row flex items-baseline gap-1 rounded-sm py-0.5 pe-1 hover:bg-accent/50',
          focusRing,
          (row.expandable || row.kind === 'more') && 'cursor-pointer',
        )
      "
    >
      <template v-if="row.kind === 'node'">
        <span data-slot="json-viewer-toggle" aria-hidden="true" class="flex size-4 shrink-0 items-center justify-center self-center text-muted-foreground">
          <Icon v-if="row.expandable" :icon="faChevronRight" size="xs" :class="cn('transition-transform motion-reduce:transition-none', row.expanded && 'rotate-90')" />
        </span>
        <template v-if="row.label !== undefined">
          <span data-slot="json-viewer-key" :class="row.indexLabel ? 'text-muted-foreground' : 'text-foreground'">{{ row.label }}</span>
          <span aria-hidden="true" class="text-muted-foreground">:</span>
        </template>
        <span data-slot="json-viewer-value" :data-type="row.type" :data-truncated="row.truncated ? 'true' : undefined" :title="row.title" :class="jsonViewerValueVariants({ type: row.type })">{{
          row.text
        }}</span>
        <span v-if="row.circularPath" data-slot="json-viewer-circular-target" class="text-xs text-muted-foreground">&rarr; {{ row.circularPath }}</span>
        <button
          v-if="showCopy"
          type="button"
          data-slot="json-viewer-copy"
          tabindex="-1"
          :aria-label="`Copy path ${row.path}`"
          :class="
            cn(
              'ms-auto inline-flex size-6 shrink-0 items-center justify-center self-center rounded-sm text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-accent-foreground group-hover/row:opacity-100 group-focus-within/row:opacity-100 motion-reduce:transition-none',
              focusRing,
              copiedPath === row.path && 'text-success opacity-100',
            )
          "
          @click.stop="copyPath(row.path)"
        >
          <Icon :icon="copiedPath === row.path ? faCheck : faCopy" size="xs" />
        </button>
      </template>
      <template v-else-if="row.kind === 'more'">
        <span class="size-4 shrink-0" aria-hidden="true" />
        <span data-slot="json-viewer-more" class="text-primary underline-offset-2 hover:underline">Show {{ row.chunk }} more</span>
        <span class="text-xs text-muted-foreground">({{ row.remaining }} left)</span>
      </template>
      <template v-else>
        <span class="size-4 shrink-0" aria-hidden="true" />
        <span data-slot="json-viewer-note" class="italic text-muted-foreground">{{ row.text }}</span>
      </template>
    </div>
  </div>
</template>
