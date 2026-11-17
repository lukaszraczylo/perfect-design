import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from './StatusBadge.vue'
import { statusBadgeLook, statusBadgeVariants } from './variants'
import { statusBadgeVariants as exportedVariants, statusBadgeLook as exportedLook } from './index'

const set = (s: string) => [...new Set(s.split(/\s+/).filter(Boolean))].sort()
const dot = (w: ReturnType<typeof mount>) => w.find('[data-slot="status-dot"]')
const STATUS = { success: 'active', warning: 'pending', danger: 'failed', info: 'running', neutral: 'archived' } as const

describe('StatusBadge variations', () => {
  describe('default output is frozen', () => {
    const BASE = 'inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium [&>svg]:pointer-events-none [&>svg]:size-3'
    const SOFT = {
      active: 'border-transparent bg-success/15 text-success',
      pending: 'border-transparent bg-warning/20 text-warning-foreground dark:text-warning',
      running: 'border-transparent bg-info/15 text-info',
      failed: 'border-transparent bg-destructive text-destructive-foreground',
      archived: 'border-transparent bg-secondary text-secondary-foreground',
    } as const
    it.each(Object.keys(SOFT))('status %s keeps the exact original badge class set', (status) => {
      const w = mount(StatusBadge, { props: { status } })
      expect(set(w.classes().join(' '))).toEqual(set(`${BASE} ${SOFT[status as keyof typeof SOFT]}`))
    })
    it('dot keeps the original sm dot and bg-current', () => {
      const c = dot(mount(StatusBadge, { props: { status: 'active' } })).classes()
      expect(c).toEqual(expect.arrayContaining(['size-1.5', 'bg-current']))
    })
  })

  describe('variant', () => {
    it.each([
      ['active', 'success', ['border-success/50', 'text-success']],
      ['pending', 'warning', ['border-warning', 'text-warning-foreground']],
      ['failed', 'danger', ['border-destructive/50', 'text-destructive']],
      ['running', 'info', ['border-info/50', 'text-info']],
      ['archived', 'neutral', ['border-border', 'text-muted-foreground']],
    ] as const)('outline %s (%s) uses the tone border and text', (status, _tone, cls) => {
      const w = mount(StatusBadge, { props: { status, variant: 'outline' } })
      expect(w.classes()).toEqual(expect.arrayContaining([...cls]))
      expect(w.classes().filter((c) => /^bg-/.test(c))).toEqual([])
    })

    it.each([
      ['active', ['bg-success', 'text-success-foreground']],
      ['pending', ['bg-warning', 'text-warning-foreground']],
      ['failed', ['bg-destructive', 'text-destructive-foreground']],
      ['running', ['bg-info', 'text-info-foreground']],
      ['archived', ['bg-foreground', 'text-background']],
    ] as const)('solid %s uses the filled token pair', (status, cls) => {
      expect(mount(StatusBadge, { props: { status, variant: 'solid' } }).classes()).toEqual(expect.arrayContaining([...cls]))
    })

    it('solid keeps a forced-colors border because the fill is dropped there', () => {
      expect(mount(StatusBadge, { props: { status: 'active', variant: 'solid' } }).classes()).toContain('forced-colors:border-current')
    })

    it.each([
      ['active', 'text-success'],
      ['failed', 'text-destructive'],
      ['archived', 'text-muted-foreground'],
    ] as const)('plain %s is text and dot only: no fill, border or side padding', (status, text) => {
      const w = mount(StatusBadge, { props: { status, variant: 'plain' } })
      const c = w.classes()
      expect(c).toEqual(expect.arrayContaining([text, 'border-0', 'px-0']))
      expect(c).not.toContain('border')
      expect(c).not.toContain('px-2')
      expect(c.filter((x) => /^bg-/.test(x))).toEqual([])
    })

    it('every variant still renders the status text and a decorative dot (not colour alone)', () => {
      for (const variant of ['soft', 'outline', 'solid', 'plain'] as const) {
        const w = mount(StatusBadge, { props: { status: 'in_progress', variant } })
        expect(w.text(), variant).toBe('In progress')
        expect(dot(w).attributes('aria-hidden'), variant).toBe('true')
        expect(w.attributes('data-tone'), variant).toBe('info')
        expect(w.attributes('data-slot'), variant).toBe('status-badge')
      }
    })

    it('unknown variant falls back to soft', () => {
      const a = mount(StatusBadge, { props: { status: 'active', variant: 'glass' as never } })
      expect(set(a.classes().join(' '))).toEqual(set(mount(StatusBadge, { props: { status: 'active' } }).classes().join(' ')))
    })
  })

  describe('size', () => {
    it.each([
      ['sm', ['px-1.5', 'text-2xs'], 'size-1'],
      ['md', ['px-2', 'text-xs'], 'size-1.5'],
      ['lg', ['px-2.5', 'text-sm'], 'size-2'],
    ] as const)('%s sizes badge text, padding and dot', (size, cls, dotCls) => {
      const w = mount(StatusBadge, { props: { status: 'active', size } })
      expect(w.classes()).toEqual(expect.arrayContaining([...cls]))
      expect(dot(w).classes()).toContain(dotCls)
    })

    it('unknown size falls back to md', () => {
      const w = mount(StatusBadge, { props: { status: 'active', size: 'huge' as never } })
      expect(w.classes()).toContain('px-2')
      expect(dot(w).classes()).toContain('size-1.5')
    })
  })

  describe('shape', () => {
    it.each([
      ['pill', 'rounded-full', 'rounded-md'],
      ['rounded', 'rounded-md', 'rounded-full'],
      ['square', 'rounded-none', 'rounded-md'],
    ] as const)('%s uses %s', (shape, cls, absent) => {
      const c = mount(StatusBadge, { props: { status: 'active', shape } }).classes()
      expect(c).toContain(cls)
      expect(c).not.toContain(absent)
    })

    it('unknown shape falls back to rounded', () => {
      expect(mount(StatusBadge, { props: { status: 'active', shape: 'blob' as never } }).classes()).toContain('rounded-md')
    })
  })

  describe('combinations', () => {
    it.each([
      ['outline', 'lg', 'pill'],
      ['solid', 'sm', 'square'],
      ['plain', 'lg', 'pill'],
      ['soft', 'sm', 'pill'],
    ] as const)('variant %s x size %s x shape %s applies all three', (variant, size, shape) => {
      const w = mount(StatusBadge, { props: { status: 'pending', variant, size, shape } })
      const c = w.classes()
      expect(c).toContain({ pill: 'rounded-full', square: 'rounded-none', rounded: 'rounded-md' }[shape])
      expect(c).toContain({ sm: 'text-2xs', md: 'text-xs', lg: 'text-sm' }[size])
      expect(dot(w).classes()).toContain({ sm: 'size-1', md: 'size-1.5', lg: 'size-2' }[size])
      expect(c.filter((x) => /^rounded/.test(x))).toHaveLength(1)
    })

    it('plain with size lg drops the size padding horizontally but keeps vertical padding', () => {
      const c = mount(StatusBadge, { props: { status: 'active', variant: 'plain', size: 'lg' } }).classes()
      expect(c).toContain('px-0')
      expect(c).toContain('py-1')
      expect(c).not.toContain('px-2.5')
    })

    it('class prop wins over variant, size and shape', () => {
      const c = mount(StatusBadge, { props: { status: 'active', variant: 'solid', shape: 'pill', class: 'bg-pink-500 rounded-sm' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['bg-pink-500', 'rounded-sm']))
      expect(c).not.toContain('bg-success')
      expect(c).not.toContain('rounded-full')
    })

    it('tones override and pulse/dot=false work with every variant', () => {
      for (const variant of ['soft', 'outline', 'solid', 'plain'] as const) {
        const live = mount(StatusBadge, { props: { status: 'running', variant, tones: { running: 'success' }, pulse: true } })
        expect(live.attributes('data-tone')).toBe('success')
        expect(live.find('[data-slot="status-dot-halo"]').exists()).toBe(true)
        expect(dot(mount(StatusBadge, { props: { status: 'ok', variant, dot: false } })).exists()).toBe(false)
      }
    })

    it('every status tone maps to every variant without throwing', () => {
      for (const status of Object.values(STATUS))
        for (const variant of ['soft', 'outline', 'solid', 'plain'] as const) expect(mount(StatusBadge, { props: { status, variant } }).text().length).toBeGreaterThan(0)
    })
  })

  describe('helpers', () => {
    it('statusBadgeLook maps variants to Badge variant and tone', () => {
      expect(statusBadgeLook('soft', 'danger')).toEqual({ variant: 'destructive' })
      expect(statusBadgeLook('soft', 'primary')).toEqual({ variant: 'default' })
      expect(statusBadgeLook('outline', 'info')).toEqual({ variant: 'outline', tone: 'info' })
      expect(statusBadgeLook('solid', 'success')).toEqual({ variant: 'solid', tone: 'success' })
      expect(statusBadgeLook('plain', 'warning')).toEqual({ variant: 'outline', tone: 'warning' })
    })

    it('statusBadgeVariants is exported and layers only the extra classes', () => {
      expect(exportedVariants).toBe(statusBadgeVariants)
      expect(exportedLook).toBe(statusBadgeLook)
      expect(statusBadgeVariants()).toBe('')
      expect(statusBadgeVariants({ variant: 'plain' })).toBe('border-0 px-0')
      expect(statusBadgeVariants({ variant: 'solid' })).toBe('forced-colors:border-current')
    })
  })
})

describe('StatusBadge tinted variant', () => {
  it('tints danger and primary instead of filling them', () => {
    expect(statusBadgeLook('tinted', 'danger')).toEqual({ variant: 'soft', tone: 'danger' })
    expect(statusBadgeLook('tinted', 'primary')).toEqual({ variant: 'soft', tone: 'primary' })
    const failed = mount(StatusBadge, { props: { status: 'failed', variant: 'tinted' } })
    expect(failed.classes()).toEqual(expect.arrayContaining(['bg-destructive/10', 'text-destructive']))
    expect(failed.classes()).not.toContain('bg-destructive')
  })
  it('matches soft for success, warning, info and neutral', () => {
    for (const status of ['active', 'pending', 'running', 'archived'])
      expect(mount(StatusBadge, { props: { status, variant: 'tinted' } }).classes().sort()).toEqual(mount(StatusBadge, { props: { status } }).classes().sort())
  })
  it('keeps the soft default unchanged (danger stays filled)', () => {
    expect(mount(StatusBadge, { props: { status: 'failed' } }).classes()).toContain('bg-destructive')
  })
})
