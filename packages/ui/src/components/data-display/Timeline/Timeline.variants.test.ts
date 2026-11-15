import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { Timeline, TimelineItem, timelineConnectorVariants, timelineItemVariants, timelineMarkerVariants } from './index'
import { TIMELINE_SIZES, TIMELINE_VARIANTS } from './variants'

const STATUSES = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const
const make = (props: Record<string, unknown> = {}, status = 'success') =>
  mount(
    { components: { Timeline, TimelineItem }, props: ['p'], template: `<Timeline v-bind="p"><TimelineItem status="${status}" title="First" time="1m" /><TimelineItem title="Second" time="2m" /></Timeline>` },
    { props: { p: { label: 'Sample log', ...props } } },
  )
const marker = (w: ReturnType<typeof make>, i = 0) => w.findAll('[data-slot=timeline-marker]')[i]!

describe('Timeline variations', () => {
  describe('default output is unchanged', () => {
    it('keeps the exact marker, item and connector strings and adds no attributes', () => {
      const w = make()
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(w.attributes('data-size')).toBeUndefined()
      expect(marker(w).attributes('class')).toBe('absolute start-0 top-0 flex size-6 items-center justify-center rounded-full border text-xs [&_svg]:size-3 border-success/40 bg-success/15 text-success')
      expect(w.find('li').attributes('class')).toBe('group/item relative pb-6 ps-9 last:pb-0')
      expect(w.find('[data-slot=timeline-connector]').attributes('class')).toBe('absolute bottom-0 start-3 top-6 w-px -translate-x-1/2 bg-border group-last/item:hidden')
    })
    it('exports the value lists', () => {
      expect(TIMELINE_SIZES).toEqual(['default', 'compact', 'large'])
      expect(TIMELINE_VARIANTS).toEqual(['default', 'outline', 'solid'])
    })
  })

  describe('size large', () => {
    it('enlarges marker, spacing, connector and text', () => {
      const w = make({ size: 'large' })
      expect(w.attributes('data-size')).toBe('large')
      expect(marker(w).classes()).toEqual(expect.arrayContaining(['size-8', '[&_svg]:size-4']))
      expect(marker(w).classes()).not.toContain('size-6')
      expect(w.find('li').classes()).toEqual(expect.arrayContaining(['pb-8', 'ps-11']))
      expect(w.find('li').classes()).not.toContain('ps-9')
      expect(w.find('[data-slot=timeline-connector]').classes()).toEqual(expect.arrayContaining(['start-4', 'top-8']))
      expect(w.find('[data-slot=timeline-title]').classes()).toContain('text-base')
      expect(w.find('[data-slot=timeline-time]').classes()).toContain('text-sm')
    })
    it('uses a larger dot and body text', () => {
      const w = mount({ components: { Timeline, TimelineItem }, template: '<Timeline size="large" label="x"><TimelineItem title="A">Body</TimelineItem></Timeline>' })
      expect(w.find('[data-slot=timeline-marker] span').classes()).toContain('size-2.5')
      expect(w.find('[data-slot=timeline-content]').classes()).toEqual(expect.arrayContaining(['text-base', 'mt-1.5']))
    })
    it('compact keeps its own look and unknown sizes fall back to default', () => {
      expect(make({ size: 'compact' }).attributes('data-size')).toBe('compact')
      expect(marker(make({ size: 'compact' })).classes()).toContain('size-4')
      const w = make({ size: 'huge' })
      expect(w.attributes('data-size')).toBeUndefined()
      expect(w.find('li').attributes('class')).toBe('group/item relative pb-6 ps-9 last:pb-0')
    })
    it('horizontal layout gets wider steps and a lower connector', () => {
      const w = make({ size: 'large', layout: 'horizontal' })
      expect(w.find('li').classes()).toEqual(expect.arrayContaining(['min-w-48', 'pe-8', 'pt-11']))
      expect(w.find('[data-slot=timeline-connector]').classes()).toEqual(expect.arrayContaining(['start-10', 'top-4', 'h-px']))
      expect(w.attributes('tabindex')).toBe('0')
    })
    it('alternating layout keeps the centre line placement with a larger offset', () => {
      const w = make({ size: 'large', layout: 'alternating' })
      expect(marker(w).classes()).toEqual(expect.arrayContaining(['md:group-odd/item:-end-4', 'md:group-even/item:-start-4']))
      expect(w.find('li').classes()).toEqual(expect.arrayContaining(['md:w-1/2', 'md:group-odd/item:pe-11', 'md:group-even/item:ps-11']))
    })
    it('items outside a Timeline keep the default size', () => {
      expect(mount(TimelineItem, { props: { title: 'x' } }).classes()).toEqual(expect.arrayContaining(['pb-6', 'ps-9']))
    })
    it('exposes the class helpers per size', () => {
      expect(timelineItemVariants({ size: 'large' })).toContain('ps-11')
      expect(timelineConnectorVariants({ size: 'large' })).toContain('top-8')
    })
  })

  describe('variant', () => {
    it.each(STATUSES)('outline with status %s draws a 2px ring in the tone on the page background', (status) => {
      const w = make({ variant: 'outline' }, status)
      const c = marker(w).classes()
      expect(w.attributes('data-variant')).toBe('outline')
      expect(c).toEqual(expect.arrayContaining(['border-2', 'bg-background', 'text-foreground']))
      const border = { neutral: 'border-muted-foreground', primary: 'border-primary', success: 'border-success', warning: 'border-warning-foreground', danger: 'border-destructive', info: 'border-info' }[status]
      expect(c).toContain(border)
      // Pinned by contrast.test.ts (ring >= 3:1 on background and card): never the decorative divider token, never plain `border-warning` in light mode.
      expect(c).not.toContain('border-border')
      if (status === 'warning') {
        expect(c).toContain('dark:border-warning')
        expect(c).not.toContain('border-warning')
      }
      expect(c).not.toContain('bg-muted')
      expect(c.some((x) => /^bg-(success|warning|info|primary|destructive)\//.test(x))).toBe(false)
    })
    it.each([
      ['neutral', 'bg-foreground', 'text-background'],
      ['primary', 'bg-primary', 'text-primary-foreground'],
      ['success', 'bg-success', 'text-success-foreground'],
      ['warning', 'bg-warning', 'text-warning-foreground'],
      ['danger', 'bg-destructive', 'text-destructive-foreground'],
      ['info', 'bg-info', 'text-info-foreground'],
    ])('solid with status %s fills the marker (%s, %s)', (status, bg, fg) => {
      const w = make({ variant: 'solid' }, status)
      const c = marker(w).classes()
      expect(w.attributes('data-variant')).toBe('solid')
      expect(c).toEqual(expect.arrayContaining([bg, fg]))
      expect(c.filter((x) => x.startsWith('bg-'))).toEqual([bg])
    })
    it('default is the tinted marker and sets no attribute', () => {
      const w = make({ variant: 'default' })
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(marker(w).classes()).toEqual(expect.arrayContaining(['bg-success/15', 'text-success']))
    })
    it('unknown variants fall back to default', () => {
      const w = make({ variant: 'neon' })
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(marker(w).classes()).toContain('bg-success/15')
    })
    it('the status stays spoken in every variant, so the tone is never the only cue', () => {
      for (const variant of ['default', 'outline', 'solid']) {
        const w = make({ variant }, 'danger')
        expect(w.find('[data-slot=timeline-status]').text()).toBe('Error.')
        expect(marker(w).attributes('aria-hidden')).toBe('true')
      }
    })
    it('draws the icon or dot in every variant', () => {
      const w = mount({ components: { Timeline, TimelineItem }, setup: () => ({ faCheck }), template: '<Timeline variant="solid" label="x"><TimelineItem status="success" :icon="faCheck" title="A" /><TimelineItem title="B" /></Timeline>' })
      expect(marker(w as never, 0).find('svg').exists()).toBe(true)
      expect(marker(w as never, 1).find('span.rounded-full').exists()).toBe(true)
    })
    it('class on the item wins over the variant marker classes', () => {
      const w = mount({ components: { Timeline, TimelineItem }, template: '<Timeline variant="solid" label="x"><TimelineItem title="A" class="pb-1" /></Timeline>' })
      expect(w.find('li').classes()).toContain('pb-1')
    })
    it('combines with size and layout without dropping either', () => {
      const w = make({ variant: 'outline', size: 'large', layout: 'alternating' })
      const c = marker(w).classes()
      expect(c).toEqual(expect.arrayContaining(['border-2', 'size-8', 'md:group-odd/item:-end-4']))
      const h = make({ variant: 'solid', size: 'compact', layout: 'horizontal' })
      expect(marker(h).classes()).toEqual(expect.arrayContaining(['bg-success', 'size-4']))
    })
    it('items outside a Timeline use the default marker', () => {
      expect(mount(TimelineItem, { props: { title: 'x', status: 'success' } }).find('[data-slot=timeline-marker]').classes()).toContain('bg-success/15')
    })
    it('exposes the class helper', () => {
      expect(timelineMarkerVariants({ status: 'info', variant: 'solid' })).toContain('bg-info')
      expect(timelineMarkerVariants({ status: 'info', variant: 'outline' })).toContain('border-info')
    })
  })

  describe('edge cases', () => {
    it('renders an empty large outline timeline', () => {
      const w = mount(Timeline, { props: { size: 'large', variant: 'outline', label: 'x' } })
      expect(w.findAll('li')).toHaveLength(0)
      expect(w.attributes('data-size')).toBe('large')
    })
    it('does not overflow with a long title', () => {
      const w = mount({ components: { Timeline, TimelineItem }, template: `<Timeline size="large" label="x"><TimelineItem title="${'t'.repeat(300)}" /></Timeline>` })
      expect(w.find('[data-slot=timeline-title]').text()).toHaveLength(300)
    })
  })
})
