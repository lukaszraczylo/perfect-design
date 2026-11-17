<script setup lang="ts">
import { computed, nextTick, onMounted, provide } from 'vue'
import { violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import type { IconDefinition } from '../../../lib/icons-tools'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import StatCounter from '../StatCounter/StatCounter.vue'
import { pickColumns } from '../shared/motion'
import {
  DEFAULT_ALIGN,
  STAT_TRENDS,
  resolveStatGridGap,
  resolveStatGridShape,
  resolveStatGridSize,
  resolveStatGridTone,
  resolveStatGridVariant,
  statGridItemVariants,
  statGridTrendVariants,
  statGridValueVariants,
  statGridVariants,
  type StatGridAlign,
  type StatGridGap,
  type StatGridShape,
  type StatGridSize,
  type StatGridTone,
  type StatGridVariant,
  type StatTrend,
} from './variants'

export interface StatItem {
  /** Number (formatted by StatCounter) or pre-formatted string such as "99.9%" or "24/7". */
  value: number | string
  label: string
  prefix?: string
  suffix?: string
  decimals?: number
  description?: string
  /** Shown in the `with-icons` variant. */
  icon?: IconDefinition
  /** Direction of change: draws an arrow and an sr-only "Up" / "Down" / "No change". Unknown values show no arrow. */
  trend?: StatTrend
  /** Change text next to the arrow, e.g. "+12%". */
  change?: string
}

export interface StatGridProps extends BaseProps {
  items?: StatItem[]
  /** `plain` (default: bare numbers, no boxes), `cards`, `divided` (hairlines between cells), `inline` (single wrapping row), `with-icons`. Unknown values fall back to `plain`. */
  variant?: StatGridVariant
  /** Columns from `sm` upward (2, 3 or 4). Invalid values fall back to 4. Ignored by `inline`. */
  columns?: 2 | 3 | 4
  /** Text alignment. Defaults per variant (`left` for cards and with-icons, otherwise `center`). */
  align?: StatGridAlign
  /** Figure size: `sm`, `md` (default) or `lg`; boxed variants (`cards`, `divided`) scale their padding too. Unknown values fall back to `md`. */
  size?: StatGridSize
  /** Figure colour: `default` (foreground) or `primary` (accent). Unknown values fall back to `default`. */
  tone?: StatGridTone
  /** Spacing between stats: `sm`, `md` (default) or `lg`. `divided` keeps its 1px cell borders. Unknown values fall back to `md`. */
  gap?: StatGridGap
  /** Corners of `cards` and `divided`: `rounded` (default) or `square`. Unknown values fall back to `rounded`. */
  shape?: StatGridShape
  /** @deprecated Removed with the count-up animation (LLMSlop M3). Accepted and ignored: numbers are always static. */
  animate?: boolean
}

const props = withDefaults(defineProps<StatGridProps>(), { items: () => [], variant: 'plain', columns: 4, size: 'md', tone: 'default', gap: 'md', shape: 'rounded', animate: undefined })

provide('pd:stat-grid', true)
// Reports the first broken item once, not once per item.
onMounted(async () => {
  await nextTick()
  const bad = (item: StatItem) => {
    if (!item || typeof item.label !== 'string' || item.label.trim() === '') return 'a non-empty `label`'
    if (typeof item.value === 'number' ? !Number.isFinite(item.value) : typeof item.value !== 'string' || item.value.trim() === '') return 'a finite number or non-empty string `value`'
    return ''
  }
  const i = props.items.findIndex((item) => bad(item) !== '')
  if (i !== -1) violation('StatGrid', 'requires-item-fields', `requires ${bad(props.items[i])} on every item (items[${i}] has none). A blank figure or label leaves a gap in the list.`)
})

const TREND_TEXT: Record<StatTrend, string> = { up: 'Up', down: 'Down', flat: 'No change' }
const ARROWS: Record<StatTrend, string> = { up: 'M8 13V3M3.5 7.5L8 3l4.5 4.5', down: 'M8 3v10M3.5 8.5L8 13l4.5-4.5', flat: 'M3 8h10' }

const variant = computed(() => resolveStatGridVariant(props.variant))
const cols = computed(() => pickColumns(props.columns, [2, 3, 4] as const, 4))
const align = computed<StatGridAlign>(() => (props.align === 'left' || props.align === 'center' ? props.align : DEFAULT_ALIGN[variant.value]))
const size = computed(() => resolveStatGridSize(props.size))
const tone = computed(() => resolveStatGridTone(props.tone))
const gap = computed(() => resolveStatGridGap(props.gap))
const shape = computed(() => resolveStatGridShape(props.shape))
const classes = computed(() => cn(statGridVariants({ variant: variant.value, columns: cols.value, align: align.value, gap: gap.value, shape: shape.value }), props.class))
const itemClass = computed(() => statGridItemVariants({ variant: variant.value, size: size.value, shape: shape.value }))
const valueClass = computed(() => statGridValueVariants({ variant: variant.value, size: size.value, tone: tone.value }))

const trendOf = (item: StatItem): StatTrend | undefined => (STAT_TRENDS as readonly unknown[]).includes(item.trend) ? item.trend : undefined
const changeOf = (item: StatItem): string => (typeof item.change === 'string' ? item.change.trim() : '')
</script>

<template>
  <dl data-slot="stat-grid" :data-variant="variant" :data-columns="cols" :data-size="size" :data-tone="tone" :data-gap="gap" :data-shape="shape" :class="classes">
    <div v-for="(item, i) in items" :key="i" data-slot="stat-grid-item" :class="itemClass">
      <dt data-slot="stat-grid-label" class="text-sm font-medium text-muted-foreground">{{ item.label }}</dt>
      <dd data-slot="stat-grid-value" :class="valueClass">
        <div v-if="variant === 'with-icons' && item.icon" data-slot="stat-grid-icon" :class="cn('mb-3 flex', align === 'center' && 'justify-center')">
          <Icon :icon="item.icon" size="xl" class="text-primary" />
        </div>
        <StatCounter
          v-if="typeof item.value === 'number'"
          :value="item.value"
          :prefix="item.prefix"
          :suffix="item.suffix"
          :decimals="item.decimals"
        />
        <template v-else>{{ item.prefix }}{{ item.value }}{{ item.suffix }}</template>
        <p
          v-if="trendOf(item) || changeOf(item)"
          data-slot="stat-grid-trend"
          :data-trend="trendOf(item)"
          :class="statGridTrendVariants({ trend: trendOf(item) ?? 'none', align })"
        >
          <svg
            v-if="trendOf(item)"
            viewBox="0 0 16 16"
            class="size-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path :d="ARROWS[trendOf(item)!]" />
          </svg>
          <span v-if="trendOf(item)" class="sr-only">{{ TREND_TEXT[trendOf(item)!] }}</span>
          <span v-if="changeOf(item)">{{ changeOf(item) }}</span>
        </p>
        <p v-if="item.description" data-slot="stat-grid-description" class="mt-1 text-sm font-normal tracking-normal text-muted-foreground">
          {{ item.description }}
        </p>
      </dd>
    </div>
  </dl>
</template>
