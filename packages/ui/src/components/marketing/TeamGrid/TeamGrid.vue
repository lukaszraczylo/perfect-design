<script setup lang="ts">
import { computed, nextTick, onMounted, useSlots } from 'vue'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { checkItems, ItemsChecked } from '../shared/itemsContract'
import { pickColumns } from '../shared/motion'
import { oneOf } from '../shared/pick'
import TeamMemberCard, { type TeamMember } from './TeamMemberCard.vue'
import { teamMemberProblem } from './contract'
import {
  TEAM_ALIGNS,
  TEAM_GAPS,
  TEAM_SHAPES,
  TEAM_SIZES,
  TEAM_VARIANTS,
  teamGridVariants,
  type TeamGridColumns,
  type TeamGridGap,
  type TeamGridVariant,
  type TeamMemberAlign,
  type TeamMemberShape,
  type TeamMemberSize,
} from './variants'

/** A member for the generated cards. `size`, `shape` and `align` on a member win over the grid's own values. */
export interface TeamGridItem extends TeamMember {
  size?: TeamMemberSize
  shape?: TeamMemberShape
  align?: TeamMemberAlign
}

export interface TeamGridProps extends BaseProps {
  /** Columns on large screens (2, 3 or 4). Invalid values fall back to 3. Always 1 column on mobile, 2 from `sm`. */
  columns?: TeamGridColumns
  /** Card layout forwarded to every generated member. Unknown values fall back to `card`. */
  variant?: TeamGridVariant
  /** Space between members: `sm`, `md` (the original) or `lg`. Unknown values fall back to `md`. */
  gap?: TeamGridGap
  /** Spacing, avatar and type scale of the generated cards (`sm` | `md` | `lg`). Unknown values fall back to `md`. */
  size?: TeamMemberSize
  /** Avatar shape of the generated cards (`circle` | `rounded` | `square`). Unknown values fall back to `circle`. */
  shape?: TeamMemberShape
  /** Text alignment of the generated `card` and `minimal` cards (`start` | `center`). Unknown values fall back to `start`. */
  align?: TeamMemberAlign
  /** Members to render. For custom cards use the default slot instead. */
  items?: TeamGridItem[]
  /** Heading level used for member names. */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  /** Privacy blur on every generated member photo; names and roles stay readable. Wins over `ConfigProvider blurMedia`, true or false. */
  blurred?: boolean
}

const props = withDefaults(defineProps<TeamGridProps>(), { columns: 3, variant: 'card', gap: 'md', size: 'md', shape: 'circle', align: 'start', items: () => [], level: 3, blurred: undefined })

const slots = useSlots()
onMounted(async () => {
  await nextTick()
  if (!slots.default) checkItems('TeamGrid', 'items', props.items, teamMemberProblem)
})
const cols = computed(() => pickColumns(props.columns, [2, 3, 4] as const, 3))
const variant = computed<TeamGridVariant>(() => (TEAM_VARIANTS.includes(props.variant) ? props.variant : 'card'))
const gap = computed<TeamGridGap>(() => oneOf(props.gap, TEAM_GAPS, 'md'))
const size = computed<TeamMemberSize>(() => oneOf(props.size, TEAM_SIZES, 'md'))
const shape = computed<TeamMemberShape>(() => oneOf(props.shape, TEAM_SHAPES, 'circle'))
const align = computed<TeamMemberAlign>(() => oneOf(props.align, TEAM_ALIGNS, 'start'))
const members = computed(() => (Array.isArray(props.items) ? props.items.filter(Boolean) : []))
/** Native list semantics only when the grid renders its own cards (each wrapped in an <li>); slot content is free-form. */
const asList = computed(() => !slots.default && members.value.length > 0)
const classes = computed(() => cn(teamGridVariants({ columns: cols.value, gap: gap.value }), props.class))

/** The member's own look wins over the grid's. */
function cardProps(m: TeamGridItem): TeamGridItem {
  return { ...m, size: m.size ?? size.value, shape: m.shape ?? shape.value, align: m.align ?? align.value }
}
</script>

<template>
  <component :is="asList ? 'ul' : 'div'" data-slot="team-grid" :role="asList ? 'list' : undefined" :data-columns="cols" :data-variant="variant" :data-gap="gap" :data-size="size" :data-shape="shape" :data-align="align" :class="classes">
    <slot>
      <!-- `role` is a member field (job title), so list semantics live on the <li> wrapper, never on the card. -->
      <li v-for="(m, i) in members" :key="`${i}-${m.name}`" data-slot="team-grid-item">
        <ItemsChecked><TeamMemberCard v-bind="cardProps(m)" :variant="variant" :level="level" :blurred="blurred" class="h-full" /></ItemsChecked>
      </li>
    </slot>
  </component>
</template>
