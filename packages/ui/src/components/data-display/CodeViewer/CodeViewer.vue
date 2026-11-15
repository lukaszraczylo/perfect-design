<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, ref, useAttrs, useId, useTemplateRef, watch } from 'vue'
import { requireOneOf, violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import { faChevronDown, faChevronRight } from '../../../lib/icons'
import { focusRing } from '../../../lib/styles'
import Icon from '../../primitives/Icon/Icon.vue'
import CopyButton from '../_shared/CopyButton.vue'
import { useMountedCheck } from '../_shared/contract'
import { buildRows, computeFolds, type FoldRegion } from './fold'
import { normaliseStartLine, parseLineSpec } from './lineSpec'
import { normalizeLanguage, splitLines, tokenize, type CodeLanguage } from './tokenize'
import type { CodeViewerBaseProps, CodeViewerFoldEvent } from './types'
import { CODE_VIEWER_SIZES, CODE_VIEWER_VARIANTS, codeViewerTokenVariants, codeViewerVariants, type CodeViewerSize } from './variants'

export interface CodeViewerProps extends CodeViewerBaseProps {
  /** The text to show. Line endings may be LF, CRLF or CR. */
  source?: string
  /** Tokenizer and folding rules. Unknown values render as `plain`. */
  language?: CodeLanguage
}

const LANGUAGE_NAMES: Record<CodeLanguage, string> = { json: 'JSON', yaml: 'YAML', go: 'Go', toml: 'TOML', shell: 'Shell', plain: 'Plain text' }
/** Above this many visible rows each row opts into `content-visibility: auto` so the browser skips off-screen layout and paint. */
const LAZY_ROWS = 400

const props = withDefaults(defineProps<CodeViewerProps>(), {
  source: '',
  language: 'plain',
  lineNumbers: true,
  foldable: true,
  startLine: 1,
  wrap: false,
  copy: true,
  variant: 'bordered',
  size: 'md',
})
const emit = defineEmits<{
  /** The source was copied to the clipboard. */
  copy: [text: string]
  /** A region was folded or unfolded. Line numbers are the displayed ones. */
  fold: [event: CodeViewerFoldEvent]
}>()

// YamlViewer and GoViewer render this component and set their own `data-slot`; the checks report under their names.
const OWNERS: Record<string, string> = { 'yaml-viewer': 'YamlViewer', 'go-viewer': 'GoViewer' }
const attrs = useAttrs()
const instance = getCurrentInstance()
useMountedCheck(() => {
  const owner = OWNERS[String(attrs['data-slot'])] ?? 'CodeViewer'
  requireOneOf(owner, { filename: props.filename, label: props.label }, 'Several viewers on one page need distinct names for the code region, e.g. `filename="config.yaml"`.')
  // An empty string is valid content; a source that was never passed (or is not a string) is a mistake. The wrappers pass their own text.
  if (owner === 'CodeViewer' && typeof instance?.vnode.props?.source !== 'string') {
    violation(owner, 'requires-source', 'requires `source`, the text to show (an empty string is fine). Pass a string, for example `:source="text ?? \'\'"`.')
  }
})

const uid = useId()
const root = useTemplateRef<HTMLElement>('root')

const text = computed(() => String(props.source ?? ''))
const language = computed(() => normalizeLanguage(props.language))
const lines = computed(() => splitLines(text.value))
const tokens = computed(() => tokenize(text.value, language.value))
const regions = computed<FoldRegion[]>(() => (props.foldable ? computeFolds(lines.value, tokens.value, language.value) : []))
const first = computed(() => normaliseStartLine(props.startLine))
const lastNumber = computed(() => first.value + lines.value.length - 1)
const highlighted = computed(() => (props.highlightLines === undefined || props.highlightLines === null ? new Set<number>() : parseLineSpec(props.highlightLines, first.value, lastNumber.value)))
const gutterWidth = computed(() => `${String(lastNumber.value).length}ch`)
const variant = computed(() => (CODE_VIEWER_VARIANTS.includes(props.variant) ? props.variant : 'bordered'))
const size = computed<CodeViewerSize>(() => (CODE_VIEWER_SIZES.includes(props.size) ? props.size : 'md'))
const regionLabel = computed(() => props.label || props.filename || `${LANGUAGE_NAMES[language.value]} source`)
const showHeader = computed(() => !!props.filename || props.copy)

function initialCollapsed(list: FoldRegion[]): Set<number> {
  const out = new Set<number>()
  const depth = Number(props.defaultFoldDepth)
  if (props.defaultFoldDepth === undefined || props.defaultFoldDepth === null || Number.isNaN(depth)) return out
  const stack: FoldRegion[] = []
  for (const r of list) {
    while (stack.length && stack[stack.length - 1].end < r.start) stack.pop()
    if (stack.length >= Math.max(0, depth)) out.add(r.start)
    stack.push(r)
  }
  return out
}

const collapsed = ref<Set<number>>(new Set())
watch(
  regions,
  (list) => {
    collapsed.value = initialCollapsed(list)
  },
  { immediate: true },
)

const rows = computed(() => buildRows(lines.value.length, regions.value, collapsed.value))
const lazy = computed(() => rows.value.length > LAZY_ROWS)
const number = (line: number) => first.value + line

function setCollapsed(start: number, value: boolean) {
  const region = regions.value.find((r) => r.start === start)
  if (!region || collapsed.value.has(start) === value) return
  const next = new Set(collapsed.value)
  if (value) next.add(start)
  else next.delete(start)
  collapsed.value = next
  emit('fold', { start: number(region.start), end: number(region.end), collapsed: value })
}
function toggle(start: number, refocus = false) {
  setCollapsed(start, !collapsed.value.has(start))
  if (refocus) void nextTick(() => root.value?.querySelector<HTMLElement>(`[data-slot="code-viewer-fold"][data-index="${start}"]`)?.focus())
}
function expandAll() {
  collapsed.value = new Set()
}
function collapseAll() {
  collapsed.value = new Set(regions.value.map((r) => r.start))
}
defineExpose({ expandAll, collapseAll })

const foldName = (r: FoldRegion) => `Fold lines ${number(r.start)} to ${number(r.end)}`
const hiddenCount = (r: FoldRegion) => r.end - r.start
const placeholderText = (r: FoldRegion) => `… ${hiddenCount(r)} ${hiddenCount(r) === 1 ? 'line' : 'lines'}`
const placeholderName = (r: FoldRegion) => `${hiddenCount(r)} ${hiddenCount(r) === 1 ? 'line' : 'lines'} hidden. Unfold lines ${number(r.start)} to ${number(r.end)}`

const classes = computed(() => cn(codeViewerVariants({ variant: variant.value, size: size.value }), props.class))
</script>

<template>
  <div ref="root" data-slot="code-viewer" :data-language="language" :data-variant="variant" :data-size="size === 'md' ? undefined : size" :class="classes">
    <div v-if="showHeader" data-slot="code-viewer-header" :class="cn('flex min-h-8 shrink-0 items-center justify-between gap-2 border-b bg-muted py-1 ps-3 pe-1.5 text-xs text-muted-foreground', variant === 'plain' && 'rounded-t-md')">
      <span data-slot="code-viewer-title" class="min-w-0 truncate font-mono">{{ filename || LANGUAGE_NAMES[language] }}</span>
      <CopyButton v-if="copy" :text="text" label="Copy code" copied-label="Code copied" class="ms-auto shrink-0" @copy="(t) => emit('copy', t)" />
    </div>
    <div
      data-slot="code-viewer-scroll"
      role="region"
      tabindex="0"
      :aria-label="regionLabel"
      :style="maxHeight ? { maxHeight } : undefined"
      :class="cn('min-h-0 min-w-0 flex-1 overflow-auto focus-visible:ring-inset', focusRing)"
    >
      <div :id="`${uid}-code`" data-slot="code-viewer-code" :class="cn('py-2 font-mono', size === 'lg' ? 'leading-7' : 'leading-6', '[tab-size:4]', wrap ? 'w-full' : 'w-max min-w-full')">
        <div
          v-for="row in rows"
          :key="row.line"
          data-slot="code-viewer-line"
          :data-line="number(row.line)"
          :data-highlighted="highlighted.has(number(row.line)) ? '' : undefined"
          :data-folded="row.folded ? '' : undefined"
          :class="
            cn(
              'flex items-start border-s-4 border-transparent',
              row.region && 'pointer-coarse:min-h-11',
              highlighted.has(number(row.line)) && 'border-primary bg-primary/10',
              lazy && '[contain-intrinsic-size:auto_1.5rem] [content-visibility:auto]',
            )
          "
        >
          <span data-slot="code-viewer-gutter" class="flex shrink-0 select-none items-start">
            <span v-if="highlighted.has(number(row.line))" class="sr-only select-none">Highlighted line</span>
            <span v-if="foldable" data-slot="code-viewer-fold-cell" class="flex size-6 shrink-0 items-center justify-center pointer-coarse:size-11">
              <button
                v-if="row.region"
                type="button"
                data-slot="code-viewer-fold"
                :data-index="row.line"
                :aria-expanded="row.folded ? 'false' : 'true'"
                :aria-controls="`${uid}-code`"
                :aria-label="foldName(row.region)"
                :class="cn('inline-flex size-6 items-center justify-center rounded-sm border border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground pointer-coarse:size-11', focusRing)"
                @click="toggle(row.line)"
              >
                <Icon :icon="row.folded ? faChevronRight : faChevronDown" size="xs" />
              </button>
            </span>
            <span v-if="lineNumbers" data-slot="code-viewer-line-number" aria-hidden="true" class="select-none pe-3 text-end tabular-nums text-muted-foreground" :style="{ minWidth: gutterWidth }">{{ number(row.line) }}</span>
          </span>
          <span data-slot="code-viewer-text" :class="cn('min-w-0 flex-1 ps-1', wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre')"
            ><template v-for="(tok, i) in tokens[row.line]" :key="i"><span v-if="tok.type !== 'plain'" data-slot="code-viewer-token" :data-type="tok.type" :class="codeViewerTokenVariants({ type: tok.type })">{{ tok.text }}</span><template v-else>{{ tok.text }}</template></template
            ><button
              v-if="row.folded && row.region"
              type="button"
              data-slot="code-viewer-placeholder"
              :aria-expanded="'false'"
              :aria-controls="`${uid}-code`"
              :aria-label="placeholderName(row.region)"
              :class="cn('ms-2 inline-flex min-h-6 items-center rounded-sm border px-1.5 align-top text-xs leading-none text-muted-foreground hover:bg-accent hover:text-accent-foreground pointer-coarse:min-h-11', focusRing)"
              @click="toggle(row.line, true)"
            >{{ placeholderText(row.region) }}</button></span
          >
        </div>
      </div>
    </div>
  </div>
</template>
