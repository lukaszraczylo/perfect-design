<script setup lang="ts">
import { computed } from 'vue'
import { violation } from '../../../lib/contract'
import CodeViewer from '../CodeViewer/CodeViewer.vue'
import { useMountedCheck } from '../_shared/contract'
import type { CodeViewerBaseProps, CodeViewerFoldEvent } from '../CodeViewer/types'
import { goLiteral, goPackageSource } from './goLiteral'

export interface GoViewerProps extends CodeViewerBaseProps {
  /** Go source text. Takes precedence over `value`. */
  source?: string
  /** Any JS value; it is rendered as a Go composite literal (`map[string]any{...}`, `[]any{...}`). Ignored when `source` is a string. */
  value?: unknown
  /** With `value`: wrap the literal in a file with this package name (`package <name>`, `var data = ...`). */
  package?: string
  /** With `value`: `natural` keeps `42` and `3.5`; `float64` writes `float64(42)` like `encoding/json` decodes. */
  numbers?: 'natural' | 'float64'
}

// `variant` and `size` come from CodeViewerBaseProps and are forwarded to CodeViewer.
const props = withDefaults(defineProps<GoViewerProps>(), { lineNumbers: true, foldable: true, startLine: 1, wrap: false, copy: true, variant: 'bordered', numbers: 'natural' })
const emit = defineEmits<{
  /** The Go text was copied to the clipboard. */
  copy: [text: string]
  /** A region was folded or unfolded. Line numbers are the displayed ones. */
  fold: [event: CodeViewerFoldEvent]
}>()

useMountedCheck(() => {
  if (props.source === undefined && props.value === undefined) {
    violation('GoViewer', 'requires-source', 'requires `source` (Go source text; an empty string is fine) or `value` (any value, rendered for you).')
  }
})

const text = computed(() => {
  if (typeof props.source === 'string') return props.source
  try {
    return props.package ? goPackageSource(props.value, { packageName: props.package, numbers: props.numbers }) : goLiteral(props.value, { numbers: props.numbers })
  } catch (e) {
    return `// Cannot render this value as a Go literal: ${e instanceof Error ? e.message : String(e)}`
  }
})
const forwarded = computed(() => {
  const { source: _s, value: _v, package: _p, numbers: _n, ...rest } = props
  return rest
})
</script>

<template>
  <CodeViewer v-bind="forwarded" data-slot="go-viewer" :source="text" language="go" @copy="(t) => emit('copy', t)" @fold="(e) => emit('fold', e)" />
</template>
