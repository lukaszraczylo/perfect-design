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
  <div class="relative rounded-lg border bg-muted/50">
    <div v-if="label" class="border-b px-3 py-1.5 text-xs text-muted-foreground">{{ label }}</div>
    <Button variant="ghost" size="icon-sm" class="absolute top-1.5 end-1.5" :aria-label="copied ? 'Copied' : 'Copy code'" @click="copy">
      <Icon :icon="copied ? faCheck : faCopy" size="sm" />
    </Button>
    <pre tabindex="0" role="region" :aria-label="regionLabel" class="overflow-x-auto p-4 pe-12 font-mono text-sm leading-relaxed focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"><code>{{ code }}</code></pre>
  </div>
</template>
