<script setup lang="ts">
/** Internal part of Avatar: clips a blurred image or fallback to the avatar shape; renders its content bare otherwise. */
defineProps<{ clip: boolean }>()
</script>

<template>
  <span v-if="clip" data-slot="avatar-media" class="flex size-full items-center justify-center overflow-hidden rounded-[inherit]"><slot /></span>
  <slot v-else />
</template>
