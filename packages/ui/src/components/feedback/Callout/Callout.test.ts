import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import Callout from './Callout.vue'
import { exampleIcon, quoteIcon } from './icons'
import { CALLOUT_TYPES, calloutIconVariants, calloutVariants } from './variants'

describe('Callout', () => {
  describe('good path', () => {
    it('renders a note with role=note and data-slot', () => {
      const w = mount(Callout, { slots: { default: 'Body' } })
      expect(w.attributes('data-slot')).toBe('callout')
      expect(w.attributes('role')).toBe('note')
      expect(w.attributes('data-type')).toBe('note')
      expect(w.text()).toBe('Body')
    })

    it.each(['note', 'tip', 'warning', 'danger'] as const)('supports type %s with an icon', (type) => {
      const w = mount(Callout, { props: { type } })
      expect(w.attributes('data-type')).toBe(type)
      expect(w.find('[data-slot="callout-icon"] svg').exists()).toBe(true)
      expect(w.classes().join(' ')).toContain(calloutVariants({ type }).split(' ').at(-1)!)
    })

    it('renders title from the prop and from the slot', () => {
      expect(mount(Callout, { props: { title: 'Tip!' } }).find('[data-slot="callout-title"]').text()).toBe('Tip!')
      const w = mount(Callout, { slots: { title: '<em>Slot</em>' } })
      expect(w.find('[data-slot="callout-title"] em').text()).toBe('Slot')
    })
  })

  describe('customisation', () => {
    it('merges class last', () => {
      const w = mount(Callout, { props: { class: 'px-9 mine' } })
      expect(w.classes()).toContain('mine')
      expect(w.classes()).toContain('px-9')
      expect(w.classes()).not.toContain('px-4')
    })

    it('custom icon replaces the default; hideIcon removes it', () => {
      const custom = mount(Callout, { props: { icon: faBell } })
      const def = mount(Callout)
      expect(custom.find('svg path').attributes('d')).toBe(faBell.icon[4])
      expect(def.find('svg path').attributes('d')).not.toBe(faBell.icon[4])
      expect(mount(Callout, { props: { hideIcon: true } }).find('[data-slot="callout-icon"]').exists()).toBe(false)
    })

    it('passes attrs through', () => {
      expect(mount(Callout, { attrs: { id: 'c', 'data-x': '1' } }).attributes('id')).toBe('c')
    })
  })

  describe('bad path / edge cases', () => {
    it('unknown or prototype-ish type falls back to note', () => {
      expect(mount(Callout, { props: { type: 'bogus' as never } }).attributes('data-type')).toBe('note')
      expect(mount(Callout, { props: { type: 'constructor' as never } }).attributes('data-type')).toBe('note')
    })

    it('empty title prop renders no title element', () => {
      expect(mount(Callout, { props: { title: '' } }).find('[data-slot="callout-title"]').exists()).toBe(false)
    })

    it('empty body and huge unicode text', () => {
      expect(mount(Callout).find('[data-slot="callout-content"]').text()).toBe('')
      const text = 'é'.repeat(3000) + ' 日本語 العربية 👩‍👩‍👧'
      expect(mount(Callout, { slots: { default: text } }).text()).toContain('العربية')
    })
  })

  describe('extended types', () => {
    it('exposes every documented type', () => {
      expect([...CALLOUT_TYPES]).toEqual(['note', 'tip', 'important', 'warning', 'caution', 'danger', 'success', 'quote', 'example'])
    })

    it.each(CALLOUT_TYPES)('type %s has no edge stripe and renders with its own data-type, tone classes and an icon', (type) => {
      const w = mount(Callout, { props: { type, title: type }, slots: { default: 'Body' } })
      expect(w.attributes('data-type')).toBe(type)
      expect(w.attributes('role')).toBe('note')
      expect(w.classes().join(' ')).not.toMatch(/border-[lt]-4/)
      expect(w.find('[data-slot="callout-icon"] svg path').attributes('d')).toBeTruthy()
      expect(w.find('[data-slot="callout-title"]').text()).toBe(type)
    })

    it.each([
      ['important', 'border-chart-4/30', 'text-chart-4'],
      ['caution', 'border-destructive/30', 'text-destructive'],
      ['success', 'border-success/30', 'text-success'],
      ['quote', 'border-border', 'text-muted-foreground'],
      ['example', 'border-chart-2/30', 'text-chart-2'],
    ] as const)('type %s uses semantic tokens %s / %s', (type, border, icon) => {
      const w = mount(Callout, { props: { type } })
      expect(w.classes()).toContain(border)
      expect(w.find('[data-slot="callout-icon"]').classes()).toContain(icon)
    })

    it('every type picks a distinct default icon except where documented as sharing one', () => {
      const paths = new Map<string, string>()
      for (const type of CALLOUT_TYPES) paths.set(type, mount(Callout, { props: { type } }).find('svg path').attributes('d')!)
      expect(paths.get('quote')).toBe(quoteIcon.icon[4])
      expect(paths.get('example')).toBe(exampleIcon.icon[4])
      expect(paths.get('caution')).not.toBe(paths.get('danger'))
      expect(paths.get('note')).not.toBe(paths.get('tip'))
    })

    it('quote renders its body in italics; other types do not', () => {
      expect(mount(Callout, { props: { type: 'quote' }, slots: { default: 'To be or not' } }).find('[data-slot="callout-content"]').classes()).toContain('italic')
      expect(mount(Callout, { props: { type: 'note' } }).find('[data-slot="callout-content"]').classes()).not.toContain('italic')
    })

    it('class override works for a new type', () => {
      const w = mount(Callout, { props: { type: 'important', class: 'bg-background px-8' } })
      expect(w.classes()).toContain('bg-background')
      expect(w.classes()).not.toContain('bg-chart-4/10')
      expect(w.classes()).toContain('px-8')
    })

    it('hideIcon and custom icon work with new types', () => {
      expect(mount(Callout, { props: { type: 'quote', hideIcon: true } }).find('[data-slot="callout-icon"]').exists()).toBe(false)
      expect(mount(Callout, { props: { type: 'example', icon: faBell } }).find('svg path').attributes('d')).toBe(faBell.icon[4])
    })

    it('variants work standalone and merge conflicts', () => {
      expect(calloutVariants({ type: 'quote' })).toContain('bg-muted/40')
      expect(calloutVariants({ type: 'tip', class: 'px-9' })).toContain('px-9')
      expect(calloutVariants({ type: 'tip', class: 'px-9' })).not.toContain('px-4')
      expect(calloutIconVariants({ type: 'important' })).toContain('text-chart-4')
      expect(calloutIconVariants()).toContain('text-info')
    })

    it('inherited object keys are not treated as types', () => {
      for (const type of ['toString', '__proto__', 'hasOwnProperty'] as const) {
        expect(mount(Callout, { props: { type: type as never } }).attributes('data-type')).toBe('note')
      }
    })

    it('multi-paragraph body and rich title slot with a new type', () => {
      const w = mount(Callout, { props: { type: 'example' }, slots: { default: '<p>One</p><p>Two</p>', title: '<strong>Try it</strong>' } })
      expect(w.findAll('p')).toHaveLength(2)
      expect(w.find('[data-slot="callout-title"] strong').text()).toBe('Try it')
    })
  })
})
