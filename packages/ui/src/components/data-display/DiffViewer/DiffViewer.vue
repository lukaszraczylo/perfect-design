<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs, useTemplateRef, watch } from 'vue'
import { violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import { faChevronDown, faChevronUp } from '../../../lib/icons'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Button from '../../primitives/Button/Button.vue'
import CopyButton from '../_shared/CopyButton.vue'
import { hasAriaName, hasText, useMountedCheck } from '../_shared/contract'
import { useVirtualWindow } from '../_shared/useVirtualWindow'
import DiffText from './DiffText.vue'
import { buildModel, buildPatchModel, diffWords, parseUnifiedDiff, toUnifiedText, type DiffBlock, type DiffLine, type Hunk, type WordPart } from './diff'
import {
  DIFF_ROW_PX, DIFF_VIEWER_SIZES, DIFF_VIEWER_VARIANTS, diffCellVariants, diffEdgeVariants, diffMarkerVariants, diffViewerVariants,
  type DiffCellType, type DiffViewerSize, type DiffViewerVariant,
} from './variants'

export interface DiffViewerProps extends BaseProps {
  /** The original text. A missing side counts as empty. */
  oldText?: string
  /** The changed text. */
  newText?: string
  /** A unified diff (`git diff` output). When it is not blank it is shown instead of `oldText` / `newText`. */
  patch?: string
  /** Accessible name of the diff. Required (or `aria-label` / `aria-labelledby`). */
  label?: string
  /** `unified` (one column, default), `split` (side by side; falls back to unified when the viewer is narrower than `splitMinWidth`) or `inline` (changed lines merged into one row with the words marked). Unknown values render `unified`. */
  variant?: DiffViewerVariant
  /** Text and row size. Unknown values render `md`. */
  size?: DiffViewerSize
  /** Wrap long lines instead of scrolling sideways. */
  wrap?: boolean
  /** Show the line number columns. */
  lineNumbers?: boolean
  /** Fold unchanged lines between changes behind "N unchanged lines" buttons. `false` shows them all. */
  collapse?: boolean
  /** Unchanged lines kept around each change. */
  context?: number
  /** Show the copy button (copies the diff as unified text). */
  copy?: boolean
  /** Heading of the old side. */
  oldLabel?: string
  /** Heading of the new side. */
  newLabel?: string
  /** Container width in px under which `split` renders as `unified`. Measured on the viewer, not the viewport. */
  splitMinWidth?: number
  /** Fixed height of the scrolling area (px or any CSS length). */
  height?: number | string
  /** Largest height of the scrolling area (px or any CSS length). Defaults to 24rem. */
  maxHeight?: number | string
  /** Largest edit distance the line diff searches before it settles for an approximate result. */
  maxCost?: number
}

const props = withDefaults(defineProps<DiffViewerProps>(), {
  variant: 'unified',
  size: 'md',
  lineNumbers: true,
  collapse: true,
  context: 3,
  copy: true,
  oldLabel: 'Original',
  newLabel: 'Modified',
  splitMinWidth: 640,
  maxCost: 1000,
})
const emit = defineEmits<{
  /** The diff was copied to the clipboard. */
  copy: [text: string]
  /** The current change moved (`index` is 1-based). */
  hunk: [event: { index: number; total: number }]
}>()
defineSlots<{ empty(): unknown }>()
defineOptions({ inheritAttrs: false })

const WINDOW_AFTER = 400
const REVEAL_STEP = 100
const attrs = useAttrs()

useMountedCheck(() => {
  if (!hasText(props.label) && !hasAriaName(attrs)) {
    violation('DiffViewer', 'requires-accessible-name', 'needs an accessible name. Set `label`, `aria-label` or `aria-labelledby`, e.g. `label="Changes to app.conf"`.')
  }
  if (typeof props.oldText !== 'string' && typeof props.newText !== 'string' && typeof props.patch !== 'string') {
    violation('DiffViewer', 'requires-input', 'needs something to compare. Pass `oldText` and `newText` (an empty string is fine) or a `patch` string.')
  }
})

const variant = computed<DiffViewerVariant>(() => (DIFF_VIEWER_VARIANTS.includes(props.variant) ? props.variant : 'unified'))
const size = computed<DiffViewerSize>(() => (DIFF_VIEWER_SIZES.includes(props.size) ? props.size : 'md'))
const rowPx = computed(() => DIFF_ROW_PX[size.value])

/* ---- model */
const patchText = computed(() => (typeof props.patch === 'string' && props.patch.trim() !== '' ? props.patch : ''))
const model = computed(() =>
  patchText.value
    ? buildPatchModel(parseUnifiedDiff(patchText.value))
    : buildModel(String(props.oldText ?? ''), String(props.newText ?? ''), { context: props.context, maxCost: props.maxCost }),
)
const hunks = computed<Hunk[]>(() => model.value.hunks)
const invalidPatch = computed(() => patchText.value !== '' && model.value.hunks.length === 0)
const emptyText = computed(() => (invalidPatch.value ? 'No changes could be read from this patch.' : 'No differences.'))
const gaps = computed(() => model.value.blocks.filter((b): b is Extract<DiffBlock, { kind: 'gap' }> => b.kind === 'gap'))

/* ---- container width: split falls back to unified when the viewer itself is narrow */
const root = useTemplateRef<HTMLElement>('root')
const region = useTemplateRef<HTMLElement>('region')
const width = ref(0)
const viewportH = ref(0)
const effective = computed<DiffViewerVariant>(() => (variant.value === 'split' && width.value > 0 && width.value < Number(props.splitMinWidth) ? 'unified' : variant.value))
let ro: ResizeObserver | undefined
function readSizes() {
  width.value = root.value?.clientWidth ?? 0
  viewportH.value = region.value?.clientHeight ?? 0
}
onMounted(() => {
  readSizes()
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(readSizes)
    if (root.value) ro.observe(root.value)
    if (region.value) ro.observe(region.value)
  }
})
let raf: number | undefined
onBeforeUnmount(() => {
  ro?.disconnect()
  ro = undefined
  if (raf !== undefined && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf)
  raf = undefined
})

/* ---- folded regions */
const revealed = ref<Record<number, number>>({})
watch([model, () => props.collapse], () => (revealed.value = {}))
const revealedOf = (id: number) => revealed.value[id] ?? (props.collapse ? 0 : Number.POSITIVE_INFINITY)
const hiddenIn = (g: { id: number; lines: DiffLine[] }) => g.lines.length - Math.min(g.lines.length, revealedOf(g.id))
const hasHidden = computed(() => gaps.value.some((g) => hiddenIn(g) > 0))
function expandAll() {
  revealed.value = Object.fromEntries(gaps.value.map((g) => [g.id, g.lines.length]))
}
function collapseAll() {
  revealed.value = Object.fromEntries(gaps.value.map((g) => [g.id, 0]))
}
function reveal(id: number) {
  const g = gaps.value.find((x) => x.id === id)
  if (!g) return
  const next = Math.min(g.lines.length, Math.min(g.lines.length, revealedOf(id)) + REVEAL_STEP)
  revealed.value = { ...revealed.value, [id]: next }
  void nextTick(() => {
    const btn = root.value?.querySelector<HTMLElement>(`[data-slot="diff-viewer-fold-button"][data-gap="${id}"]`)
    ;(btn ?? region.value)?.focus()
  })
}

/* ---- rows */
type Row =
  | { k: 'file'; name: string }
  | { k: 'hunk'; hunk: Hunk; index: number }
  | { k: 'fold'; id: number; count: number }
  | { k: 'line'; line: DiffLine }
  | { k: 'pair'; left?: DiffLine; right?: DiffLine }
  | { k: 'change'; del: DiffLine; add: DiffLine }

function lineRows(lines: DiffLine[], mode: DiffViewerVariant, out: Row[]) {
  if (mode === 'unified') {
    for (const line of lines) out.push({ k: 'line', line })
    return
  }
  let i = 0
  while (i < lines.length) {
    const l = lines[i]
    if (l.type === 'ctx') {
      out.push(mode === 'split' ? { k: 'pair', left: l, right: l } : { k: 'line', line: l })
      i++
      continue
    }
    let d = i
    while (d < lines.length && lines[d].type === 'del') d++
    let a = d
    while (a < lines.length && lines[a].type === 'add') a++
    const dels = lines.slice(i, d)
    const adds = lines.slice(d, a)
    const n = Math.max(dels.length, adds.length)
    for (let k = 0; k < n; k++) {
      if (mode === 'split') out.push({ k: 'pair', left: dels[k], right: adds[k] })
      else if (dels[k] && adds[k]) out.push({ k: 'change', del: dels[k], add: adds[k] })
      else out.push({ k: 'line', line: (dels[k] ?? adds[k]) as DiffLine })
    }
    i = a
  }
}

const rows = computed<Row[]>(() => {
  const out: Row[] = []
  const mode = effective.value
  for (const b of model.value.blocks) {
    if (b.kind === 'file') out.push({ k: 'file', name: b.name })
    else if (b.kind === 'hunk') {
      out.push({ k: 'hunk', hunk: b.hunk, index: b.index })
      lineRows(b.hunk.lines, mode, out)
    } else {
      const total = b.lines.length
      const shown = Math.min(total, revealedOf(b.id))
      const hidden = total - shown
      if (hidden === 0) lineRows(b.lines, mode, out)
      else if (b.fromEnd) {
        out.push({ k: 'fold', id: b.id, count: hidden })
        lineRows(b.lines.slice(total - shown), mode, out)
      } else {
        lineRows(b.lines.slice(0, shown), mode, out)
        out.push({ k: 'fold', id: b.id, count: hidden })
      }
    }
  }
  return out
})

const digits = computed(() => {
  let max = 1
  for (const b of model.value.blocks) {
    const lines = b.kind === 'hunk' ? b.hunk.lines : b.kind === 'gap' ? b.lines : []
    for (const l of lines) max = Math.max(max, l.oldNo, l.newNo)
  }
  return String(max).length
})
const numberWidth = computed(() => `${digits.value + 2}ch`)
const split = computed(() => effective.value === 'split')
const sideCols = computed(() => (props.lineNumbers ? 3 : 2))
const cols = computed(() => (split.value ? sideCols.value * 2 : props.lineNumbers ? 4 : 2))

/* ---- windowing: long diffs render only the rows in view (heights are measured, so wrapped lines still line up) */
const windowed = computed(() => rows.value.length > WINDOW_AFTER)
const win = useVirtualWindow({
  count: () => rows.value.length,
  rowHeight: () => undefined,
  estimate: () => rowPx.value,
  viewport: () => viewportH.value || 600,
  overscan: 12,
})
watch([model, effective, () => props.wrap, size], () => win.reset())
const visible = computed(() => {
  if (!windowed.value) return rows.value.map((row, index) => ({ row, index }))
  const { start, end } = win.range.value
  return rows.value.slice(start, end).map((row, i) => ({ row, index: start + i }))
})
const table = useTemplateRef<HTMLElement>('table')
onUpdated(() => {
  if (windowed.value) win.measure(table.value)
})
function onScroll() {
  if (!windowed.value || raf !== undefined) return
  const run = () => {
    raf = undefined
    if (region.value) win.scrollTop.value = region.value.scrollTop
  }
  if (typeof requestAnimationFrame !== 'function') return run()
  raf = requestAnimationFrame(run)
}

/* ---- word highlighting (computed only for the rows that render, then kept) */
const wordCache = new WeakMap<DiffLine, WordPart[] | null>()
function wordsOf(line: DiffLine | undefined): WordPart[] | null {
  if (!line?.pair) return null
  const del = line.type === 'del' ? line : line.pair
  const add = line.type === 'del' ? line.pair : line
  let parts = wordCache.get(del)
  if (parts === undefined) wordCache.set(del, (parts = diffWords(del.text, add.text)))
  return parts
}

/* ---- navigation between changes */
const current = ref(-1)
watch(model, () => (current.value = -1))
const total = computed(() => hunks.value.length)
function go(target: number) {
  if (total.value === 0) return
  const index = ((target % total.value) + total.value) % total.value
  current.value = index
  emit('hunk', { index: index + 1, total: total.value })
  const at = rows.value.findIndex((r) => r.k === 'hunk' && r.index === index)
  const box = region.value
  if (box && windowed.value) {
    const y = win.offsetOf(at)
    box.scrollTop = y
    win.scrollTop.value = y
  }
  void nextTick(() => {
    const cell = root.value?.querySelector<HTMLElement>(`[data-slot="diff-viewer-hunk-cell"][data-hunk="${index}"]`)
    if (!cell) return
    cell.focus({ preventScroll: true })
    if (box && !windowed.value) box.scrollTop = box.scrollTop + cell.getBoundingClientRect().top - box.getBoundingClientRect().top
  })
}
const next = () => go(current.value + 1)
const prev = () => go(current.value <= 0 ? total.value - 1 : current.value - 1)
function onKey(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key === 'n') {
    e.preventDefault()
    next()
  } else if (e.key === 'p') {
    e.preventDefault()
    prev()
  }
}
defineExpose({ next, prev, expandAll, collapseAll })

/* ---- copy and labels */
const copyText = () => (patchText.value ? patchText.value : toUnifiedText(model.value, props.oldLabel, props.newLabel))
const regionName = computed(() => (hasText(props.label) ? props.label : (attrs['aria-label'] as string | undefined)))
const regionLabelledBy = computed(() => (regionName.value ? undefined : (attrs['aria-labelledby'] as string | undefined)))
const rootAttrs = computed(() => {
  const { 'aria-label': _l, 'aria-labelledby': _b, ...rest } = attrs
  return rest
})
const status = computed(() => (current.value < 0 ? '' : `Change ${current.value + 1} of ${total.value}`))
const summary = computed(() => `${model.value.added} added, ${model.value.removed} removed`)
const px = (v: number | string | undefined) => (typeof v === 'number' ? (v > 0 ? `${v}px` : undefined) : v || undefined)
const regionStyle = computed(() => ({ height: px(props.height), maxHeight: props.height ? undefined : px(props.maxHeight) }))
const classes = computed(() => cn(diffViewerVariants({ variant: variant.value, size: size.value }), props.class))

const rowStyle = computed(() => (props.wrap ? { minHeight: `${rowPx.value}px`, lineHeight: `${rowPx.value}px` } : { height: `${rowPx.value}px`, lineHeight: `${rowPx.value}px` }))
const codeClass = computed(() => cn('min-w-0 px-2 font-mono [tab-size:4]', props.wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre max-sm:whitespace-pre-wrap max-sm:[overflow-wrap:anywhere]'))
const numClass = 'select-none bg-muted px-2 text-end font-mono tabular-nums text-muted-foreground'
const MARK: Record<string, string> = { ctx: ' ', add: '+', del: '-', change: '~', empty: '' }
const WORD: Record<string, string> = { ctx: 'Unchanged', add: 'Added', del: 'Removed', change: 'Changed', empty: '' }
const typeOf = (l: DiffLine | undefined): DiffCellType => (l ? l.type : 'empty')
const ariaRow = (index: number) => (windowed.value ? index + 1 : undefined)
</script>

<template>
  <div
    ref="root"
    v-bind="rootAttrs"
    data-slot="diff-viewer"
    :data-variant="variant"
    :data-size="size"
    :data-effective-variant="effective"
    :data-wrap="wrap ? '' : undefined"
    :class="classes"
  >
    <div v-if="total > 0" data-slot="diff-viewer-toolbar" class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 border-b bg-muted py-1 ps-3 pe-1.5 text-xs text-muted-foreground">
      <span data-slot="diff-viewer-title" class="min-w-0 break-words font-mono">{{ oldLabel }} to {{ newLabel }}</span>
      <span data-slot="diff-viewer-summary" class="tabular-nums">{{ summary }}</span>
      <span data-slot="diff-viewer-status" role="status" class="tabular-nums">{{ status }}</span>
      <span class="ms-auto flex flex-wrap items-center gap-1">
        <Button data-slot="diff-viewer-previous" variant="ghost" size="xs" class="pointer-coarse:min-h-11" :icon-start="faChevronUp" @click="prev">Previous change</Button>
        <Button data-slot="diff-viewer-next" variant="ghost" size="xs" class="pointer-coarse:min-h-11" :icon-start="faChevronDown" @click="next">Next change</Button>
        <Button v-if="gaps.length > 0 && hasHidden" data-slot="diff-viewer-expand-all" variant="ghost" size="xs" class="pointer-coarse:min-h-11" @click="expandAll">Expand all</Button>
        <Button v-else-if="gaps.length > 0" data-slot="diff-viewer-collapse" variant="ghost" size="xs" class="pointer-coarse:min-h-11" @click="collapseAll">Collapse unchanged</Button>
        <CopyButton v-if="copy" :text="copyText" label="Copy diff" copied-label="Diff copied" @copy="(t) => emit('copy', t)" />
      </span>
    </div>
    <p v-if="model.approximate" data-slot="diff-viewer-note" class="border-b bg-muted px-3 py-1 text-xs text-muted-foreground">Large diff: the result may not be the smallest possible.</p>
    <div v-if="total === 0" data-slot="diff-viewer-empty" class="p-4 text-center text-sm text-muted-foreground">
      <slot name="empty">{{ emptyText }}</slot>
    </div>
    <div
      v-else
      ref="region"
      data-slot="diff-viewer-scroll"
      role="region"
      tabindex="0"
      :aria-label="regionName"
      :aria-labelledby="regionLabelledBy"
      :style="regionStyle"
      :class="cn('min-h-0 min-w-0 flex-1 overflow-auto focus-visible:ring-inset', !height && !maxHeight && 'max-h-96', focusRing)"
      @scroll.passive="onScroll"
      @keydown="onKey"
    >
      <table
        ref="table"
        data-slot="diff-viewer-table"
        :aria-rowcount="windowed ? rows.length : undefined"
        :class="cn('border-separate border-spacing-0 text-start', wrap ? 'w-full table-fixed' : 'w-max min-w-full max-sm:w-full')"
      >
        <caption class="sr-only">{{ regionName || 'Diff' }}</caption>
        <colgroup>
          <template v-if="split">
            <template v-for="side in 2" :key="side">
              <col v-if="lineNumbers" :style="{ width: numberWidth }" />
              <col style="width: 2rem" />
              <col />
            </template>
          </template>
          <template v-else>
            <template v-if="lineNumbers"><col :style="{ width: numberWidth }" /><col :style="{ width: numberWidth }" /></template>
            <col style="width: 2rem" />
            <col />
          </template>
        </colgroup>
        <thead v-if="split" data-slot="diff-viewer-head">
          <tr>
            <th scope="col" :colspan="sideCols" class="border-b bg-muted px-2 py-1 text-start text-xs font-medium text-muted-foreground">{{ oldLabel }}</th>
            <th scope="col" :colspan="sideCols" class="border-b border-s bg-muted px-2 py-1 text-start text-xs font-medium text-muted-foreground">{{ newLabel }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="windowed && win.padTop.value > 0" aria-hidden="true" role="presentation" data-slot="diff-viewer-spacer"><td :colspan="cols" :style="{ height: `${win.padTop.value}px`, padding: 0 }" /></tr>
          <template v-for="{ row, index } in visible" :key="index">
            <tr v-if="row.k === 'file'" data-slot="diff-viewer-file" :data-index="index" :aria-rowindex="ariaRow(index)" class="bg-muted text-foreground">
              <td :colspan="cols" class="px-3 py-1 font-mono text-xs font-medium break-words">{{ row.name }}</td>
            </tr>
            <tr v-else-if="row.k === 'hunk'" data-slot="diff-viewer-hunk" :data-index="index" :aria-rowindex="ariaRow(index)" :data-current="current === row.index ? '' : undefined">
              <td
                :colspan="cols"
                data-slot="diff-viewer-hunk-cell"
                :data-hunk="row.index"
                tabindex="-1"
                :class="cn('px-3 font-mono text-xs focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid', current === row.index ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground')"
                :style="{ height: `${rowPx}px`, lineHeight: `${rowPx}px` }"
              >{{ row.hunk.header }}</td>
            </tr>
            <tr v-else-if="row.k === 'fold'" data-slot="diff-viewer-fold" :data-index="index" :aria-rowindex="ariaRow(index)">
              <td :colspan="cols" class="bg-muted p-0">
                <button
                  type="button"
                  data-slot="diff-viewer-fold-button"
                  :data-gap="row.id"
                  aria-expanded="false"
                  :aria-label="`Expand ${row.count} unchanged ${row.count === 1 ? 'line' : 'lines'}`"
                  :class="cn('flex min-h-6 w-full items-center px-3 text-start text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground pointer-coarse:min-h-11', focusRing)"
                  :style="{ minHeight: `${Math.max(24, rowPx)}px` }"
                  @click="reveal(row.id)"
                >{{ row.count }} unchanged {{ row.count === 1 ? 'line' : 'lines' }}</button>
              </td>
            </tr>
            <tr v-else-if="row.k === 'pair'" data-slot="diff-viewer-row" data-layout="split" :data-index="index" :aria-rowindex="ariaRow(index)" :style="rowStyle">
              <template v-for="side in ['left', 'right'] as const" :key="side">
                <template v-if="lineNumbers">
                  <td data-slot="diff-viewer-number" :data-side="side" aria-hidden="true" :class="cn(numClass, diffEdgeVariants({ type: typeOf(row[side]) }))">{{ side === 'left' ? row.left?.oldNo || '' : row.right?.newNo || '' }}</td>
                </template>
                <td data-slot="diff-viewer-marker" :data-side="side" :class="cn(diffMarkerVariants({ type: typeOf(row[side]) }), diffCellVariants({ type: typeOf(row[side]) }), !lineNumbers && diffEdgeVariants({ type: typeOf(row[side]) }))">
                  <template v-if="row[side]"><span aria-hidden="true">{{ MARK[typeOf(row[side])] }}</span><span class="sr-only">{{ WORD[typeOf(row[side])] }}</span></template>
                </td>
                <td data-slot="diff-viewer-code" :data-side="side" dir="auto" :class="cn(codeClass, diffCellVariants({ type: typeOf(row[side]) }))"><DiffText v-if="row[side]" :text="row[side]!.text" :parts="wordsOf(row[side])" :side="side === 'left' ? 'old' : 'new'" /></td>
              </template>
            </tr>
            <tr v-else-if="row.k === 'change'" data-slot="diff-viewer-row" data-layout="inline" data-type="change" :data-index="index" :aria-rowindex="ariaRow(index)" :style="rowStyle">
              <template v-if="lineNumbers">
                <td data-slot="diff-viewer-number" data-side="old" aria-hidden="true" :class="cn(numClass, diffEdgeVariants({ type: 'change' }))">{{ row.del.oldNo }}</td>
                <td data-slot="diff-viewer-number" data-side="new" aria-hidden="true" :class="numClass">{{ row.add.newNo }}</td>
              </template>
              <td data-slot="diff-viewer-marker" :class="cn(diffMarkerVariants({ type: 'change' }), 'w-8', !lineNumbers && diffEdgeVariants({ type: 'change' }))"><span aria-hidden="true">~</span><span class="sr-only">Changed</span></td>
              <td data-slot="diff-viewer-code" dir="auto" :class="codeClass"><DiffText :text="row.add.text" :parts="wordsOf(row.add)" side="both" /></td>
            </tr>
            <tr v-else-if="row.k === 'line'" data-slot="diff-viewer-row" :data-layout="effective" :data-type="row.line.type" :data-index="index" :aria-rowindex="ariaRow(index)" :style="rowStyle">
              <template v-if="lineNumbers">
                <td data-slot="diff-viewer-number" data-side="old" aria-hidden="true" :class="cn(numClass, diffEdgeVariants({ type: row.line.type }))">{{ row.line.oldNo || '' }}</td>
                <td data-slot="diff-viewer-number" data-side="new" aria-hidden="true" :class="numClass">{{ row.line.newNo || '' }}</td>
              </template>
              <td data-slot="diff-viewer-marker" :class="cn(diffMarkerVariants({ type: row.line.type }), diffCellVariants({ type: row.line.type }), !lineNumbers && diffEdgeVariants({ type: row.line.type }))"><span aria-hidden="true">{{ MARK[row.line.type] }}</span><span class="sr-only">{{ WORD[row.line.type] }}</span></td>
              <td data-slot="diff-viewer-code" dir="auto" :class="cn(codeClass, diffCellVariants({ type: row.line.type }))"><DiffText :text="row.line.text" :parts="wordsOf(row.line)" :side="row.line.type === 'del' ? 'old' : 'new'" /></td>
            </tr>
          </template>
          <tr v-if="windowed && win.padBottom.value > 0" aria-hidden="true" role="presentation" data-slot="diff-viewer-spacer"><td :colspan="cols" :style="{ height: `${win.padBottom.value}px`, padding: 0 }" /></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
