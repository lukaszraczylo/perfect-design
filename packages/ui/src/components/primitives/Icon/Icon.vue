<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { IconDefinition } from '../../../lib/icons-tools'
import type { BaseProps } from '../../../lib/types'

export interface IconProps extends BaseProps {
  /**
   * Any FontAwesome-shaped IconDefinition (`{ icon: [w, h, , , path] }`), e.g.
   * `import { faCheck } from '../../../lib/icons'`. Rendered as inline SVG, no FontAwesome runtime needed.
   */
  icon: IconDefinition
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Spin continuously (loading). */
  spin?: boolean
  /** When set the icon is exposed to assistive tech with this label; otherwise it is decorative (aria-hidden). */
  label?: string
}

const props = withDefaults(defineProps<IconProps>(), { size: 'md' })

const SIZES = { xs: 'size-3', sm: 'size-3.5', md: 'size-4', lg: 'size-5', xl: 'size-6' } as const
const classes = computed(() => cn('inline-block shrink-0 fill-current', SIZES[props.size] ?? SIZES.md, props.spin && 'animate-spin motion-reduce:animate-pulse', props.class))

const data = computed(() => {
  const d = props.icon?.icon
  if (!Array.isArray(d) || d.length < 5) return null
  const [w, h, , , path] = d
  const paths = Array.isArray(path) ? path : [path]
  return { w, h, paths: paths.filter((p): p is string => typeof p === 'string' && p.length > 0) }
})

const problem = computed(() => {
  const d = props.icon?.icon
  if (!Array.isArray(d) || d.length < 5) return 'is not an icon definition'
  const [w, h, , , path] = d
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 'has no valid width and height'
  const paths = Array.isArray(path) ? path : [path]
  return paths.some((p) => typeof p === 'string' && p.length > 0) ? null : 'has no path data'
})
// A malformed icon renders nothing (or an empty svg), which hides the mistake.
onMounted(async () => {
  await nextTick()
  if (problem.value) {
    violation('Icon', 'requires-icon', `requires a valid \`icon\` definition (\`{ icon: [width, height, , , path] }\`, e.g. faCheck from lib/icons), but \`icon\` ${problem.value}.`)
  }
})
</script>

<template>
  <svg
    v-if="data"
    data-slot="icon"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="`0 0 ${data.w} ${data.h}`"
    :class="classes"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label"
    :role="label ? 'img' : undefined"
    focusable="false"
  >
    <path v-for="(p, i) in data.paths" :key="i" :d="p" :class="data.paths.length > 1 && i === 0 ? 'opacity-40' : undefined" />
  </svg>
</template>
