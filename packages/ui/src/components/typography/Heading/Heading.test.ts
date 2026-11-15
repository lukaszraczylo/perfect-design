import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Heading from './Heading.vue'
import {
  headingAligns,
  headingDefaultSizes,
  headingDescriptionSizes,
  headingDescriptionVariants,
  headingGroupVariants,
  headingSizes,
  headingVariantNames,
  headingVariants,
} from './variants'

describe('Heading', () => {
  describe('good path', () => {
    it('renders an h2 with slot content and data-slot by default', () => {
      const w = mount(Heading, { slots: { default: 'Title' } })
      expect(w.element.tagName).toBe('H2')
      expect(w.attributes('data-slot')).toBe('heading')
      expect(w.text()).toBe('Title')
    })

    it.each([1, 2, 3, 4, 5, 6] as const)('level %i renders h%i with its default visual size', (level) => {
      const w = mount(Heading, { props: { level } })
      expect(w.element.tagName).toBe(`H${level}`)
      expect(w.classes()).toContain(`text-${headingDefaultSizes[level]}`)
    })

    it('accepts string levels', () => {
      expect(mount(Heading, { props: { level: '4' } }).element.tagName).toBe('H4')
    })

    it('size is independent from level', () => {
      const w = mount(Heading, { props: { level: 1, size: 'sm' } })
      expect(w.element.tagName).toBe('H1')
      expect(w.classes()).toContain('text-sm')
      expect(w.classes()).not.toContain('text-4xl')
    })

    it.each(headingSizes)('supports size %s', (size) => {
      expect(mount(Heading, { props: { size } }).classes()).toContain(`text-${size}`)
    })

    it('has display font, tight tracking and semibold weight by default', () => {
      const c = mount(Heading).classes()
      expect(c).toContain('font-display')
      expect(c).toContain('tracking-tight')
      expect(c).toContain('font-semibold')
    })

    it.each([
      ['normal', 'font-normal'],
      ['medium', 'font-medium'],
      ['semibold', 'font-semibold'],
      ['bold', 'font-bold'],
    ] as const)('weight %s', (weight, cls) => {
      expect(mount(Heading, { props: { weight } }).classes()).toContain(cls)
    })

    it.each([
      ['muted', 'text-muted-foreground'],
      ['primary', 'text-primary'],
      ['success', 'text-success'],
      ['warning', 'text-warning-foreground'],
      ['danger', 'text-destructive'],
      ['info', 'text-info'],
    ] as const)('tone %s', (tone, cls) => {
      expect(mount(Heading, { props: { tone } }).classes()).toContain(cls)
    })

    it('balance adds text-balance', () => {
      expect(mount(Heading, { props: { balance: true } }).classes()).toContain('text-balance')
      expect(mount(Heading).classes()).not.toContain('text-balance')
    })
  })

  describe('customisation', () => {
    it('as overrides the tag but keeps the styling', () => {
      const w = mount(Heading, { props: { as: 'div', level: 3 } })
      expect(w.element.tagName).toBe('DIV')
      expect(w.classes()).toContain('text-2xl')
    })

    it('asChild styles the child element', () => {
      const w = mount(Heading, { props: { asChild: true }, slots: { default: '<a href="/x">Link</a>' } })
      expect(w.element.tagName).toBe('A')
      expect(w.classes()).toContain('font-display')
    })

    it('class merges last and overrides conflicting utilities', () => {
      const w = mount(Heading, { props: { class: 'text-sm custom-x font-bold' } })
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('text-sm')
      expect(w.classes()).not.toContain('text-3xl')
      expect(w.classes()).toContain('font-bold')
      expect(w.classes()).not.toContain('font-semibold')
    })

    it('a consumer colour class replaces tone without dropping the size', () => {
      const w = mount(Heading, { props: { tone: 'muted', size: 'md', class: 'text-primary' } })
      expect(w.classes()).toContain('text-primary')
      expect(w.classes()).not.toContain('text-muted-foreground')
      expect(w.classes()).toContain('text-md')
    })

    it('passes attributes through', () => {
      const w = mount(Heading, { attrs: { id: 'h', 'aria-level': '5', 'data-test': 'x' } })
      expect(w.attributes('id')).toBe('h')
      expect(w.attributes('aria-level')).toBe('5')
      expect(w.attributes('data-test')).toBe('x')
    })

    it('headingVariants is reusable on other elements', () => {
      expect(headingVariants({ size: 'xl' })).toContain('text-xl')
    })
  })

  describe('bad path', () => {
    it.each([0, 7, -1, 2.5, NaN, 100])('invalid level %s falls back to h2', (level) => {
      const w = mount(Heading, { props: { level: level as never } })
      expect(w.element.tagName).toBe('H2')
      expect(w.classes()).toContain('text-3xl')
    })

    it('non-numeric string level falls back to h2', () => {
      expect(mount(Heading, { props: { level: 'abc' as never } }).element.tagName).toBe('H2')
    })

    it('unknown size falls back to the level default', () => {
      const w = mount(Heading, { props: { level: 3, size: '9xl' as never } })
      expect(w.classes()).toContain('text-2xl')
    })
  })

  describe('edge cases', () => {
    it('renders with no slot content', () => {
      expect(mount(Heading).text()).toBe('')
    })

    it('handles empty class, unicode and RTL text', () => {
      const w = mount(Heading, { props: { class: '' }, slots: { default: 'مرحبا 你好 🎉' } })
      expect(w.text()).toBe('مرحبا 你好 🎉')
      expect(w.classes()).toContain('font-display')
    })

    it('handles a very long title', () => {
      const text = 'x'.repeat(5000)
      expect(mount(Heading, { slots: { default: text } }).text()).toHaveLength(5000)
    })

    it('reacts to level changes', async () => {
      const w = mount(Heading, { props: { level: 1 } })
      await w.setProps({ level: 6 })
      expect(w.element.tagName).toBe('H6')
    })
  })

  describe('variants', () => {
    it('default variant adds no decoration', () => {
      const c = mount(Heading).classes()
      expect(c).not.toContain('bg-clip-text')
      expect(c).not.toContain('border-b')
      expect(c.some((x) => x.startsWith('after:'))).toBe(false)
    })

    it('the gradient variant was removed: it is not listed and falls back to the default look', () => {
      expect(headingVariantNames).not.toContain('gradient')
      const c = mount(Heading, { props: { variant: 'gradient' as never } }).classes()
      expect(c.some((x) => /gradient|bg-linear|bg-clip-text|text-transparent|^from-|^to-/.test(x))).toBe(false)
    })

    it('underline adds an accent bar via after:', () => {
      const c = mount(Heading, { props: { variant: 'underline' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['after:block', 'after:h-1', 'after:w-12', 'after:bg-primary']))
      expect(c).not.toContain('after:mx-auto')
    })

    it('underline bar follows alignment', () => {
      expect(mount(Heading, { props: { variant: 'underline', align: 'center' } }).classes()).toContain('after:mx-auto')
      expect(mount(Heading, { props: { variant: 'underline', align: 'right' } }).classes()).toContain('after:ms-auto')
      expect(mount(Heading, { props: { variant: 'underline', align: 'left' } }).classes()).not.toContain('after:mx-auto')
    })

    it('underline colour is overridable', () => {
      const c = mount(Heading, { props: { variant: 'underline', class: 'after:bg-success' } }).classes()
      expect(c).toContain('after:bg-success')
      expect(c).not.toContain('after:bg-primary')
    })

    it('divider adds a full-width bottom border', () => {
      const c = mount(Heading, { props: { variant: 'divider' } }).classes()
      expect(c).toEqual(expect.arrayContaining(['border-b', 'border-border', 'pb-3']))
    })

    it.each([
      ['left', 'text-left'],
      ['center', 'text-center'],
      ['right', 'text-right'],
    ] as const)('align %s', (align, cls) => {
      expect(mount(Heading, { props: { align } }).classes()).toContain(cls)
    })

    it('variant composes with level, size and tone', () => {
      const w = mount(Heading, { props: { level: 1, size: '5xl', variant: 'underline', tone: 'muted' } })
      expect(w.element.tagName).toBe('H1')
      expect(w.classes()).toEqual(expect.arrayContaining(['text-5xl', 'text-muted-foreground', 'after:bg-primary']))
    })

    it('exposes the variant name lists', () => {
      expect(headingVariantNames).toEqual(['default', 'underline', 'divider'])
      expect(headingAligns).toEqual(['left', 'center', 'right'])
    })

    it('unknown variant and align fall back without crashing', () => {
      const w = mount(Heading, { props: { variant: 'sparkle' as never, align: 'diagonal' as never } })
      expect(w.exists()).toBe(true)
      expect(w.classes()).not.toContain('bg-clip-text')
      expect(w.classes().some((c) => c.startsWith('text-') && /left|center|right/.test(c))).toBe(false)
    })

    it('headingVariants is reusable with variant', () => {
      expect(headingVariants({ variant: 'divider' })).toContain('border-b')
    })
  })

  describe('eyebrow and description', () => {
    it('without eyebrow or description the root is the heading itself', () => {
      const w = mount(Heading, { slots: { default: 'T' } })
      expect(w.attributes('data-slot')).toBe('heading')
      expect(w.find('[data-slot="heading-group"]').exists()).toBe(false)
    })

    it('eyebrow prop renders an Eyebrow above the heading inside a group', () => {
      const w = mount(Heading, { props: { eyebrow: 'New' }, slots: { default: 'Title' } })
      expect(w.attributes('data-slot')).toBe('heading-group')
      const kids = Array.from((w.element as HTMLElement).children)
      expect(kids.map((k) => k.getAttribute('data-slot'))).toEqual(['eyebrow', 'heading'])
      expect(kids[0].textContent).toBe('New')
      expect(kids[0].classList.contains('uppercase')).toBe(false)
      expect(kids[0].className).not.toMatch(/tracking-/)
      expect(kids[1].tagName).toBe('H2')
    })

    it('description prop renders a paragraph below the heading', () => {
      const w = mount(Heading, { props: { description: 'More detail' }, slots: { default: 'Title' } })
      const kids = Array.from((w.element as HTMLElement).children)
      expect(kids.map((k) => k.getAttribute('data-slot'))).toEqual(['heading', 'heading-description'])
      expect(kids[1].tagName).toBe('P')
      expect(kids[1].textContent?.trim()).toBe('More detail')
      expect(kids[1].classList.contains('text-muted-foreground')).toBe(true)
    })

    it('renders eyebrow, heading and description in order', () => {
      const w = mount(Heading, { props: { eyebrow: 'E', description: 'D' }, slots: { default: 'H' } })
      expect(Array.from((w.element as HTMLElement).children).map((k) => k.getAttribute('data-slot'))).toEqual([
        'eyebrow',
        'heading',
        'heading-description',
      ])
    })

    it('slots override the props', () => {
      const w = mount(Heading, {
        props: { eyebrow: 'prop-e', description: 'prop-d' },
        slots: { default: 'H', eyebrow: '<b>slot-e</b>', description: '<i>slot-d</i>' },
      })
      expect(w.find('[data-slot="eyebrow"] b').text()).toBe('slot-e')
      expect(w.find('[data-slot="heading-description"] i').text()).toBe('slot-d')
      expect(w.text()).not.toContain('prop-')
    })

    it('slots alone create the group', () => {
      expect(mount(Heading, { slots: { default: 'H', eyebrow: 'E' } }).attributes('data-slot')).toBe('heading-group')
      expect(mount(Heading, { slots: { default: 'H', description: 'D' } }).attributes('data-slot')).toBe('heading-group')
    })

    it('eyebrowTone is forwarded to the Eyebrow', () => {
      const w = mount(Heading, { props: { eyebrow: 'E', eyebrowTone: 'muted' }, slots: { default: 'H' } })
      expect(w.find('[data-slot="eyebrow"]').classes()).toContain('text-muted-foreground')
      expect(mount(Heading, { props: { eyebrow: 'E' } }).find('[data-slot="eyebrow"]').classes()).toContain('text-primary')
    })

    it('class and attrs go to the heading element, groupClass to the wrapper', () => {
      const w = mount(Heading, {
        props: { eyebrow: 'E', class: 'custom-h', groupClass: 'custom-g gap-6' },
        attrs: { id: 'hd', 'data-test': 'x' },
        slots: { default: 'H' },
      })
      expect(w.classes()).toContain('custom-g')
      expect(w.classes()).toContain('gap-6')
      expect(w.classes()).not.toContain('gap-2')
      expect(w.attributes('id')).toBeUndefined()
      const h = w.find('[data-slot="heading"]')
      expect(h.classes()).toContain('custom-h')
      expect(h.attributes('id')).toBe('hd')
      expect(h.attributes('data-test')).toBe('x')
    })

    it.each([
      ['left', ['items-start', 'text-left']],
      ['center', ['items-center', 'text-center']],
      ['right', ['items-end', 'text-right']],
    ] as const)('align %s applies to the group and the heading', (align, cls) => {
      const w = mount(Heading, { props: { eyebrow: 'E', align }, slots: { default: 'H' } })
      expect(w.classes()).toEqual(expect.arrayContaining([...cls]))
      expect(w.find('[data-slot="heading"]').classes()).toContain(cls[1])
    })

    it('group defaults to start alignment without align', () => {
      const w = mount(Heading, { props: { eyebrow: 'E' }, slots: { default: 'H' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'flex-col', 'gap-2']))
      expect(w.classes()).toContain('items-start')
    })

    it('works with as and asChild', () => {
      const a = mount(Heading, { props: { eyebrow: 'E', as: 'div' }, slots: { default: 'H' } })
      expect(a.find('[data-slot="heading"]').element.tagName).toBe('DIV')
      const b = mount(Heading, { props: { eyebrow: 'E', asChild: true }, slots: { default: '<a href="/x">L</a>' } })
      expect(b.find('a[data-slot="heading"]').exists()).toBe(true)
    })

    it('works with variants inside the group', () => {
      const w = mount(Heading, { props: { eyebrow: 'E', variant: 'divider', level: 1 }, slots: { default: 'H' } })
      expect(w.find('h1').classes()).toContain('border-b')
    })

    it.each([
      ['sm', 'sm', 'text-sm'],
      ['xl', 'base', 'text-md'],
      ['4xl', 'lg', 'text-lg'],
    ] as const)('description scales with heading size %s', (size, key, cls) => {
      expect(headingDescriptionSizes[size]).toBe(key)
      const w = mount(Heading, { props: { size, description: 'D' }, slots: { default: 'H' } })
      expect(w.find('[data-slot="heading-description"]').classes()).toContain(cls)
    })

    it('every heading size has a description size', () => {
      for (const s of headingSizes) expect(['sm', 'base', 'lg']).toContain(headingDescriptionSizes[s])
    })

    it('empty-string eyebrow and description do not create a group', () => {
      const w = mount(Heading, { props: { eyebrow: '', description: '' }, slots: { default: 'H' } })
      expect(w.attributes('data-slot')).toBe('heading')
    })

    it('group and description variants are reusable', () => {
      expect(headingGroupVariants({ align: 'center' })).toContain('items-center')
      expect(headingGroupVariants()).toContain('items-start')
      expect(headingDescriptionVariants({ size: 'lg' })).toContain('text-lg')
    })

    it('handles unicode in eyebrow and description', () => {
      const w = mount(Heading, { props: { eyebrow: 'جديد', description: '説明 🎉' }, slots: { default: 'H' } })
      expect(w.text()).toContain('جديد')
      expect(w.text()).toContain('説明 🎉')
    })

    it('reacts when the eyebrow is added and removed', async () => {
      const w = mount(Heading, { slots: { default: 'H' } })
      expect(w.attributes('data-slot')).toBe('heading')
      await w.setProps({ eyebrow: 'E' })
      expect(w.attributes('data-slot')).toBe('heading-group')
      await w.setProps({ eyebrow: undefined })
      expect(w.attributes('data-slot')).toBe('heading')
    })
  })
})
