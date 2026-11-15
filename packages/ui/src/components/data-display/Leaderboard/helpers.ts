import type { FormatNumberOptions, NumberFormatStyle, NumberNotation, NumberSignDisplay } from '../../typography/FormattedNumber/format'

export const LEADERBOARD_VARIANTS = ['list', 'table', 'podium'] as const
export type LeaderboardVariant = (typeof LEADERBOARD_VARIANTS)[number]
export const LEADERBOARD_SIZES = ['sm', 'md', 'lg'] as const
export type LeaderboardSize = (typeof LEADERBOARD_SIZES)[number]
export const LEADERBOARD_DENSITIES = ['comfortable', 'compact'] as const
export type LeaderboardDensity = (typeof LEADERBOARD_DENSITIES)[number]
export const LEADERBOARD_TIES = ['competition', 'dense', 'none'] as const
export type LeaderboardTies = (typeof LEADERBOARD_TIES)[number]
export const LEADERBOARD_SORTS = ['desc', 'asc', 'none'] as const
export type LeaderboardSort = (typeof LEADERBOARD_SORTS)[number]

/** Avatar of an entry: an image source (an inline data URI works), or an object with an optional image and fallback text. */
export type LeaderboardAvatar = string | { src?: string; fallback?: string }

export interface LeaderboardEntry {
  /** Unique, stable id (non-empty string or finite number). Used for keys and for `highlight`. */
  id: string | number
  /** Name of the thing ranked, e.g. "Team A". */
  label: string
  /** The score. NaN, Infinity and non-numbers render the fallback text and are left unranked. */
  value: number
  /** Overrides the computed rank (a whole number from 1). */
  rank?: number
  /** Change since the last period, in the same unit as `value`. Shown as an arrow and a signed number. */
  delta?: number
  avatar?: LeaderboardAvatar
}

/** The number options of `FormattedNumber` that apply to values and deltas. */
export interface LeaderboardValueFormat {
  format?: NumberFormatStyle
  currency?: string
  unit?: string
  notation?: NumberNotation
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  signDisplay?: NumberSignDisplay
}

export interface LeaderboardRow {
  key: string
  /** Position in the displayed order. */
  index: number
  entry: LeaderboardEntry
  /** The value when it is a finite number, else null. */
  value: number | null
  /** Effective rank (override or computed), null when unranked. */
  rank: number | null
  /** Another row has the same rank. */
  tied: boolean
  /** Share of the largest value, 0..1 (for bars). */
  ratio: number
  /** The delta when it is a finite number, else null. */
  delta: number | null
}

export const finiteOrNull = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

const validRank = (v: unknown): number | null => (typeof v === 'number' && Number.isInteger(v) && v >= 1 ? v : null)

export const validId = (id: unknown): id is string | number => (typeof id === 'string' && id.trim() !== '') || (typeof id === 'number' && Number.isFinite(id))

export const avatarParts = (avatar: LeaderboardAvatar | undefined): { src?: string; fallback?: string } | null => {
  if (typeof avatar === 'string') return avatar.trim() ? { src: avatar } : null
  if (avatar && typeof avatar === 'object') return avatar
  return null
}

/** Options for `formatNumber` (the plain-string twin of FormattedNumber). */
export const toFormatOptions = (vf: LeaderboardValueFormat | undefined, locale: string | undefined): FormatNumberOptions => ({
  style: vf?.format,
  currency: vf?.currency,
  unit: vf?.unit,
  notation: vf?.notation,
  minimumFractionDigits: vf?.minimumFractionDigits,
  maximumFractionDigits: vf?.maximumFractionDigits,
  signDisplay: vf?.signDisplay,
  locale,
})

/**
 * Sort (stable; unranked values always last) and rank the entries.
 * `desc`: the highest value is rank 1. `asc`: the lowest is rank 1. `none`: keep the given order, ranks follow `desc`.
 * `competition` gives equal values the same rank and skips the next ones (1, 2, 2, 4); `dense` does not skip (1, 2, 2, 3);
 * `none` ranks by position. An entry's own `rank` always wins.
 */
export function buildRows(entries: readonly LeaderboardEntry[], sort: LeaderboardSort, ties: LeaderboardTies): LeaderboardRow[] {
  const items = entries
    .filter((e) => e && typeof e === 'object')
    .map((entry, original) => ({ entry, original, value: finiteOrNull(entry.value) }))
  const lowFirst = sort === 'asc'
  if (sort !== 'none') {
    items.sort((a, b) => {
      if (a.value === null || b.value === null) return a.value === b.value ? a.original - b.original : a.value === null ? 1 : -1
      return a.value === b.value ? a.original - b.original : lowFirst ? a.value - b.value : b.value - a.value
    })
  }
  const finite = items.map((i) => i.value).filter((v): v is number => v !== null)
  const best = (v: number) => (lowFirst ? finite.filter((o) => o < v) : finite.filter((o) => o > v))
  const max = finite.reduce((m, v) => Math.max(m, v), 0)

  const used = new Set<string>()
  const rows = items.map((item, index): LeaderboardRow => {
    let key = String(item.entry.id ?? index)
    while (used.has(key)) key += '~'
    used.add(key)
    let computed: number | null = null
    if (item.value !== null) {
      if (ties === 'none') computed = index + 1
      else if (ties === 'dense') computed = new Set(best(item.value)).size + 1
      else computed = best(item.value).length + 1
    }
    return {
      key,
      index,
      entry: item.entry,
      value: item.value,
      rank: validRank(item.entry.rank) ?? computed,
      tied: false,
      ratio: item.value !== null && max > 0 ? Math.min(1, Math.max(0, item.value / max)) : 0,
      delta: finiteOrNull(item.entry.delta),
    }
  })
  const counts = new Map<number, number>()
  for (const r of rows) if (r.rank !== null) counts.set(r.rank, (counts.get(r.rank) ?? 0) + 1)
  for (const r of rows) r.tied = r.rank !== null && (counts.get(r.rank) ?? 0) > 1
  return rows
}
