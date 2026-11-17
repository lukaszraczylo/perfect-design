import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import KpiTile from './KpiTile.vue'
import { kpiTileVariants } from './index'

const delta = (w: ReturnType<typeof mount>) => w.find('[data-slot="kpi-tile-delta"]')

describe('KpiTile', () => {
  describe('good path', () => {
    it('renders label, value, delta and hint inside a card', () => {
      const w = mount(KpiTile, { props: { label: 'Revenue', value: 12345.678, delta: '+12%', trend: 'up', hint: 'vs last week' } })
      expect(w.attributes('data-slot')).toBe('kpi-tile')
      expect(w.classes()).toContain('bg-card')
      expect(w.find('[data-slot="kpi-tile-label"]').text()).toBe('Revenue')
      expect(w.find('[data-slot="kpi-tile-value"]').text()).toBe('12,345.68')
      expect(delta(w).text()).toContain('+12%')
      expect(delta(w).text()).toContain('Increase')
      expect(w.find('[data-slot="kpi-tile-hint"]').text()).toBe('vs last week')
    })

    it('good/bad semantics: up is good by default, down is bad', () => {
      expect(delta(mount(KpiTile, { props: { label: 'x', value: 1, delta: '1', trend: 'up' } })).attributes('data-sentiment')).toBe('good')
      const down = delta(mount(KpiTile, { props: { label: 'x', value: 1, delta: '1', trend: 'down' } }))
      expect(down.attributes('data-sentiment')).toBe('bad')
      expect(down.classes()).toContain('text-destructive')
      expect(down.text()).toContain('Decrease')
    })

    it('goodWhen=down inverts (latency / cost)', () => {
      const down = delta(mount(KpiTile, { props: { label: 'x', value: 1, delta: '-5ms', trend: 'down', goodWhen: 'down' } }))
      expect(down.attributes('data-sentiment')).toBe('good')
      expect(down.classes()).toContain('text-success')
      expect(delta(mount(KpiTile, { props: { label: 'x', value: 1, delta: '+5', trend: 'up', goodWhen: 'down' } })).attributes('data-sentiment')).toBe('bad')
    })

    it('flat and goodWhen=none are neutral', () => {
      const flat = delta(mount(KpiTile, { props: { label: 'x', value: 1, delta: '0%', trend: 'flat' } }))
      expect(flat.attributes('data-sentiment')).toBe('neutral')
      expect(flat.classes()).toContain('text-muted-foreground')
      expect(flat.text()).toContain('No change')
      expect(delta(mount(KpiTile, { props: { label: 'x', value: 1, delta: '1', trend: 'up', goodWhen: 'none' } })).attributes('data-sentiment')).toBe('neutral')
    })

    it('numeric delta is formatted with a sign', () => {
      expect(delta(mount(KpiTile, { props: { label: 'x', value: 1, delta: 3.5, trend: 'up' } })).text()).toContain('+3.5')
      expect(delta(mount(KpiTile, { props: { label: 'x', value: 1, delta: -3, trend: 'down' } })).text()).toContain('-3')
      expect(delta(mount(KpiTile, { props: { label: 'x', value: 1, delta: 0 } })).text()).toContain('0')
    })

    it('renders an icon from props and via the slot', () => {
      const w = mount(KpiTile, { props: { label: 'x', value: 1, icon: faServer } })
      expect(w.find('[data-slot="kpi-tile-icon"] svg').exists()).toBe(true)
      const s = mount(KpiTile, { props: { label: 'x', value: 1 }, slots: { icon: '<i id="custom" />' } })
      expect(s.find('#custom').exists()).toBe(true)
    })

    it('slots override value, delta and hint', () => {
      const w = mount(KpiTile, { props: { label: 'x' }, slots: { value: '<b>V</b>', delta: 'D', hint: '<i>H</i>' } })
      expect(w.find('[data-slot="kpi-tile-value"] b').text()).toBe('V')
      expect(delta(w).text()).toContain('D')
      expect(w.find('[data-slot="kpi-tile-hint"] i').text()).toBe('H')
    })

    it('loading shows a skeleton and hides value/delta, with aria-busy', () => {
      const w = mount(KpiTile, { props: { label: 'x', value: 5, delta: '+1', hint: 'h', loading: true } })
      expect(w.attributes('aria-busy')).toBe('true')
      expect(w.find('[data-slot="kpi-tile-skeleton"]').exists()).toBe(true)
      expect(w.find('[data-slot="kpi-tile-value"]').exists()).toBe(false)
      expect(delta(w).exists()).toBe(false)
      expect(w.text()).toContain('Loading')
    })
  })

  describe('variations', () => {
    const root = (props: Record<string, unknown>, slots: Record<string, string> = {}) => mount(KpiTile, { props: { label: 'x', value: 1, ...props }, slots })

    it('default output is unchanged', () => {
      const w = root({})
      expect(w.classes().join(' ')).toBe('flex flex-col rounded-xl border bg-card shadow-sm text-card-foreground gap-2 p-4')
      expect(w.attributes('data-tile-variant')).toBeUndefined()
      expect(w.attributes('data-size')).toBeUndefined()
      expect(w.find('[data-slot="kpi-tile-sparkline"]').exists()).toBe(false)
      expect(w.find('[data-slot="kpi-tile-progress"]').exists()).toBe(false)
      expect(w.find('[data-slot="kpi-tile-value"]').classes().join(' ')).toBe('text-3xl font-semibold tracking-tight tabular-nums text-foreground')
      expect(kpiTileVariants()).toBe('gap-2 p-4')
    })

    it('compact tightens padding and shrinks text', () => {
      const w = root({ size: 'compact' })
      expect(w.classes()).toContain('p-3')
      expect(w.classes()).not.toContain('p-4')
      expect(w.classes()).toContain('gap-1')
      expect(w.attributes('data-size')).toBe('compact')
      expect(w.find('[data-slot="kpi-tile-value"]').classes()).toContain('text-xl')
      expect(w.find('[data-slot="kpi-tile-value"]').classes()).not.toContain('text-3xl')
      expect(w.find('[data-slot="kpi-tile-label"]').element.parentElement!.classList).toContain('text-xs')
    })

    it.each(['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const)('tone %s never draws an edge stripe', (tone) => {
      const w = root({ tone })
      expect(w.classes().join(' ')).not.toMatch(/border-l-|border-t-|border-s-[2-9]|gradient/)
    })

    it('delta uses tabular figures', () => {
      expect(delta(root({ delta: 12, trend: 'up' })).classes()).toContain('tabular-nums')
    })

    it('has no accent variant: a stale `accent` value renders the plain default tile without a stripe', () => {
      const w = root({ variant: 'accent' as never, tone: 'danger' })
      expect(w.classes().join(' ')).not.toMatch(/border-l-|gradient/)
      expect(w.attributes('data-tile-variant')).toBeUndefined()
      expect(w.classes()).toContain('bg-card')
    })

    it('inverted uses the foreground surface and light text', () => {
      const w = root({ variant: 'inverted', label: 'Revenue', delta: '+1', trend: 'flat', hint: 'h', loading: false })
      expect(w.classes()).toContain('bg-foreground')
      expect(w.classes()).toContain('text-background')
      expect(w.classes()).not.toContain('bg-card')
      expect(w.attributes('data-tile-variant')).toBe('inverted')
      expect(w.find('[data-slot="kpi-tile-value"]').classes()).toContain('text-background')
      expect(w.find('[data-slot="kpi-tile-value"]').classes()).not.toContain('text-foreground')
      expect(w.find('[data-slot="kpi-tile-hint"]').classes()).toContain('text-background/70')
      // success / destructive text fails contrast on the foreground surface, so the delta follows the surface text colour
      expect(delta(w).classes()).toContain('text-background')
      expect(delta(w).classes()).not.toContain('text-success')
    })

    it('with-sparkline renders a Sparkline from data, tone-coloured, with an accessible label', () => {
      const w = root({ label: 'Revenue', sparkline: [1, 3, 2, 5], tone: 'success' })
      const spark = w.find('[data-slot="kpi-tile-sparkline"] svg')
      expect(spark.exists()).toBe(true)
      expect(spark.attributes('aria-label')).toBe('Revenue trend')
      expect(spark.find('[data-slot="sparkline-line"]').classes()).toContain('stroke-success')
      expect(spark.classes()).toContain('w-full')
    })

    it('sparkline slot overrides the built-in one; empty data renders nothing', () => {
      const w = root({ sparkline: [1, 2] }, { sparkline: '<i id="custom" />' })
      expect(w.find('[data-slot="kpi-tile-sparkline"] #custom').exists()).toBe(true)
      expect(w.find('svg[data-slot="sparkline"]').exists()).toBe(false)
      expect(root({}, { sparkline: '<i id="only-slot" />' }).find('#only-slot').exists()).toBe(true)
      expect(root({ sparkline: [] }).find('[data-slot="kpi-tile-sparkline"]').exists()).toBe(false)
      expect(root({ sparkline: 'nope' as never }).find('[data-slot="kpi-tile-sparkline"]').exists()).toBe(false)
    })

    it('with-progress renders an accessible bar and clamps the value', () => {
      const w = root({ label: 'Quota', progress: 64, tone: 'warning' })
      const bar = w.find('[data-slot="kpi-tile-progress"]')
      expect(bar.attributes('role')).toBe('progressbar')
      expect(bar.attributes('aria-valuenow')).toBe('64')
      expect(bar.attributes('aria-valuemin')).toBe('0')
      expect(bar.attributes('aria-valuemax')).toBe('100')
      expect(bar.attributes('aria-label')).toBe('Quota progress')
      const fill = w.find('[data-slot="kpi-tile-progress-bar"]')
      expect(fill.attributes('style')).toContain('width: 64%')
      expect(fill.classes()).toContain('bg-warning')
      expect(root({ progress: 250 }).find('[data-slot="kpi-tile-progress"]').attributes('aria-valuenow')).toBe('100')
      expect(root({ progress: -5 }).find('[data-slot="kpi-tile-progress"]').attributes('aria-valuenow')).toBe('0')
      expect(root({ progress: 0 }).find('[data-slot="kpi-tile-progress"]').exists()).toBe(true)
    })

    it.each([NaN, Infinity, null, undefined, 'x' as never])('invalid progress %s hides the bar', (progress) => {
      expect(root({ progress }).find('[data-slot="kpi-tile-progress"]').exists()).toBe(false)
    })

    it('inverted sparkline draws in the surface text colour, not a tone that vanishes on it', () => {
      const w = root({ variant: 'inverted', sparkline: [1, 3, 2], tone: 'info' })
      expect(w.find('[data-slot="sparkline"]').classes().join(' ')).toContain('[&_[data-slot=sparkline-line]]:stroke-background')
      expect(root({ sparkline: [1, 3, 2] }).find('[data-slot="sparkline"]').classes().join(' ')).not.toContain('stroke-background')
    })
    it('inverted progress uses light track and fill', () => {
      const w = root({ variant: 'inverted', progress: 50 })
      expect(w.find('[data-slot="kpi-tile-progress"]').classes()).toContain('bg-background/20')
      expect(w.find('[data-slot="kpi-tile-progress-bar"]').classes()).toContain('bg-background')
    })

    it('every tone maps to a progress colour; unknown tone falls back to primary', () => {
      for (const [tone, cls] of [['neutral', 'bg-muted-foreground'], ['primary', 'bg-primary'], ['success', 'bg-success'], ['danger', 'bg-destructive'], ['info', 'bg-info']] as const) {
        expect(root({ progress: 10, tone }).find('[data-slot="kpi-tile-progress-bar"]').classes()).toContain(cls)
      }
      const odd = root({ progress: 10, tone: 'rainbow' as never, sparkline: [1, 2, 3] })
      expect(odd.find('[data-slot="kpi-tile-progress-bar"]').classes()).toContain('bg-primary')
      expect(odd.find('[data-slot="sparkline-line"]').classes()).toContain('stroke-primary')
    })

    it('loading hides sparkline and progress', () => {
      const w = root({ loading: true, sparkline: [1, 2], progress: 40 })
      expect(w.find('[data-slot="kpi-tile-sparkline"]').exists()).toBe(false)
      expect(w.find('[data-slot="kpi-tile-progress"]').exists()).toBe(false)
    })

    it('variations combine and class still wins', () => {
      const w = root({ variant: 'inverted', size: 'compact', tone: 'info', sparkline: [1, 2], progress: 20, class: 'p-6' })
      expect(w.classes()).toContain('p-6')
      expect(w.classes()).not.toContain('p-3')
      expect(w.find('[data-slot="kpi-tile-sparkline"]').exists()).toBe(true)
      expect(w.find('[data-slot="kpi-tile-progress"]').exists()).toBe(true)
    })

    it('unknown size / variant fall back without crashing', () => {
      const a = root({ size: 'huge' as never })
      expect(a.exists()).toBe(true)
      expect(a.classes()).toContain('flex')
      expect(a.find('[data-slot="kpi-tile-value"]').classes()).toContain('text-3xl')
      const b = root({ variant: 'nope' as never })
      expect(b.exists()).toBe(true)
      expect(b.attributes('data-tile-variant')).toBeUndefined()
    })

    it('Card variants still pass through', () => {
      expect(root({ variant: 'outline' }).classes()).toContain('bg-transparent')
      expect(root({ variant: 'ghost' }).classes()).toContain('bg-transparent')
    })
  })

  describe('customisation', () => {
    it('merges class, overriding the default padding', () => {
      const w = mount(KpiTile, { props: { label: 'x', value: 1, class: 'p-8 custom' } })
      expect(w.classes()).toContain('p-8')
      expect(w.classes()).not.toContain('p-4')
      expect(w.classes()).toContain('custom')
    })
    it('supports variant, as and attrs', () => {
      const w = mount(KpiTile, { props: { label: 'x', value: 1, variant: 'interactive', as: 'a' }, attrs: { href: '/x', 'data-test': 't' } })
      expect(w.element.tagName).toBe('A')
      expect(w.attributes('href')).toBe('/x')
      expect(w.attributes('data-test')).toBe('t')
      expect(w.classes()).toContain('cursor-pointer')
    })
    it('as-child renders the slotted element', () => {
      const w = mount(KpiTile, { props: { label: 'x', value: 1, asChild: true }, slots: { default: '<a href="/z">z</a>' } })
      expect(w.exists()).toBe(true)
    })
  })

  describe('bad path / edge cases', () => {
    it.each([NaN, Infinity, -Infinity])('non-finite value %s shows a dash', (value) => {
      expect(mount(KpiTile, { props: { label: 'x', value } }).find('[data-slot="kpi-tile-value"]').text()).toBe('–')
    })
    it('null / undefined value shows a dash', () => {
      expect(mount(KpiTile, { props: { label: 'x', value: null } }).find('[data-slot="kpi-tile-value"]').text()).toBe('–')
      expect(mount(KpiTile, { props: { label: 'x' } }).find('[data-slot="kpi-tile-value"]').text()).toBe('–')
    })
    it('string value is shown verbatim; zero and negative numbers format', () => {
      expect(mount(KpiTile, { props: { label: 'x', value: '99.9%' } }).find('[data-slot="kpi-tile-value"]').text()).toBe('99.9%')
      expect(mount(KpiTile, { props: { label: 'x', value: 0 } }).find('[data-slot="kpi-tile-value"]').text()).toBe('0')
      expect(mount(KpiTile, { props: { label: 'x', value: -1500 } }).find('[data-slot="kpi-tile-value"]').text()).toBe('-1,500')
    })
    it('non-finite numeric delta shows a dash; empty delta hides the row', () => {
      expect(delta(mount(KpiTile, { props: { label: 'x', value: 1, delta: NaN } })).text()).toContain('–')
      expect(delta(mount(KpiTile, { props: { label: 'x', value: 1, delta: '' } })).exists()).toBe(false)
      expect(delta(mount(KpiTile, { props: { label: 'x', value: 1 } })).exists()).toBe(false)
    })
    it('hint only renders without a delta', () => {
      const w = mount(KpiTile, { props: { label: 'x', value: 1, hint: 'only hint' } })
      expect(delta(w).exists()).toBe(false)
      expect(w.find('[data-slot="kpi-tile-hint"]').text()).toBe('only hint')
    })
    it('invalid trend falls back to neutral', () => {
      const d = delta(mount(KpiTile, { props: { label: 'x', value: 1, delta: '1', trend: 'sideways' as never } }))
      expect(d.attributes('data-sentiment')).toBe('neutral')
    })
    it('huge values and unicode labels', () => {
      const w = mount(KpiTile, { props: { label: 'مرحبا', value: 1e21 } })
      expect(w.find('[data-slot="kpi-tile-label"]').text()).toBe('مرحبا')
      expect(w.find('[data-slot="kpi-tile-value"]').text().length).toBeGreaterThan(5)
    })
  })
})
