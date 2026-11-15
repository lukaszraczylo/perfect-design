import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Text from './Text.vue'
import { lineClampClasses, textPresets, textSizes, textVariantNames, textVariants } from './variants'

describe('Text', () => {
  describe('good path', () => {
    it('renders a <p> with base size and slot content', () => {
      const w = mount(Text, { slots: { default: 'Hello' } })
      expect(w.element.tagName).toBe('P')
      expect(w.attributes('data-slot')).toBe('text')
      expect(w.classes()).toContain('text-base')
      expect(w.text()).toBe('Hello')
    })

    it.each(textSizes)('size %s', (size) => {
      expect(mount(Text, { props: { size } }).classes()).toContain(`text-${size}`)
    })

    it('default tone adds no colour class', () => {
      const c = mount(Text).classes()
      expect(c.some((x) => /^text-(muted-foreground|success|warning|destructive|info)$/.test(x))).toBe(false)
    })

    it.each([
      ['muted', 'text-muted-foreground'],
      ['success', 'text-success'],
      ['warning', 'text-warning-foreground'],
      ['danger', 'text-destructive'],
      ['info', 'text-info'],
    ] as const)('tone %s', (tone, cls) => {
      expect(mount(Text, { props: { tone } }).classes()).toContain(cls)
    })

    it.each([
      ['normal', 'font-normal'],
      ['medium', 'font-medium'],
      ['semibold', 'font-semibold'],
      ['bold', 'font-bold'],
    ] as const)('weight %s', (weight, cls) => {
      expect(mount(Text, { props: { weight } }).classes()).toContain(cls)
    })

    it.each([
      ['left', 'text-left'],
      ['center', 'text-center'],
      ['right', 'text-right'],
      ['justify', 'text-justify'],
      ['start', 'text-start'],
      ['end', 'text-end'],
    ] as const)('align %s', (align, cls) => {
      expect(mount(Text, { props: { align } }).classes()).toContain(cls)
    })

    it('truncate adds truncate', () => {
      expect(mount(Text, { props: { truncate: true } }).classes()).toContain('truncate')
      expect(mount(Text).classes()).not.toContain('truncate')
    })

    it.each([1, 2, 3, 4, 5, 6] as const)('lines %i adds line-clamp-%i', (lines) => {
      expect(mount(Text, { props: { lines } }).classes()).toContain(lineClampClasses[lines])
      expect(mount(Text, { props: { lines } }).classes()).toContain(`line-clamp-${lines}`)
    })

    it('accepts string lines', () => {
      expect(mount(Text, { props: { lines: '3' } }).classes()).toContain('line-clamp-3')
    })
  })

  describe('customisation', () => {
    it('as renders another element', () => {
      expect(mount(Text, { props: { as: 'span' } }).element.tagName).toBe('SPAN')
    })

    it('asChild styles the child', () => {
      const w = mount(Text, { props: { asChild: true, tone: 'muted' }, slots: { default: '<em>x</em>' } })
      expect(w.element.tagName).toBe('EM')
      expect(w.classes()).toContain('text-muted-foreground')
    })

    it('class merges last and wins over size/tone', () => {
      const w = mount(Text, { props: { size: 'lg', tone: 'muted', class: 'text-sm text-primary custom-x' } })
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('text-sm')
      expect(w.classes()).toContain('text-primary')
      expect(w.classes()).not.toContain('text-lg')
      expect(w.classes()).not.toContain('text-muted-foreground')
    })

    it('keeps size and tone together (tailwind-merge does not confuse them)', () => {
      const c = mount(Text, { props: { size: 'md', tone: 'muted' } }).classes()
      expect(c).toContain('text-md')
      expect(c).toContain('text-muted-foreground')
    })

    it('passes attributes through', () => {
      const w = mount(Text, { attrs: { id: 't', title: 'full text' } })
      expect(w.attributes('id')).toBe('t')
      expect(w.attributes('title')).toBe('full text')
    })

    it('textVariants is reusable', () => {
      expect(textVariants({ size: 'xs', tone: 'danger' })).toContain('text-destructive')
    })
  })

  describe('bad path', () => {
    it.each([0, 7, -2, 1.5, NaN])('invalid lines %s is ignored', (lines) => {
      const c = mount(Text, { props: { lines: lines as never } }).classes()
      expect(c.some((x) => x.startsWith('line-clamp'))).toBe(false)
    })

    it('invalid lines still honours truncate', () => {
      expect(mount(Text, { props: { lines: 9 as never, truncate: true } }).classes()).toContain('truncate')
    })

    it('valid lines wins over truncate', () => {
      const c = mount(Text, { props: { lines: 2, truncate: true } }).classes()
      expect(c).toContain('line-clamp-2')
      expect(c).not.toContain('truncate')
    })

    it('unknown size falls back to base', () => {
      expect(mount(Text, { props: { size: 'huge' as never } }).classes()).toContain('text-base')
    })

    it('unknown tone / weight / align add no class and do not throw', () => {
      const w = mount(Text, { props: { tone: 'x' as never, weight: 'y' as never, align: 'z' as never } })
      expect(w.exists()).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('renders with no slot content', () => {
      expect(mount(Text).text()).toBe('')
    })

    it('handles empty class, unicode and RTL text', () => {
      const w = mount(Text, { props: { class: '' }, slots: { default: 'שלום 世界 🌍' } })
      expect(w.text()).toBe('שלום 世界 🌍')
    })

    it('handles huge text', () => {
      expect(mount(Text, { slots: { default: 'a '.repeat(10000) } }).text().length).toBeGreaterThan(9999)
    })

    it('reacts to prop changes', async () => {
      const w = mount(Text, { props: { lines: 2 } })
      await w.setProps({ lines: 4 })
      expect(w.classes()).toContain('line-clamp-4')
      await w.setProps({ lines: undefined })
      expect(w.classes().some((x) => x.startsWith('line-clamp'))).toBe(false)
    })
  })

  describe('extended scale', () => {
    it.each([
      ['subtle', 'text-muted-foreground'],
      ['foreground', 'text-foreground'],
      ['primary', 'text-primary'],
    ] as const)('tone %s', (tone, cls) => {
      expect(mount(Text, { props: { tone } }).classes()).toContain(cls)
    })

    it('weight light', () => {
      expect(mount(Text, { props: { weight: 'light' } }).classes()).toContain('font-light')
    })

    it.each([
      ['none', 'leading-none'],
      ['tight', 'leading-tight'],
      ['snug', 'leading-snug'],
      ['normal', 'leading-normal'],
      ['relaxed', 'leading-relaxed'],
      ['loose', 'leading-loose'],
    ] as const)('leading %s', (leading, cls) => {
      expect(mount(Text, { props: { leading } }).classes()).toContain(cls)
    })

    it.each([
      ['uppercase', 'uppercase'],
      ['lowercase', 'lowercase'],
      ['capitalize', 'capitalize'],
    ] as const)('transform %s', (transform, cls) => {
      expect(mount(Text, { props: { transform } }).classes()).toContain(cls)
    })

    it('italic toggles italic', () => {
      expect(mount(Text, { props: { italic: true } }).classes()).toContain('italic')
      expect(mount(Text).classes()).not.toContain('italic')
    })

    it.each([
      ['balance', 'text-balance'],
      ['pretty', 'text-pretty'],
      ['nowrap', 'text-nowrap'],
    ] as const)('wrap %s', (wrap, cls) => {
      expect(mount(Text, { props: { wrap } }).classes()).toContain(cls)
    })

    it('2xl and 3xl sizes are included in textSizes', () => {
      expect(textSizes).toEqual(expect.arrayContaining(['2xl', '3xl']))
    })

    it('wrap text-balance does not clobber size or tone', () => {
      const c = mount(Text, { props: { wrap: 'balance', size: 'lg', tone: 'muted' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['text-balance', 'text-lg', 'text-muted-foreground']))
    })

    it('unknown leading / transform / wrap add nothing and do not throw', () => {
      const w = mount(Text, { props: { leading: 'x' as never, transform: 'y' as never, wrap: 'z' as never } })
      expect(w.exists()).toBe(true)
      expect(w.classes().some((c) => c.startsWith('leading-'))).toBe(false)
    })
  })

  describe('variant presets', () => {
    it('default variant keeps the legacy output (base, no colour)', () => {
      const c = mount(Text).classes()
      expect(c).toEqual(['text-base'])
    })

    it('exposes the variant names and presets', () => {
      expect(textVariantNames).toEqual(['default', 'caption', 'label', 'overline', 'mono'])
      for (const v of textVariantNames) expect(textPresets[v]).toBeDefined()
    })

    it('caption is a small muted text', () => {
      const c = mount(Text, { props: { variant: 'caption' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['text-xs', 'text-muted-foreground']))
      expect(c).not.toContain('text-base')
    })

    it('label is small, medium weight, tight leading', () => {
      const c = mount(Text, { props: { variant: 'label', as: 'label' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['text-sm', 'font-medium', 'leading-none']))
    })

    it('overline is small, muted, medium and plain case (no uppercase or tracking)', () => {
      const c = mount(Text, { props: { variant: 'overline' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['text-xs', 'font-medium', 'text-muted-foreground']))
      expect(c).not.toContain('uppercase')
      expect(c).not.toContain('tracking-wider')
    })

    it('mono uses the monospace font at small size', () => {
      const c = mount(Text, { props: { variant: 'mono' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['font-mono', 'text-sm']))
    })

    it('explicit size, tone and weight beat the preset', () => {
      const c = mount(Text, { props: { variant: 'overline', size: 'md', tone: 'primary', weight: 'bold' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['text-md', 'text-primary', 'font-bold']))
      expect(c).not.toContain('text-xs')
      expect(c).not.toContain('text-muted-foreground')
      expect(c).not.toContain('font-semibold')
    })

    it('explicit tone default beats a preset tone', () => {
      const c = mount(Text, { props: { variant: 'caption', tone: 'default' } }).classes()
      expect(c).not.toContain('text-muted-foreground')
    })

    it('class prop beats the preset', () => {
      const c = mount(Text, { props: { variant: 'overline', class: 'normal-case text-sm' } }).classes()
      expect(c).toContain('normal-case')
      expect(c).not.toContain('uppercase')
      expect(c).toContain('text-sm')
      expect(c).not.toContain('text-xs')
    })

    it('variant composes with truncate, lines and align', () => {
      const c = mount(Text, { props: { variant: 'caption', lines: 2, align: 'center' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['line-clamp-2', 'text-center', 'text-xs']))
    })

    it('unknown variant falls back to default', () => {
      const w = mount(Text, { props: { variant: 'banner' as never } })
      expect(w.classes()).toEqual(['text-base'])
    })

    it('unknown size with a variant falls back to base, not the preset', () => {
      expect(mount(Text, { props: { variant: 'caption', size: 'huge' as never } }).classes()).toContain('text-base')
    })

    it('textVariants is reusable with variant', () => {
      expect(textVariants({ variant: 'overline' })).not.toContain('uppercase')
    })

    it('reacts to variant changes', async () => {
      const w = mount(Text, { props: { variant: 'caption' } })
      expect(w.classes()).toContain('text-xs')
      await w.setProps({ variant: 'default' })
      expect(w.classes()).toContain('text-base')
    })
  })
})
