<script setup lang="ts">
import DocText from './DocText.vue'

defineProps<{ title: string; lead?: string }>()
</script>

<template>
  <article class="w-full min-w-0">
    <h1 class="min-w-0 text-4xl font-semibold tracking-tight text-balance wrap-anywhere">{{ title }}</h1>
    <DocText v-if="lead" :text="lead" size="lg" tone="muted" class="mt-3 max-w-2xl text-pretty" />
    <div class="mt-10 space-y-12"><slot /></div>
  </article>
</template>
