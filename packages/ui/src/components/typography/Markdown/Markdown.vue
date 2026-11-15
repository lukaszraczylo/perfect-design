<script setup lang="ts">
import { computed, useSlots, watch } from 'vue'
import { cn } from '../../../lib/cn'
import { headingMap, parseMarkdown, type HeadingInfo } from './parse'
import { createContext, renderRoot, type ResolvedOptions } from './render'
import { dedent, vnodesToText } from './source'
import type { MarkdownProps } from './types'
import { MARKDOWN_SIZES, MARKDOWN_TONES, markdownVariants } from './variants'

export type { MarkdownProps } from './types'

const props = withDefaults(defineProps<MarkdownProps>(), {
  source: undefined,
  headingOffset: 0,
  headingIds: true,
  headingAnchors: false,
  idPrefix: '',
  linkTarget: undefined,
  externalTarget: undefined,
  baseUrl: undefined,
  allowedProtocols: undefined,
  highlight: true,
  codeFold: false,
  size: 'md',
  tone: 'default',
  inline: false,
  streaming: false,
  components: undefined,
  maxDepth: 32,
  maxLength: 1_000_000,
})
const emit = defineEmits<{
  /** The heading outline (`{ level, text, id }[]`, levels after `headingOffset`) changed. Feed it to `TableOfContents`. */
  headings: [headings: HeadingInfo[]]
}>()
const slots = useSlots()

const text = computed(() => (typeof props.source === 'string' ? props.source : dedent(vnodesToText(slots.default?.()))))
const ast = computed(() => parseMarkdown(text.value, { maxDepth: props.maxDepth, maxLength: props.maxLength, streaming: props.streaming, inline: props.inline }))
const size = computed(() => (MARKDOWN_SIZES.includes(props.size) ? props.size : 'md'))
const tone = computed(() => (MARKDOWN_TONES.includes(props.tone) ? props.tone : 'default'))
const nodes = computed(() => headingMap(ast.value, { headingOffset: props.headingOffset, idPrefix: props.idPrefix }))
const outline = computed(() => (props.inline ? [] : [...nodes.value.values()]))
const options = computed<ResolvedOptions>(() => ({
  headingOffset: props.headingOffset,
  headingIds: props.headingIds,
  headingAnchors: props.headingAnchors,
  idPrefix: props.idPrefix,
  linkTarget: props.linkTarget,
  externalTarget: props.externalTarget,
  baseUrl: props.baseUrl,
  allowedProtocols: props.allowedProtocols,
  highlight: props.highlight,
  codeFold: props.codeFold,
  size: size.value,
  components: props.components ?? {},
}))

watch(
  outline,
  (next, prev) => {
    const key = (list: HeadingInfo[]) => JSON.stringify(list)
    if (!prev || key(next) !== key(prev)) emit('headings', next)
  },
  { immediate: true },
)

const Rendered = () => renderRoot(ast.value, createContext(nodes.value, options.value), props.inline)
const classes = computed(() => cn(markdownVariants({ size: size.value, tone: tone.value, inline: props.inline }), props.class))
</script>

<template>
  <component :is="inline ? 'span' : 'div'" data-slot="markdown" :data-size="size" :data-streaming="streaming ? '' : undefined" :aria-busy="streaming ? 'true' : undefined" :class="classes">
    <Rendered />
  </component>
</template>
