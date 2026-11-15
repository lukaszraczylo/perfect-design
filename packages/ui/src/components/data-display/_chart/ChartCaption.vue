<script setup lang="ts">
/** Internal visible caption of a chart: a title and a description. The description is wired to the image with aria-describedby. */
defineProps<{ dataSlot: string; title?: string; description?: string; descriptionId: string }>()
</script>

<template>
  <figcaption v-if="title || description" :data-slot="`${dataSlot}-caption`" class="flex min-w-0 flex-col gap-0.5">
    <span v-if="title" :data-slot="`${dataSlot}-title`" class="text-sm font-medium text-foreground">{{ title }}</span>
    <span v-if="description" :id="descriptionId" :data-slot="`${dataSlot}-description`" class="text-xs text-muted-foreground">{{ description }}</span>
  </figcaption>
</template>
