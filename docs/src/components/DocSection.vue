<script setup lang="ts">
const props = defineProps<{ title: string; id?: string; description?: string }>()
const anchor = props.id ?? props.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
</script>

<template>
  <section :id="anchor" class="space-y-4">
    <h2 class="group text-2xl font-semibold tracking-tight"><a :href="`#${anchor}`" class="hover:underline">{{ title }}</a></h2>
    <p v-if="description" class="max-w-2xl text-muted-foreground">{{ description }}</p>
    <slot />
  </section>
</template>
