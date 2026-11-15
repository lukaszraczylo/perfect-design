<script setup lang="ts">
import { computed } from 'vue'
import type { WordPart } from './diff'
import { diffWordVariants } from './variants'

/**
 * The text of one code cell. Without word parts the line is plain text; with them, changed words become `<del>` / `<ins>`.
 * `side` picks what to show: `old` keeps unchanged and removed words, `new` unchanged and added, `both` all of them.
 * Everything is interpolated as text, never as HTML.
 */
const props = defineProps<{ text: string; parts?: WordPart[] | null; side: 'old' | 'new' | 'both' }>()
const shown = computed(() => (props.parts ?? []).filter((p) => p.kind === 'eq' || props.side === 'both' || (p.kind === 'del' ? props.side === 'old' : props.side === 'new')))
const addClass = diffWordVariants({ kind: 'add' })
const delClass = diffWordVariants({ kind: 'del' })
</script>

<template><template v-if="!parts">{{ text }}</template><template v-else v-for="(p, i) in shown" :key="i"><ins v-if="p.kind === 'add'" data-slot="diff-viewer-ins" :class="addClass">{{ p.text }}</ins><del v-else-if="p.kind === 'del'" data-slot="diff-viewer-del" :class="delClass">{{ p.text }}</del><template v-else>{{ p.text }}</template></template></template>
