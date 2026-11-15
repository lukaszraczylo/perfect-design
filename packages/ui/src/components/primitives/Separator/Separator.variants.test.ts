import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Separator from './Separator.vue'
import { separatorLabelVariants, separatorLineVariants, separatorVariants } from './variants'

const lines = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="separator-line"]')
const label = (w: ReturnType<typeof mount>) => w.find('[data-slot="separator-label"]')

describe('Separator size (thickness)', () => {
  it('thin is the default and keeps the original 1px classes', () => {
    const w = mount(Separator)
    expect(w.classes()).toEqual(expect.arrayContaining(['data-[orientation=horizontal]:h-px', 'data-[orientation=vertical]:w-px', 'bg-border', 'forced-colors:bg-[CanvasText]']))
    expect(mount(Separator, { props: { size: 'thin' } }).classes().sort()).toEqual(w.classes().sort())
    expect(separatorVariants()).toBe(
      'shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px bg-border forced-colors:bg-[CanvasText]',
    )
  })

  it.each([
    ['md', 'h-0.5', 'w-0.5'],
    ['thick', 'h-0.75', 'w-0.75'],
  ] as const)('%s replaces the 1px thickness (%s horizontal, %s vertical)', (size, h, v) => {
    const w = mount(Separator, { props: { size } })
    expect(w.classes()).toContain(`data-[orientation=horizontal]:${h}`)
    expect(w.classes()).toContain(`data-[orientation=vertical]:${v}`)
    expect(w.classes()).not.toContain('data-[orientation=horizontal]:h-px')
    expect(w.classes()).not.toContain('data-[orientation=vertical]:w-px')
    expect(w.attributes('role')).toBe('none')
  })

  it.each([
    ['md', 'border-t-2', 'border-l-2'],
    ['thick', 'border-t-3', 'border-l-3'],
  ] as const)('%s dashed and dotted lines draw a thicker border', (size, top, left) => {
    for (const variant of ['dashed', 'dotted'] as const) {
      const w = mount(Separator, { props: { size, variant } })
      expect(w.classes()).toContain(`data-[orientation=horizontal]:${top}`)
      expect(w.classes()).toContain(`data-[orientation=vertical]:${left}`)
      expect(w.classes()).not.toContain('data-[orientation=horizontal]:border-t')
      expect(w.classes()).not.toContain('bg-border')
    }
  })

  it('a thin dashed line keeps the 1px border', () => {
    expect(mount(Separator, { props: { variant: 'dashed' } }).classes()).toContain('data-[orientation=horizontal]:border-t')
  })

  it('thicker filled lines add a forced-colors border of the same width', () => {
    expect(mount(Separator, { props: { size: 'md' } }).classes()).toEqual(
      expect.arrayContaining(['forced-colors:data-[orientation=horizontal]:border-t-2', 'forced-colors:data-[orientation=vertical]:border-l-2']),
    )
    expect(mount(Separator, { props: { size: 'thick' } }).classes()).toEqual(
      expect.arrayContaining(['forced-colors:data-[orientation=horizontal]:border-t-3', 'forced-colors:data-[orientation=vertical]:border-l-3']),
    )
  })

  it('labelled: both lines take the thickness in either orientation', () => {
    const h = mount(Separator, { props: { label: 'or', size: 'md' } })
    for (const l of lines(h)) {
      expect(l.classes()).toContain('h-0.5')
      expect(l.classes()).not.toContain('h-px')
    }
    const v = mount(Separator, { props: { label: 'or', size: 'thick', orientation: 'vertical' } })
    for (const l of lines(v)) {
      expect(l.classes()).toContain('w-0.75')
      expect(l.classes()).not.toContain('w-px')
    }
  })

  it('labelled dashed lines get a thicker border', () => {
    const w = mount(Separator, { props: { label: 'or', size: 'thick', variant: 'dotted' } })
    for (const l of lines(w)) expect(l.classes()).toEqual(expect.arrayContaining(['border-t-3', 'border-dotted', 'h-0.75']))
    const v = mount(Separator, { props: { label: 'or', size: 'md', variant: 'dashed', orientation: 'vertical' } })
    for (const l of lines(v)) expect(l.classes()).toEqual(expect.arrayContaining(['border-l-2', 'w-0.5']))
  })

  it('unknown size falls back to thin', () => {
    const w = mount(Separator, { props: { size: 'huge' as never } })
    expect(w.classes()).toContain('data-[orientation=horizontal]:h-px')
    const l = mount(Separator, { props: { size: 'huge' as never, label: 'x' } })
    expect(lines(l)[0]!.classes()).toContain('h-px')
  })

  it('class wins over the thickness', () => {
    const w = mount(Separator, { props: { size: 'thick', class: 'data-[orientation=horizontal]:h-4' } })
    expect(w.classes()).toContain('data-[orientation=horizontal]:h-4')
    expect(w.classes()).not.toContain('data-[orientation=horizontal]:h-0.75')
  })
})

describe('Separator tone', () => {
  const SOLID = { muted: 'bg-border/50', strong: 'bg-input', primary: 'bg-primary' } as const
  const BORDER = { muted: 'border-border/50', strong: 'border-input', primary: 'border-primary' } as const

  it('default is unchanged', () => {
    expect(mount(Separator, { props: { tone: 'default' } }).classes().sort()).toEqual(mount(Separator).classes().sort())
    const l = mount(Separator, { props: { label: 'x', tone: 'default' } })
    expect(label(l).classes()).toContain('text-muted-foreground')
    expect(lines(l)[0]!.classes()).toContain('bg-border')
  })

  it.each(Object.entries(SOLID))('%s recolours a filled line (%s) and drops bg-border', (tone, cls) => {
    const w = mount(Separator, { props: { tone: tone as never } })
    expect(w.classes()).toContain(cls)
    expect(w.classes()).not.toContain('bg-border')
    expect(w.classes()).toEqual(
      expect.arrayContaining(['forced-colors:data-[orientation=horizontal]:border-t', 'forced-colors:data-[orientation=vertical]:border-l']),
    )
  })

  it.each(Object.entries(BORDER))('%s recolours dashed and dotted lines (%s) and drops border-border', (tone, cls) => {
    for (const variant of ['dashed', 'dotted'] as const) {
      const w = mount(Separator, { props: { tone: tone as never, variant } })
      expect(w.classes()).toContain(cls)
      if (tone !== 'muted') expect(w.classes()).not.toContain('border-border')
      expect(w.classes()).not.toContain('forced-colors:data-[orientation=horizontal]:border-t')
    }
  })

  it.each(Object.entries(SOLID))('labelled: %s recolours both lines and sets the matching label text', (tone, cls) => {
    const w = mount(Separator, { props: { label: 'Section', tone: tone as never } })
    for (const l of lines(w)) {
      expect(l.classes()).toContain(cls)
      expect(l.classes()).not.toContain('bg-border')
      expect(l.classes()).toContain('forced-colors:border-t')
    }
    const text = label(w).classes()
    if (tone === 'strong') expect(text).toContain('text-foreground')
    if (tone === 'primary') expect(text).toContain('text-primary')
    if (tone === 'muted') expect(text).toContain('text-muted-foreground')
    if (tone !== 'muted') expect(text).not.toContain('text-muted-foreground')
    expect(w.text()).toBe('Section')
  })

  it('labelled vertical: toned lines get the vertical forced-colors border', () => {
    const w = mount(Separator, { props: { label: 'x', tone: 'primary', orientation: 'vertical' } })
    expect(lines(w)[0]!.classes()).toContain('forced-colors:border-l')
    const d = mount(Separator, { props: { label: 'x', tone: 'strong', variant: 'dashed', orientation: 'vertical' } })
    expect(lines(d)[0]!.classes()).toEqual(expect.arrayContaining(['border-input', 'border-l']))
  })

  it('unknown tone falls back to default', () => {
    expect(mount(Separator, { props: { tone: 'pink' as never } }).classes()).toContain('bg-border')
    expect(label(mount(Separator, { props: { label: 'x', tone: 'pink' as never } })).classes()).toContain('text-muted-foreground')
  })

  it('class wins over the tone', () => {
    const w = mount(Separator, { props: { tone: 'primary', class: 'bg-pink-500' } })
    expect(w.classes()).toContain('bg-pink-500')
    expect(w.classes()).not.toContain('bg-primary')
  })
})

describe('Separator size x tone x variant', () => {
  const sizes = ['thin', 'md', 'thick'] as const
  const tones = ['default', 'muted', 'strong', 'primary'] as const
  const variants = ['solid', 'dashed', 'dotted'] as const

  it.each(sizes.flatMap((s) => tones.flatMap((t) => variants.map((v) => [s, t, v] as const))))('size %s, tone %s, variant %s: one colour, one thickness, a11y intact', (size, tone, variant) => {
    for (const orientation of ['horizontal', 'vertical'] as const) {
      const w = mount(Separator, { props: { size, tone, variant, orientation, decorative: false } })
      const c = w.classes()
      expect(c.filter((x) => /^bg-/.test(x))).toHaveLength(variant === 'solid' ? 1 : 0)
      expect(c.filter((x) => /^border-(?:border|input|primary)/.test(x))).toHaveLength(variant === 'solid' ? 0 : 1)
      const key = orientation === 'horizontal' ? 'data-[orientation=horizontal]:h-' : 'data-[orientation=vertical]:w-'
      expect(c.filter((x) => x.startsWith(key))).toHaveLength(1)
      expect(w.attributes('role')).toBe('separator')
      expect(w.attributes('data-orientation')).toBe(orientation)
    }
  })

  it('a labelled non-decorative separator keeps its name with every look', () => {
    const w = mount(Separator, { props: { label: 'Or', decorative: false, size: 'thick', tone: 'primary', variant: 'dashed', align: 'end' } })
    expect(w.attributes('role')).toBe('separator')
    expect(w.attributes('aria-label')).toBe('Or')
    expect(lines(w)).toHaveLength(1)
  })

  it('asChild keeps the look on the child', () => {
    const w = mount(Separator, { props: { asChild: true, size: 'md', tone: 'strong' }, slots: { default: '<hr class="mine" />' } })
    expect(w.element.tagName).toBe('HR')
    expect(w.classes()).toEqual(expect.arrayContaining(['mine', 'bg-input', 'data-[orientation=horizontal]:h-0.5']))
  })
})

describe('Separator helpers with the new dimensions', () => {
  it('line and label helpers emit size and tone classes and accept defaults', () => {
    expect(separatorLineVariants()).toBe('block flex-1 bg-border forced-colors:bg-[CanvasText] h-px min-w-4')
    expect(separatorLineVariants({ size: 'md' })).toContain('h-0.5')
    expect(separatorLineVariants({ size: 'thick', orientation: 'vertical', variant: 'dashed', tone: 'strong' })).toEqual(expect.stringContaining('border-l-3'))
    expect(separatorLabelVariants()).toBe('shrink-0 text-xs font-medium text-muted-foreground')
    expect(separatorLabelVariants({ tone: 'strong' })).toContain('text-foreground')
    expect(separatorLabelVariants({ tone: 'primary' })).toContain('text-primary')
    expect(separatorVariants({ tone: 'strong', size: 'md', variant: 'dotted' })).toEqual(expect.stringContaining('border-input'))
  })
})

describe('Separator forced colours', () => {
  const lines = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="separator-line"]')

  it('the default filled hairline paints CanvasText in forced-colors mode (a background token is dropped there)', () => {
    for (const orientation of ['horizontal', 'vertical'] as const) {
      const w = mount(Separator, { props: { orientation } })
      expect(w.classes()).toContain('bg-border')
      expect(w.classes()).toContain('forced-colors:bg-[CanvasText]')
    }
  })

  it('the labelled lines paint CanvasText too, on both sides of the label', () => {
    const w = mount(Separator, { props: { label: 'or' } })
    expect(lines(w)).toHaveLength(2)
    for (const l of lines(w)) expect(l.classes()).toContain('forced-colors:bg-[CanvasText]')
  })

  it('dashed and dotted lines already use a border and need no forced-colors background', () => {
    for (const variant of ['dashed', 'dotted'] as const) expect(mount(Separator, { props: { variant } }).classes()).not.toContain('forced-colors:bg-[CanvasText]')
  })

  it('every tone and size keeps the forced-colors fill and the consumer class still wins for the normal colour', () => {
    for (const tone of ['muted', 'strong', 'primary'] as const) for (const size of ['thin', 'md', 'thick'] as const) {
      expect(mount(Separator, { props: { tone, size } }).classes()).toContain('forced-colors:bg-[CanvasText]')
    }
    const w = mount(Separator, { props: { class: 'bg-primary' } })
    expect(w.classes()).toContain('bg-primary')
    expect(w.classes()).not.toContain('bg-border')
    expect(w.classes()).toContain('forced-colors:bg-[CanvasText]')
  })
})
