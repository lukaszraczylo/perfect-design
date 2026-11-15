import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import Leaderboard from './Leaderboard.vue'
import { Leaderboard as FromBarrel, leaderboardVariants } from './index'
import { buildRows, toFormatOptions, avatarParts, validId } from './helpers'

const E = [
  { id: 'a', label: 'Team A', value: 30 },
  { id: 'b', label: 'Team B', value: 20 },
  { id: 'c', label: 'Team C', value: 20 },
  { id: 'd', label: 'Team D', value: 10 },
]
const mk = (props: Record<string, unknown> = {}, opts: Record<string, unknown> = {}) => mount(Leaderboard, { props: { label: 'Scores', entries: E, ...props } as never, ...opts })
const items = (w: ReturnType<typeof mk>) => w.findAll('[data-slot="leaderboard-item"]')
const ranks = (w: ReturnType<typeof mk>) => items(w).map((i) => i.find('[data-slot="leaderboard-rank"]').text().replace(/^Rank\s*/, ''))

describe('Leaderboard', () => {
  describe('good path', () => {
    it('is an ordered list with one li per entry, labels and formatted values', () => {
      const w = mk()
      expect(w.element.tagName).toBe('OL')
      expect(w.attributes('data-slot')).toBe('leaderboard')
      expect(w.attributes('aria-label')).toBe('Scores')
      expect(items(w)).toHaveLength(4)
      expect(items(w).map((i) => i.find('[data-slot="leaderboard-label"]').text())).toEqual(['Team A', 'Team B', 'Team C', 'Team D'])
      expect(items(w)[0]!.find('[data-slot="leaderboard-value"]').text()).toBe('30')
    })
    it('sorts descending by default, stable for equal values', () => {
      const w = mk({ entries: [E[3], E[2], E[1], E[0]] })
      expect(items(w).map((i) => i.find('[data-slot="leaderboard-label"]').text())).toEqual(['Team A', 'Team C', 'Team B', 'Team D'])
    })
    it('hides the rank with showRank=false', () => {
      expect(mk({ showRank: false }).find('[data-slot="leaderboard-rank"]').exists()).toBe(false)
    })
    it('exports the barrel and variants', () => {
      expect(FromBarrel).toBe(Leaderboard)
      expect(leaderboardVariants()).toContain('flex-col')
    })
    it('formats values with valueFormat and locale', () => {
      const w = mk({ valueFormat: { format: 'currency', currency: 'EUR', maximumFractionDigits: 0 }, locale: 'de-DE', entries: [{ id: 1, label: 'A', value: 1234 }] })
      expect(w.find('[data-slot="leaderboard-value"]').text().replace(/\s/g, ' ')).toBe('1.234 €')
    })
    it('passes the formatted text to the value slot and the entry to the entry slot', () => {
      const w = mk(
        { valueFormat: { format: 'percent' }, entries: [{ id: 1, label: 'A', value: 0.5 }] },
        { slots: { value: '<template #value="{ formatted, rank }">{{ formatted }}/{{ rank }}</template>', entry: '<template #entry="{ entry, highlighted }"><b>{{ entry.label }}{{ highlighted }}</b></template>' } },
      )
      expect(w.find('[data-slot="leaderboard-value"]').text()).toBe('50%/1')
      expect(w.find('b').text()).toBe('Afalse')
    })
  })

  describe('ranking', () => {
    it('competition ties (default): 1 2 2 4', () => expect(ranks(mk())).toEqual(['1', '2', '2', '4']))
    it('dense ties: 1 2 2 3', () => expect(ranks(mk({ ties: 'dense' }))).toEqual(['1', '2', '2', '3']))
    it('no ties: by position', () => expect(ranks(mk({ ties: 'none' }))).toEqual(['1', '2', '3', '4']))
    it('marks tied rows', () => {
      const w = mk()
      expect(items(w).map((i) => i.attributes('data-tied') !== undefined)).toEqual([false, true, true, false])
    })
    it('asc: the lowest value is rank 1', () => {
      const w = mk({ sort: 'asc' })
      expect(items(w).map((i) => i.find('[data-slot="leaderboard-label"]').text())).toEqual(['Team D', 'Team B', 'Team C', 'Team A'])
      expect(ranks(w)).toEqual(['1', '2', '2', '4'])
    })
    it('sort none keeps the given order, ranks follow the highest value', () => {
      const w = mk({ sort: 'none', entries: [E[3], E[0], E[1]] })
      expect(items(w).map((i) => i.find('[data-slot="leaderboard-label"]').text())).toEqual(['Team D', 'Team A', 'Team B'])
      expect(ranks(w)).toEqual(['3', '1', '2'])
    })
    it('an entry rank overrides the computed one', () => {
      const w = mk({ entries: [{ ...E[0], rank: 5 }, E[1]] })
      expect(ranks(w)).toEqual(['5', '2'])
    })
    it('ignores invalid rank overrides', () => {
      const w = mk({ entries: [{ ...E[0], rank: 0 }, { ...E[1], rank: 1.5 }, { ...E[3], rank: Number.NaN }] })
      expect(ranks(w)).toEqual(['1', '2', '3'])
    })
  })

  describe('highlight, delta, bars', () => {
    it('highlight sets aria-current and visible text', () => {
      const w = mk({ highlight: 'b' })
      const hit = items(w).filter((i) => i.attributes('aria-current') === 'true')
      expect(hit).toHaveLength(1)
      expect(hit[0]!.find('[data-slot="leaderboard-label"]').text()).toBe('Team B')
      expect(hit[0]!.find('[data-slot="leaderboard-highlight"]').text()).toBe('Selected')
      expect(hit[0]!.classes()).toContain('bg-muted')
    })
    it('highlightLabel is configurable and an unknown highlight marks nothing', () => {
      expect(mk({ highlight: 'a', highlightLabel: 'Your team' }).find('[data-slot="leaderboard-highlight"]').text()).toBe('Your team')
      expect(mk({ highlight: 'zzz' }).find('[data-slot="leaderboard-highlight"]').exists()).toBe(false)
      expect(mk({ highlight: 1 }).find('[aria-current]').exists()).toBe(false)
    })
    it('highlight compares ids strictly (1 is not "1")', () => {
      expect(mk({ highlight: '1', entries: [{ id: 1, label: 'One', value: 1 }] }).find('[aria-current]').exists()).toBe(false)
      expect(mk({ highlight: 1, entries: [{ id: 1, label: 'One', value: 1 }] }).find('[aria-current]').exists()).toBe(true)
    })
    it('delta is an arrow icon and a signed number', () => {
      const w = mk({ entries: [{ id: 1, label: 'A', value: 5, delta: 3 }, { id: 2, label: 'B', value: 4, delta: -2 }, { id: 3, label: 'C', value: 3, delta: 0 }, { id: 4, label: 'D', value: 2 }] })
      const d = w.findAll('[data-slot="leaderboard-delta"]')
      expect(d.map((x) => x.attributes('data-direction'))).toEqual(['up', 'down', 'flat'])
      expect(d.map((x) => x.text())).toEqual(['+3', '-2', '0'])
      for (const x of d) expect(x.find('svg').attributes('aria-hidden')).toBe('true')
      expect(d[0]!.classes()).toContain('text-success')
      expect(d[1]!.classes()).toContain('text-destructive')
    })
    it('a non-finite delta is not shown', () => {
      expect(mk({ entries: [{ id: 1, label: 'A', value: 5, delta: Number.NaN }] }).find('[data-slot="leaderboard-delta"]').exists()).toBe(false)
    })
    it('bars are proportional, decorative and off by default', () => {
      expect(mk().find('[data-slot="leaderboard-bar"]').exists()).toBe(false)
      const w = mk({ bars: true })
      const bars = w.findAll('[data-slot="leaderboard-bar"]')
      expect(bars).toHaveLength(4)
      expect(bars[0]!.attributes('aria-hidden')).toBe('true')
      expect(bars.map((b) => b.find('span').attributes('style'))).toEqual(['width: 100%;', 'width: 66.6667%;', 'width: 66.6667%;', 'width: 33.3333%;'])
    })
    it('bars: negative, zero-max and non-finite values draw an empty bar', () => {
      const w = mk({ bars: true, entries: [{ id: 1, label: 'A', value: -5 }, { id: 2, label: 'B', value: Number.NaN }] })
      expect(w.findAll('[data-slot="leaderboard-bar"] span').map((s) => s.attributes('style'))).toEqual(['width: 0%;', 'width: 0%;'])
    })
  })

  describe('avatars', () => {
    it('shows initials from the label, an explicit fallback or an image, always decorative', () => {
      const w = mk({ entries: [{ id: 1, label: 'Team A', value: 3, avatar: { fallback: 'XY' } }, { id: 2, label: 'Region 3', value: 2, avatar: { src: 'data:image/svg+xml,%3Csvg%2F%3E' } }, { id: 3, label: 'Plain', value: 1, avatar: { src: '' } }, { id: 4, label: 'Str', value: 0, avatar: 'data:image/svg+xml,%3Csvg%2F%3E' }, { id: 5, label: 'None', value: -1, avatar: '  ' }] })
      const av = w.findAll('[data-slot="avatar"]')
      expect(av).toHaveLength(4)
      expect(av[0]!.text()).toBe('XY')
      expect(av[1]!.find('img').attributes('src')).toContain('data:image/svg+xml')
      expect(av[1]!.find('img').attributes('alt')).toBe('')
      expect(av[2]!.text()).toBe('P')
      expect(av[3]!.find('img').exists()).toBe(true)
      expect(w.findAll('[data-slot="avatar"]').every((a) => a.element.parentElement!.getAttribute('aria-hidden') === 'true')).toBe(true)
    })
  })

  describe('table variant', () => {
    const t = (props: Record<string, unknown> = {}) => mk({ variant: 'table', ...props })
    it('is a focusable named region around a real table with caption and scoped headers', () => {
      const w = t({ entries: [{ ...E[0], delta: 2 }, E[1]] })
      expect(w.attributes('role')).toBe('region')
      expect(w.attributes('tabindex')).toBe('0')
      expect(w.attributes('aria-label')).toBe('Scores')
      expect(w.classes()).toContain('overflow-x-auto')
      expect(w.find('caption').text()).toBe('Scores')
      expect(w.find('table').attributes('aria-label')).toBeUndefined()
      const cols = w.findAll('thead th')
      expect(cols.map((c) => c.text())).toEqual(['Rank', 'Name', 'Value', 'Change'])
      expect(cols.every((c) => c.attributes('scope') === 'col')).toBe(true)
      const rows = w.findAll('tbody tr')
      expect(rows).toHaveLength(2)
      expect(rows[0]!.find('th').attributes('scope')).toBe('row')
      expect(rows[0]!.find('th').text()).toBe('Team A')
    })
    it('omits the change column without deltas and the rank column with showRank=false', () => {
      const w = t({ showRank: false })
      expect(w.findAll('thead th').map((c) => c.text())).toEqual(['Name', 'Value'])
    })
    it('uses custom column labels', () => {
      expect(t({ columnLabels: { rank: 'No.', name: 'Region', value: 'Orders' } }).findAll('thead th').map((c) => c.text())).toEqual(['No.', 'Region', 'Orders'])
    })
    it('names the table from aria-labelledby or aria-label when there is no label prop', () => {
      const a = mk({ variant: 'table', label: undefined, 'aria-labelledby': 'h1' })
      expect(a.find('table').attributes('aria-labelledby')).toBe('h1')
      expect(a.find('caption').exists()).toBe(false)
      expect(mk({ variant: 'table', label: undefined, 'aria-label': 'Named' }).find('table').attributes('aria-label')).toBe('Named')
    })
    it('highlights a row, shows delta, bars, avatar and value slot', () => {
      const w = t({ highlight: 'a', bars: true, entries: [{ ...E[0], delta: -4, avatar: { fallback: 'TA' } }, E[1]] })
      const row = w.find('tbody tr')
      expect(row.attributes('aria-current')).toBe('true')
      expect(row.find('[data-slot="leaderboard-highlight"]').text()).toBe('Selected')
      expect(row.find('[data-slot="leaderboard-delta"]').text()).toBe('-4')
      expect(row.find('[data-slot="avatar"]').text()).toBe('TA')
      expect(w.findAll('[data-slot="leaderboard-bar"]')).toHaveLength(2)
      const s = t({ entries: [E[0]] }) 
      expect(s.find('td[data-slot="leaderboard-value"]').text()).toBe('30')
      const slotted = mk({ variant: 'table', entries: [E[0]] }, { slots: { value: '<template #value="{ formatted }">v{{ formatted }}</template>', entry: '<template #entry="{ entry }"><i>{{ entry.label }}</i></template>' } })
      expect(slotted.find('td[data-slot="leaderboard-value"]').text()).toBe('v30')
      expect(slotted.find('th[scope="row"] i').text()).toBe('Team A')
    })
    it('shows "-" as the rank of an unranked value', () => {
      expect(t({ entries: [{ id: 1, label: 'A', value: Number.NaN }] }).find('td[data-slot="leaderboard-rank"]').text()).toBe('-')
    })
  })

  describe('podium variant', () => {
    const many = [...E, { id: 'e', label: 'Team E', value: 5 }, { id: 'f', label: 'Team F', value: 1 }]
    const p = (props: Record<string, unknown> = {}) => mk({ variant: 'podium', entries: many, ...props })
    it('top three keep rank order in the DOM and get visual order 2-1-3', () => {
      const w = p()
      expect(w.attributes('role')).toBe('group')
      expect(w.attributes('aria-label')).toBe('Scores')
      const top = w.findAll('[data-slot="leaderboard-podium"] > li')
      expect(top.map((i) => i.find('[data-slot="leaderboard-label"]').text())).toEqual(['Team A', 'Team B', 'Team C'])
      expect(top.map((i) => i.attributes('data-place'))).toEqual(['first', 'second', 'third'])
      expect(top[0]!.classes()).toContain('order-2')
      expect(top[1]!.classes()).toContain('order-1')
      expect(top[2]!.classes()).toContain('order-3')
      expect(w.find('[data-slot="leaderboard-podium"]').element.tagName).toBe('OL')
    })
    it('lists the rest in an ordered list below', () => {
      const w = p()
      const rest = w.find('[data-slot="leaderboard-rest"]')
      expect(rest.element.tagName).toBe('OL')
      expect(rest.findAll('li').map((i) => i.find('[data-slot="leaderboard-label"]').text())).toEqual(['Team D', 'Team E', 'Team F'])
    })
    it('renders no rest list with three or fewer entries and works with one', () => {
      expect(p({ entries: E.slice(0, 3) }).find('[data-slot="leaderboard-rest"]').exists()).toBe(false)
      expect(p({ entries: [E[0]] }).findAll('[data-slot="leaderboard-item"]')).toHaveLength(1)
    })
    it('carries rank, highlight, delta, bars, avatar and slots on both parts', () => {
      const w = p({ highlight: 'a', bars: true, entries: many.map((e, i) => ({ ...e, delta: i - 2, avatar: { fallback: `T${i}` } })) }, )
      expect(w.findAll('[data-slot="leaderboard-delta"]')).toHaveLength(6)
      expect(w.findAll('[data-slot="leaderboard-bar"]')).toHaveLength(6)
      expect(w.findAll('[data-slot="avatar"]')).toHaveLength(6)
      expect(w.find('[data-slot="leaderboard-podium"] [aria-current="true"] [data-slot="leaderboard-highlight"]').exists()).toBe(true)
      const r = p({ highlight: 'f' })
      expect(r.find('[data-slot="leaderboard-rest"] [aria-current="true"] [data-slot="leaderboard-highlight"]').exists()).toBe(true)
      expect(w.find('[data-slot="leaderboard-podium"] [data-slot="leaderboard-rank"]').text()).toBe('Rank 1')
      const s = mk({ variant: 'podium', entries: many, showRank: false }, { slots: { value: '<template #value="{ formatted }">v{{ formatted }}</template>', entry: '<template #entry="{ entry }"><i>{{ entry.label }}</i></template>' } })
      expect(s.findAll('[data-slot="leaderboard-rank"]')).toHaveLength(0)
      expect(s.findAll('i')).toHaveLength(6)
      expect(s.findAll('[data-slot="leaderboard-value"]')[0]!.text()).toBe('v30')
    })
  })

  describe('bad path and edge cases', () => {
    it('empty entries: default text, role group, name kept', () => {
      for (const entries of [[], null, undefined, 'x' as never]) {
        const w = mk({ entries })
        expect(w.attributes('role')).toBe('group')
        expect(w.attributes('aria-label')).toBe('Scores')
        expect(w.find('[data-slot="leaderboard-empty"]').text()).toBe('No entries yet.')
      }
    })
    it('empty slot and emptyText', () => {
      expect(mk({ entries: [], emptyText: 'Nothing' }).text()).toBe('Nothing')
      expect(mk({ entries: [] }, { slots: { empty: '<b>Custom</b>' } }).find('b').text()).toBe('Custom')
    })
    it('unknown variant, size, density, ties and sort fall back to the defaults', () => {
      const bad = mk({ variant: 'x', size: 'x', density: 'x', ties: 'x', sort: 'x' })
      expect(bad.html()).toBe(mk().html())
    })
    it('skips null entries and keeps going', () => {
      expect(items(mk({ entries: [null, E[0], undefined] }))).toHaveLength(1)
    })
    it('non-finite and non-numeric values show the fallback, sort last and are unranked', () => {
      const w = mk({ entries: [{ id: 1, label: 'A', value: Number.NaN }, { id: 2, label: 'B', value: 5 }, { id: 3, label: 'C', value: Infinity }, { id: 4, label: 'D', value: '7' as never }, { id: 5, label: 'E', value: undefined as never }] })
      expect(items(w).map((i) => i.find('[data-slot="leaderboard-label"]').text())).toEqual(['B', 'A', 'C', 'D', 'E'])
      expect(ranks(w)).toEqual(['1', '-', '-', '-', '-'])
      expect(items(w)[1]!.find('[data-slot="leaderboard-value"]').text()).toBe('n/a')
    })
    it('unranked values also sort last for asc', () => {
      expect(items(mk({ sort: 'asc', entries: [{ id: 1, label: 'A', value: Number.NaN }, { id: 2, label: 'B', value: 5 }] })).map((i) => i.find('[data-slot="leaderboard-label"]').text())).toEqual(['B', 'A'])
    })
    it('renders hostile text as text and truncates with a title', () => {
      const bad = '<img src=x onerror=alert(1)><script>alert(1)</script>'
      const w = mk({ entries: [{ id: 1, label: bad, value: 1 }], highlight: 1, highlightLabel: bad })
      expect(w.find('img').exists()).toBe(false)
      expect(w.find('script').exists()).toBe(false)
      const label = w.find('[data-slot="leaderboard-label"]')
      expect(label.text()).toBe(bad)
      expect(label.attributes('title')).toBe(bad)
      expect(label.classes()).toEqual(expect.arrayContaining(['min-w-0', 'truncate']))
      expect(w.find('[data-slot="leaderboard-highlight"]').text()).toBe(bad)
    })
    it('handles a huge list and long unicode / RTL labels', () => {
      const many = Array.from({ length: 500 }, (_, i) => ({ id: i, label: i % 2 ? 'مرحبا بالعالم'.repeat(10) : `Team ${i}`, value: i }))
      const w = mk({ entries: many })
      expect(items(w)).toHaveLength(500)
      expect(ranks(w)[0]).toBe('1')
      expect(ranks(w)[499]).toBe('500')
    })
    it('uses logical alignment, no physical left/right utilities', () => {
      const html = mk({ variant: 'table', bars: true, highlight: 'a', entries: [{ ...E[0], delta: 1 }] }).html() + mk({ variant: 'podium' }).html()
      expect(html).not.toMatch(/\b(?:ml|mr|pl|pr|left|right|text-left|text-right)-/)
    })
    it('class wins and attributes fall through', () => {
      const w = mk({ class: 'max-w-xs rounded-none', id: 'lb', 'data-test': 'x' })
      expect(w.classes()).toContain('max-w-xs')
      expect(w.classes()).not.toContain('max-w-full')
      expect(w.attributes('id')).toBe('lb')
      expect(w.attributes('data-test')).toBe('x')
      expect(mk({ variant: 'table', class: 'max-w-xs' }).classes()).toContain('max-w-xs')
      expect(mk({ variant: 'podium', class: 'max-w-xs' }).classes()).toContain('max-w-xs')
      expect(mk({ entries: [], class: 'max-w-xs' }).classes()).toContain('max-w-xs')
    })
    it('aria-labelledby names it when there is no label', () => {
      const w = mount(defineComponent({ render: () => h('div', [h('h2', { id: 'hh' }, 'Heading'), h(Leaderboard as never, { entries: E, 'aria-labelledby': 'hh' })]) }), { attachTo: document.body })
      expect(w.find('ol').attributes('aria-labelledby')).toBe('hh')
      expect(w.find('ol').attributes('aria-label')).toBeUndefined()
      w.unmount()
    })
    it('sizes the empty state too', () => {
      expect(mk({ entries: [], size: 'sm' }).classes()).toContain('text-xs')
      expect(mk({ entries: [], size: 'lg' }).classes()).toContain('text-base')
    })
  })

  describe('helpers', () => {
    it('buildRows ranks dense, competition and none and flags ties', () => {
      const v = (ties: 'competition' | 'dense' | 'none') => buildRows(E, 'desc', ties).map((r) => r.rank)
      expect(v('competition')).toEqual([1, 2, 2, 4])
      expect(v('dense')).toEqual([1, 2, 2, 3])
      expect(v('none')).toEqual([1, 2, 3, 4])
      expect(buildRows(E, 'desc', 'none').some((r) => r.tied)).toBe(false)
    })
    it('dedupes colliding keys', () => {
      expect(buildRows([{ id: 1, label: 'A', value: 1 }, { id: 1, label: 'B', value: 2 }], 'desc', 'none').map((r) => r.key)).toEqual(['1', '1~'])
    })
    it('validId, avatarParts and toFormatOptions', () => {
      expect(validId('a')).toBe(true)
      expect(validId(0)).toBe(true)
      expect(validId(' ')).toBe(false)
      expect(validId(Number.NaN)).toBe(false)
      expect(validId(undefined)).toBe(false)
      expect(avatarParts(undefined)).toBeNull()
      expect(avatarParts('x')).toEqual({ src: 'x' })
      expect(toFormatOptions({ format: 'percent', unit: 'meter' }, 'fr')).toMatchObject({ style: 'percent', unit: 'meter', locale: 'fr' })
      expect(toFormatOptions(undefined, undefined).style).toBeUndefined()
    })
  })
})
