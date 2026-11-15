import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, onErrorCaptured } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { THEME_STYLES } from '../../../stores/theme'
import StyleScope from './StyleScope.vue'

const captured = (looks: string[]) => {
  const errors: Error[] = []
  mount(
    defineComponent({
      setup() {
        onErrorCaptured((e) => {
          errors.push(e as Error)
          return false
        })
        return () => looks.map((look) => h(StyleScope, { look: look as never }))
      },
    }),
  )
  return errors
}

beforeEach(() => configureStrictMode('off'))
afterEach(() => configureStrictMode('off'))

describe('StyleScope', () => {
  describe('good path', () => {
    it.each(THEME_STYLES)('look="%s" sets data-style and data-slot', (look) => {
      const w = mount(StyleScope, { props: { look }, slots: { default: 'Inside' } })
      expect(w.attributes('data-style')).toBe(look)
      expect(w.attributes('data-slot')).toBe('style-scope')
      expect(w.text()).toBe('Inside')
    })
    it('paints the page colours so the pack reads on any parent', () => {
      expect(mount(StyleScope, { props: { look: 'raw' } }).classes()).toEqual(expect.arrayContaining(['bg-background', 'text-foreground']))
    })
  })

  describe('customisation', () => {
    it('class wins over internal classes', () => {
      const w = mount(StyleScope, { props: { look: 'raw', class: 'bg-card p-4' } })
      expect(w.classes()).toContain('bg-card')
      expect(w.classes()).not.toContain('bg-background')
    })
    it('renders as another element and forwards attributes', () => {
      const w = mount(StyleScope, { props: { look: 'terminal', as: 'section' }, attrs: { id: 'x', 'aria-label': 'Console' } })
      expect(w.element.tagName).toBe('SECTION')
      expect(w.attributes('id')).toBe('x')
      expect(w.attributes('aria-label')).toBe('Console')
    })
  })

  describe('bad path', () => {
    it('an unknown look renders no data-style (no stray attribute), never a crash', () => {
      const w = mount(StyleScope, { props: { look: 'neon' as never } })
      expect(w.attributes('data-style')).toBeUndefined()
    })
    it('throws a ContractError in strict mode for an unknown look', async () => {
      configureStrictMode('throw')
      const errors = captured(['neon'])
      await new Promise((r) => setTimeout(r, 0))
      expect(errors[0]?.name).toBe('ContractError')
      expect(errors[0].message).toContain('StyleScope: requires `look`')
    })
    it('no ContractError for every known look', async () => {
      configureStrictMode('throw')
      const errors = captured([...THEME_STYLES])
      await new Promise((r) => setTimeout(r, 0))
      expect(errors).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('nested scopes keep their own look', () => {
      const w = mount(StyleScope, { props: { look: 'workbench' }, slots: { default: '<div data-slot="style-scope" data-style="quiet" />' } })
      expect(w.attributes('data-style')).toBe('workbench')
      expect(w.find('[data-style="quiet"]').exists()).toBe(true)
    })
    it('empty slot renders an empty element', () => {
      expect(mount(StyleScope, { props: { look: 'raw' } }).text()).toBe('')
    })
  })
})
