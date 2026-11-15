<script setup lang="ts">
import type { PropDoc } from '@ui/docs-types'
import DocText from './DocText.vue'
withDefaults(defineProps<{ props: PropDoc[]; /** Accessible name of the scrollable region; must be unique on the page. */ label?: string }>(), { label: 'Props' })
</script>

<template>
  <div class="overflow-x-auto rounded-lg border" tabindex="0" role="region" :aria-label="label">
    <table class="w-full text-left text-sm">
      <thead class="bg-muted/50 text-xs text-muted-foreground">
        <tr><th class="px-3 py-2 font-medium">Prop</th><th class="px-3 py-2 font-medium">Type</th><th class="px-3 py-2 font-medium">Default</th><th class="px-3 py-2 font-medium">Description</th></tr>
      </thead>
      <tbody class="divide-y">
        <tr v-for="p in props" :key="p.name">
          <td class="px-3 py-2 align-top font-mono text-sm whitespace-nowrap">{{ p.name }}<span v-if="p.required" class="ml-1 text-destructive" title="required">*</span></td>
          <td class="px-3 py-2 align-top font-mono text-xs text-muted-foreground">{{ p.type }}</td>
          <td class="px-3 py-2 align-top font-mono text-xs">{{ p.default ?? 'None' }}</td>
          <td class="px-3 py-2 align-top"><DocText :text="p.description" size="sm" /></td>
        </tr>
        <tr v-if="!props.length"><td colspan="4" class="px-3 py-4 text-center text-muted-foreground">No props. Style it with `class` and slots.</td></tr>
      </tbody>
    </table>
  </div>
</template>
