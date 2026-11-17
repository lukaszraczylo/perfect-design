<script setup lang="ts">
/**
 * Renders a Markdown image inside ChatMessage. A remote picture would be fetched the moment the message appears (which lets
 * the author of the text learn that it was read), so http(s) sources become a link. Inline `data:` pictures need no request.
 */
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import { mediaBlurSoftClass, useMediaBlur } from '../../../lib/media-blur'

const props = defineProps<{ src: string; alt?: string; title?: string }>()
const blurred = useMediaBlur(() => undefined)
const inline = computed(() => /^data:/i.test(props.src))
</script>

<template>
  <img v-if="inline" data-slot="chat-message-image" :src="src" :alt="alt ?? ''" :title="title" loading="lazy" decoding="async" :data-blurred="blurred ? '' : undefined" :class="cn('my-1 h-auto max-w-full rounded-md border', mediaBlurSoftClass(blurred))" />
  <a v-else data-slot="chat-message-image-link" :href="src" :title="title" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2">{{ alt || 'Image' }}<span class="sr-only"> (image, opens in a new tab)</span></a>
</template>
