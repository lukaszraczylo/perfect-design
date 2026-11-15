import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Separator from './Separator.vue'
import { separatorLabelledVariants, separatorLabelVariants, separatorLineVariants, separatorVariants } from './variants'

describe('Separator', () => {
  describe('good path', () => {
    it('renders a horizontal decorative separator by default', () => {
      const w = mount(Separator)
      expect(w.attributes('data-slot')).toBe('separator')
      expect(w.attributes('data-orientation')).toBe('horizontal')
      expect(w.attributes('role')).toBe('none')
      expect(w.classes()).toContain('bg-border')
      expect(w.classes()).toContain('data-[orientation=horizontal]:h-px')
    })

    it('renders vertical orientation', () => {
      const w = mount(Separator, { props: { orientation: 'vertical' } })
      expect(w.attributes('data-orientation')).toBe('vertical')
      expect(separatorVariants()).toContain('data-[orientation=vertical]:w-px')
    })

    it('decorative=false exposes role=separator with aria-orientation for vertical', () => {
      const h = mount(Separator, { props: { decorative: false } })
      expect(h.attributes('role')).toBe('separator')
      const v = mount(Separator, { props: { decorative: false, orientation: 'vertical' } })
      expect(v.attributes('role')).toBe('separator')
      expect(v.attributes('aria-orientation')).toBe('vertical')
    })
  })

  describe('customisation', () => {
    it('merges class with consumer winning', () => {
      const w = mount(Separator, { props: { class: 'bg-primary my-4' } })
      expect(w.classes()).toContain('bg-primary')
      expect(w.classes()).not.toContain('bg-border')
      expect(w.classes()).toContain('my-4')
    })

    it('passes attributes through', () => {
      const w = mount(Separator, { attrs: { id: 'sep', 'data-test': 'x' } })
      expect(w.attributes('id')).toBe('sep')
      expect(w.attributes('data-test')).toBe('x')
    })

    it('renders as another element with `as`', () => {
      const w = mount(Separator, { props: { as: 'li' } })
      expect(w.element.tagName).toBe('LI')
    })

    it('asChild renders the child element', () => {
      const w = mount(Separator, { props: { asChild: true }, slots: { default: '<hr class="mine" />' } })
      expect(w.element.tagName).toBe('HR')
      expect(w.classes()).toContain('mine')
      expect(w.classes()).toContain('bg-border')
    })
  })

  describe('bad path / edge cases', () => {
    it('invalid orientation falls back to horizontal', () => {
      const w = mount(Separator, { props: { orientation: 'diagonal' as never } })
      expect(w.attributes('data-orientation')).toBe('horizontal')
    })

    it('empty class prop is harmless', () => {
      expect(mount(Separator, { props: { class: '' } }).classes()).toContain('shrink-0')
    })

    it('has no text content and no children', () => {
      const w = mount(Separator)
      expect(w.text()).toBe('')
      expect(w.element.children).toHaveLength(0)
    })
  })
})

describe('Separator variations', () => {
  const lines = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="separator-line"]')
  const label = (w: ReturnType<typeof mount>) => w.find('[data-slot="separator-label"]')

  describe('line style', () => {
    it('solid is the default and fills with bg-border', () => {
      const w = mount(Separator)
      expect(w.classes()).toContain('bg-border')
      expect(w.classes()).not.toContain('border-dashed')
    })

    it.each([
      ['dashed', 'border-dashed'],
      ['dotted', 'border-dotted'],
    ] as const)('%s draws a %s border without a fill', (variant, cls) => {
      const w = mount(Separator, { props: { variant } })
      expect(w.classes()).toContain(cls)
      expect(w.classes()).toContain('data-[orientation=horizontal]:border-t')
      expect(w.classes()).not.toContain('bg-border')
      expect(w.attributes('role')).toBe('none')
      expect(separatorVariants({ variant })).toContain(cls)
    })

    it('dashed vertical uses a left border and keeps orientation semantics', () => {
      const w = mount(Separator, { props: { variant: 'dashed', orientation: 'vertical', decorative: false } })
      expect(w.classes()).toContain('data-[orientation=vertical]:border-l')
      expect(w.attributes('data-orientation')).toBe('vertical')
      expect(w.attributes('role')).toBe('separator')
      expect(w.attributes('aria-orientation')).toBe('vertical')
    })

    it('unknown variant falls back to solid', () => {
      const w = mount(Separator, { props: { variant: 'wavy' as never } })
      expect(w.classes()).toContain('bg-border')
    })

    it('class can still override a dashed colour', () => {
      const w = mount(Separator, { props: { variant: 'dashed', class: 'border-primary' } })
      expect(w.classes()).toContain('border-primary')
      expect(w.classes()).not.toContain('border-border')
    })
  })

  describe('label', () => {
    it('plain separators do not render label parts', () => {
      const w = mount(Separator)
      expect(lines(w)).toHaveLength(0)
      expect(label(w).exists()).toBe(false)
      expect(w.attributes('data-align')).toBeUndefined()
      expect(w.attributes('aria-label')).toBeUndefined()
    })

    it('label prop renders a centred label between two lines', () => {
      const w = mount(Separator, { props: { label: 'or' } })
      expect(w.attributes('data-slot')).toBe('separator')
      expect(w.attributes('data-orientation')).toBe('horizontal')
      expect(w.attributes('data-align')).toBe('center')
      expect(w.attributes('role')).toBe('none')
      expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'items-center', 'gap-3']))
      expect(w.classes()).not.toContain('bg-border')
      expect(label(w).text()).toBe('or')
      expect(lines(w)).toHaveLength(2)
      const kids = [...w.element.children].map((c) => c.getAttribute('data-slot'))
      expect(kids).toEqual(['separator-line', 'separator-label', 'separator-line'])
      expect(lines(w)[0]!.classes()).toEqual(expect.arrayContaining(['flex-1', 'h-px', 'bg-border']))
    })

    it('default slot content is the label and wins over the prop', () => {
      const w = mount(Separator, { props: { label: 'ignored' }, slots: { default: '<b class="x">Slot</b>' } })
      expect(label(w).find('b.x').text()).toBe('Slot')
      expect(w.text()).not.toContain('ignored')
      expect(lines(w)).toHaveLength(2)
    })

    it('slot alone (no label prop) makes a labelled separator', () => {
      const w = mount(Separator, { slots: { default: 'Continue with' } })
      expect(label(w).text()).toBe('Continue with')
    })

    it('align start puts the label first with one trailing line', () => {
      const w = mount(Separator, { props: { label: 'Section', align: 'start' } })
      expect(w.attributes('data-align')).toBe('start')
      expect([...w.element.children].map((c) => c.getAttribute('data-slot'))).toEqual(['separator-label', 'separator-line'])
    })

    it('align end puts the label last with one leading line', () => {
      const w = mount(Separator, { props: { label: 'Section', align: 'end' } })
      expect(w.attributes('data-align')).toBe('end')
      expect([...w.element.children].map((c) => c.getAttribute('data-slot'))).toEqual(['separator-line', 'separator-label'])
    })

    it('unknown align falls back to center', () => {
      const w = mount(Separator, { props: { label: 'x', align: 'middle' as never } })
      expect(w.attributes('data-align')).toBe('center')
      expect(lines(w)).toHaveLength(2)
    })

    it.each([
      ['dashed', 'border-dashed', 'border-t'],
      ['dotted', 'border-dotted', 'border-t'],
    ] as const)('%s lines next to the label', (variant, cls, side) => {
      const w = mount(Separator, { props: { label: 'x', variant } })
      for (const l of lines(w)) {
        expect(l.classes()).toContain(cls)
        expect(l.classes()).toContain(side)
        expect(l.classes()).not.toContain('bg-border')
      }
    })

    it('vertical labelled separator is a column with vertical lines', () => {
      const w = mount(Separator, { props: { label: 'or', orientation: 'vertical' } })
      expect(w.attributes('data-orientation')).toBe('vertical')
      expect(w.classes()).toContain('data-[orientation=vertical]:flex-col')
      expect(lines(w)[0]!.classes()).toContain('w-px')
      expect(lines(w)[0]!.attributes('data-orientation')).toBe('vertical')
      const d = mount(Separator, { props: { label: 'or', orientation: 'vertical', variant: 'dashed' } })
      expect(lines(d)[0]!.classes()).toContain('border-l')
    })

    it('invalid orientation on a labelled separator is horizontal', () => {
      const w = mount(Separator, { props: { label: 'x', orientation: 'diagonal' as never } })
      expect(w.attributes('data-orientation')).toBe('horizontal')
      expect(lines(w)[0]!.classes()).toContain('h-px')
    })

    it('non-decorative labelled separator exposes role=separator named by the label', () => {
      const w = mount(Separator, { props: { label: 'Or', decorative: false } })
      expect(w.attributes('role')).toBe('separator')
      expect(w.attributes('aria-label')).toBe('Or')
    })

    it('an explicit aria-label wins; slot content gets no automatic name', () => {
      const w = mount(Separator, { props: { label: 'Or', decorative: false }, attrs: { 'aria-label': 'Custom' } })
      expect(w.attributes('aria-label')).toBe('Custom')
      const s = mount(Separator, { props: { decorative: false }, slots: { default: 'Or' } })
      expect(s.attributes('aria-label')).toBeUndefined()
    })

    it('decorative labelled separator keeps the text readable (role none, no aria-label)', () => {
      const w = mount(Separator, { props: { label: 'or' } })
      expect(w.attributes('role')).toBe('none')
      expect(w.attributes('aria-label')).toBeUndefined()
      expect(w.text()).toBe('or')
    })

    it('class merges on the labelled root and overrides internal classes', () => {
      const w = mount(Separator, { props: { label: 'x', class: 'gap-6 my-4' } })
      expect(w.classes()).toContain('gap-6')
      expect(w.classes()).not.toContain('gap-3')
      expect(w.classes()).toContain('my-4')
    })

    it('passes attributes and `as` through', () => {
      const w = mount(Separator, { props: { label: 'x', as: 'li' }, attrs: { id: 'sep', 'data-test': 'y' } })
      expect(w.element.tagName).toBe('LI')
      expect(w.attributes('id')).toBe('sep')
      expect(w.attributes('data-test')).toBe('y')
    })

    it('asChild ignores the label and renders the child as-is', () => {
      const w = mount(Separator, { props: { asChild: true, label: 'ignored' }, slots: { default: '<hr class="mine" />' } })
      expect(w.element.tagName).toBe('HR')
      expect(w.find('[data-slot="separator-label"]').exists()).toBe(false)
      expect(w.classes()).toContain('bg-border')
      expect(w.attributes('data-align')).toBeUndefined()
    })

    it('empty label string with no slot stays a plain separator', () => {
      const w = mount(Separator, { props: { label: '' } })
      expect(lines(w)).toHaveLength(0)
      expect(w.classes()).toContain('bg-border')
    })

    it('unicode / RTL / long labels render', () => {
      const text = 'أو ✓ ' + 'long '.repeat(40)
      expect(label(mount(Separator, { props: { label: text } })).text()).toBe(text.trim())
    })

    it('reacts to label changes', async () => {
      const w = mount(Separator)
      await w.setProps({ label: 'now' })
      expect(label(w).text()).toBe('now')
      await w.setProps({ label: undefined })
      expect(label(w).exists()).toBe(false)
    })
  })

  it('exports variant helpers for reuse', () => {
    expect(separatorVariants({ variant: 'dotted' })).toContain('border-dotted')
    expect(separatorVariants()).toContain('bg-border')
    expect(separatorLabelledVariants()).toContain('flex')
    expect(separatorLabelVariants()).toContain('text-muted-foreground')
    expect(separatorLineVariants({ variant: 'dashed', orientation: 'vertical' })).toContain('border-l')
    expect(separatorLineVariants()).toContain('bg-border')
  })
})
