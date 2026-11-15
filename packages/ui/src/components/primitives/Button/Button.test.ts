import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faPlus, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import Button from './Button.vue'
import { buttonVariants } from './variants'

describe('Button', () => {
  describe('good path', () => {
    it('renders a <button type="button"> with slot content', () => {
      const w = mount(Button, { slots: { default: 'Save' } })
      expect(w.element.tagName).toBe('BUTTON')
      expect(w.attributes('type')).toBe('button')
      expect(w.attributes('data-slot')).toBe('button')
      expect(w.text()).toBe('Save')
    })

    it.each(['default', 'secondary', 'outline', 'ghost', 'link', 'destructive', 'success'] as const)(
      'applies the %s variant',
      (variant) => {
        const w = mount(Button, { props: { variant } })
        expect(w.classes().join(' ')).toContain(buttonVariants({ variant }).split(' ')[0])
      },
    )

    it('uses primary colours by default and h-9 at md size', () => {
      const w = mount(Button)
      expect(w.classes()).toContain('bg-primary')
      expect(w.classes()).toContain('h-9')
    })

    it('supports every size', () => {
      for (const size of ['xs', 'sm', 'md', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] as const) {
        expect(mount(Button, { props: { size } }).exists()).toBe(true)
      }
      expect(mount(Button, { props: { size: 'lg' } }).classes()).toContain('h-11')
    })

    it('emits click', async () => {
      const w = mount(Button)
      await w.trigger('click')
      expect(w.emitted('click')).toHaveLength(1)
    })

    it('forwards the type prop', () => {
      expect(mount(Button, { props: { type: 'submit' } }).attributes('type')).toBe('submit')
    })

    it('renders as another element with `as`', () => {
      const w = mount(Button, { props: { as: 'a' }, attrs: { href: '/x' } })
      expect(w.element.tagName).toBe('A')
      expect(w.attributes('href')).toBe('/x')
      expect(w.attributes('type')).toBeUndefined()
    })

    it('asChild renders the child element with button classes', () => {
      const w = mount(Button, { props: { asChild: true }, slots: { default: '<a href="/y">Go</a>' } })
      expect(w.element.tagName).toBe('A')
      expect(w.classes()).toContain('inline-flex')
    })
  })

  describe('customisation', () => {
    it('merges a consumer class and lets it override conflicting utilities', () => {
      const w = mount(Button, { props: { class: 'bg-red-500 custom-x' } })
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('bg-red-500')
      expect(w.classes()).not.toContain('bg-primary')
    })

    it('passes arbitrary attributes through', () => {
      const w = mount(Button, { attrs: { 'aria-label': 'Close', 'data-test': 'x' } })
      expect(w.attributes('aria-label')).toBe('Close')
      expect(w.attributes('data-test')).toBe('x')
    })
  })

  describe('bad path / states', () => {
    it('disabled sets the attribute and does not emit click', async () => {
      const w = mount(Button, { props: { disabled: true } })
      expect(w.attributes('disabled')).toBeDefined()
      await w.trigger('click')
      expect(w.emitted('click')).toBeUndefined()
    })

    it('loading shows a spinner, sets aria-busy, disables and blocks clicks', async () => {
      const w = mount(Button, { props: { loading: true }, slots: { default: 'Save' } })
      expect(w.find('[data-slot="spinner"]').exists()).toBe(true)
      expect(w.attributes('aria-busy')).toBe('true')
      expect(w.attributes('data-loading')).toBeDefined()
      expect(w.attributes('disabled')).toBeDefined()
      expect(w.text()).toContain('Save')
      await w.trigger('click')
      expect(w.emitted('click')).toBeUndefined()
    })

    it('does not render a spinner when not loading', () => {
      expect(mount(Button).find('[data-slot="spinner"]').exists()).toBe(false)
    })

    it('non-button element uses aria-disabled and blocks clicks', async () => {
      let clicked = 0
      const w = mount(Button, { props: { as: 'a', disabled: true }, attrs: { onClick: () => clicked++ } })
      expect(w.attributes('aria-disabled')).toBe('true')
      expect(w.attributes('disabled')).toBeUndefined()
      await w.trigger('click')
      expect(clicked).toBe(0)
    })

    it('non-button element with loading is aria-disabled too', () => {
      const w = mount(Button, { props: { as: 'div', loading: true } })
      expect(w.attributes('aria-disabled')).toBe('true')
    })
  })

  describe('edge cases', () => {
    it('renders with no slot content', () => {
      expect(mount(Button).text()).toBe('')
    })

    it('handles an empty-string class prop', () => {
      expect(mount(Button, { props: { class: '' } }).classes()).toContain('inline-flex')
    })

    it('enabled non-button element is not aria-disabled and still clicks', async () => {
      let clicked = 0
      const w = mount(Button, { props: { as: 'a' }, attrs: { onClick: () => clicked++ } })
      expect(w.attributes('aria-disabled')).toBeUndefined()
      await w.trigger('click')
      expect(clicked).toBe(1)
    })
  })

  describe('backward compatibility (existing class output is frozen)', () => {
    const BASE =
      'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all select-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4 outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40'
    const VARIANTS = {
      default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      outline:
        'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
      ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
      link: 'text-primary underline-offset-4 hover:underline',
      destructive: 'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/30',
      success: 'bg-success text-success-foreground shadow-xs hover:bg-success/90 focus-visible:ring-success/30',
    } as const
    const SIZES = {
      xs: 'h-6 gap-1 rounded-md px-2 text-xs [&_svg:not([class*="size-"])]:size-3',
      sm: 'h-8 gap-1.5 px-3 pointer-coarse:min-h-10',
      md: 'h-9 px-4 py-2 pointer-coarse:min-h-11',
      lg: 'h-11 px-6 text-base',
      icon: 'size-9 pointer-coarse:size-11',
      'icon-xs': 'size-6 [&_svg:not([class*="size-"])]:size-3',
      'icon-sm': 'size-8 pointer-coarse:size-10',
      'icon-lg': 'size-11',
    } as const
    const set = (s: string) => [...new Set(s.split(/\s+/).filter(Boolean))].sort()

    const combos = Object.keys(VARIANTS).flatMap((v) => Object.keys(SIZES).map((z) => [v, z] as const))
    it.each(combos)('buttonVariants %s/%s emits the exact original class set', (variant, size) => {
      const expected = set(`${BASE} ${VARIANTS[variant as keyof typeof VARIANTS]} ${SIZES[size as keyof typeof SIZES]}`)
      expect(set(buttonVariants({ variant: variant as never, size: size as never }))).toEqual(expected)
    })

    it('the component adds no extra classes or DOM for default usage', () => {
      const w = mount(Button, { slots: { default: 'Save' } })
      expect(set(w.classes().join(' '))).toEqual(set(`${BASE} ${VARIANTS.default} ${SIZES.md}`))
      expect(w.element.children).toHaveLength(0)
      expect(w.text()).toBe('Save')
    })
  })

  describe('soft variant', () => {
    it('renders a tinted primary button', () => {
      const w = mount(Button, { props: { variant: 'soft' } })
      expect(w.classes()).toContain('bg-primary/10')
      expect(w.classes()).toContain('text-primary')
      expect(w.classes()).not.toContain('bg-primary')
      expect(buttonVariants({ variant: 'soft' })).toContain('hover:bg-primary/20')
    })

    it('class override wins over soft', () => {
      const w = mount(Button, { props: { variant: 'soft', class: 'bg-success/10 text-success' } })
      expect(w.classes()).toContain('bg-success/10')
      expect(w.classes()).not.toContain('bg-primary/10')
    })
  })

  describe('rounded', () => {
    it('default keeps rounded-md', () => {
      expect(mount(Button).classes()).toContain('rounded-md')
      expect(mount(Button, { props: { size: 'xs' } }).classes().filter((c) => c === 'rounded-md')).toHaveLength(1)
    })

    it('full is a pill and replaces rounded-md', () => {
      const w = mount(Button, { props: { rounded: 'full' } })
      expect(w.classes()).toContain('rounded-full')
      expect(w.classes()).not.toContain('rounded-md')
      expect(buttonVariants({ rounded: 'full' })).not.toContain('rounded-md')
    })

    it('none removes the radius', () => {
      const w = mount(Button, { props: { rounded: 'none' } })
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-md')
    })

    it('full works with xs and icon sizes (circle icon button)', () => {
      expect(mount(Button, { props: { rounded: 'full', size: 'xs' } }).classes()).not.toContain('rounded-md')
      const w = mount(Button, { props: { rounded: 'full', size: 'icon' }, attrs: { 'aria-label': 'Add' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-full', 'size-9']))
    })

    it('unknown rounded falls back to default', () => {
      expect(mount(Button, { props: { rounded: 'blob' as never } }).classes()).toContain('rounded-md')
    })

    it('class still wins over rounded', () => {
      const w = mount(Button, { props: { rounded: 'full', class: 'rounded-lg' } })
      expect(w.classes()).toContain('rounded-lg')
      expect(w.classes()).not.toContain('rounded-full')
    })
  })

  describe('block', () => {
    it('adds w-full', () => {
      expect(mount(Button, { props: { block: true } }).classes()).toContain('w-full')
      expect(buttonVariants({ block: true })).toContain('w-full')
    })

    it('is off by default and when false', () => {
      expect(mount(Button).classes()).not.toContain('w-full')
      expect(mount(Button, { props: { block: false } }).classes()).not.toContain('w-full')
    })

    it('a consumer width class overrides it', () => {
      const w = mount(Button, { props: { block: true, class: 'w-40' } })
      expect(w.classes()).toContain('w-40')
      expect(w.classes()).not.toContain('w-full')
    })

    it('works on non-button elements and with asChild', () => {
      expect(mount(Button, { props: { block: true, as: 'a' } }).classes()).toContain('w-full')
      expect(mount(Button, { props: { block: true, asChild: true }, slots: { default: '<a href="/x">x</a>' } }).classes()).toContain('w-full')
    })
  })

  describe('icons', () => {
    it('iconStart renders before the label', () => {
      const w = mount(Button, { props: { iconStart: faPlus }, slots: { default: 'Add' } })
      expect(w.element.children[0]!.getAttribute('data-slot')).toBe('icon')
      expect(w.text()).toBe('Add')
      expect(w.findAll('svg')).toHaveLength(1)
    })

    it('iconEnd renders after the label', () => {
      const w = mount(Button, { props: { iconEnd: faArrowRight }, slots: { default: 'Next' } })
      const last = w.element.lastElementChild!
      expect(last.getAttribute('data-slot')).toBe('icon')
      expect(w.findAll('svg')).toHaveLength(1)
    })

    it('renders both icons, decorative (aria-hidden)', () => {
      const w = mount(Button, { props: { iconStart: faPlus, iconEnd: faArrowRight }, slots: { default: 'Go' } })
      const svgs = w.findAll('svg')
      expect(svgs).toHaveLength(2)
      expect(svgs.every((s) => s.attributes('aria-hidden') === 'true')).toBe(true)
    })

    it('icon-start / icon-end slots override the props', () => {
      const w = mount(Button, {
        props: { iconStart: faPlus, iconEnd: faArrowRight },
        slots: { default: 'Go', 'icon-start': '<i data-s />', 'icon-end': '<i data-e />' },
      })
      expect(w.find('[data-s]').exists()).toBe(true)
      expect(w.find('[data-e]').exists()).toBe(true)
      expect(w.find('svg').exists()).toBe(false)
    })

    it('slots work without props', () => {
      const w = mount(Button, { slots: { default: 'Go', 'icon-end': '<i data-e />' } })
      expect(w.find('[data-e]').exists()).toBe(true)
    })

    it('loading replaces the start icon with the spinner but keeps the end icon', () => {
      const w = mount(Button, { props: { loading: true, iconStart: faPlus, iconEnd: faArrowRight }, slots: { default: 'Save' } })
      expect(w.find('[data-slot="spinner"]').exists()).toBe(true)
      expect(w.findAll('svg[data-slot="icon"]')).toHaveLength(1)
    })

    it('loading also hides an icon-start slot', () => {
      const w = mount(Button, { props: { loading: true }, slots: { default: 'Save', 'icon-start': '<i data-s />' } })
      expect(w.find('[data-s]').exists()).toBe(false)
    })

    it('asChild ignores icon props (child is rendered as is)', () => {
      const w = mount(Button, { props: { asChild: true, iconStart: faPlus }, slots: { default: '<a href="/x">x</a>' } })
      expect(w.element.tagName).toBe('A')
      expect(w.find('svg').exists()).toBe(false)
    })
  })

  describe('invalid variant / size', () => {
    it('unknown variant falls back to default', () => {
      const w = mount(Button, { props: { variant: 'neon' as never } })
      expect(w.classes()).toContain('bg-primary')
    })

    it('unknown size falls back to md', () => {
      const w = mount(Button, { props: { size: 'giant' as never } })
      expect(w.classes()).toContain('h-9')
    })

    it('every variant x rounded x block combination mounts', () => {
      for (const variant of ['default', 'soft', 'link'] as const)
        for (const rounded of ['default', 'full', 'none'] as const)
          for (const block of [true, false])
            expect(mount(Button, { props: { variant, rounded, block } }).exists()).toBe(true)
    })
  })
})
