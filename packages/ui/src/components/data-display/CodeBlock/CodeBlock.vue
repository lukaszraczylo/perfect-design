<script setup lang="ts">
import { computed, nextTick, Text, useId, useSlots } from 'vue'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import CopyButton from '../_shared/CopyButton.vue'
import { diffKind, parseHighlightLines } from './lines'
import {
  CODE_BLOCK_SIZES,
  CODE_BLOCK_VARIANTS,
  codeBlockHeaderVariants,
  codeBlockLineVariants,
  codeBlockMarkerVariants,
  codeBlockTabVariants,
  codeBlockVariants,
  type CodeBlockDiffKind,
  type CodeBlockSize,
  type CodeBlockVariant,
} from './variants'

export interface CodeBlockTab {
  /** Tab label (usually a file name). */
  label: string
  /** Source shown while the tab is active. */
  code: string
  /** Stable id used by `v-model:activeTab`. Defaults to `label`. */
  id?: string
  /** Overrides the block `language` for this tab. */
  language?: string
}

export interface CodeBlockProps extends BaseProps {
  /** Source text. When omitted, the text of the default slot is used. Ignored when `tabs` is set. */
  code?: string
  /** Label shown in the header (e.g. `ts`, `bash`) and exposed as `data-language`. No syntax highlighting is applied. */
  language?: string
  /**
   * Frame: `default` plain panel; `window` plain panel that always shows the titled header bar (file name);
   * `terminal` the same header on an inverted console surface. None draws window chrome.
   * `plain` has no frame (for use inside another surface); `flush` is full-bleed with only top and bottom rules.
   */
  variant?: CodeBlockVariant
  /** Text size: `sm` text-xs, `md` text-sm (default), `lg` text-base. Unknown values fall back to `md`. */
  size?: CodeBlockSize
  /** File name shown in the header (and as the window title). */
  filename?: string
  /** Several files in one block: renders a tablist in the header and shows the active tab's code. */
  tabs?: CodeBlockTab[]
  /** Treat the source as a unified diff: lines starting with `+` / `-` get added / removed styling and a gutter marker, `@@` lines are muted hunk headers. */
  diff?: boolean
  /** 1-based lines to emphasise: `[2, 4]` or a spec string such as `"1,3-5"`. */
  highlightLines?: number[] | string
  /** Show a line-number gutter (not copied, not selectable). */
  lineNumbers?: boolean
  /** Wrap long lines instead of scrolling horizontally. */
  wrap?: boolean
  /** Maximum height (any CSS length, e.g. `20rem`); content scrolls vertically beyond it. */
  maxHeight?: string
  /** Show the copy button. */
  copyable?: boolean
  /** Accessible name of the scrollable code region. Defaults to the file name, else `<language> code`, else `Code`. */
  label?: string
}

const props = withDefaults(defineProps<CodeBlockProps>(), { copyable: true, variant: 'default', size: 'md' })
/** Id of the active tab (`v-model:activeTab`). Works uncontrolled too. */
const activeTab = defineModel<string | undefined>('activeTab')
defineEmits<{ copy: [text: string] }>()
const slots = useSlots()
const uid = useId()

const variant = computed<CodeBlockVariant>(() => (CODE_BLOCK_VARIANTS.includes(props.variant) ? props.variant : 'default'))
const size = computed<CodeBlockSize>(() => (CODE_BLOCK_SIZES.includes(props.size) ? props.size : 'md'))
// `window` and `terminal` always show the titled header bar; the other variants only change the surface.
const framed = computed(() => variant.value === 'window' || variant.value === 'terminal')
const terminal = computed(() => variant.value === 'terminal')

const tabList = computed(() =>
  (Array.isArray(props.tabs) ? props.tabs : []).filter((t) => t && typeof t === 'object').map((t, i) => ({ ...t, key: String(t.id ?? t.label ?? i), index: i })),
)
const hasTabs = computed(() => tabList.value.length > 0)
const current = computed(() => tabList.value.find((t) => t.key === activeTab.value) ?? tabList.value[0])
const tabId = (index: number) => `${uid}-tab-${index}`

const effectiveLanguage = computed(() => (hasTabs.value ? current.value?.language ?? props.language : props.language))

function source(): string {
  if (hasTabs.value) return String(current.value?.code ?? '')
  let text = props.code
  if (text === undefined || text === null) {
    text = (slots.default?.() ?? []).map((n) => (n.type === Text && typeof n.children === 'string' ? n.children : '')).join('').replace(/^\s*\n/, '').replace(/\s+$/, '')
  }
  return String(text)
}
function lines(): string[] {
  return source().replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n')
}
interface LineView {
  text: string
  diff: CodeBlockDiffKind
  highlighted: boolean
}
const diffLabels: Record<CodeBlockDiffKind, string> = { none: '', add: 'Added: ', remove: 'Removed: ', hunk: '' }
function lineViews(all: string[]): LineView[] {
  const marked = props.highlightLines === undefined || props.highlightLines === null ? null : parseHighlightLines(props.highlightLines, all.length)
  return all.map((raw, i) => {
    const diff = props.diff ? diffKind(raw) : 'none'
    return {
      text: diff === 'add' || diff === 'remove' ? raw.slice(1) : raw,
      diff,
      highlighted: marked?.has(i + 1) ?? false,
    }
  })
}
const gutter = (count: number) => `${String(count).length}ch`
const markerChar = (diff: CodeBlockDiffKind) => (diff === 'add' ? '+' : diff === 'remove' ? '-' : '')

const showHeader = computed(() => !!props.language || props.copyable || !!props.filename || hasTabs.value || framed.value)
const classes = computed(() => cn(codeBlockVariants({ variant: variant.value, size: size.value }), props.class))
const headerClasses = computed(() => cn(codeBlockHeaderVariants({ variant: variant.value }), framed.value && 'py-2'))
const titleClasses = computed(() => cn('min-w-0 truncate font-mono', props.filename && !terminal.value && 'text-foreground'))
const copyClasses = computed(() => cn('ms-auto', terminal.value && 'text-background/70 hover:bg-background/15 hover:text-background'))
const showLanguageLabel = computed(() => (framed.value ? !props.filename : !props.filename || !!props.language))
const regionLabel = computed(() => props.label || props.filename || (effectiveLanguage.value ? `${effectiveLanguage.value} code` : 'Code'))
const dense = computed(() => !!props.diff || props.highlightLines !== undefined)

function selectTab(index: number, focus = false) {
  const t = tabList.value[index]
  if (!t) return
  activeTab.value = t.key
  if (focus) void nextTick(() => document.getElementById(tabId(index))?.focus())
}
function onTabKeydown(e: KeyboardEvent, index: number) {
  const last = tabList.value.length - 1
  const next = { ArrowRight: index >= last ? 0 : index + 1, ArrowLeft: index <= 0 ? last : index - 1, Home: 0, End: last }[e.key as 'Home']
  if (next === undefined) return
  e.preventDefault()
  selectTab(next, true)
}
</script>

<template>
  <div data-slot="code-block" :data-variant="variant === 'default' ? undefined : variant" :data-size="size === 'md' ? undefined : size" :data-language="effectiveLanguage" :class="classes" :style="maxHeight ? { maxHeight } : undefined">
    <div v-if="showHeader" data-slot="code-block-header" :class="headerClasses">
      <div v-if="hasTabs" data-slot="code-block-tabs" role="tablist" aria-label="Files" class="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        <button
          v-for="t in tabList"
          :id="tabId(t.index)"
          :key="t.key"
          type="button"
          role="tab"
          data-slot="code-block-tab"
          :aria-selected="current?.key === t.key ? 'true' : 'false'"
          :aria-controls="`${uid}-panel`"
          :tabindex="current?.key === t.key ? 0 : -1"
          :data-state="current?.key === t.key ? 'active' : 'inactive'"
          :class="codeBlockTabVariants({ variant, active: current?.key === t.key })"
          @click="selectTab(t.index)"
          @keydown="onTabKeydown($event, t.index)"
        >{{ t.label }}</button>
      </div>
      <template v-else>
        <span v-if="filename" data-slot="code-block-filename" :class="titleClasses">{{ filename }}</span>
        <span v-if="showLanguageLabel" data-slot="code-block-language" :class="cn('font-mono', filename && 'ms-1')">{{ language }}</span>
      </template>
      <CopyButton v-if="copyable" :class="copyClasses" :text="source" label="Copy code" copied-label="Code copied" @copy="(t) => $emit('copy', t)" />
    </div>
    <pre
      :id="hasTabs ? `${uid}-panel` : undefined"
      data-slot="code-block-pre"
      tabindex="0"
      :role="hasTabs ? 'tabpanel' : 'region'"
      :aria-label="hasTabs ? undefined : regionLabel"
      :aria-labelledby="hasTabs && current ? tabId(current.index) : undefined"
      :class="cn('min-h-0 flex-1 overflow-auto p-3 font-mono leading-relaxed focus-visible:ring-inset', wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre', focusRing)"
    ><code :class="cn(effectiveLanguage && `language-${effectiveLanguage}`, dense && 'block w-fit min-w-full') || undefined"><template v-for="(line, i) in lineViews(lines())" :key="i"><span data-slot="code-block-line" :data-diff="line.diff === 'none' ? undefined : line.diff" :data-highlighted="line.highlighted ? '' : undefined" :class="codeBlockLineVariants({ diff: line.diff, highlighted: line.highlighted })"><span v-if="lineNumbers" data-slot="code-block-line-number" aria-hidden="true" :class="cn('me-4 inline-block select-none text-end text-muted-foreground', terminal && 'text-background/70')" :style="{ minWidth: gutter(lines().length) }">{{ i + 1 }}</span><span v-if="line.highlighted" class="sr-only">Highlighted: </span><template v-if="diff"><span v-if="diffLabels[line.diff]" class="sr-only">{{ diffLabels[line.diff] }}</span><span data-slot="code-block-marker" aria-hidden="true" :class="codeBlockMarkerVariants({ diff: line.diff })">{{ markerChar(line.diff) }}</span></template>{{ line.text }}</span></template></code></pre>
  </div>
</template>
