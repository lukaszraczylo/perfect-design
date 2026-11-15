<script setup lang="ts">
import { computed } from 'vue'
import { violation } from '../../../lib/contract'
import CodeViewer from '../CodeViewer/CodeViewer.vue'
import { useMountedCheck } from '../_shared/contract'
import type { CodeViewerBaseProps, CodeViewerFoldEvent } from '../CodeViewer/types'
import { yamlStringify } from './yamlStringify'

export interface YamlViewerProps extends CodeViewerBaseProps {
  /** Raw YAML text. Takes precedence over `value`. */
  source?: string
  /** Any JS value; it is serialised to block-style YAML. Ignored when `source` is a string. */
  value?: unknown
  /** Spaces per level when serialising `value`: 2 or 4. */
  indent?: 2 | 4
}

// `variant` and `size` come from CodeViewerBaseProps and are forwarded to CodeViewer.
const props = withDefaults(defineProps<YamlViewerProps>(), { lineNumbers: true, foldable: true, startLine: 1, wrap: false, copy: true, variant: 'bordered', indent: 2 })
const emit = defineEmits<{
  /** The YAML text was copied to the clipboard. */
  copy: [text: string]
  /** A region was folded or unfolded. Line numbers are the displayed ones. */
  fold: [event: CodeViewerFoldEvent]
}>()

useMountedCheck(() => {
  if (props.source === undefined && props.value === undefined) {
    violation('YamlViewer', 'requires-source', 'requires `source` (a YAML string; an empty string is fine) or `value` (any value, rendered for you).')
  }
})

const text = computed(() => {
  if (typeof props.source === 'string') return props.source
  try {
    return yamlStringify(props.value, { indent: props.indent })
  } catch (e) {
    return `# Cannot render this value as YAML: ${e instanceof Error ? e.message : String(e)}`
  }
})
const forwarded = computed(() => {
  const { source: _s, value: _v, indent: _i, ...rest } = props
  return rest
})
</script>

<template>
  <CodeViewer v-bind="forwarded" data-slot="yaml-viewer" :source="text" language="yaml" @copy="(t) => emit('copy', t)" @fold="(e) => emit('fold', e)" />
</template>
