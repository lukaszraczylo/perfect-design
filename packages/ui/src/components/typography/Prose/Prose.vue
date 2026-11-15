<script setup lang="ts">
import { computed, ref } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { useFocusableScrollers } from '../../primitives/ScrollArea/scrollable'
import { proseVariants, type ProseDensity, type ProseSize, type ProseTone } from './variants'

export interface ProseProps extends BaseProps {
  /** Base font size of the content block: `xs` 13px, `sm` 14px, `base`/`md` 16px, `lg` 18px, `xl` 20px. */
  size?: ProseSize
  /** `default`, `inverted` (foreground/background swapped) or `dark` (forces the dark palette). Both add a padded rounded surface. */
  tone?: ProseTone
  /** Vertical rhythm of headings, paragraphs, lists, code and tables: `compact`, `default` or `relaxed` (also raises line height). Unknown values fall back to `default`. */
  density?: ProseDensity
  /** Limit line length to a readable measure (`max-w-prose`, 65ch). */
  measure?: boolean
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<ProseProps>(), { size: 'base', tone: 'default', density: 'default', measure: false, as: 'div' })
const root = ref<unknown>(null)
// Wide `pre` blocks scroll inside the prose; make them keyboard reachable only while they overflow.
useFocusableScrollers(root)
const classes = computed(() => cn(proseVariants({ size: props.size, tone: props.tone, density: props.density, measure: props.measure }), props.class))
</script>

<template>
  <Primitive ref="root" data-slot="prose" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
