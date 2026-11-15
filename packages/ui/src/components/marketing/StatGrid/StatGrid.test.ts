import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StatGrid from './StatGrid.vue'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { STAT_GRID_VARIANTS, STAT_TRENDS, resolveStatGridVariant, statGridVariants } from './variants'
import { installIntersectionObserver, installRaf, mockMatchMedia } from '../shared/testing'

const items = [
  { value: 1200, label: 'Users', suffix: '+' },
  { value: '99.9%', label: 'Uptime', description: 'Last 12 months' },
  { value: 4.5, label: 'Rating', decimals: 1, prefix: '≈' },
]

let io: ReturnType<typeof installIntersectionObserver>
beforeEach(() => {
  io = installIntersectionObserver()
  installRaf()
  mockMatchMedia(false)
})
afterEach(() => vi.unstubAllGlobals())

describe('StatGrid', () => {
  describe('good path', () => {
    it('renders a dl with label and value per item', () => {
      const w = mount(StatGrid, { props: { items } })
      expect(w.element.tagName).toBe('DL')
      expect(w.attributes('data-slot')).toBe('stat-grid')
      expect(w.findAll('[data-slot="stat-grid-item"]')).toHaveLength(3)
      expect(w.findAll('dt').map((d) => d.text())).toEqual(['Users', 'Uptime', 'Rating'])
      expect(w.findAll('[data-slot="stat-grid-value"]')[0].text()).toBe('1,200+')
      expect(w.findAll('[data-slot="stat-grid-value"]')[1].text()).toContain('99.9%')
      expect(w.find('[data-slot="stat-grid-description"]').text()).toBe('Last 12 months')
    })
    it('is always static: the count-up was removed, so animate is ignored and no observer is created', () => {
      mount(StatGrid, { props: { items } })
      expect(io).toHaveLength(0)
      const w = mount(StatGrid, { props: { items, animate: true } })
      expect(io).toHaveLength(0)
      expect(w.attributes('animate')).toBeUndefined()
      expect(w.text()).toContain('1,200+')
    })
    it.each([
      [2, 'sm:grid-cols-2'],
      [3, 'sm:grid-cols-3'],
      [4, 'lg:grid-cols-4'],
    ] as const)('columns %s', (columns, cls) => {
      expect(mount(StatGrid, { props: { items, columns } }).classes()).toContain(cls)
    })
  })
  describe('customisation', () => {
    it('merges class and attrs', () => {
      const w = mount(StatGrid, { props: { items, class: 'gap-2 custom' }, attrs: { id: 'x' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('gap-8')
      expect(w.attributes('id')).toBe('x')
    })
  })
  describe('bad path', () => {
    it('empty items renders an empty dl', () => {
      expect(mount(StatGrid, { props: { items: [] } }).element.children).toHaveLength(0)
    })
    it('invalid columns fall back to 4', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(StatGrid, { props: { items, columns: 7 } }).attributes('data-columns')).toBe('4')
    })
    it('NaN number value shows the n/a fallback (no em dash)', () => {
      const w = mount(StatGrid, { props: { items: [{ value: Number.NaN, label: 'X' }] } })
      expect(w.find('[data-slot="stat-counter"]').text()).toBe('n/a')
    })
  })
  describe('edge cases', () => {
    it('one item and 100 items', () => {
      expect(mount(StatGrid, { props: { items: [items[0]] } }).findAll('dt')).toHaveLength(1)
      const many = Array.from({ length: 100 }, (_, i) => ({ value: i, label: `L${i}` }))
      expect(mount(StatGrid, { props: { items: many } }).findAll('dt')).toHaveLength(100)
    })
    it('long and unicode labels', () => {
      const w = mount(StatGrid, { props: { items: [{ value: '∞', label: '数'.repeat(1000) }] } })
      expect(w.find('dt').text()).toHaveLength(1000)
      expect(w.find('dd').text()).toContain('∞')
    })
  })

  describe('variants', () => {
    it('defaults to plain with the original classes', () => {
      const w = mount(StatGrid, { props: { items } })
      expect(w.attributes('data-variant')).toBe('plain')
      expect(w.classes()).toEqual(expect.arrayContaining(['grid', 'gap-8', 'text-center']))
    })
    it.each([
      ['cards', 'gap-4', 'text-start'],
      ['divided', 'gap-px', 'bg-border'],
      ['inline', 'flex-wrap', 'justify-center'],
      ['plain', 'gap-8', 'grid'],
      ['with-icons', 'gap-8', 'grid'],
    ] as const)('variant %s root classes', (variant, a, b) => {
      const w = mount(StatGrid, { props: { items, variant } })
      expect(w.attributes('data-variant')).toBe(variant)
      expect(w.classes()).toEqual(expect.arrayContaining([a, b]))
    })
    it('cards: each item is a bordered card', () => {
      const w = mount(StatGrid, { props: { items, variant: 'cards' } })
      expect(w.find('[data-slot="stat-grid-item"]').classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'bg-card']))
      expect(w.classes()).toContain('text-start')
    })
    it('divided: hairline gap trick with card-filled cells', () => {
      const w = mount(StatGrid, { props: { items, variant: 'divided' } })
      expect(w.find('[data-slot="stat-grid-item"]').classes()).toContain('bg-card')
      expect(w.classes()).toContain('text-center')
    })
    it('inline: single wrapping row, label after value, smaller value, columns ignored', () => {
      const w = mount(StatGrid, { props: { items, variant: 'inline', columns: 3 } })
      expect(w.classes().join(' ')).not.toContain('grid-cols')
      expect(w.find('[data-slot="stat-grid-item"]').classes()).toContain('flex-row-reverse')
      expect(w.find('[data-slot="stat-grid-value"]').classes()).toContain('text-2xl')
    })
    it('with-icons: renders the icon box only when an item has an icon', () => {
      const w = mount(StatGrid, { props: { items: [{ value: 5, label: 'A', icon: faUser }, { value: 6, label: 'B' }], variant: 'with-icons' } })
      const icons = w.findAll('[data-slot="stat-grid-icon"]')
      expect(icons).toHaveLength(1)
      expect(icons[0].find('svg').attributes('aria-hidden')).toBe('true')
      expect(icons[0].html()).not.toMatch(/bg-primary|rounded/)
      expect(icons[0].classes()).not.toContain('justify-center')
    })
    it('with-icons centred when align=center', () => {
      const w = mount(StatGrid, { props: { items: [{ value: 5, label: 'A', icon: faUser }], variant: 'with-icons', align: 'center' } })
      expect(w.classes()).toContain('text-center')
      expect(w.find('[data-slot="stat-grid-icon"]').classes()).toContain('justify-center')
    })
    it('icons are ignored outside with-icons', () => {
      expect(mount(StatGrid, { props: { items: [{ value: 5, label: 'A', icon: faUser }], variant: 'cards' } }).find('[data-slot="stat-grid-icon"]').exists()).toBe(false)
    })
    it('align overrides the variant default; invalid align falls back to it', () => {
      expect(mount(StatGrid, { props: { items, align: 'left' } }).classes()).toContain('text-start')
      // @ts-expect-error deliberately invalid
      expect(mount(StatGrid, { props: { items, variant: 'cards', align: 'right' } }).classes()).toContain('text-start')
    })
    it.each(['cards', 'divided', 'with-icons'] as const)('columns apply in %s', (variant) => {
      expect(mount(StatGrid, { props: { items, variant, columns: 3 } }).classes()).toContain('sm:grid-cols-3')
    })
    it('unknown variant falls back to plain', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(StatGrid, { props: { items, variant: 'fancy' } })
      expect(w.attributes('data-variant')).toBe('plain')
      expect(w.classes()).toContain('gap-8')
    })
    it('exports helpers', () => {
      expect(STAT_GRID_VARIANTS).toHaveLength(5)
      expect(resolveStatGridVariant('cards')).toBe('cards')
      expect(resolveStatGridVariant(undefined)).toBe('plain')
      expect(statGridVariants({ variant: 'divided' })).toContain('gap-px')
    })
    it('class override wins in every variant', () => {
      for (const variant of STAT_GRID_VARIANTS) {
        const w = mount(StatGrid, { props: { items, variant, class: 'gap-2 custom' } })
        expect(w.classes()).toContain('custom')
        expect(w.classes()).not.toContain('gap-8')
        expect(w.classes()).not.toContain('gap-4')
        expect(w.classes()).not.toContain('gap-px')
      }
    })
    it('attrs fall through in every variant', () => {
      for (const variant of STAT_GRID_VARIANTS) expect(mount(StatGrid, { props: { items, variant }, attrs: { 'data-x': '1' } }).attributes('data-x')).toBe('1')
    })
    it('keeps StatCounter for numbers in every variant', () => {
      for (const variant of STAT_GRID_VARIANTS) expect(mount(StatGrid, { props: { items, variant } }).findAll('[data-slot="stat-counter"]')).toHaveLength(2)
    })
  })

  describe('trend', () => {
    const t = (trend: unknown, change?: string) =>
      mount(StatGrid, { props: { items: [{ value: 10, label: 'X', trend, change } as never] } })
    it.each([
      ['up', 'Up', 'text-success'],
      ['down', 'Down', 'text-destructive'],
      ['flat', 'No change', 'text-muted-foreground'],
    ] as const)('trend %s shows an arrow, sr text and colour', (trend, sr, cls) => {
      const w = t(trend, '+12%')
      const el = w.find('[data-slot="stat-grid-trend"]')
      expect(el.attributes('data-trend')).toBe(trend)
      expect(el.classes()).toContain(cls)
      expect(el.find('svg').attributes('aria-hidden')).toBe('true')
      expect(el.find('.sr-only').text()).toBe(sr)
      expect(el.text()).toContain('+12%')
    })
    it('trend without change still announces direction', () => {
      const el = t('up').find('[data-slot="stat-grid-trend"]')
      expect(el.find('.sr-only').text()).toBe('Up')
      expect(el.findAll('span')).toHaveLength(1)
    })
    it('change without trend shows muted text and no arrow', () => {
      const el = t(undefined, '  3 new  ').find('[data-slot="stat-grid-trend"]')
      expect(el.find('svg').exists()).toBe(false)
      expect(el.find('.sr-only').exists()).toBe(false)
      expect(el.text()).toBe('3 new')
      expect(el.classes()).toContain('text-muted-foreground')
    })
    it('unknown trend with no change renders nothing', () => {
      expect(t('sideways').find('[data-slot="stat-grid-trend"]').exists()).toBe(false)
    })
    it('unknown trend with change renders the text only', () => {
      const el = t('sideways', '5%').find('[data-slot="stat-grid-trend"]')
      expect(el.find('svg').exists()).toBe(false)
      expect(el.text()).toBe('5%')
    })
    it('non-string or blank change is ignored', () => {
      expect(t(undefined, '   ').find('[data-slot="stat-grid-trend"]').exists()).toBe(false)
      expect(mount(StatGrid, { props: { items: [{ value: 1, label: 'X', change: 5 as never }] } }).find('[data-slot="stat-grid-trend"]').exists()).toBe(false)
    })
    it('trend renders before the description and works in every variant', () => {
      for (const variant of STAT_GRID_VARIANTS) {
        const w = mount(StatGrid, { props: { variant, items: [{ value: '9', label: 'X', trend: 'down', change: '-2%', description: 'vs last month' }] } })
        const dd = w.find('dd')
        expect(Array.from(dd.element.querySelectorAll('p')).map((p) => p.getAttribute('data-slot'))).toEqual(['stat-grid-trend', 'stat-grid-description'])
      }
    })
    it('has an arrow for every known trend', () => {
      expect(STAT_TRENDS).toEqual(['up', 'down', 'flat'])
    })
  })

  describe('variant edge cases', () => {
    it('empty items render an empty dl in every variant', () => {
      for (const variant of STAT_GRID_VARIANTS) expect(mount(StatGrid, { props: { items: [], variant } }).element.children).toHaveLength(0)
    })
    it('one item and 100 items in cards/inline', () => {
      for (const variant of ['cards', 'inline'] as const) {
        expect(mount(StatGrid, { props: { items: [items[0]], variant } }).findAll('dt')).toHaveLength(1)
        const many = Array.from({ length: 100 }, (_, i) => ({ value: i, label: `L${i}`, trend: 'up' as const, change: `+${i}` }))
        expect(mount(StatGrid, { props: { items: many, variant } }).findAll('[data-slot="stat-grid-trend"]')).toHaveLength(100)
      }
    })
    it('very long unicode label and change in with-icons', () => {
      const w = mount(StatGrid, { props: { variant: 'with-icons', items: [{ value: '∞', label: '数'.repeat(1000), change: '😀'.repeat(200), trend: 'up', icon: faUser }] } })
      expect(w.find('dt').text()).toHaveLength(1000)
      expect(w.find('[data-slot="stat-grid-trend"]').text()).toContain('😀')
    })
    it('switching variant repeatedly stays consistent', async () => {
      const w = mount(StatGrid, { props: { items } })
      for (let n = 0; n < 15; n++) await w.setProps({ variant: STAT_GRID_VARIANTS[n % 5] })
      expect(w.attributes('data-variant')).toBe(STAT_GRID_VARIANTS[14 % 5])
      w.unmount()
    })
    it('animate stays a no-op inside variants', () => {
      mount(StatGrid, { props: { items, animate: true, variant: 'cards' } })
      expect(io).toHaveLength(0)
    })
    it('default is the plain variant, not four cards, and the values are semibold tabular numbers', () => {
      const w = mount(StatGrid, { props: { items } })
      expect(w.attributes('data-variant')).toBe('plain')
      expect(w.find('[data-slot="stat-grid-item"]').classes().join(' ')).not.toMatch(/border|bg-card|shadow|rounded/)
      expect(w.find('[data-slot="stat-grid-value"]').classes()).toEqual(expect.arrayContaining(['font-semibold', 'tabular-nums']))
    })
    it('no variant uses rounded-xl or larger, shadows or a tinted icon tile', () => {
      for (const variant of STAT_GRID_VARIANTS) {
        const html = mount(StatGrid, { props: { items: [{ value: 1, label: 'a', icon: faUser, trend: 'up', change: '+1' }], variant } }).html()
        expect(html).not.toMatch(/rounded-(xl|2xl|3xl)|shadow|bg-primary\/10|font-bold/)
      }
    })
  })
})
