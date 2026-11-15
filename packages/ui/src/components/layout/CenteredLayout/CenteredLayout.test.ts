import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import CenteredLayout from './CenteredLayout.vue'

describe('CenteredLayout', () => {
  describe('good path', () => {
    it('centres default content in a full-height flex container', () => {
      const w = mount(CenteredLayout, { slots: { default: '<form id="f">Login</form>' } })
      expect(w.attributes('data-slot')).toBe('centered-layout')
      expect(w.classes()).toEqual(expect.arrayContaining(['flex', 'min-h-dvh', 'items-center', 'justify-center', 'bg-background']))
      expect(w.find('[data-slot="centered-layout-column"] #f').text()).toBe('Login')
    })

    it.each([
      ['sm', 'max-w-sm'],
      ['md', 'max-w-md'],
      ['lg', 'max-w-lg'],
      ['xl', 'max-w-xl'],
      ['2xl', 'max-w-2xl'],
      ['4xl', 'max-w-4xl'],
    ] as const)('width %s', (width, cls) => {
      const col = mount(CenteredLayout, { props: { width } }).find('[data-slot="centered-layout-column"]')
      expect(col.classes()).toContain(cls)
      expect(col.classes()).toContain('w-full')
      expect(col.attributes('data-width')).toBe(width)
    })

    it('defaults to md', () => {
      expect(mount(CenteredLayout).find('[data-slot="centered-layout-column"]').classes()).toContain('max-w-md')
    })

    it('default layout has no data-layout and no card surface', () => {
      const w = mount(CenteredLayout)
      expect(w.attributes('data-layout')).toBeUndefined()
      expect(w.find('[data-slot="centered-layout-column"]').classes()).not.toContain('bg-card')
    })

    it('card layout: muted page and a card column', () => {
      const w = mount(CenteredLayout, { props: { layout: 'card' }, slots: { default: 'x' } })
      expect(w.attributes('data-layout')).toBe('card')
      expect(w.classes()).toEqual(expect.arrayContaining(['bg-muted', 'min-h-dvh', 'justify-center']))
      expect(w.classes()).not.toContain('bg-background')
      expect(w.find('[data-slot="centered-layout-column"]').classes()).toEqual(
        expect.arrayContaining(['rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'p-6']),
      )
    })

    it('card layout keeps width and slots', () => {
      const w = mount(CenteredLayout, { props: { layout: 'card', width: 'sm' }, slots: { logo: 'L', header: 'H', footer: 'F', default: 'B' } })
      const col = w.find('[data-slot="centered-layout-column"]')
      expect(col.classes()).toContain('max-w-sm')
      expect(col.text()).toBe('LHBF')
    })

    it('split layout with illustration: two columns from lg, illustration hidden on mobile', () => {
      const w = mount(CenteredLayout, { props: { layout: 'split' }, slots: { default: 'form', illustration: '<img id="il" alt="">' } })
      expect(w.attributes('data-layout')).toBe('split')
      expect(w.classes()).toEqual(expect.arrayContaining(['grid', 'grid-cols-1', 'lg:grid-cols-2']))
      expect(w.find('[data-slot="centered-layout-column"]').classes()).toContain('place-self-center')
      const il = w.find('[data-slot="centered-layout-illustration"]')
      expect(il.find('#il').exists()).toBe(true)
      expect(il.classes()).toEqual(expect.arrayContaining(['hidden', 'lg:flex', 'bg-muted']))
      expect(il.classes()).not.toContain('lg:order-first')
    })

    it('illustration after the form in DOM order (reading order) even when positioned at start', () => {
      const w = mount(CenteredLayout, { props: { layout: 'split', illustrationPosition: 'start' }, slots: { default: 'FORM', illustration: 'ART' } })
      expect(w.text().indexOf('FORM')).toBeLessThan(w.text().indexOf('ART'))
      expect(w.find('[data-slot="centered-layout-illustration"]').classes()).toContain('lg:order-first')
    })

    it('split layout without an illustration slot renders a single centred column', () => {
      const w = mount(CenteredLayout, { props: { layout: 'split' }, slots: { default: 'x' } })
      expect(w.classes()).not.toContain('lg:grid-cols-2')
      expect(w.find('[data-slot="centered-layout-illustration"]').exists()).toBe(false)
    })

    it('illustration slot is ignored outside the split layout', () => {
      expect(mount(CenteredLayout, { slots: { illustration: 'art' } }).find('[data-slot="centered-layout-illustration"]').exists()).toBe(false)
      expect(mount(CenteredLayout, { props: { layout: 'card' }, slots: { illustration: 'art' } }).text()).toBe('')
    })

    it('renders logo, header, default and footer in order', () => {
      const w = mount(CenteredLayout, {
        slots: { logo: '<i>LOGO</i>', header: '<h1>Welcome</h1>', default: '<main>BODY</main>', footer: '<a>Help</a>' },
      })
      const text = w.text()
      expect(text.indexOf('LOGO')).toBeLessThan(text.indexOf('Welcome'))
      expect(text.indexOf('Welcome')).toBeLessThan(text.indexOf('BODY'))
      expect(text.indexOf('BODY')).toBeLessThan(text.indexOf('Help'))
      expect(w.find('[data-slot="centered-layout-logo"] i').exists()).toBe(true)
      expect(w.find('[data-slot="centered-layout-header"] h1').exists()).toBe(true)
      expect(w.find('[data-slot="centered-layout-footer"] a').exists()).toBe(true)
    })
  })

  describe('customisation', () => {
    it('class wins', () => {
      const w = mount(CenteredLayout, { props: { class: 'bg-muted min-h-screen custom' } })
      expect(w.classes()).toContain('bg-muted')
      expect(w.classes()).not.toContain('bg-background')
      expect(w.classes()).toContain('min-h-screen')
      expect(w.classes()).not.toContain('min-h-dvh')
      expect(w.classes()).toContain('custom')
    })

    it('as + attrs', () => {
      const w = mount(CenteredLayout, { props: { as: 'main' }, attrs: { id: 'auth', 'data-x': '1' } })
      expect(w.element.tagName).toBe('MAIN')
      expect(w.attributes('id')).toBe('auth')
      expect(w.attributes('data-x')).toBe('1')
    })
  })

  describe('bad path', () => {
    it('unknown width falls back to md', () => {
      const col = mount(CenteredLayout, { props: { width: 'huge' as never } }).find('[data-slot="centered-layout-column"]')
      expect(col.classes()).toContain('max-w-md')
      expect(col.attributes('data-width')).toBe('md')
    })

    it('unknown layout falls back to default', () => {
      const w = mount(CenteredLayout, { props: { layout: 'wat' as never, width: 'sm' }, slots: { illustration: 'art' } })
      expect(w.attributes('data-layout')).toBeUndefined()
      expect(w.classes()).toContain('bg-background')
      expect(w.find('[data-slot="centered-layout-illustration"]').exists()).toBe(false)
      expect(mount(CenteredLayout, { props: { layout: 'toString' as never } }).attributes('data-layout')).toBeUndefined()
    })

    it('unknown illustrationPosition falls back to end', () => {
      const w = mount(CenteredLayout, { props: { layout: 'split', illustrationPosition: 'middle' as never }, slots: { illustration: 'art' } })
      expect(w.find('[data-slot="centered-layout-illustration"]').classes()).not.toContain('lg:order-first')
    })

    it('inherited key width falls back', () => {
      expect(mount(CenteredLayout, { props: { width: 'toString' as never } }).find('[data-width]').attributes('data-width')).toBe('md')
    })
  })

  describe('edge cases', () => {
    it('omits slot wrappers when slots are absent', () => {
      const w = mount(CenteredLayout)
      expect(w.find('[data-slot="centered-layout-logo"]').exists()).toBe(false)
      expect(w.find('[data-slot="centered-layout-header"]').exists()).toBe(false)
      expect(w.find('[data-slot="centered-layout-footer"]').exists()).toBe(false)
      expect(w.text()).toBe('')
    })

    it('class overrides layout classes on the root', () => {
      const w = mount(CenteredLayout, { props: { layout: 'card', class: 'bg-background' } })
      expect(w.classes()).toContain('bg-background')
      expect(w.classes()).not.toContain('bg-muted')
    })

    it('picks up an illustration slot that appears after mount', async () => {
      const Host = defineComponent({
        components: { CenteredLayout },
        props: { show: Boolean },
        template: `<CenteredLayout layout="split"><template v-if="show" #illustration>ART</template>body</CenteredLayout>`,
      })
      const w = mount(Host)
      expect(w.find('[data-slot="centered-layout-illustration"]').exists()).toBe(false)
      await w.setProps({ show: true })
      expect(w.find('[data-slot="centered-layout-illustration"]').text()).toBe('ART')
      expect(w.find('[data-slot="centered-layout"]').classes()).toContain('lg:grid-cols-2')
    })

    it('handles unicode / RTL', () => {
      expect(mount(CenteredLayout, { slots: { default: 'مرحبا 🌍' } }).text()).toBe('مرحبا 🌍')
    })
  })
})
