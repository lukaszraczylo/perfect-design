import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Badge from './Badge.vue'
import { badgeDotVariants, badgeVariants } from './variants'

describe('Badge', () => {
  it('renders a span with slot content and data-slot', () => {
    const w = mount(Badge, { slots: { default: 'New' } })
    expect(w.element.tagName).toBe('SPAN')
    expect(w.text()).toBe('New')
    expect(w.attributes('data-slot')).toBe('badge')
  })

  it.each([
    ['default', 'bg-primary'],
    ['secondary', 'bg-secondary'],
    ['destructive', 'bg-destructive'],
    ['success', 'text-success'],
    ['info', 'text-info'],
    ['outline', 'text-foreground'],
    ['warning', 'bg-warning/20'],
  ] as const)('variant %s includes %s', (variant, cls) => {
    expect(mount(Badge, { props: { variant } }).classes()).toContain(cls)
  })

  it('lets consumer class override', () => {
    const w = mount(Badge, { props: { class: 'bg-pink-500' } })
    expect(w.classes()).toContain('bg-pink-500')
    expect(w.classes()).not.toContain('bg-primary')
  })

  it('supports `as` and asChild', () => {
    expect(mount(Badge, { props: { as: 'a' } }).element.tagName).toBe('A')
    const w = mount(Badge, { props: { asChild: true }, slots: { default: '<a href="#">x</a>' } })
    expect(w.element.tagName).toBe('A')
  })

  it('renders empty without crashing', () => {
    expect(mount(Badge).text()).toBe('')
  })

  describe('backward compatibility (existing class output is frozen)', () => {
    const set = (s: string) => [...new Set(s.split(/\s+/).filter(Boolean))].sort()
    const BASE =
      'inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium [&>svg]:pointer-events-none [&>svg]:size-3'
    const VARIANTS = {
      default: 'border-transparent bg-primary text-primary-foreground',
      secondary: 'border-transparent bg-secondary text-secondary-foreground',
      outline: 'text-foreground',
      destructive: 'border-transparent bg-destructive text-destructive-foreground',
      success: 'border-transparent bg-success/15 text-success',
      warning: 'border-transparent bg-warning/20 text-warning-foreground dark:text-warning',
      info: 'border-transparent bg-info/15 text-info',
    } as const

    it.each(Object.keys(VARIANTS))('variant %s emits the exact original class set', (variant) => {
      const expected = set(`${BASE} ${VARIANTS[variant as keyof typeof VARIANTS]}`)
      expect(set(badgeVariants({ variant: variant as never }))).toEqual(expected)
      expect(set(mount(Badge, { props: { variant: variant as never } }).classes().join(' '))).toEqual(expected)
    })

    it('adds no extra DOM by default', () => {
      const w = mount(Badge, { slots: { default: 'x' } })
      expect(w.element.children).toHaveLength(0)
      expect(w.find('[data-slot="badge-dot"]').exists()).toBe(false)
    })
  })

  describe('tone-aware variants (soft / solid / outline)', () => {
    const SOFT = {
      neutral: ['bg-muted', 'text-muted-foreground'],
      primary: ['bg-primary/10', 'text-primary'],
      success: ['bg-success/15', 'text-success'],
      warning: ['bg-warning/20', 'text-warning-foreground'],
      danger: ['bg-destructive/10', 'text-destructive'],
      info: ['bg-info/15', 'text-info'],
    } as const
    const SOLID = {
      neutral: ['bg-foreground', 'text-background'],
      primary: ['bg-primary', 'text-primary-foreground'],
      success: ['bg-success', 'text-success-foreground'],
      warning: ['bg-warning', 'text-warning-foreground'],
      danger: ['bg-destructive', 'text-destructive-foreground'],
      info: ['bg-info', 'text-info-foreground'],
    } as const
    const OUTLINE = {
      neutral: ['border-border', 'text-muted-foreground'],
      primary: ['border-primary/50', 'text-primary'],
      success: ['border-success/50', 'text-success'],
      warning: ['border-warning', 'text-warning-foreground'],
      danger: ['border-destructive/50', 'text-destructive'],
      info: ['border-info/50', 'text-info'],
    } as const
    const cases = (table: Record<string, readonly string[]>) => Object.entries(table).map(([tone, cls]) => [tone, cls] as const)

    it.each(cases(SOFT))('soft + %s', (tone, cls) => {
      const w = mount(Badge, { props: { variant: 'soft', tone: tone as never } })
      expect(w.classes()).toEqual(expect.arrayContaining([...cls, 'border-transparent']))
    })

    it.each(cases(SOLID))('solid + %s', (tone, cls) => {
      expect(mount(Badge, { props: { variant: 'solid', tone: tone as never } }).classes()).toEqual(expect.arrayContaining([...cls, 'border-transparent']))
    })

    it.each(cases(OUTLINE))('outline + %s', (tone, cls) => {
      expect(mount(Badge, { props: { variant: 'outline', tone: tone as never } }).classes()).toEqual(expect.arrayContaining([...cls]))
    })

    it('a tone replaces the neutral soft colours (no conflicting classes after merge)', () => {
      const w = mount(Badge, { props: { variant: 'soft', tone: 'success' } })
      expect(w.classes()).not.toContain('bg-muted')
      expect(w.classes()).not.toContain('text-muted-foreground')
    })

    it('soft and solid without a tone are neutral', () => {
      expect(mount(Badge, { props: { variant: 'soft' } }).classes()).toEqual(expect.arrayContaining(['bg-muted', 'text-muted-foreground']))
      expect(mount(Badge, { props: { variant: 'solid' } }).classes()).toEqual(expect.arrayContaining(['bg-foreground', 'text-background']))
    })

    it('plain outline without a tone is unchanged', () => {
      const w = mount(Badge, { props: { variant: 'outline' } })
      expect(w.classes()).toContain('text-foreground')
      expect(w.classes()).not.toContain('text-muted-foreground')
    })

    it('tone is ignored by fixed-colour variants', () => {
      const w = mount(Badge, { props: { variant: 'default', tone: 'danger' } })
      expect(w.classes()).toContain('bg-primary')
      expect(w.classes()).not.toContain('bg-destructive/10')
    })

    it('unknown tone is ignored (soft stays neutral)', () => {
      const w = mount(Badge, { props: { variant: 'soft', tone: 'rainbow' as never } })
      expect(w.classes()).toContain('bg-muted')
    })

    it('class override wins over tone colours', () => {
      const w = mount(Badge, { props: { variant: 'soft', tone: 'success', class: 'bg-pink-500' } })
      expect(w.classes()).toContain('bg-pink-500')
      expect(w.classes()).not.toContain('bg-success/15')
    })
  })

  describe('sizes', () => {
    it.each([
      ['sm', ['px-1.5', 'py-0', 'text-2xs']],
      ['md', ['px-2', 'py-0.5', 'text-xs']],
      ['lg', ['px-2.5', 'py-1', 'text-sm']],
    ] as const)('size %s', (size, cls) => {
      const w = mount(Badge, { props: { size } })
      expect(w.classes()).toEqual(expect.arrayContaining([...cls]))
      expect(badgeVariants({ size })).toContain(cls[0])
    })

    it('md is the default', () => {
      expect(mount(Badge).classes()).toEqual(expect.arrayContaining(['px-2', 'text-xs']))
    })

    it('size replaces the md padding/text (no conflicts)', () => {
      const w = mount(Badge, { props: { size: 'lg' } })
      expect(w.classes()).not.toContain('px-2')
      expect(w.classes()).not.toContain('text-xs')
      expect(w.classes()).toContain('[&>svg]:size-3.5')
      expect(w.classes()).not.toContain('[&>svg]:size-3')
    })

    it('unknown size falls back to md', () => {
      expect(mount(Badge, { props: { size: 'huge' as never } }).classes()).toContain('px-2')
    })
  })

  describe('rounded', () => {
    it('default is rounded-md', () => {
      expect(mount(Badge).classes()).toContain('rounded-md')
    })

    it('full is a pill', () => {
      const w = mount(Badge, { props: { rounded: 'full' } })
      expect(w.classes()).toContain('rounded-full')
      expect(w.classes()).not.toContain('rounded-md')
    })

    it('none removes the radius', () => {
      expect(mount(Badge, { props: { rounded: 'none' } }).classes()).toContain('rounded-none')
    })

    it('unknown value falls back to default; class wins', () => {
      expect(mount(Badge, { props: { rounded: 'blob' as never } }).classes()).toContain('rounded-md')
      const w = mount(Badge, { props: { rounded: 'full', class: 'rounded-sm' } })
      expect(w.classes()).toContain('rounded-sm')
      expect(w.classes()).not.toContain('rounded-full')
    })
  })

  describe('dot', () => {
    it('renders a decorative dot before the content', () => {
      const w = mount(Badge, { props: { dot: true }, slots: { default: 'Online' } })
      const dot = w.find('[data-slot="badge-dot"]')
      expect(dot.exists()).toBe(true)
      expect(dot.attributes('aria-hidden')).toBe('true')
      expect(dot.classes()).toEqual(expect.arrayContaining(['rounded-full', 'bg-current', 'size-1.5']))
      expect(w.element.firstElementChild).toBe(dot.element)
      expect(w.text()).toBe('Online')
    })

    it('dot size follows the badge size', () => {
      expect(mount(Badge, { props: { dot: true, size: 'sm' } }).find('[data-slot="badge-dot"]').classes()).toContain('size-1')
      expect(mount(Badge, { props: { dot: true, size: 'lg' } }).find('[data-slot="badge-dot"]').classes()).toContain('size-2')
      expect(badgeDotVariants({ size: 'lg' })).toContain('size-2')
    })

    it('dot takes the tone colour through currentColor', () => {
      const w = mount(Badge, { props: { dot: true, variant: 'soft', tone: 'success' } })
      expect(w.classes()).toContain('text-success')
      expect(w.find('[data-slot="badge-dot"]').classes()).toContain('bg-current')
    })

    it('dot works without content (dot-only badge)', () => {
      const w = mount(Badge, { props: { dot: true } })
      expect(w.text()).toBe('')
      expect(w.find('[data-slot="badge-dot"]').exists()).toBe(true)
    })

    it('is not rendered when false or with asChild', () => {
      expect(mount(Badge, { props: { dot: false } }).find('[data-slot="badge-dot"]').exists()).toBe(false)
      const w = mount(Badge, { props: { dot: true, asChild: true }, slots: { default: '<a href="#">x</a>' } })
      expect(w.element.tagName).toBe('A')
      expect(w.find('[data-slot="badge-dot"]').exists()).toBe(false)
    })
  })

  describe('combinations and bad input', () => {
    it('pill + soft + tone + dot + lg together', () => {
      const w = mount(Badge, { props: { variant: 'soft', tone: 'warning', rounded: 'full', size: 'lg', dot: true }, slots: { default: 'Pending' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-full', 'bg-warning/20', 'px-2.5']))
      expect(w.find('[data-slot="badge-dot"]').exists()).toBe(true)
    })

    it('unknown variant falls back to default', () => {
      const w = mount(Badge, { props: { variant: 'neon' as never } })
      expect(w.classes()).toContain('bg-primary')
    })

    it('passes attributes through', () => {
      const w = mount(Badge, { attrs: { id: 'b', 'aria-label': 'status' } })
      expect(w.attributes('id')).toBe('b')
      expect(w.attributes('aria-label')).toBe('status')
    })

    it('handles very long and RTL text', () => {
      expect(mount(Badge, { slots: { default: 'x'.repeat(3000) } }).text()).toHaveLength(3000)
      expect(mount(Badge, { slots: { default: 'جديد' } }).text()).toBe('جديد')
    })
  })
})
