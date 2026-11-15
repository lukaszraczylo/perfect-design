<script setup lang="ts">
import { computed } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import {
  sectionDividers,
  sectionPaddings,
  sectionTones,
  sectionVariants,
  type SectionDivider,
  type SectionPadding,
  type SectionTone,
} from './variants'

export interface SectionProps extends BaseProps {
  /** Vertical padding preset (`none` | `xs` | `sm` | `md` | `lg` | `xl`). Unknown values fall back to `md`. */
  padding?: SectionPadding
  /** Background: `none` (transparent), `muted`, `card`, or `primary`. Flat token colours only. Unknown values (including the removed `gradient` and `pattern`) fall back to `none`. */
  tone?: SectionTone
  /** Adds top and bottom borders. Superseded by `divider` when that is set. */
  bordered?: boolean
  /** Border on `top`, `bottom` or `both` edges. Unknown values are ignored (then `bordered` applies). */
  divider?: SectionDivider
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<SectionProps>(), { padding: 'md', tone: 'none', bordered: false, as: 'section' })

const divider = computed(() => (props.divider && sectionDividers.includes(props.divider) ? props.divider : undefined))

const classes = computed(() =>
  cn(
    sectionVariants({
      padding: sectionPaddings.includes(props.padding) ? props.padding : 'md',
      tone: sectionTones.includes(props.tone) ? props.tone : 'none',
      bordered: divider.value ? false : props.bordered,
      divider: divider.value,
    }),
    props.class,
  ),
)
</script>

<template>
  <Primitive data-slot="section" :as="as" :as-child="asChild" :class="classes">
    <slot />
  </Primitive>
</template>
