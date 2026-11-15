<script setup lang="ts">
/**
 * Renders documentation text (summaries, descriptions, prop notes) as Markdown so `code`, **bold**, lists and links show
 * as formatting instead of raw markers. Inline by default (a single line of prose); `block` for multi-paragraph text.
 */
import { Markdown } from '@ui/index'

withDefaults(defineProps<{ text: string; block?: boolean; size?: 'sm' | 'md' | 'lg'; tone?: 'default' | 'muted' }>(), { block: false, size: 'md', tone: 'default' })
</script>

<template>
  <Markdown :source="text" :inline="!block" :size="size" :tone="tone" :heading-offset="3" :highlight="true" class="max-w-none" />
</template>
