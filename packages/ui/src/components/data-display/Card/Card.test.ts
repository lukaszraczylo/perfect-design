import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { Card, CardAction, CardBody, CardContent, CardDescription, CardFooter, CardHeader, CardMedia, CardTitle, cardVariants } from './index'

describe('Card', () => {
  describe('good path', () => {
    it('renders a div with data-slot and slot content', () => {
      const w = mount(Card, { slots: { default: 'Hello' } })
      expect(w.element.tagName).toBe('DIV')
      expect(w.attributes('data-slot')).toBe('card')
      expect(w.text()).toBe('Hello')
      expect(w.classes()).toContain('bg-card')
    })

    it.each(['default', 'outline', 'elevated', 'interactive', 'ghost', 'filled', 'with-image-header'] as const)('applies the %s variant', (variant) => {
      const w = mount(Card, { props: { variant } })
      expect(w.attributes('data-variant')).toBe(variant)
      expect(w.classes().join(' ')).toContain(cardVariants({ variant }).split(' ')[0])
    })

    it('interactive adds hover + pointer styles', () => {
      const w = mount(Card, { props: { variant: 'interactive' } })
      expect(w.classes()).toContain('cursor-pointer')
      expect(w.classes().some((c) => c.startsWith('hover:shadow'))).toBe(true)
    })

    it('composes every part with its own data-slot', () => {
      const w = mount({
        components: { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter },
        template: `<Card><CardHeader><CardTitle>T</CardTitle><CardDescription>D</CardDescription><CardAction>A</CardAction></CardHeader><CardContent>C</CardContent><CardFooter>F</CardFooter></Card>`,
      })
      for (const s of ['card', 'card-header', 'card-title', 'card-description', 'card-action', 'card-content', 'card-footer']) {
        expect(w.find(`[data-slot="${s}"]`).exists(), s).toBe(true)
      }
      expect(w.find('[data-slot="card-title"]').element.tagName).toBe('H3')
      expect(w.find('[data-slot="card-description"]').element.tagName).toBe('P')
    })
  })

  describe('customisation', () => {
    it('merges class and lets it override conflicting utilities', () => {
      const w = mount(Card, { props: { class: 'rounded-none py-2 custom-x' } })
      expect(w.classes()).toContain('custom-x')
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-xl')
      expect(w.classes()).toContain('py-2')
      expect(w.classes()).not.toContain('py-6')
    })

    it('passes attributes and listeners through', async () => {
      let clicked = 0
      const w = mount(Card, { attrs: { 'aria-label': 'x', 'data-test': 'y', onClick: () => clicked++ } })
      expect(w.attributes('aria-label')).toBe('x')
      expect(w.attributes('data-test')).toBe('y')
      await w.trigger('click')
      expect(clicked).toBe(1)
    })

    it('renders as a link with `as` and as-child', () => {
      const a = mount(Card, { props: { as: 'a', variant: 'interactive' }, attrs: { href: '/x' } })
      expect(a.element.tagName).toBe('A')
      expect(a.attributes('href')).toBe('/x')
      const child = mount(Card, { props: { asChild: true }, slots: { default: '<a href="/y">Go</a>' } })
      expect(child.element.tagName).toBe('A')
      expect(child.classes()).toContain('rounded-xl')
    })

    it('parts accept class, as and asChild', () => {
      const title = mount(CardTitle, { props: { as: 'h2', class: 'text-xl' } })
      expect(title.element.tagName).toBe('H2')
      expect(title.classes()).toContain('text-xl')
      const header = mount(CardHeader, { props: { asChild: true }, slots: { default: '<header>H</header>' } })
      expect(header.element.tagName).toBe('HEADER')
      expect(mount(CardContent, { props: { class: 'p-0' } }).classes()).not.toContain('px-6')
      expect(mount(CardFooter, { props: { class: 'justify-end' } }).classes()).toContain('justify-end')
      expect(mount(CardDescription, { props: { class: 'x' } }).classes()).toContain('x')
      expect(mount(CardAction, { props: { class: 'x' } }).classes()).toContain('x')
    })
  })

  describe('new variants', () => {
    it('default output is unchanged', () => {
      expect(cardVariants()).toBe('flex flex-col gap-6 rounded-xl py-6 text-card-foreground border bg-card shadow-sm')
      expect(mount(Card).classes().join(' ')).toBe('flex flex-col gap-6 rounded-xl py-6 text-card-foreground border bg-card shadow-sm')
      expect(mount(Card).attributes('data-layout')).toBeUndefined()
      expect(mount(Card).attributes('role')).toBeUndefined()
      expect(mount(Card).attributes('data-state')).toBeUndefined()
    })
    it('ghost has a transparent surface', () => {
      const c = mount(Card, { props: { variant: 'ghost' } }).classes()
      expect(c).toContain('bg-transparent')
      expect(c).toContain('border-transparent')
      expect(c).not.toContain('shadow-sm')
    })
    it('filled uses the muted surface without shadow', () => {
      const c = mount(Card, { props: { variant: 'filled' } }).classes()
      expect(c).toContain('bg-muted')
      expect(c).not.toContain('bg-card')
    })
    it('has no gradient-border variant: a stale value renders the plain base card, no gradient', () => {
      const cls = mount(Card, { props: { variant: 'gradient-border' as never } }).classes().join(' ')
      expect(cls).not.toContain('gradient')
      expect(cls).not.toContain('bg-clip')
      expect(cardVariants({ variant: 'gradient-border' as never })).not.toContain('gradient')
    })
    it.each(['default', 'outline', 'elevated', 'interactive', 'ghost', 'filled', 'with-image-header'] as const)('%s variant has no gradient, blur, stripe or hover movement', (variant) => {
      const cls = cardVariants({ variant })
      expect(cls).not.toMatch(/gradient|backdrop-blur|border-l-|border-t-|hover:scale|hover:-translate/)
    })
    it('with-image-header removes top padding and clips overflow', () => {
      const c = mount(Card, { props: { variant: 'with-image-header' } }).classes()
      expect(c).toContain('overflow-hidden')
      expect(c).toContain('pt-0')
    })
    it('horizontal layout drops padding/gap and goes row from sm', () => {
      const w = mount(Card, { props: { layout: 'horizontal' } })
      expect(w.attributes('data-layout')).toBe('horizontal')
      expect(w.classes()).toContain('sm:flex-row')
      expect(w.classes()).toContain('py-0')
      expect(w.classes()).not.toContain('py-6')
      expect(w.classes()).toContain('gap-0')
      expect(w.classes()).not.toContain('gap-6')
    })
    it('unknown layout falls back to vertical', () => {
      const w = mount(Card, { props: { layout: 'diagonal' as never } })
      expect(w.classes()).toContain('py-6')
      expect(w.attributes('data-layout')).toBeUndefined()
    })
    it('class still wins over variant utilities', () => {
      const w = mount(Card, { props: { variant: 'filled', layout: 'horizontal', class: 'bg-primary py-4' } })
      expect(w.classes()).toContain('bg-primary')
      expect(w.classes()).not.toContain('bg-muted')
      expect(w.classes()).toContain('py-4')
      expect(w.classes()).not.toContain('py-0')
    })
    it('CardMedia / CardBody carry data-slots, merge class and size by layout', () => {
      const h = mount({
        components: { Card, CardMedia, CardBody },
        template: '<Card layout="horizontal"><CardMedia><img alt="" src="x.png" /></CardMedia><CardBody>Body</CardBody></Card>',
      })
      const media = h.find('[data-slot="card-media"]')
      expect(media.classes()).toContain('sm:w-2/5')
      expect(media.find('img').exists()).toBe(true)
      expect(h.find('[data-slot="card-body"]').text()).toBe('Body')
      const v = mount({ components: { Card, CardMedia }, template: '<Card variant="with-image-header"><CardMedia /></Card>' })
      expect(v.find('[data-slot="card-media"]').classes()).not.toContain('sm:w-2/5')
      const standalone = mount(CardMedia, { props: { class: 'h-40 sm:w-1/3' } })
      expect(standalone.classes()).toContain('h-40')
      expect(standalone.classes()).toContain('sm:w-1/3')
      const override = mount({ components: { Card, CardMedia }, template: '<Card layout="horizontal"><CardMedia class="sm:w-1/3" /></Card>' }).find('[data-slot="card-media"]')
      expect(override.classes()).toContain('sm:w-1/3')
      expect(override.classes()).not.toContain('sm:w-2/5')
    })
    it('CardMedia and CardBody support as / asChild / class', () => {
      expect(mount(CardMedia, { props: { as: 'figure' } }).element.tagName).toBe('FIGURE')
      expect(mount(CardBody, { props: { as: 'section', class: 'py-2' } }).classes()).toContain('py-2')
      expect(mount(CardBody, { props: { class: 'py-2' } }).classes()).not.toContain('py-6')
      expect(mount(CardMedia, { props: { asChild: true }, slots: { default: '<img alt="" />' } }).element.tagName).toBe('IMG')
      expect(mount(CardBody, { props: { asChild: true }, slots: { default: '<main>x</main>' } }).element.tagName).toBe('MAIN')
      expect(mount(CardMedia).text()).toBe('')
      expect(mount(CardBody).text()).toBe('')
    })
  })

  describe('selectable', () => {
    it('is a keyboard-accessible checkbox with data-state', () => {
      const w = mount(Card, { props: { selectable: true } })
      expect(w.attributes('role')).toBe('checkbox')
      expect(w.attributes('tabindex')).toBe('0')
      expect(w.attributes('aria-checked')).toBe('false')
      expect(w.attributes('data-state')).toBe('unchecked')
      expect(w.classes()).toContain('cursor-pointer')
    })
    it('toggles uncontrolled on click, Space and Enter and emits both events', async () => {
      const w = mount(Card, { props: { selectable: true } })
      await w.trigger('click')
      expect(w.attributes('aria-checked')).toBe('true')
      expect(w.attributes('data-state')).toBe('checked')
      expect(w.emitted('update:modelValue')![0]).toEqual([true])
      expect(w.emitted('update:checked')![0]).toEqual([true])
      await w.trigger('keydown', { key: ' ' })
      expect(w.attributes('aria-checked')).toBe('false')
      await w.trigger('keydown', { key: 'Enter' })
      expect(w.attributes('aria-checked')).toBe('true')
      await w.trigger('keydown', { key: 'a' })
      expect(w.attributes('aria-checked')).toBe('true')
      expect(w.emitted('update:modelValue')).toHaveLength(3)
    })
    it('v-model controls the state; the parent decides', async () => {
      const w = mount(Card, { props: { selectable: true, modelValue: true } })
      expect(w.attributes('aria-checked')).toBe('true')
      await w.trigger('click')
      expect(w.emitted('update:modelValue')![0]).toEqual([false])
      // parent did not update the prop: still checked
      expect(w.attributes('aria-checked')).toBe('true')
      await w.setProps({ modelValue: false })
      expect(w.attributes('data-state')).toBe('unchecked')
    })
    it('checked prop works as an alias', async () => {
      const w = mount(Card, { props: { selectable: true, checked: true } })
      expect(w.attributes('data-state')).toBe('checked')
      await w.trigger('click')
      expect(w.emitted('update:checked')![0]).toEqual([false])
    })
    it('disabled blocks click and keys and leaves the tab order', async () => {
      let clicks = 0
      const w = mount(Card, { props: { selectable: true, disabled: true }, attrs: { onClick: () => clicks++ } })
      expect(w.attributes('aria-disabled')).toBe('true')
      expect(w.attributes('tabindex')).toBeUndefined()
      await w.trigger('click')
      await w.trigger('keydown', { key: ' ' })
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(clicks).toBe(0)
    })
    it('not selectable: no role, no toggling, keys ignored', async () => {
      const w = mount(Card)
      await w.trigger('click')
      await w.trigger('keydown', { key: ' ' })
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(w.attributes('aria-checked')).toBeUndefined()
      expect(mount(Card, { props: { disabled: true } }).attributes('aria-disabled')).toBeUndefined()
    })
    it('inner interactive elements do not toggle the card, but plain content does', async () => {
      const w = mount(Card, {
        props: { selectable: true },
        slots: { default: '<button id="b">Go</button><a id="l" href="#x">l</a><span id="s">text</span>' },
        attachTo: document.body,
      })
      await w.find('#b').trigger('click')
      await w.find('#l').trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      await w.find('#s').trigger('click')
      expect(w.emitted('update:modelValue')).toHaveLength(1)
      await w.find('#b').trigger('keydown', { key: ' ' })
      expect(w.emitted('update:modelValue')).toHaveLength(1)
      w.unmount()
    })
    it('a non-interactive slot child resolving to the card itself still toggles (closest is the root)', async () => {
      const w = mount(Card, { props: { selectable: true, as: 'button' } })
      await w.trigger('click')
      expect(w.emitted('update:modelValue')).toHaveLength(1)
    })
    it('merges with attrs and a user click listener still fires', async () => {
      let clicks = 0
      const w = mount(Card, { props: { selectable: true, class: 'custom' }, attrs: { 'aria-label': 'Plan', onClick: () => clicks++ } })
      await w.trigger('click')
      expect(clicks).toBe(1)
      expect(w.attributes('aria-label')).toBe('Plan')
      expect(w.classes()).toContain('custom')
    })
  })

  describe('bad path / edge cases', () => {
    it('invalid variant renders without throwing and falls back to base styles', () => {
      const w = mount(Card, { props: { variant: 'nope' as never } })
      expect(w.exists()).toBe(true)
      expect(w.classes()).toContain('rounded-xl')
    })

    it('renders empty', () => {
      expect(mount(Card).text()).toBe('')
      expect(mount(CardHeader).text()).toBe('')
    })

    it('handles unicode / RTL / very long text', () => {
      const long = 'ж'.repeat(5000)
      expect(mount(CardTitle, { slots: { default: 'مرحبا 🎉' } }).text()).toBe('مرحبا 🎉')
      expect(mount(CardContent, { slots: { default: long } }).text()).toHaveLength(5000)
    })

    it('empty-string class is ignored', () => {
      expect(mount(Card, { props: { class: '' } }).classes()).toContain('bg-card')
    })
  })
})
