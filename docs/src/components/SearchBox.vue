<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useRouter } from 'vue-router'
import { entries } from '@/lib/registry'

const router = useRouter()
const query = ref('')
const focused = ref(false)
const active = ref(0)
// Two instances are mounted (header and mobile drawer), so ids must be per instance.
const listId = `${useId()}-results`
const optionId = (i: number) => `${listId}-${i}`
const open = computed(() => focused.value && results.value.length > 0)

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return entries
    .map((e) => {
      const hay = `${e.name} ${e.summary} ${e.subgroup} ${e.group}`.toLowerCase()
      const score = e.name.toLowerCase() === q ? 0 : e.name.toLowerCase().startsWith(q) ? 1 : e.name.toLowerCase().includes(q) ? 2 : hay.includes(q) ? 3 : 99
      return { e, score }
    })
    .filter((r) => r.score < 99)
    .sort((a, b) => a.score - b.score || a.e.name.localeCompare(b.e.name))
    .slice(0, 8)
    .map((r) => r.e)
})

function onBlur() {
  setTimeout(() => (focused.value = false), 150)
}
function go(i = active.value) {
  const hit = results.value[i]
  if (!hit) return
  router.push(`/components/${hit.group}/${hit.slug}`)
  query.value = ''
  active.value = 0
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') { e.preventDefault(); active.value = Math.min(active.value + 1, results.value.length - 1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); active.value = Math.max(active.value - 1, 0) }
  else if (e.key === 'Enter') go()
  else if (e.key === 'Escape') query.value = ''
}
</script>

<template>
  <div class="relative w-full sm:w-64">
    <input
      v-model="query"
      type="search"
      role="combobox"
      aria-label="Search components"
      aria-autocomplete="list"
      :aria-expanded="open"
      :aria-controls="open ? listId : undefined"
      :aria-activedescendant="open ? optionId(active) : undefined"
      placeholder="Search components…"
      class="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
      @focus="focused = true"
      @blur="onBlur"
      @keydown="onKey"
      @input="active = 0"
    />
    <ul v-if="open" :id="listId" role="listbox" aria-label="Matching components" class="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-popover p-1 shadow-md">
      <li v-for="(r, i) in results" :id="optionId(i)" :key="r.group + r.name" role="option" :aria-selected="i === active" class="flex w-full cursor-pointer flex-col rounded px-2 py-1.5 text-start text-sm hover:bg-accent" :class="i === active && 'bg-accent'" @mousedown.prevent="go(i)">
        <span class="font-medium">{{ r.name }}</span>
        <span class="truncate text-xs text-muted-foreground">{{ r.group }} · {{ r.subgroup }}</span>
      </li>
    </ul>
    <p v-else-if="focused && query.trim() && !results.length" class="absolute inset-x-0 top-full z-50 mt-1 rounded-md border bg-popover p-3 text-sm text-muted-foreground shadow-md">No component matches “{{ query }}”.</p>
  </div>
</template>
