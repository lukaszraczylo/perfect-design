<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'

/** Internal part of LogoCloud: one logo (image with the name as text fallback), optionally a link. */
export interface LogoCloudLogoProps extends BaseProps {
  name: string
  src?: string
  href?: string
  /** Render as a link when `href` is set. Marquee copies are not linked. */
  link?: boolean
}

const props = withDefaults(defineProps<LogoCloudLogoProps>(), { link: true })

const broken = ref(false)
watch(
  () => props.src,
  () => (broken.value = false),
)
const tag = computed(() => (props.href && props.link ? 'a' : 'span'))
</script>

<template>
  <component :is="tag" data-slot="logo-cloud-logo" :href="tag === 'a' ? href : undefined" :class="cn(focusRing, props.class)">
    <img
      v-if="src && !broken"
      :src="src"
      :alt="name"
      loading="lazy"
      class="max-h-full w-auto max-w-full object-contain"
      @error="broken = true"
    />
    <template v-else>{{ name }}</template>
  </component>
</template>
