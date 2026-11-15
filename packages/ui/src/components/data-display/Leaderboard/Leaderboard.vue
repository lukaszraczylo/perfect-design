<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { faArrowDown, faArrowUp, faMinus } from '../../../lib/icons'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Avatar from '../../primitives/Avatar/Avatar.vue'
import { getInitials } from '../../primitives/Avatar/context'
import Icon from '../../primitives/Icon/Icon.vue'
import FormattedNumber from '../../typography/FormattedNumber/FormattedNumber.vue'
import { formatNumber } from '../../typography/FormattedNumber/format'
import { hasAriaName, hasText, useMountedCheck } from '../_shared/contract'
import {
  LEADERBOARD_DENSITIES,
  LEADERBOARD_SIZES,
  LEADERBOARD_SORTS,
  LEADERBOARD_TIES,
  LEADERBOARD_VARIANTS,
  avatarParts,
  buildRows,
  toFormatOptions,
  validId,
  type LeaderboardDensity,
  type LeaderboardEntry,
  type LeaderboardRow,
  type LeaderboardSize,
  type LeaderboardSort,
  type LeaderboardTies,
  type LeaderboardValueFormat,
  type LeaderboardVariant,
} from './helpers'
import { leaderboardCellVariants, leaderboardPodiumVariants, leaderboardRowVariants, leaderboardVariants } from './variants'

export interface LeaderboardColumnLabels {
  /** Rank column header and the hidden text before each rank. Default `Rank`. */
  rank?: string
  /** Name column header of the table. Default `Name`. */
  name?: string
  /** Value column header of the table. Default `Value`. */
  value?: string
  /** Change column header of the table. Default `Change`. */
  delta?: string
}

export interface LeaderboardProps extends BaseProps {
  /** The entries. They are sorted by `sort`; the order you pass breaks ties. */
  entries?: readonly LeaderboardEntry[] | null
  /** Accessible name of the leaderboard (also the hidden table caption). Required, or pass `aria-label` / `aria-labelledby`. */
  label?: string
  /** `list` (default, ruled rows), `table` (a real table in a focusable scroll region) or `podium` (the top three as 2-1-3 steps, the rest in a list below). Unknown values fall back to `list`. */
  variant?: LeaderboardVariant
  /** Text and avatar size: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  size?: LeaderboardSize
  /** Row spacing: `comfortable` (default) or `compact`. Unknown values fall back to `comfortable`. */
  density?: LeaderboardDensity
  /** Show the rank of every entry. */
  showRank?: boolean
  /** Id of the entry to mark. It gets `aria-current`, a tinted surface and the visible `highlightLabel`. */
  highlight?: string | number
  /** Visible text on the highlighted entry. */
  highlightLabel?: string
  /** Draw a bar under each entry, proportional to the largest value. */
  bars?: boolean
  /** Number format of values and deltas: the `format`, `currency`, `unit`, `notation` and fraction digit options of FormattedNumber. */
  valueFormat?: LeaderboardValueFormat
  /** BCP 47 locale for numbers. Defaults to `en`. */
  locale?: string
  /** `competition` (default, 1 2 2 4), `dense` (1 2 2 3) or `none` (rank by position). Unknown values fall back to `competition`. */
  ties?: LeaderboardTies
  /** `desc` (default, highest first), `asc` (lowest first, lowest is rank 1) or `none` (keep the given order). Unknown values fall back to `desc`. */
  sort?: LeaderboardSort
  /** Replacement texts for the table headers and the hidden rank prefix. */
  columnLabels?: LeaderboardColumnLabels
  /** Text when there are no entries and no `empty` slot. */
  emptyText?: string
}

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<LeaderboardProps>(), {
  entries: () => [],
  variant: 'list',
  size: 'md',
  density: 'comfortable',
  showRank: true,
  highlightLabel: 'Selected',
  bars: false,
  ties: 'competition',
  sort: 'desc',
  emptyText: 'No entries yet.',
})
defineSlots<{
  entry(props: { entry: LeaderboardEntry; rank: number | null; index: number; highlighted: boolean }): unknown
  value(props: { entry: LeaderboardEntry; rank: number | null; index: number; formatted: string }): unknown
  empty(): unknown
}>()
const attrs = useAttrs()

/* -------------------------------------------------------------------------- contract */
const list = computed<readonly LeaderboardEntry[]>(() => (Array.isArray(props.entries) ? props.entries : []))
useMountedCheck(
  () => {
    if (!hasText(props.label) && !hasAriaName(attrs)) {
      violation('Leaderboard', 'requires-accessible-name', 'needs an accessible name. Set `label` (for example `label="Sales by region"`), `aria-label` or `aria-labelledby`.')
    }
    const seen = new Set<string | number>()
    list.value.forEach((e, i) => {
      const idOk = validId(e?.id)
      if (!idOk) violation('Leaderboard', 'requires-entry-id', `entry ${i + 1} needs an \`id\` (a non-empty string or a number) that is unique in \`entries\`.`)
      else if (seen.has(e.id)) violation('Leaderboard', 'requires-unique-entry-id', `entry ids must be unique, but ${JSON.stringify(e.id)} appears twice (entry ${i + 1}). Duplicate ids break keys and \`highlight\`.`)
      if (idOk) seen.add(e.id)
      if (!hasText(e?.label)) violation('Leaderboard', 'requires-entry-label', `entry ${i + 1}${idOk ? ` (${JSON.stringify(e.id)})` : ''} needs a \`label\`, the visible name of what is ranked.`)
    })
  },
  [() => props.entries, () => props.label],
)

/* -------------------------------------------------------------------------- appearance */
const variant = computed<LeaderboardVariant>(() => (LEADERBOARD_VARIANTS.includes(props.variant) ? props.variant : 'list'))
const size = computed<LeaderboardSize>(() => (LEADERBOARD_SIZES.includes(props.size) ? props.size : 'md'))
const density = computed<LeaderboardDensity>(() => (LEADERBOARD_DENSITIES.includes(props.density) ? props.density : 'comfortable'))
const ties = computed<LeaderboardTies>(() => (LEADERBOARD_TIES.includes(props.ties) ? props.ties : 'competition'))
const sort = computed<LeaderboardSort>(() => (LEADERBOARD_SORTS.includes(props.sort) ? props.sort : 'desc'))
const LIST_AVATAR = { sm: 'xs', md: 'sm', lg: 'md' } as const
const PODIUM_AVATAR = { sm: 'sm', md: 'md', lg: 'lg' } as const
const PLACES = ['first', 'second', 'third'] as const

const rows = computed<LeaderboardRow[]>(() => buildRows(list.value, sort.value, ties.value))
const top = computed(() => (variant.value === 'podium' ? rows.value.slice(0, 3) : []))
const rest = computed(() => (variant.value === 'podium' ? rows.value.slice(3) : rows.value))
const hasDelta = computed(() => rows.value.some((r) => r.delta !== null))

const labels = computed(() => ({ rank: 'Rank', name: 'Name', value: 'Value', delta: 'Change', ...props.columnLabels }))
const numberProps = computed(() => ({ ...props.valueFormat, locale: props.locale }))
const deltaProps = computed(() => ({ ...numberProps.value, signDisplay: 'exceptZero' as const }))
const formatted = (r: LeaderboardRow) => formatNumber(r.entry.value, toFormatOptions(props.valueFormat, props.locale))
const isHighlighted = (r: LeaderboardRow) => props.highlight !== undefined && props.highlight !== null && r.entry.id === props.highlight

const deltaIcon = (d: number) => (d > 0 ? faArrowUp : d < 0 ? faArrowDown : faMinus)
const deltaDirection = (d: number) => (d > 0 ? 'up' : d < 0 ? 'down' : 'flat')
const deltaClass = (r: LeaderboardRow) =>
  cn('inline-flex shrink-0 items-center gap-1 tabular-nums', isHighlighted(r) ? 'text-foreground' : r.delta! > 0 ? 'text-success' : r.delta! < 0 ? 'text-destructive' : 'text-muted-foreground')

const rootAttrs = computed(() => ({ ...attrs, ...(hasText(props.label) ? { 'aria-label': props.label } : {}) }))
const rootClasses = computed(() => cn(leaderboardVariants({ variant: variant.value, size: size.value }), props.class))
const regionClasses = computed(() => cn(rootClasses.value, focusRing))
const rowClasses = (r: LeaderboardRow) => leaderboardRowVariants({ density: density.value, highlighted: isHighlighted(r) })
const cellClasses = computed(() => leaderboardCellVariants({ density: density.value }))
const rankClasses = 'min-w-8 shrink-0 text-end font-medium tabular-nums text-muted-foreground'
const dataSize = computed(() => (size.value === 'md' ? undefined : size.value))
const dataDensity = computed(() => (density.value === 'comfortable' ? undefined : density.value))
const avatarOf = (r: LeaderboardRow) => avatarParts(r.entry.avatar)
</script>

<template>
  <!-- Empty -->
  <div v-if="rows.length === 0" v-bind="rootAttrs" data-slot="leaderboard" data-empty="" role="group" :data-variant="variant" :class="cn('min-w-0 max-w-full text-foreground', size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm', props.class)">
    <slot name="empty">
      <p data-slot="leaderboard-empty" class="py-6 text-center text-muted-foreground">{{ emptyText }}</p>
    </slot>
  </div>

  <!-- Table -->
  <div v-else-if="variant === 'table'" v-bind="rootAttrs" data-slot="leaderboard" data-variant="table" :data-size="dataSize" :data-density="dataDensity" role="region" tabindex="0" :class="regionClasses">
    <table data-slot="leaderboard-table" class="w-full border-collapse text-start" :aria-label="hasText(label) ? undefined : (attrs['aria-label'] as string | undefined)" :aria-labelledby="hasText(label) ? undefined : (attrs['aria-labelledby'] as string | undefined)">
      <caption v-if="hasText(label)" class="sr-only">{{ label }}</caption>
      <thead>
        <tr class="border-b text-muted-foreground">
          <th v-if="showRank" scope="col" :class="cn(cellClasses, 'w-px whitespace-nowrap text-end font-medium')">{{ labels.rank }}</th>
          <th scope="col" :class="cn(cellClasses, 'text-start font-medium')">{{ labels.name }}</th>
          <th scope="col" :class="cn(cellClasses, 'whitespace-nowrap text-end font-medium')">{{ labels.value }}</th>
          <th v-if="hasDelta" scope="col" :class="cn(cellClasses, 'whitespace-nowrap text-end font-medium')">{{ labels.delta }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rows" :key="r.key" data-slot="leaderboard-item" :data-rank="r.rank ?? undefined" :data-tied="r.tied ? '' : undefined" :aria-current="isHighlighted(r) ? 'true' : undefined" :class="cn('border-b last:border-b-0', isHighlighted(r) && 'bg-muted')">
          <td v-if="showRank" data-slot="leaderboard-rank" :class="cn(cellClasses, rankClasses)">{{ r.rank ?? '-' }}</td>
          <th scope="row" :class="cn(cellClasses, 'w-full max-w-0 text-start font-normal')">
            <span class="flex min-w-0 flex-col gap-1">
              <span class="flex min-w-0 items-center gap-2">
                <span v-if="avatarOf(r)" aria-hidden="true" class="shrink-0"><Avatar alt="" :src="avatarOf(r)!.src" :fallback="avatarOf(r)!.fallback || getInitials(r.entry.label)" :size="LIST_AVATAR[size]" /></span>
                <slot name="entry" :entry="r.entry" :rank="r.rank" :index="r.index" :highlighted="isHighlighted(r)">
                  <span data-slot="leaderboard-label" class="min-w-0 truncate" :title="r.entry.label">{{ r.entry.label }}</span>
                </slot>
                <span v-if="isHighlighted(r)" data-slot="leaderboard-highlight" class="shrink-0 rounded-sm border border-primary px-1.5 text-xs font-medium">{{ highlightLabel }}</span>
              </span>
              <span v-if="bars" data-slot="leaderboard-bar" aria-hidden="true" class="block h-1.5 w-full overflow-hidden rounded-full bg-muted"><span class="block h-full rounded-full bg-primary" :style="{ width: `${r.ratio * 100}%` }" /></span>
            </span>
          </th>
          <td data-slot="leaderboard-value" :class="cn(cellClasses, 'whitespace-nowrap text-end font-medium')">
            <slot name="value" :entry="r.entry" :rank="r.rank" :index="r.index" :formatted="formatted(r)"><FormattedNumber v-bind="numberProps" :value="r.entry.value" /></slot>
          </td>
          <td v-if="hasDelta" :class="cn(cellClasses, 'whitespace-nowrap text-end')">
            <span v-if="r.delta !== null" data-slot="leaderboard-delta" :data-direction="deltaDirection(r.delta)" :class="deltaClass(r)"><Icon :icon="deltaIcon(r.delta)" size="xs" /><FormattedNumber v-bind="deltaProps" :value="r.delta" /></span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Podium: top three as 2-1-3, the rest below -->
  <div v-else-if="variant === 'podium'" v-bind="rootAttrs" data-slot="leaderboard" data-variant="podium" :data-size="dataSize" :data-density="dataDensity" role="group" :class="rootClasses">
    <ol data-slot="leaderboard-podium" role="list" class="flex min-w-0 items-end gap-2">
      <li v-for="(r, i) in top" :key="r.key" data-slot="leaderboard-item" :data-place="PLACES[i]" :data-rank="r.rank ?? undefined" :data-tied="r.tied ? '' : undefined" :aria-current="isHighlighted(r) ? 'true' : undefined" :class="leaderboardPodiumVariants({ place: PLACES[i], highlighted: isHighlighted(r) })">
        <span v-if="showRank" data-slot="leaderboard-rank" class="text-lg font-semibold tabular-nums text-muted-foreground"><span class="sr-only">{{ labels.rank }} </span>{{ r.rank ?? '-' }}</span>
        <span v-if="avatarOf(r)" aria-hidden="true" class="shrink-0"><Avatar alt="" :src="avatarOf(r)!.src" :fallback="avatarOf(r)!.fallback || getInitials(r.entry.label)" :size="PODIUM_AVATAR[size]" /></span>
        <slot name="entry" :entry="r.entry" :rank="r.rank" :index="r.index" :highlighted="isHighlighted(r)">
          <span data-slot="leaderboard-label" class="w-full min-w-0 truncate font-medium" :title="r.entry.label">{{ r.entry.label }}</span>
        </slot>
        <span v-if="isHighlighted(r)" data-slot="leaderboard-highlight" class="shrink-0 rounded-sm border border-primary px-1.5 text-xs font-medium">{{ highlightLabel }}</span>
        <span data-slot="leaderboard-value" class="max-w-full truncate font-medium">
          <slot name="value" :entry="r.entry" :rank="r.rank" :index="r.index" :formatted="formatted(r)"><FormattedNumber v-bind="numberProps" :value="r.entry.value" /></slot>
        </span>
        <span v-if="r.delta !== null" data-slot="leaderboard-delta" :data-direction="deltaDirection(r.delta)" :class="deltaClass(r)"><Icon :icon="deltaIcon(r.delta)" size="xs" /><FormattedNumber v-bind="deltaProps" :value="r.delta" /></span>
        <span v-if="bars" data-slot="leaderboard-bar" aria-hidden="true" class="block h-1.5 w-full overflow-hidden rounded-full bg-muted"><span class="block h-full rounded-full bg-primary" :style="{ width: `${r.ratio * 100}%` }" /></span>
      </li>
    </ol>
    <ol v-if="rest.length > 0" data-slot="leaderboard-rest" role="list" class="flex min-w-0 flex-col">
      <li v-for="r in rest" :key="r.key" data-slot="leaderboard-item" :data-rank="r.rank ?? undefined" :data-tied="r.tied ? '' : undefined" :aria-current="isHighlighted(r) ? 'true' : undefined" :class="rowClasses(r)">
        <span v-if="showRank" data-slot="leaderboard-rank" :class="rankClasses"><span class="sr-only">{{ labels.rank }} </span>{{ r.rank ?? '-' }}</span>
        <span v-if="avatarOf(r)" aria-hidden="true" class="shrink-0"><Avatar alt="" :src="avatarOf(r)!.src" :fallback="avatarOf(r)!.fallback || getInitials(r.entry.label)" :size="LIST_AVATAR[size]" /></span>
        <span class="flex min-w-0 flex-1 flex-col gap-1">
          <span class="flex min-w-0 items-center gap-2">
            <slot name="entry" :entry="r.entry" :rank="r.rank" :index="r.index" :highlighted="isHighlighted(r)">
              <span data-slot="leaderboard-label" class="min-w-0 truncate" :title="r.entry.label">{{ r.entry.label }}</span>
            </slot>
            <span v-if="isHighlighted(r)" data-slot="leaderboard-highlight" class="shrink-0 rounded-sm border border-primary px-1.5 text-xs font-medium">{{ highlightLabel }}</span>
          </span>
          <span v-if="bars" data-slot="leaderboard-bar" aria-hidden="true" class="block h-1.5 w-full overflow-hidden rounded-full bg-muted"><span class="block h-full rounded-full bg-primary" :style="{ width: `${r.ratio * 100}%` }" /></span>
        </span>
        <span class="flex shrink-0 items-baseline gap-2">
          <span data-slot="leaderboard-value" class="font-medium">
            <slot name="value" :entry="r.entry" :rank="r.rank" :index="r.index" :formatted="formatted(r)"><FormattedNumber v-bind="numberProps" :value="r.entry.value" /></slot>
          </span>
          <span v-if="r.delta !== null" data-slot="leaderboard-delta" :data-direction="deltaDirection(r.delta)" :class="deltaClass(r)"><Icon :icon="deltaIcon(r.delta)" size="xs" /><FormattedNumber v-bind="deltaProps" :value="r.delta" /></span>
        </span>
      </li>
    </ol>
  </div>

  <!-- List -->
  <ol v-else v-bind="rootAttrs" data-slot="leaderboard" data-variant="list" :data-size="dataSize" :data-density="dataDensity" role="list" :class="rootClasses">
    <li v-for="r in rows" :key="r.key" data-slot="leaderboard-item" :data-rank="r.rank ?? undefined" :data-tied="r.tied ? '' : undefined" :aria-current="isHighlighted(r) ? 'true' : undefined" :class="rowClasses(r)">
      <span v-if="showRank" data-slot="leaderboard-rank" :class="rankClasses"><span class="sr-only">{{ labels.rank }} </span>{{ r.rank ?? '-' }}</span>
      <span v-if="avatarOf(r)" aria-hidden="true" class="shrink-0"><Avatar alt="" :src="avatarOf(r)!.src" :fallback="avatarOf(r)!.fallback || getInitials(r.entry.label)" :size="LIST_AVATAR[size]" /></span>
      <span class="flex min-w-0 flex-1 flex-col gap-1">
        <span class="flex min-w-0 items-center gap-2">
          <slot name="entry" :entry="r.entry" :rank="r.rank" :index="r.index" :highlighted="isHighlighted(r)">
            <span data-slot="leaderboard-label" class="min-w-0 truncate" :title="r.entry.label">{{ r.entry.label }}</span>
          </slot>
          <span v-if="isHighlighted(r)" data-slot="leaderboard-highlight" class="shrink-0 rounded-sm border border-primary px-1.5 text-xs font-medium">{{ highlightLabel }}</span>
        </span>
        <span v-if="bars" data-slot="leaderboard-bar" aria-hidden="true" class="block h-1.5 w-full overflow-hidden rounded-full bg-muted"><span class="block h-full rounded-full bg-primary" :style="{ width: `${r.ratio * 100}%` }" /></span>
      </span>
      <span class="flex shrink-0 items-baseline gap-2">
        <span data-slot="leaderboard-value" class="font-medium">
          <slot name="value" :entry="r.entry" :rank="r.rank" :index="r.index" :formatted="formatted(r)"><FormattedNumber v-bind="numberProps" :value="r.entry.value" /></slot>
        </span>
        <span v-if="r.delta !== null" data-slot="leaderboard-delta" :data-direction="deltaDirection(r.delta)" :class="deltaClass(r)"><Icon :icon="deltaIcon(r.delta)" size="xs" /><FormattedNumber v-bind="deltaProps" :value="r.delta" /></span>
      </span>
    </li>
  </ol>
</template>
