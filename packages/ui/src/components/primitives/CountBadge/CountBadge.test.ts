import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import CountBadge from './CountBadge.vue'
import CountBadgeAnchor from './CountBadgeAnchor.vue'
import { formatCountBadge, resolveCountBadgeMax } from './count'
import { countBadgePlacement, countBadgePlacementClasses } from './variants'

const text = (props: Record<string, unknown>) => mount(CountBadge, { props: { label: 'x', ...props } }).find('[data-slot="count-badge-text"]').text()

describe('CountBadge', () => {
  it('renders the count aria-hidden plus visually hidden label text', () => {
    const w = mount(CountBadge, { props: { count: 3, label: '3 unread messages' } })
    expect(w.element.tagName).toBe('SPAN')
    expect(w.attributes('data-slot')).toBe('count-badge')
    const num = w.find('[data-slot="count-badge-text"]')
    expect(num.text()).toBe('3')
    expect(num.attributes('aria-hidden')).toBe('true')
    const label = w.find('[data-slot="count-badge-label"]')
    expect(label.text()).toBe('3 unread messages')
    expect(label.classes()).toContain('sr-only')
    expect(label.attributes('aria-hidden')).toBeUndefined()
  })

  it('uses tabular figures and keeps the default look', () => {
    const c = mount(CountBadge, { props: { count: 1, label: 'x' } }).classes()
    expect(c).toEqual(expect.arrayContaining(['tabular-nums', 'bg-primary', 'text-primary-foreground', 'rounded-full', 'h-5', 'px-1.5', 'text-xs']))
  })

  it('has no ARIA role of its own', () => {
    const w = mount(CountBadge, { props: { count: 1, label: 'x' } })
    expect(w.attributes('role')).toBeUndefined()
    expect(w.attributes('aria-label')).toBeUndefined()
  })

  describe('visibility', () => {
    it('renders nothing at 0 by default', () => {
      const w = mount(CountBadge, { props: { count: 0, label: 'none' } })
      expect(w.html()).toBe('<!--v-if-->')
    })
    it('renders nothing when count is omitted', () => {
      expect(mount(CountBadge, { props: { label: 'none' } }).html()).toBe('<!--v-if-->')
    })
    it('renders 0 with showZero', () => {
      expect(text({ count: 0, showZero: true })).toBe('0')
    })
    it('showZero also shows a badge with no count', () => {
      expect(text({ showZero: true })).toBe('0')
    })
    it('appears when the count changes from 0 to a number', async () => {
      const w = mount(CountBadge, { props: { count: 0, label: 'x' } })
      await w.setProps({ count: 4 })
      expect(w.find('[data-slot="count-badge-text"]').text()).toBe('4')
      await w.setProps({ count: 0 })
      expect(w.html()).toBe('<!--v-if-->')
    })
  })

  describe('max and overflow', () => {
    it('shows the number up to max and max+ above it', () => {
      expect(text({ count: 99 })).toBe('99')
      expect(text({ count: 100 })).toBe('99+')
      expect(text({ count: 10, max: 9 })).toBe('9+')
      expect(text({ count: 9, max: 9 })).toBe('9')
    })
    it('marks overflow with data-overflow', () => {
      expect(mount(CountBadge, { props: { count: 100, label: 'x' } }).attributes('data-overflow')).toBe('')
      expect(mount(CountBadge, { props: { count: 99, label: 'x' } }).attributes('data-overflow')).toBeUndefined()
    })
    it('raises the cap', () => {
      expect(text({ count: 999, max: 999 })).toBe('999')
      expect(text({ count: 1000, max: 999 })).toBe('999+')
    })
  })

  describe('hostile numbers', () => {
    it.each([
      ['NaN', Number.NaN, false],
      ['negative', -5, false],
      ['-Infinity', Number.NEGATIVE_INFINITY, false],
      ['negative fraction', -0.5, false],
      ['fraction below one', 0.9, false],
    ])('%s counts as 0 and renders nothing', (_n, count) => {
      expect(mount(CountBadge, { props: { count, label: 'x' } }).html()).toBe('<!--v-if-->')
    })
    it('shows a counted 0 for hostile numbers with showZero', () => {
      for (const count of [Number.NaN, -5, Number.NEGATIVE_INFINITY, -0.5]) expect(text({ count, showZero: true })).toBe('0')
    })
    it('truncates fractions', () => {
      expect(text({ count: 3.7 })).toBe('3')
      expect(text({ count: 99.9 })).toBe('99')
      expect(text({ count: 100.2 })).toBe('99+')
    })
    it('Infinity and huge numbers show the capped text', () => {
      expect(text({ count: Number.POSITIVE_INFINITY })).toBe('99+')
      expect(text({ count: Number.MAX_VALUE })).toBe('99+')
      expect(text({ count: 1e21 })).toBe('99+')
    })
    it('a non-number count (text) counts as 0', () => {
      expect(mount(CountBadge, { props: { count: '5' as never, label: 'x' } }).html()).toBe('<!--v-if-->')
    })
    it.each([Number.NaN, 0, -3, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, '5', null])('invalid max %s falls back to 99', (max) => {
      expect(text({ count: 150, max })).toBe('99+')
      expect(text({ count: 99, max })).toBe('99')
    })
    it('a fractional max is truncated and 0.5 falls back', () => {
      expect(text({ count: 20, max: 9.9 })).toBe('9+')
      expect(text({ count: 100, max: 0.5 })).toBe('99+')
    })
    it('a huge max never prints exponent notation', () => {
      expect(text({ count: Number.MAX_VALUE, max: Number.MAX_VALUE })).toBe('9007199254740991+')
      expect(text({ count: 1234567, max: 1e12 })).toBe('1234567')
    })
  })

  describe('dot mode', () => {
    it('renders a dot with hidden label text and no number', () => {
      const w = mount(CountBadge, { props: { dot: true, label: 'New activity' } })
      expect(w.attributes('data-dot')).toBe('')
      expect(w.find('[data-slot="count-badge-text"]').exists()).toBe(false)
      expect(w.text()).toBe('New activity')
      expect(w.find('[data-slot="count-badge-label"]').classes()).toContain('sr-only')
      expect(w.classes()).toEqual(expect.arrayContaining(['size-2', 'p-0', 'rounded-full']))
    })
    it('hides at count 0 and shows above 0', () => {
      expect(mount(CountBadge, { props: { dot: true, count: 0, label: 'x' } }).html()).toBe('<!--v-if-->')
      const w = mount(CountBadge, { props: { dot: true, count: 2, label: 'x' } })
      expect(w.find('[data-slot="count-badge-text"]').exists()).toBe(false)
      expect(w.attributes('data-dot')).toBe('')
    })
    it('showZero keeps a dot visible at 0', () => {
      expect(mount(CountBadge, { props: { dot: true, count: 0, showZero: true, label: 'x' } }).attributes('data-dot')).toBe('')
    })
    it('a dot with NaN count is hidden', () => {
      expect(mount(CountBadge, { props: { dot: true, count: Number.NaN, label: 'x' } }).html()).toBe('<!--v-if-->')
    })
    it('never marks overflow', () => {
      expect(mount(CountBadge, { props: { dot: true, count: 1000, label: 'x' } }).attributes('data-overflow')).toBeUndefined()
    })
  })

  describe('label text', () => {
    it('trims the label', () => {
      expect(mount(CountBadge, { props: { count: 1, label: '  1 new  ' } }).find('[data-slot="count-badge-label"]').text()).toBe('1 new')
    })
    it('renders no label element when blank (strict mode is off in unit tests)', () => {
      expect(mount(CountBadge, { props: { count: 1, label: '   ' } }).find('[data-slot="count-badge-label"]').exists()).toBe(false)
      expect(mount(CountBadge, { props: { count: 1 } }).find('[data-slot="count-badge-label"]').exists()).toBe(false)
    })
    it('escapes hostile label text', () => {
      const w = mount(CountBadge, { props: { count: 1, label: '<img src=x onerror=alert(1)>' } })
      expect(w.find('img').exists()).toBe(false)
      expect(w.find('[data-slot="count-badge-label"]').text()).toBe('<img src=x onerror=alert(1)>')
    })
    it('handles very long, RTL and unicode labels', () => {
      expect(mount(CountBadge, { props: { count: 1, label: 'x'.repeat(3000) } }).find('[data-slot="count-badge-label"]').text()).toHaveLength(3000)
      expect(mount(CountBadge, { props: { count: 1, label: '٣ رسائل غير مقروءة' } }).text()).toContain('٣ رسائل غير مقروءة')
    })
  })

  describe('customisation', () => {
    it('class wins over internal classes', () => {
      const w = mount(CountBadge, { props: { count: 1, label: 'x', class: 'bg-pink-500 px-4' } })
      expect(w.classes()).toContain('bg-pink-500')
      expect(w.classes()).not.toContain('bg-primary')
      expect(w.classes()).toContain('px-4')
      expect(w.classes()).not.toContain('px-1.5')
    })
    it('passes attributes through', () => {
      const w = mount(CountBadge, { props: { count: 1, label: 'x' }, attrs: { id: 'b', 'data-test': 'y', title: 'hint' } })
      expect(w.attributes('id')).toBe('b')
      expect(w.attributes('data-test')).toBe('y')
      expect(w.attributes('title')).toBe('hint')
    })
    it('renders as another element', () => {
      expect(mount(CountBadge, { props: { count: 1, label: 'x', as: 'div' } }).element.tagName).toBe('DIV')
      expect(mount(CountBadge, { props: { count: 1, label: 'x', as: 'output' } }).element.tagName).toBe('OUTPUT')
    })
    it('tolerates a number count updated reactively', async () => {
      const w = mount(CountBadge, { props: { count: 1, label: '1 item' } })
      await w.setProps({ count: 250, label: 'More than 99 items' })
      expect(w.find('[data-slot="count-badge-text"]').text()).toBe('99+')
      expect(w.find('[data-slot="count-badge-label"]').text()).toBe('More than 99 items')
    })
  })
})

describe('formatCountBadge / resolveCountBadgeMax', () => {
  it('formats counts', () => {
    expect(formatCountBadge(5, 99)).toEqual({ value: 5, text: '5', overflow: false })
    expect(formatCountBadge(500, 99)).toEqual({ value: 500, text: '99+', overflow: true })
    expect(formatCountBadge(undefined, 99)).toEqual({ value: 0, text: '0', overflow: false })
    expect(formatCountBadge(Number.NaN, 99)).toEqual({ value: 0, text: '0', overflow: false })
    expect(formatCountBadge(-7, undefined)).toEqual({ value: 0, text: '0', overflow: false })
    expect(formatCountBadge(Number.POSITIVE_INFINITY, 5).text).toBe('5+')
  })
  it('sanitises max', () => {
    expect(resolveCountBadgeMax(undefined)).toBe(99)
    expect(resolveCountBadgeMax(9.9)).toBe(9)
    expect(resolveCountBadgeMax(0)).toBe(99)
    expect(resolveCountBadgeMax(Number.MAX_VALUE)).toBe(Number.MAX_SAFE_INTEGER)
  })
})

describe('CountBadgeAnchor', () => {
  const mountAnchor = (props: Record<string, unknown> = {}, badge = true) =>
    mount(CountBadgeAnchor, {
      props,
      slots: {
        default: () => h('button', 'Inbox'),
        ...(badge ? { badge: () => h(CountBadge, { count: 3, label: '3 unread' }) } : {}),
      },
    })

  it('renders the target and the badge in a positioned wrapper', () => {
    const w = mountAnchor()
    expect(w.attributes('data-slot')).toBe('count-badge-anchor')
    expect(w.classes()).toEqual(expect.arrayContaining(['relative', 'inline-flex']))
    expect(w.find('button').text()).toBe('Inbox')
    const slot = w.find('[data-slot="count-badge-anchor-badge"]')
    expect(slot.exists()).toBe(true)
    expect(slot.find('[data-slot="count-badge"]').exists()).toBe(true)
    expect(slot.classes()).toEqual(expect.arrayContaining(['absolute', 'pointer-events-none']))
  })

  it('defaults to top-end', () => {
    const w = mountAnchor()
    expect(w.attributes('data-placement')).toBe('top-end')
    expect(w.find('[data-slot="count-badge-anchor-badge"]').classes()).toEqual(expect.arrayContaining(['top-0', 'end-0', '-translate-y-1/2']))
  })

  it.each(['top-end', 'top-start', 'bottom-end', 'bottom-start'] as const)('placement %s uses its classes', (placement) => {
    const w = mountAnchor({ placement })
    expect(w.attributes('data-placement')).toBe(placement)
    for (const cls of countBadgePlacement[placement].split(' ')) expect(w.find('[data-slot="count-badge-anchor-badge"]').classes()).toContain(cls)
  })

  it('unknown placement falls back to top-end', () => {
    const w = mountAnchor({ placement: 'middle' })
    expect(w.attributes('data-placement')).toBe('top-end')
    expect(w.find('[data-slot="count-badge-anchor-badge"]').classes()).toContain('end-0')
  })

  it('uses logical properties only', () => {
    for (const cls of Object.values(countBadgePlacement)) {
      expect(cls).not.toMatch(/(^|\s)-?(left|right)-/)
      expect(cls).not.toMatch(/(^|\s)(ml|mr|pl|pr)-/)
    }
  })

  it('renders no badge wrapper without a badge slot', () => {
    expect(mountAnchor({}, false).find('[data-slot="count-badge-anchor-badge"]').exists()).toBe(false)
  })

  it('keeps an empty wrapper harmless when the badge renders nothing', () => {
    const w = mount(CountBadgeAnchor, { slots: { default: () => h('button', 'Inbox'), badge: () => h(CountBadge, { count: 0, label: 'x' }) } })
    expect(w.find('[data-slot="count-badge"]').exists()).toBe(false)
    expect(w.find('button').exists()).toBe(true)
  })

  it('class wins, attributes fall through, `as` works', () => {
    const w = mount(CountBadgeAnchor, { props: { class: 'inline-block', as: 'div' }, attrs: { id: 'a' }, slots: { default: () => 'x' } })
    expect(w.element.tagName).toBe('DIV')
    expect(w.attributes('id')).toBe('a')
    expect(w.classes()).toContain('inline-block')
    expect(w.classes()).not.toContain('inline-flex')
  })

  it('placement helper falls back for unknown values', () => {
    expect(countBadgePlacementClasses('nope')).toBe(countBadgePlacement['top-end'])
    expect(countBadgePlacementClasses(undefined)).toBe(countBadgePlacement['top-end'])
    expect(countBadgePlacementClasses('bottom-start')).toBe(countBadgePlacement['bottom-start'])
  })

  it('flips the horizontal shift for right-to-left', () => {
    expect(countBadgePlacement['top-end']).toContain('ltr:translate-x-1/2')
    expect(countBadgePlacement['top-end']).toContain('rtl:-translate-x-1/2')
    expect(countBadgePlacement['bottom-start']).toContain('ltr:-translate-x-1/2')
    expect(countBadgePlacement['bottom-start']).toContain('rtl:translate-x-1/2')
  })
})
