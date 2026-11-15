<script setup lang="ts">
import { computed, onMounted, ref, useId, watch } from 'vue'
import { Primitive } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { requireText } from '../../../lib/contract'
import { focusRing } from '../../../lib/styles'
import Button from '../../primitives/Button/Button.vue'
import CodeViewer from '../CodeViewer/CodeViewer.vue'
import { useMountedCheck } from '../_shared/contract'
import DiagramCanvas from '../_diagram/DiagramCanvas.vue'
import { isVariant } from '../_diagram/palette'
import { splitSource } from '../_diagram/source'
import { DIAGRAM_TONES, DIRECTIONS, type DiagramTone, type Direction, type MermaidParseError, type RenderModel } from '../_diagram/types'
import { oneOf } from '../_chart/chartKit'
import { useMeasuredWidth } from '../_chart/useMeasuredWidth'
import { parseMermaid, type MermaidAst } from './parse'
import { renderModel } from './render'
import type { MermaidDiagramBaseProps, MermaidErrorEvent, MermaidRenderedEvent } from './types'
import { MERMAID_AUTO_MIN_SCALE, MERMAID_DENSITIES, MERMAID_EDGE_STYLES, MERMAID_FITS, MERMAID_ROUNDED, MERMAID_SIZES, mermaidDiagramVariants } from './variants'

export type MermaidDiagramProps = MermaidDiagramBaseProps

const props = withDefaults(defineProps<MermaidDiagramProps>(), {
  variant: 'outline',
  size: 'md',
  density: 'comfortable',
  edgeStyle: 'curved',
  rounded: 'md',
  tone: 'neutral',
  fit: 'width',
  showSource: false,
  showCode: false,
  showTable: false,
  maxNodes: 300,
  maxEdges: 600,
  as: 'figure',
})
const emit = defineEmits<{
  /** The source could not be drawn: syntax error, unsupported type, empty input or a size limit. */
  error: [event: MermaidErrorEvent]
  /** The diagram was drawn (also after every change that redraws it). */
  rendered: [event: MermaidRenderedEvent]
}>()

useMountedCheck(
  () => requireText('MermaidDiagram', 'source', props.source, 'Pass the Mermaid text, for example `source="flowchart TD\\n  A[Start] --> B[Done]"`.'),
  [() => props.source],
)

const uid = useId()
const variant = computed(() => (isVariant(props.variant) ? props.variant : 'outline'))
const size = computed(() => oneOf(props.size, MERMAID_SIZES, 'md'))
const density = computed(() => oneOf(props.density, MERMAID_DENSITIES, 'comfortable'))
const edgeStyle = computed(() => oneOf(props.edgeStyle, MERMAID_EDGE_STYLES, 'curved'))
const rounded = computed(() => oneOf(props.rounded, MERMAID_ROUNDED, 'md'))
const tone = computed<DiagramTone>(() => oneOf(props.tone, DIAGRAM_TONES, 'neutral'))
const requestedFit = computed(() => oneOf(props.fit, MERMAID_FITS, 'width'))
// `auto` measures the room the diagram has: below the minimum scale it scrolls at natural size instead of shrinking its text
const box = ref<HTMLElement | null>(null)
const available = useMeasuredWidth(box)
const fit = computed<'width' | 'scroll'>(() => {
  if (requestedFit.value !== 'auto') return requestedFit.value
  const natural = model.value?.width ?? 0
  return available.value > 0 && natural > 0 && available.value / natural < MERMAID_AUTO_MIN_SCALE ? 'scroll' : 'width'
})
const direction = computed<Direction | undefined>(() => (DIRECTIONS.includes(props.direction as Direction) ? props.direction : undefined))
const limit = (n: unknown, fallback: number) => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback)

interface Drawn {
  ast: MermaidAst
  model: RenderModel
}
interface View {
  drawn?: Drawn
  error?: MermaidParseError
}

const view = computed<View>(() => {
  const parsed = parseMermaid(props.source)
  if (!parsed.ok) return { error: parsed.errors[0] }
  const result = renderModel(parsed.ast, {
    direction: direction.value,
    edgeStyle: edgeStyle.value,
    size: size.value,
    density: density.value,
    rounded: rounded.value,
    tone: tone.value,
    maxNodes: limit(props.maxNodes, 300),
    maxEdges: limit(props.maxEdges, 600),
  })
  if (!result.ok) {
    // errors found while drawing (limits, empty diagrams) carry a line number but not its text
    const lines = splitSource(props.source)
    const at = Math.min(Math.max(result.error.line, 1), lines.length) - 1
    return { error: { ...result.error, sourceLine: lines[at] as string } }
  }
  return { drawn: { ast: parsed.ast, model: result.model } }
})

const model = computed(() => view.value.drawn?.model)
const error = computed(() => view.value.error)

const visibleTitle = computed(() => props.title?.trim() || model.value?.title || view.value.drawn?.ast.meta.title || undefined)
const accessibleName = computed(() => props.title?.trim() || view.value.drawn?.ast.meta.accTitle || visibleTitle.value || model.value!.summary)
const accessibleDescription = computed(() => {
  const explicit = props.description?.trim() || view.value.drawn?.ast.meta.accDescr
  if (explicit) return explicit
  return accessibleName.value === model.value?.summary ? undefined : model.value?.summary
})

const sourceOpen = ref(props.showSource || props.showCode)
const textOpen = ref(props.showTable)
watch(() => props.showSource || props.showCode, (v) => (sourceOpen.value = v))
watch(() => props.showTable, (v) => (textOpen.value = v))

const emitView = () => {
  const e = error.value
  if (e) emit('error', { message: e.message, line: e.line, column: e.column })
  else if (model.value) emit('rendered', { type: model.value.type, nodes: model.value.nodes, edges: model.value.edges })
}
onMounted(emitView)
watch(view, emitView, { flush: 'post' })

const classes = computed(() => cn(mermaidDiagramVariants({ variant: variant.value, size: size.value, density: density.value }), props.class))
const captionTag = computed(() => (props.as === 'figure' ? 'figcaption' : 'div'))

// These are read only while an error is shown (the template guards them with v-if="error").
const errorTitle = computed(() => {
  const e = error.value!
  if (e.code === 'unsupported') return `Diagram type not supported: ${e.diagramType}`
  if (e.code === 'empty') return 'Nothing to draw'
  if (e.code === 'limit') return 'Diagram is too large'
  return `Syntax error at line ${e.line}, column ${e.column}`
})
const quiet = computed(() => error.value!.code === 'unsupported' || error.value!.code === 'empty')
const caret = computed(() => ' '.repeat(Math.max(0, error.value!.column - 1)) + '^')
const showCaret = computed(() => error.value!.code === 'syntax' && !!error.value!.sourceLine)
const showLine = computed(() => !!error.value!.sourceLine && error.value!.code !== 'empty')
const textId = computed(() => `${uid}-text`)
const sourceId = computed(() => `${uid}-source`)
</script>

<template>
  <Primitive
    :as="as"
    data-slot="mermaid-diagram"
    :data-variant="variant"
    :data-size="size"
    :data-density="density"
    :data-edge-style="edgeStyle"
    :data-tone="tone === 'neutral' ? undefined : tone"
    :data-state="error ? 'error' : 'ready'"
    :data-fit="model ? fit : undefined"
    :data-type="model?.type"
    :class="classes"
  >
    <component :is="captionTag" v-if="visibleTitle && !error" data-slot="mermaid-diagram-title" aria-hidden="true" class="font-medium text-foreground">{{ visibleTitle }}</component>

    <div
      v-if="error"
      data-slot="mermaid-diagram-error"
      :data-code="error.code"
      :role="quiet ? 'status' : 'alert'"
      :class="cn('min-w-0 rounded-md border p-3', quiet ? 'border-border bg-muted' : 'border-destructive bg-destructive/10')"
    >
      <p data-slot="mermaid-diagram-error-title" class="font-medium">{{ errorTitle }}</p>
      <p data-slot="mermaid-diagram-error-message" class="mt-1 break-words">{{ error.message }}</p>
      <pre v-if="showLine" data-slot="mermaid-diagram-error-line" role="group" tabindex="0" aria-label="Source line with the error" :class="cn('mt-2 overflow-x-auto rounded-sm bg-card p-2 font-mono text-xs', focusRing)"><code>{{ error.line }} | {{ error.sourceLine }}</code><template v-if="showCaret">{{ '\n' }}<span aria-hidden="true" class="text-destructive">{{ ' '.repeat(String(error.line).length + 3) + caret }}</span></template></pre>
    </div>

    <template v-else-if="model">
      <div ref="box" data-slot="mermaid-diagram-box" class="min-w-0">
        <div
          v-if="fit === 'scroll'"
          data-slot="mermaid-diagram-viewport"
          role="region"
          tabindex="0"
          :aria-label="`${accessibleName}, scrollable diagram`"
          :class="cn('min-w-0 overflow-auto rounded-sm', focusRing)"
        >
          <DiagramCanvas :model="model" :variant="variant" fit="scroll" :uid="uid" :title="accessibleName" :description="accessibleDescription" />
        </div>
        <div v-else data-slot="mermaid-diagram-viewport" class="flex min-w-0 justify-center">
          <DiagramCanvas :model="model" :variant="variant" fit="width" :uid="uid" :title="accessibleName" :description="accessibleDescription" />
        </div>
      </div>

      <div
        :id="textId"
        data-slot="mermaid-diagram-text"
        :class="textOpen ? 'min-w-0 rounded-sm border border-border bg-background p-3' : 'sr-only'"
      >
        <template v-for="section in model.alt.sections" :key="section.title">
          <p class="font-medium">{{ section.title }}</p>
          <ol v-if="section.ordered" class="mb-2 list-decimal ps-5">
            <li v-for="(item, i) in section.items" :key="i">{{ item }}</li>
          </ol>
          <ul v-else class="mb-2 list-disc ps-5">
            <li v-for="(item, i) in section.items" :key="i">{{ item }}</li>
          </ul>
        </template>
      </div>
    </template>

    <div v-if="sourceOpen" :id="sourceId" data-slot="mermaid-diagram-source" class="min-w-0">
      <CodeViewer :source="source" language="plain" filename="diagram.mmd" label="Mermaid source" :line-numbers="true" :foldable="false" />
    </div>

    <div v-if="model || error" data-slot="mermaid-diagram-controls" class="flex flex-wrap items-center gap-1">
      <Button
        v-if="model"
        variant="ghost"
        size="xs"
        :aria-expanded="textOpen"
        :aria-controls="textId"
        @click="textOpen = !textOpen"
      >{{ textOpen ? 'Hide text version' : 'Show as text' }}</Button>
      <Button
        variant="ghost"
        size="xs"
        :aria-expanded="sourceOpen"
        :aria-controls="sourceId"
        @click="sourceOpen = !sourceOpen"
      >{{ sourceOpen ? 'Hide source' : 'Show source' }}</Button>
    </div>
  </Primitive>
</template>
