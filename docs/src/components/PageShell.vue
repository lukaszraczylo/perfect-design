<script setup lang="ts">
defineProps<{ title: string; lead?: string }>()
</script>

<template>
  <article class="w-full min-w-0">
    <h1 class="min-w-0 text-4xl font-semibold tracking-tight text-balance wrap-anywhere">{{ title }}</h1>
    <p v-if="lead" class="mt-3 max-w-2xl text-md text-muted-foreground text-pretty">{{ lead }}</p>
    <div class="mt-10 space-y-12"><slot /></div>
  </article>
</template>
