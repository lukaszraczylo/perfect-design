import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faStar } from '@fortawesome/free-solid-svg-icons'
import Chip from './Chip.vue'
import { chipVariants } from './variants'

describe('Chip', () => {
  describe('good path', () => {
    it('renders a span with the label', () => {
      const w = mount(Chip, { props: { label: 'Vue' } })
      expect(w.element.tagName).toBe('SPAN')
      expect(w.attributes('data-slot')).toBe('chip')
      expect(w.text()).toBe('Vue')
      expect(w.find('button').exists()).toBe(false)
      expect(w.attributes('tabindex')).toBeUndefined()
    })

    it('slot content overrides label', () => {
      expect(mount(Chip, { props: { label: 'x' }, slots: { default: 'Custom' } }).text()).toBe('Custom')
    })

    it.each([
      ['default', 'bg-muted'],
      ['secondary', 'bg-secondary'],
      ['outline', 'bg-background'],
      ['primary', 'bg-primary'],
      ['success', 'text-success'],
      ['warning', 'bg-warning/20'],
      ['destructive', 'bg-destructive'],
      ['info', 'text-info'],
    ] as const)('applies the %s variant', (variant, cls) => {
      expect(mount(Chip, { props: { variant } }).classes()).toContain(cls)
      expect(chipVariants({ variant })).toContain(cls)
    })

    it('removable renders a labelled remove button and emits remove on click', async () => {
      const w = mount(Chip, { props: { label: 'Vue', removable: true } })
      const btn = w.find('[data-slot="chip-remove"]')
      expect(btn.attributes('aria-label')).toBe('Remove Vue')
      expect(btn.attributes('type')).toBe('button')
      await btn.trigger('click')
      expect(w.emitted('remove')).toHaveLength(1)
    })

    it('remove button label has no name without a label prop', () => {
      expect(mount(Chip, { props: { removable: true } }).find('[data-slot="chip-remove"]').attributes('aria-label')).toBe('Remove')
    })

    it('removable chip is focusable and Backspace / Delete emit remove', async () => {
      const w = mount(Chip, { props: { label: 'Vue', removable: true } })
      expect(w.attributes('tabindex')).toBe('0')
      await w.trigger('keydown', { key: 'Backspace' })
      await w.trigger('keydown', { key: 'Delete' })
      expect(w.emitted('remove')).toHaveLength(2)
    })

    it('other keys do not emit remove', async () => {
      const w = mount(Chip, { props: { label: 'Vue', removable: true } })
      await w.trigger('keydown', { key: 'a' })
      await w.trigger('keydown', { key: 'Enter' })
      expect(w.emitted('remove')).toBeUndefined()
    })

    it('Backspace on a non-removable chip does nothing', async () => {
      const w = mount(Chip, { props: { label: 'Vue' } })
      await w.trigger('keydown', { key: 'Backspace' })
      expect(w.emitted('remove')).toBeUndefined()
    })

    it('renders a leading slot and a leading icon prop', () => {
      const a = mount(Chip, { props: { label: 'x' }, slots: { leading: '<i data-lead />' } })
      expect(a.find('[data-slot="chip-leading"] [data-lead]').exists()).toBe(true)
      const b = mount(Chip, { props: { label: 'x', icon: faStar } })
      expect(b.find('[data-slot="chip-leading"] svg').exists()).toBe(true)
      expect(mount(Chip, { props: { label: 'x' } }).find('[data-slot="chip-leading"]').exists()).toBe(false)
    })
  })

  describe('selectable', () => {
    it('renders a toggle button with aria-pressed=false', () => {
      const w = mount(Chip, { props: { label: 'Tag', selectable: true } })
      const btn = w.find('[data-slot="chip-toggle"]')
      expect(btn.element.tagName).toBe('BUTTON')
      expect(btn.attributes('aria-pressed')).toBe('false')
      expect(btn.text()).toBe('Tag')
      expect(w.attributes('data-selectable')).toBeDefined()
      expect(w.attributes('data-selected')).toBeUndefined()
      expect(w.attributes('tabindex')).toBeUndefined()
    })

    it('uncontrolled toggling flips aria-pressed and data-selected', async () => {
      const w = mount(Chip, { props: { label: 'Tag', selectable: true } })
      await w.find('button').trigger('click')
      expect(w.find('button').attributes('aria-pressed')).toBe('true')
      expect(w.attributes('data-selected')).toBeDefined()
      await w.find('button').trigger('click')
      expect(w.find('button').attributes('aria-pressed')).toBe('false')
    })

    it('emits update:selected', async () => {
      const w = mount(Chip, { props: { label: 'Tag', selectable: true, selected: false } })
      await w.find('button').trigger('click')
      expect(w.emitted('update:selected')![0]).toEqual([true])
    })

    it('controlled: follows the prop and does not self-flip', async () => {
      const w = mount(Chip, { props: { label: 'Tag', selectable: true, selected: true } })
      expect(w.find('button').attributes('aria-pressed')).toBe('true')
      await w.setProps({ selected: false })
      expect(w.find('button').attributes('aria-pressed')).toBe('false')
    })

    it('selected prop is ignored for data-selected when not selectable', () => {
      expect(mount(Chip, { props: { label: 'x', selected: true } }).attributes('data-selected')).toBeUndefined()
    })

    it('selectable + removable: toggle is the focus stop, Delete on toggle removes, no nested buttons', async () => {
      const w = mount(Chip, { props: { label: 'Tag', selectable: true, removable: true } })
      expect(w.attributes('tabindex')).toBeUndefined()
      expect(w.find('[data-slot="chip-toggle"] button').exists()).toBe(false)
      await w.find('[data-slot="chip-toggle"]').trigger('keydown', { key: 'Delete' })
      expect(w.emitted('remove')).toHaveLength(1)
      await w.find('[data-slot="chip-remove"]').trigger('click')
      expect(w.emitted('remove')).toHaveLength(2)
      expect(w.emitted('update:selected')).toBeUndefined()
    })

    it('rapid toggles end in the right state', async () => {
      const w = mount(Chip, { props: { label: 'Tag', selectable: true } })
      for (let i = 0; i < 7; i++) await w.find('button').trigger('click')
      expect(w.find('button').attributes('aria-pressed')).toBe('true')
    })
  })

  describe('customisation', () => {
    it('merges class with consumer winning', () => {
      const w = mount(Chip, { props: { class: 'rounded-md bg-red-500 custom' } })
      expect(w.classes()).toContain('rounded-md')
      expect(w.classes()).not.toContain('rounded-full')
      expect(w.classes()).toContain('bg-red-500')
      expect(w.classes()).not.toContain('bg-muted')
    })

    it('attributes fall through; `as` swaps element', () => {
      const w = mount(Chip, { props: { as: 'li' }, attrs: { id: 'c', 'data-test': 'x' } })
      expect(w.element.tagName).toBe('LI')
      expect(w.attributes('id')).toBe('c')
      expect(w.attributes('data-test')).toBe('x')
    })

    it('has a focus ring', () => {
      expect(mount(Chip).classes().join(' ')).toContain('focus-visible:ring-3')
    })
  })

  describe('bad path', () => {
    it('disabled blocks remove click, keyboard, and removes tab stop', async () => {
      const w = mount(Chip, { props: { label: 'Vue', removable: true, disabled: true } })
      expect(w.attributes('aria-disabled')).toBe('true')
      expect(w.attributes('tabindex')).toBeUndefined()
      expect(w.find('[data-slot="chip-remove"]').attributes('disabled')).toBeDefined()
      await w.find('[data-slot="chip-remove"]').trigger('click')
      await w.trigger('keydown', { key: 'Backspace' })
      expect(w.emitted('remove')).toBeUndefined()
    })

    it('disabled blocks selection', async () => {
      const w = mount(Chip, { props: { label: 'Tag', selectable: true, disabled: true } })
      expect(w.find('button').attributes('disabled')).toBeDefined()
      await w.find('button').trigger('click')
      expect(w.emitted('update:selected')).toBeUndefined()
      expect(w.find('button').attributes('aria-pressed')).toBe('false')
    })

    it('programmatic handlers are guarded when disabled (disabled attr bypassed)', async () => {
      const w = mount(Chip, { props: { label: 'Tag', selectable: true, removable: true, disabled: true } })
      w.find('button').element.removeAttribute('disabled')
      w.find('[data-slot="chip-remove"]').element.removeAttribute('disabled')
      await w.find('[data-slot="chip-toggle"]').trigger('click')
      await w.find('[data-slot="chip-remove"]').trigger('click')
      expect(w.emitted('update:selected')).toBeUndefined()
      expect(w.emitted('remove')).toBeUndefined()
    })

    it('unknown variant falls back to default', () => {
      expect(mount(Chip, { props: { variant: 'neon' as never } }).classes()).toContain('bg-muted')
    })

    it('Backspace keydown is default-prevented only when it removes', async () => {
      const w = mount(Chip, { props: { label: 'x', removable: true } })
      const ev = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true })
      w.element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('renders empty with no label or slot', () => {
      expect(mount(Chip).text()).toBe('')
    })

    it('handles unicode, RTL and very long labels', () => {
      expect(mount(Chip, { props: { label: 'שלום 日本語 🚀', removable: true } }).find('[data-slot="chip-remove"]').attributes('aria-label')).toBe('Remove שלום 日本語 🚀')
      expect(mount(Chip, { props: { label: 'x'.repeat(5000) } }).text()).toHaveLength(5000)
    })

    it('remove click does not bubble to ancestors', async () => {
      let bubbled = 0
      const w = mount(Chip, { props: { label: 'x', removable: true }, attachTo: document.body })
      document.body.addEventListener('click', () => bubbled++)
      await w.find('[data-slot="chip-remove"]').trigger('click')
      expect(bubbled).toBe(0)
      w.unmount()
    })

    it('remove button stays out of the tab order', () => {
      expect(mount(Chip, { props: { removable: true } }).find('[data-slot="chip-remove"]').attributes('tabindex')).toBe('-1')
    })
  })

  describe('backward compatibility (existing class output is frozen)', () => {
    const set = (s: string) => [...new Set(s.split(/\s+/).filter(Boolean))].sort()
    const BASE =
      'inline-flex w-fit max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors [&_svg]:pointer-events-none [&_svg]:shrink-0 data-selectable:cursor-pointer data-selected:ring-2 data-selected:ring-primary/60 data-disabled:pointer-events-none data-disabled:opacity-50 outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40'
    const VARIANTS = {
      default: 'border-transparent bg-muted text-foreground',
      secondary: 'border-transparent bg-secondary text-secondary-foreground',
      outline: 'bg-background text-foreground',
      primary: 'border-transparent bg-primary text-primary-foreground',
      success: 'border-transparent bg-success/15 text-success',
      warning: 'border-transparent bg-warning/20 text-warning-foreground dark:text-warning',
      destructive: 'border-transparent bg-destructive text-destructive-foreground',
      info: 'border-transparent bg-info/15 text-info',
    } as const

    it.each(Object.keys(VARIANTS))('variant %s emits the exact original class set', (variant) => {
      const expected = set(`${BASE} ${VARIANTS[variant as keyof typeof VARIANTS]}`)
      expect(set(chipVariants({ variant: variant as never }))).toEqual(expected)
      expect(set(mount(Chip, { props: { variant: variant as never } }).classes().join(' '))).toEqual(expected)
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
      const w = mount(Chip, { props: { variant: 'soft', tone: tone as never } })
      expect(w.classes()).toEqual(expect.arrayContaining([...cls, 'border-transparent']))
    })

    it.each(cases(SOLID))('solid + %s', (tone, cls) => {
      expect(mount(Chip, { props: { variant: 'solid', tone: tone as never } }).classes()).toEqual(expect.arrayContaining([...cls, 'border-transparent']))
    })

    it.each(cases(OUTLINE))('outline + %s', (tone, cls) => {
      expect(mount(Chip, { props: { variant: 'outline', tone: tone as never } }).classes()).toEqual(expect.arrayContaining([...cls]))
    })

    it('a tone replaces the neutral soft colours (no conflicting classes after merge)', () => {
      const w = mount(Chip, { props: { variant: 'soft', tone: 'success' } })
      expect(w.classes()).not.toContain('bg-muted')
      expect(w.classes()).not.toContain('text-muted-foreground')
    })

    it('soft and solid without a tone are neutral', () => {
      expect(mount(Chip, { props: { variant: 'soft' } }).classes()).toEqual(expect.arrayContaining(['bg-muted', 'text-muted-foreground']))
      expect(mount(Chip, { props: { variant: 'solid' } }).classes()).toEqual(expect.arrayContaining(['bg-foreground', 'text-background']))
    })

    it('plain outline without a tone is unchanged', () => {
      const w = mount(Chip, { props: { variant: 'outline' } })
      expect(w.classes()).toContain('text-foreground')
      expect(w.classes()).not.toContain('text-muted-foreground')
    })

    it('tone is ignored by fixed-colour variants', () => {
      const w = mount(Chip, { props: { variant: 'primary', tone: 'danger' } })
      expect(w.classes()).toContain('bg-primary')
      expect(w.classes()).not.toContain('bg-destructive/10')
    })

    it('unknown tone is ignored (soft stays neutral)', () => {
      const w = mount(Chip, { props: { variant: 'soft', tone: 'rainbow' as never } })
      expect(w.classes()).toContain('bg-muted')
    })

    it('class override wins over tone colours', () => {
      const w = mount(Chip, { props: { variant: 'soft', tone: 'success', class: 'bg-pink-500' } })
      expect(w.classes()).toContain('bg-pink-500')
      expect(w.classes()).not.toContain('bg-success/15')
    })
  })

  describe('sizes', () => {
    it.each([
      ['sm', ['px-2', 'py-0', 'text-2xs']],
      ['md', ['px-2.5', 'py-0.5', 'text-xs']],
      ['lg', ['px-3', 'py-1', 'text-sm']],
    ] as const)('size %s', (size, cls) => {
      expect(mount(Chip, { props: { size } }).classes()).toEqual(expect.arrayContaining([...cls]))
      expect(chipVariants({ size })).toContain(cls[0])
    })

    it('size replaces md padding/text (no conflicts)', () => {
      const w = mount(Chip, { props: { size: 'lg' } })
      expect(w.classes()).not.toContain('px-2.5')
      expect(w.classes()).not.toContain('text-xs')
    })

    it('unknown size falls back to md', () => {
      expect(mount(Chip, { props: { size: 'huge' as never } }).classes()).toContain('px-2.5')
    })

    it('size works with selectable + removable chips', () => {
      const w = mount(Chip, { props: { label: 'Tag', size: 'lg', selectable: true, removable: true } })
      expect(w.classes()).toContain('text-sm')
      expect(w.find('[data-slot="chip-toggle"]').exists()).toBe(true)
      expect(w.find('[data-slot="chip-remove"]').exists()).toBe(true)
    })
  })

  describe('rounded', () => {
    it('full is the default', () => {
      expect(mount(Chip).classes()).toContain('rounded-full')
    })

    it('md and none', () => {
      const md = mount(Chip, { props: { rounded: 'md' } })
      expect(md.classes()).toContain('rounded-md')
      expect(md.classes()).not.toContain('rounded-full')
      expect(mount(Chip, { props: { rounded: 'none' } }).classes()).toContain('rounded-none')
      expect(chipVariants({ rounded: 'md' })).not.toContain('rounded-full')
    })

    it('unknown value falls back to full', () => {
      expect(mount(Chip, { props: { rounded: 'blob' as never } }).classes()).toContain('rounded-full')
    })
  })

  describe('selected state with the new variants', () => {
    it('keeps the selection ring hooks for soft, solid and outline chips', async () => {
      for (const variant of ['soft', 'solid', 'outline'] as const) {
        const w = mount(Chip, { props: { label: 'Tag', variant, tone: 'primary', selectable: true, selected: true } })
        expect(w.attributes('data-selected')).toBeDefined()
        expect(w.classes()).toEqual(expect.arrayContaining(['data-selected:ring-2', 'data-selectable:cursor-pointer']))
        expect(w.find('button').attributes('aria-pressed')).toBe('true')
      }
    })

    it('toggling a tone chip does not change its tone classes', async () => {
      const w = mount(Chip, { props: { label: 'Tag', variant: 'soft', tone: 'success', selectable: true } })
      const before = w.classes().join(' ')
      await w.find('button').trigger('click')
      expect(w.classes().join(' ')).toBe(before)
      expect(w.attributes('data-selected')).toBeDefined()
    })

    it('disabled tone chip is dimmed and inert', async () => {
      const w = mount(Chip, { props: { label: 'x', variant: 'solid', tone: 'danger', selectable: true, disabled: true } })
      expect(w.attributes('data-disabled')).toBeDefined()
      await w.find('button').trigger('click')
      expect(w.emitted('update:selected')).toBeUndefined()
    })
  })

  describe('combined variations', () => {
    it('soft + tone + size + rounded + icon + removable', () => {
      const w = mount(Chip, {
        props: { label: 'Prod', variant: 'soft', tone: 'warning', size: 'sm', rounded: 'md', icon: faStar, removable: true },
      })
      expect(w.classes()).toEqual(expect.arrayContaining(['bg-warning/20', 'text-2xs', 'rounded-md']))
      expect(w.find('[data-slot="chip-leading"] svg').exists()).toBe(true)
      expect(w.find('[data-slot="chip-remove"]').attributes('aria-label')).toBe('Remove Prod')
    })
  })
})

describe('Chip accessibility (WCAG 2.5.8 target size, names)', () => {
  it('the remove button is at least 24x24px (size-6)', () => {
    const w = mount(Chip, { props: { label: 'Tag', removable: true } })
    const classes = w.find('[data-slot="chip-remove"]').classes()
    expect(classes).toContain('size-6')
    expect(classes).not.toContain('size-4')
    expect(classes).toContain('-me-1.5') // logical margin, mirrors in RTL
  })

  it('a removable, non-selectable chip is a named group and focus stop that documents its keys', () => {
    const w = mount(Chip, { props: { label: 'Tag', removable: true } })
    expect(w.attributes('role')).toBe('group')
    expect(w.attributes('aria-label')).toBe('Tag')
    expect(w.attributes('aria-keyshortcuts')).toBe('Delete Backspace')
    expect(w.attributes('tabindex')).toBe('0')
  })

  it('plain and selectable chips add no role, name or tab stop of their own', () => {
    const plain = mount(Chip, { props: { label: 'Tag' } })
    expect(plain.attributes('role')).toBeUndefined()
    expect(plain.attributes('tabindex')).toBeUndefined()
    const selectable = mount(Chip, { props: { label: 'Tag', selectable: true, removable: true } })
    expect(selectable.attributes('role')).toBeUndefined()
    expect(selectable.attributes('aria-label')).toBeUndefined()
    expect(selectable.find('[data-slot="chip-toggle"]').attributes('aria-pressed')).toBe('false')
  })
})
