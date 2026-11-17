export interface RateCardItem {
  id?: string
  name: string
  description?: string
  /** What the rate is per, such as "per 1,000 requests". */
  unit: string
  /** A number is formatted as a price; a string is shown as written ("Custom"). */
  rate: number | string
  /** What is free before the rate applies, such as "First 10,000 free". */
  included?: string
  /** What happens beyond the included amount. */
  overage?: string
  badge?: string
  /** Section this item belongs to; see `RateCardGroup`. */
  group?: string
}

export interface RateCardGroup {
  /** Heading row text. Items join it through `item.group`. */
  group: string
  description?: string
}

export interface RateCardSection {
  group?: string
  description?: string
  items: { item: RateCardItem; key: string }[]
}

const isItem = (i: unknown): i is RateCardItem =>
  !!i && typeof i === 'object' && typeof (i as RateCardItem).name === 'string' && (i as RateCardItem).name.trim() !== '' && (typeof (i as RateCardItem).rate === 'number' || typeof (i as RateCardItem).rate === 'string')

/**
 * Items bucketed into sections. Ungrouped items come first without a heading, then `groups` in the given order, then any
 * other `item.group` names in order of first appearance. Items without a name or a number-or-text `rate` are skipped. A
 * group with no items shows no heading.
 */
export function buildSections(items: readonly RateCardItem[] | null | undefined, groups: readonly RateCardGroup[] | null | undefined): RateCardSection[] {
  const list = (Array.isArray(items) ? items : []).map((item, index) => ({ item, index })).filter(({ item }) => isItem(item))
  const order: { group?: string; description?: string }[] = [{}]
  for (const g of Array.isArray(groups) ? groups : []) {
    if (g && typeof g.group === 'string' && g.group.trim() && !order.some((o) => o.group === g.group)) order.push({ group: g.group, description: g.description })
  }
  for (const { item } of list) {
    const g = typeof item.group === 'string' && item.group.trim() ? item.group : undefined
    if (g && !order.some((o) => o.group === g)) order.push({ group: g })
  }
  return order
    .map((o) => ({
      ...o,
      items: list
        .filter(({ item }) => (typeof item.group === 'string' && item.group.trim() ? item.group : undefined) === o.group)
        .map(({ item, index }) => ({ item, key: item.id ?? `${item.name}-${index}` })),
    }))
    .filter((s) => s.items.length > 0)
}
