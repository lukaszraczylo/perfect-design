import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { Timeline, TimelineItem, timelineConnectorVariants, timelineItemVariants, timelineMarkerVariants, timelineVariants } from './index'

describe('Timeline', () => {
  describe('good path', () => {
    it('renders an ordered list of items', () => {
      const w = mount({ components: { Timeline, TimelineItem }, template: '<Timeline><TimelineItem title="A" /><TimelineItem title="B" /></Timeline>' })
      expect(w.element.tagName).toBe('OL')
      expect(w.attributes('data-slot')).toBe('timeline')
      expect(w.attributes('role')).toBe('list')
      expect(w.findAll('li')).toHaveLength(2)
    })

    it('can render as ul', () => {
      expect(mount(Timeline, { props: { as: 'ul' } }).element.tagName).toBe('UL')
      expect(mount(Timeline, { props: { as: 'div' as never } }).element.tagName).toBe('OL')
    })

    it('renders title, time (with datetime), content and a connector', () => {
      const w = mount(TimelineItem, { props: { title: 'Deployed', time: '2h ago', datetime: '2026-03-01T10:00:00Z' }, slots: { default: 'Details' } })
      expect(w.attributes('data-slot')).toBe('timeline-item')
      expect(w.find('[data-slot="timeline-title"]').text()).toBe('Deployed')
      const t = w.find('time')
      expect(t.text()).toBe('2h ago')
      expect(t.attributes('datetime')).toBe('2026-03-01T10:00:00Z')
      expect(w.find('[data-slot="timeline-content"]').text()).toBe('Details')
      expect(w.find('[data-slot="timeline-connector"]').classes()).toContain('group-last/item:hidden')
    })

    it.each(['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const)('status %s tones the marker', (status) => {
      const w = mount(TimelineItem, { props: { status } })
      expect(w.attributes('data-status')).toBe(status)
      expect(w.find('[data-slot="timeline-marker"]').classes()).toContain(timelineMarkerVariants({ status }).split(' ').find((c) => c.startsWith('border-') && c !== 'border')!)
    })

    it('uses an icon prop, icon slot or a default dot', () => {
      expect(mount(TimelineItem, { props: { icon: faCheck } }).find('[data-slot="timeline-marker"] svg').exists()).toBe(true)
      expect(mount(TimelineItem, { slots: { icon: '<i id="c" />' } }).find('#c').exists()).toBe(true)
      const dot = mount(TimelineItem)
      expect(dot.find('[data-slot="timeline-marker"] svg').exists()).toBe(false)
      expect(dot.find('[data-slot="timeline-marker"] span').exists()).toBe(true)
    })

    it('title and time slots override props', () => {
      const w = mount(TimelineItem, { slots: { title: '<b>T</b>', time: 'now' } })
      expect(w.find('[data-slot="timeline-title"] b').text()).toBe('T')
      expect(w.find('time').text()).toBe('now')
    })

    it('marker is hidden from assistive tech', () => {
      expect(mount(TimelineItem).find('[data-slot="timeline-marker"]').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('customisation', () => {
    it('merges classes and passes attributes', () => {
      const w = mount(TimelineItem, { props: { class: 'pb-12 custom' }, attrs: { 'data-test': 'x' } })
      expect(w.classes()).toContain('pb-12')
      expect(w.classes()).not.toContain('pb-6')
      expect(w.attributes('data-test')).toBe('x')
      expect(mount(Timeline, { props: { class: 'gap-2' } }).classes()).toContain('gap-2')
    })
  })

  describe('bad path / edge cases', () => {
    it('invalid status falls back to neutral styling without throwing', () => {
      const w = mount(TimelineItem, { props: { status: 'weird' as never } })
      expect(w.exists()).toBe(true)
      expect(w.find('[data-slot="timeline-marker"]').classes()).toContain('rounded-full')
    })
    it('empty item renders without title, time or content', () => {
      const w = mount(TimelineItem)
      expect(w.find('[data-slot="timeline-title"]').exists()).toBe(false)
      expect(w.find('time').exists()).toBe(false)
      expect(w.find('[data-slot="timeline-content"]').exists()).toBe(false)
    })
    it('empty timeline renders', () => {
      expect(mount(Timeline).text()).toBe('')
    })
    it('long unicode and RTL text', () => {
      const w = mount(TimelineItem, { props: { title: 'مرحبا 🎉', time: 'ж'.repeat(500) } })
      expect(w.find('[data-slot="timeline-title"]').text()).toBe('مرحبا 🎉')
      expect(w.find('time').text()).toHaveLength(500)
    })
    it('time without datetime omits the attribute', () => {
      expect(mount(TimelineItem, { props: { time: 'x' } }).find('time').attributes('datetime')).toBeUndefined()
    })
  })

  describe('layouts and sizes', () => {
    const tl = (props: Record<string, unknown>, n = 2) =>
      mount({
        components: { Timeline, TimelineItem },
        setup: () => ({ props, items: Array.from({ length: n }, (_, i) => i) }),
        template: '<Timeline v-bind="props"><TimelineItem v-for="i in items" :key="i" :title="`E${i}`" time="now">Body</TimelineItem></Timeline>',
      })

    it('default output is unchanged', () => {
      const w = tl({})
      expect(w.classes().join(' ')).toBe('flex flex-col')
      expect(w.attributes('data-layout')).toBeUndefined()
      expect(w.attributes('data-size')).toBeUndefined()
      const li = w.find('li')
      expect(li.classes().join(' ')).toBe('group/item relative pb-6 ps-9 last:pb-0')
      expect(w.find('[data-slot="timeline-connector"]').classes().join(' ')).toBe('absolute bottom-0 start-3 top-6 w-px -translate-x-1/2 bg-border group-last/item:hidden')
      expect(w.find('[data-slot="timeline-marker"]').classes().join(' ')).toBe(
        'absolute start-0 top-0 flex size-6 items-center justify-center rounded-full border text-xs [&_svg]:size-3 border-border bg-muted text-muted-foreground',
      )
      expect(w.find('[data-slot="timeline-marker"] span').classes().join(' ')).toBe('size-2 rounded-full bg-current')
      expect(w.find('[data-slot="timeline-content"]').classes().join(' ')).toBe('mt-1 text-sm text-muted-foreground')
      expect(timelineVariants()).toBe('flex flex-col')
      expect(timelineItemVariants()).toBe('group/item relative pb-6 ps-9 last:pb-0')
      expect(timelineConnectorVariants()).toContain('start-3')
    })

    it('horizontal lays steps in a row with a horizontal connector', () => {
      const w = tl({ layout: 'horizontal' })
      expect(w.attributes('data-layout')).toBe('horizontal')
      expect(w.classes()).toContain('flex-row')
      expect(w.classes()).not.toContain('flex-col')
      expect(w.classes()).toContain('overflow-x-auto')
      const li = w.find('li')
      expect(li.classes()).toContain('flex-1')
      expect(li.classes()).toContain('pt-9')
      expect(li.classes()).not.toContain('ps-9')
      const conn = w.find('[data-slot="timeline-connector"]')
      expect(conn.classes()).toContain('h-px')
      expect(conn.classes()).not.toContain('w-px')
      expect(conn.classes()).toContain('group-last/item:hidden')
    })

    it('alternating keeps the vertical base and adds md+ left/right placement', () => {
      const w = tl({ layout: 'alternating' }, 3)
      expect(w.attributes('data-layout')).toBe('alternating')
      expect(w.classes()).toContain('flex-col')
      const li = w.find('li')
      expect(li.classes()).toContain('ps-9')
      expect(li.classes()).toContain('md:w-1/2')
      expect(li.classes()).toContain('md:odd:text-end')
      expect(li.classes()).toContain('md:even:self-end')
      expect(w.find('[data-slot="timeline-marker"]').classes()).toContain('md:group-odd/item:-end-3')
      expect(w.find('[data-slot="timeline-marker"]').classes()).toContain('md:group-even/item:-start-3')
      const conn = w.find('[data-slot="timeline-connector"]')
      expect(conn.classes()).toContain('w-px')
      expect(conn.classes()).toContain('md:group-even/item:start-0')
    })

    it('compact shrinks marker, spacing and body text', () => {
      const w = tl({ size: 'compact' })
      expect(w.attributes('data-size')).toBe('compact')
      const li = w.find('li')
      expect(li.classes()).toContain('pb-3')
      expect(li.classes()).toContain('ps-7')
      expect(li.classes()).not.toContain('pb-6')
      const marker = w.find('[data-slot="timeline-marker"]')
      expect(marker.classes()).toContain('size-4')
      expect(marker.classes()).not.toContain('size-6')
      expect(marker.find('span').classes()).toContain('size-1.5')
      expect(w.find('[data-slot="timeline-connector"]').classes()).toContain('start-2')
      expect(w.find('[data-slot="timeline-content"]').classes()).toContain('text-xs')
    })

    it.each(['horizontal', 'alternating'] as const)('compact + %s combine', (layout) => {
      const w = tl({ layout, size: 'compact' })
      expect(w.find('[data-slot="timeline-marker"]').classes()).toContain('size-4')
      expect(w.find('li').classes().some((c) => c === 'pt-7' || c === 'ps-7')).toBe(true)
      if (layout === 'alternating') expect(w.find('[data-slot="timeline-marker"]').classes()).toContain('md:group-odd/item:-end-2')
      else expect(w.find('[data-slot="timeline-connector"]').classes()).toContain('start-6')
    })

    it('status tones still work inside every layout', () => {
      const w = mount({
        components: { Timeline, TimelineItem },
        template: '<Timeline layout="horizontal" size="compact"><TimelineItem status="success" title="A" /></Timeline>',
      })
      expect(w.find('[data-slot="timeline-marker"]').classes()).toContain('bg-success/15')
      expect(w.find('li').attributes('data-status')).toBe('success')
    })

    it('unknown layout or size fall back to the defaults', () => {
      const w = tl({ layout: 'diagonal', size: 'huge' })
      expect(w.classes().join(' ')).toBe('flex flex-col')
      expect(w.attributes('data-layout')).toBeUndefined()
      expect(w.attributes('data-size')).toBeUndefined()
      expect(w.find('li').classes()).toContain('ps-9')
    })

    it('class overrides layout utilities on root and item', () => {
      const w = mount({
        components: { Timeline, TimelineItem },
        template: '<Timeline layout="horizontal" class="flex-wrap overflow-visible"><TimelineItem class="pt-2 min-w-0" /></Timeline>',
      })
      expect(w.classes()).toContain('flex-wrap')
      expect(w.classes()).not.toContain('overflow-x-auto')
      expect(w.find('li').classes()).toContain('pt-2')
      expect(w.find('li').classes()).not.toContain('pt-9')
      expect(w.find('li').classes()).toContain('min-w-0')
      expect(w.find('li').classes()).not.toContain('min-w-40')
    })

    it('a TimelineItem outside a Timeline renders as vertical/default', () => {
      expect(mount(TimelineItem).classes()).toContain('ps-9')
    })

    it('ul variant and empty timelines work in every layout', () => {
      for (const layout of ['vertical', 'horizontal', 'alternating'] as const) {
        expect(mount(Timeline, { props: { layout, as: 'ul' } }).element.tagName).toBe('UL')
        expect(mount(Timeline, { props: { layout } }).text()).toBe('')
      }
    })

    it('markerVariants accepts layout and size directly', () => {
      expect(timelineMarkerVariants({ size: 'compact' })).toContain('size-4')
      expect(timelineMarkerVariants({ layout: 'alternating', status: 'info' })).toContain('border-info/40')
    })
  })

  describe('accessibility and logical layout', () => {
    it('non-neutral statuses are also spoken, neutral and primary are not', () => {
      const text = (status: string) => mount(TimelineItem, { props: { status: status as never, title: 'T' } }).find('[data-slot="timeline-status"]')
      expect(text('success').text()).toBe('Success.')
      expect(text('warning').text()).toBe('Warning.')
      expect(text('danger').text()).toBe('Error.')
      expect(text('info').text()).toBe('Info.')
      expect(text('success').classes()).toContain('sr-only')
      expect(text('neutral').exists()).toBe(false)
      expect(text('primary').exists()).toBe(false)
      expect(text('bogus').exists()).toBe(false)
    })

    it('times use tabular figures', () => {
      expect(mount(TimelineItem, { props: { time: '09:12' } }).find('[data-slot="timeline-time"]').classes()).toContain('tabular-nums')
    })

    it('the list can be named with `label`', () => {
      expect(mount(Timeline, { props: { label: 'Build log' } }).attributes('aria-label')).toBe('Build log')
    })

    it('the horizontal layout is a focusable scroll region; the others are not', () => {
      const h = mount(Timeline, { props: { layout: 'horizontal', label: 'Steps' } })
      expect(h.attributes('tabindex')).toBe('0')
      expect(h.classes()).toEqual(expect.arrayContaining(['overflow-x-auto', 'focus-visible:ring-inset']))
      expect(mount(Timeline).attributes('tabindex')).toBeUndefined()
      expect(mount(Timeline, { props: { layout: 'alternating' } }).attributes('tabindex')).toBeUndefined()
    })

    it('alternating item places itself with odd:/even: (group-odd/item only reaches descendants, never the item)', () => {
      const li = timelineItemVariants({ layout: 'alternating', size: 'default' })
      expect(li).not.toContain('group-odd/item')
      expect(li).not.toContain('group-even/item')
      expect(li).toEqual(expect.stringContaining('md:odd:pe-9'))
      expect(li).toEqual(expect.stringContaining('md:even:ps-9'))
    })

    it('uses logical start/end utilities only (RTL mirrors)', () => {
      const all = [
        timelineItemVariants({ layout: 'alternating', size: 'default' }),
        timelineConnectorVariants({ layout: 'alternating', size: 'default' }),
        timelineMarkerVariants({ layout: 'alternating', size: 'default' }),
        timelineItemVariants({ layout: 'horizontal', size: 'compact' }),
        timelineConnectorVariants({ layout: 'horizontal', size: 'compact' }),
      ].join(' ')
      expect(all).not.toMatch(/(?<![a-z-])(pl|pr|left|right)-|text-right|-(left|right)-/)
    })
  })
})
