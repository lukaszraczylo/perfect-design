<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { faCheck, faCopy } from '@fortawesome/free-solid-svg-icons'
import { Button, Icon } from '@ui/index'

const props = defineProps<{ code: string; label?: string }>()
const copied = ref(false)
// Unique accessible name per snippet (WCAG landmark uniqueness): the caption plus the start of the code.
const regionLabel = computed(() => `${props.label ?? 'Code'}: ${props.code.trim().split('\n')[0].slice(0, 40)}`)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), 1500)
  } catch {
    copied.value = false
  }
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="rounded-lg border bg-muted/50">
    <div v-if="label" class="border-b px-3 py-1.5 text-xs text-muted-foreground">{{ label }}</div>
    <!-- The copy button gets its own column so a long, horizontally scrolled line never runs under it. -->
    <div class="flex items-start">
      <pre tabindex="0" role="region" :aria-label="regionLabel" class="min-w-0 flex-1 overflow-x-auto p-4 font-mono text-sm leading-relaxed focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"><code>{{ code }}</code></pre>
      <Button variant="ghost" size="icon-sm" class="m-1.5 shrink-0" :aria-label="copied ? 'Copied' : 'Copy code'" @click="copy">
        <Icon :icon="copied ? faCheck : faCopy" size="sm" />
      </Button>
    </div>
  </div>
</template>
