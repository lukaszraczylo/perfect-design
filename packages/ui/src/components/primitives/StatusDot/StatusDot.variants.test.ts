import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusDot from './StatusDot.vue'
import { statusDotHaloVariants, statusDotVariants } from './variants'

const set = (s: string) => [...new Set(s.split(/\s+/).filter(Boolean))].sort()
const TONES = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const
const SOLID_BG = { neutral: 'bg-muted-foreground', primary: 'bg-primary', success: 'bg-success', warning: 'bg-warning', danger: 'bg-destructive', info: 'bg-info' } as const
const COLOUR = { neutral: 'muted-foreground', primary: 'primary', success: 'success', warning: 'warning', danger: 'destructive', info: 'info' } as const

describe('StatusDot variations', () => {
  describe('default output is frozen', () => {
    const BASE = 'relative inline-flex shrink-0 rounded-full align-middle'
    it.each(TONES)('solid %s md emits the original class set', (tone) => {
      const expected = set(`${BASE} ${SOLID_BG[tone]} size-2`)
      expect(set(statusDotVariants({ tone }))).toEqual(expected)
      expect(set(mount(StatusDot, { props: { tone } }).classes().join(' '))).toEqual(expected)
    })
    it.each([
      ['sm', 'size-1.5'],
      ['md', 'size-2'],
      ['lg', 'size-2.5'],
    ] as const)('original size %s keeps %s', (size, cls) => {
      expect(set(statusDotVariants({ size }))).toEqual(set(`${BASE} bg-muted-foreground ${cls}`))
    })
    it('no props: neutral md, decorative, no extra DOM', () => {
      const w = mount(StatusDot)
      expect(set(w.classes().join(' '))).toEqual(set(`${BASE} bg-muted-foreground size-2`))
      expect(w.attributes('aria-hidden')).toBe('true')
      expect(w.element.children).toHaveLength(0)
    })
    it('the pulse halo keeps its original class set', () => {
      const halo = mount(StatusDot, { props: { pulse: true } }).find('[data-slot="status-dot-halo"]')
      expect(set(halo.classes().join(' '))).toEqual(set('absolute inset-0 animate-ping rounded-full bg-inherit opacity-60 motion-reduce:animate-none'))
    })
  })

  describe('size', () => {
    it.each([
      ['xs', 'size-1'],
      ['sm', 'size-1.5'],
      ['md', 'size-2'],
      ['lg', 'size-2.5'],
      ['xl', 'size-3'],
    ] as const)('%s uses %s and no other size class', (size, cls) => {
      const c = mount(StatusDot, { props: { size } }).classes()
      expect(c).toContain(cls)
      expect(c.filter((x) => x.startsWith('size-'))).toEqual([cls])
    })
    it('unknown size falls back to md', () => {
      expect(mount(StatusDot, { props: { size: 'huge' as never } }).classes()).toContain('size-2')
    })
  })

  describe('variant', () => {
    it.each(TONES)('ring %s fills and outlines in the tone colour', (tone) => {
      const c = mount(StatusDot, { props: { variant: 'ring', tone } }).classes()
      expect(c).toEqual(expect.arrayContaining([SOLID_BG[tone], `outline-${COLOUR[tone]}`, 'outline-1', 'outline-offset-1']))
    })

    it.each(TONES)('outline %s is hollow with a tone border', (tone) => {
      const c = mount(StatusDot, { props: { variant: 'outline', tone } }).classes()
      expect(c).toEqual(expect.arrayContaining(['bg-transparent', `border-${COLOUR[tone]}`]))
      expect(c.filter((x) => /^bg-(?!transparent)/.test(x))).toEqual([])
    })

    it.each(TONES)('soft %s is a 30% tint with a tone border', (tone) => {
      const c = mount(StatusDot, { props: { variant: 'soft', tone } }).classes()
      expect(c).toEqual(expect.arrayContaining(['border', `border-${COLOUR[tone]}`, `bg-${COLOUR[tone]}/30`]))
    })

    it('outline uses a 1px border on xs and sm and 2px from md up (one border-width class each)', () => {
      for (const [size, cls] of [['xs', 'border'], ['sm', 'border'], ['md', 'border-2'], ['lg', 'border-2'], ['xl', 'border-2']] as const) {
        const c = mount(StatusDot, { props: { variant: 'outline', size } }).classes()
        expect(c.filter((x) => x === 'border' || /^border-\d$/.test(x)), size).toEqual([cls])
      }
    })

    it('every non-solid variant draws a border or outline that survives forced-colors mode', () => {
      for (const variant of ['ring', 'outline', 'soft'] as const) {
        const c = mount(StatusDot, { props: { variant } }).classes().join(' ')
        expect(c, variant).toMatch(/(?:^|\s)(?:border|border-2|outline-1)(?:\s|$)/)
      }
    })

    it('variants never carry two background colours (no conflicting classes)', () => {
      for (const variant of ['solid', 'ring', 'outline', 'soft'] as const)
        for (const tone of TONES) expect(statusDotVariants({ variant, tone }).split(' ').filter((x) => /^bg-/.test(x)).length, `${variant} ${tone}`).toBeLessThanOrEqual(1)
    })

    it('unknown variant falls back to solid', () => {
      const w = mount(StatusDot, { props: { variant: 'glow' as never, tone: 'success' } })
      expect(set(w.classes().join(' '))).toEqual(set(mount(StatusDot, { props: { tone: 'success' } }).classes().join(' ')))
    })

    it('unknown tone falls back to neutral', () => {
      expect(mount(StatusDot, { props: { tone: 'nope' as never } }).classes()).toContain('bg-muted-foreground')
    })
  })

  describe('combinations', () => {
    it.each([
      ['ring', 'xl', 'success'],
      ['outline', 'xs', 'danger'],
      ['soft', 'lg', 'warning'],
      ['ring', 'sm', 'info'],
    ] as const)('variant %s x size %s x tone %s', (variant, size, tone) => {
      const c = mount(StatusDot, { props: { variant, size, tone } }).classes()
      expect(c.filter((x) => x.startsWith('size-'))).toHaveLength(1)
      expect(c).toContain({ xs: 'size-1', sm: 'size-1.5', lg: 'size-2.5', xl: 'size-3' }[size])
      expect(c).toContain('rounded-full')
    })

    it('class prop wins over variant, tone and size', () => {
      const c = mount(StatusDot, { props: { variant: 'soft', tone: 'danger', size: 'xl', class: 'bg-pink-500 size-4 border-pink-500' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['bg-pink-500', 'size-4', 'border-pink-500']))
      expect(c).not.toContain('bg-destructive/30')
      expect(c).not.toContain('size-3')
      expect(c).not.toContain('border-destructive')
    })
  })

  describe('pulse and accessible name per variant', () => {
    it.each(['solid', 'ring', 'outline', 'soft'] as const)('%s pulses with a decorative, reduced-motion safe halo', (variant) => {
      const w = mount(StatusDot, { props: { variant, pulse: true, tone: 'success' } })
      const halo = w.find('[data-slot="status-dot-halo"]')
      expect(halo.exists()).toBe(true)
      expect(halo.attributes('aria-hidden')).toBe('true')
      expect(halo.classes()).toEqual(expect.arrayContaining(['animate-ping', 'motion-reduce:animate-none', 'rounded-full']))
      expect(w.attributes('data-pulse')).toBeDefined()
    })

    it('outline halo copies the border colour instead of a fill (a transparent fill would not pulse)', () => {
      const c = statusDotHaloVariants({ variant: 'outline' })
      expect(c).toContain('border-inherit')
      expect(c).not.toContain('bg-inherit')
      expect(statusDotHaloVariants({ variant: 'ring' })).toContain('bg-inherit')
      expect(statusDotHaloVariants({ variant: 'soft' })).toContain('bg-inherit')
    })

    it.each(['solid', 'ring', 'outline', 'soft'] as const)('%s with a label is role=img with that name; without it is aria-hidden', (variant) => {
      const named = mount(StatusDot, { props: { variant, label: 'Online' } })
      expect(named.attributes('role')).toBe('img')
      expect(named.attributes('aria-label')).toBe('Online')
      expect(named.attributes('aria-hidden')).toBeUndefined()
      const bare = mount(StatusDot, { props: { variant } })
      expect(bare.attributes('aria-hidden')).toBe('true')
      expect(bare.attributes('role')).toBeUndefined()
    })

    it('toggling variant at runtime swaps the classes', async () => {
      const w = mount(StatusDot, { props: { tone: 'success' } })
      expect(w.classes()).toContain('bg-success')
      await w.setProps({ variant: 'outline' })
      expect(w.classes()).not.toContain('bg-success')
      expect(w.classes()).toContain('border-success')
    })
  })
})
