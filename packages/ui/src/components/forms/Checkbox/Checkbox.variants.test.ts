import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import Checkbox from './Checkbox.vue'
import Field from '../Field/Field.vue'
import { CHECKBOX_SHAPES, checkboxVariants, normalizeCheckboxShape } from './variants'
import { CHOICE_LABEL_POSITIONS, CHOICE_TONES, normalizeChoiceTone, normalizeLabelPosition } from './tones'
import * as barrel from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const box = (w: VueWrapper) => w.find('[data-slot="checkbox"]')
const named = { 'aria-label': 'Sample choice' }

/** The class string the box rendered before variations existed (size md, no label). */
const DEFAULT_BOX =
  'peer relative inline-flex shrink-0 items-center justify-center rounded-sm border border-input bg-transparent shadow-xs transition-[color,box-shadow] after:absolute pointer-coarse:after:-inset-3 dark:data-[state=unchecked]:bg-input/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 forced-colors:aria-invalid:border-dashed size-4 after:-inset-1'

/** Expected checked-surface classes per tone. */
const TONES = {
  primary: { bg: 'primary', fg: 'primary-foreground' },
  success: { bg: 'success', fg: 'success-foreground' },
  danger: { bg: 'destructive', fg: 'destructive-foreground' },
  info: { bg: 'info', fg: 'info-foreground' },
  neutral: { bg: 'foreground', fg: 'background' },
} as const

describe('Checkbox variations', () => {
  describe('defaults', () => {
    it('keeps the original class string without a label', () => {
      expect(box(mount(Checkbox, { attrs: named })).attributes('class')).toBe(DEFAULT_BOX)
    })

    it('keeps the original wrapper and class string with a label (only the alignment margin is added)', () => {
      const w = mount(Checkbox, { props: { label: 'Accept' } })
      expect(box(w).attributes('class')).toBe(`${DEFAULT_BOX} mt-0.5`)
      expect(w.find('[data-slot="checkbox-wrapper"]').attributes('class')).toBe('inline-flex max-w-full items-start gap-2')
      expect(w.find('[data-slot="checkbox-text"]').exists()).toBe(false)
    })

    it('explicit default values render exactly like omitted ones', () => {
      const plain = mount(Checkbox, { attrs: named }).html()
      expect(mount(Checkbox, { props: { tone: 'primary', shape: 'rounded', labelPosition: 'end' }, attrs: named }).html()).toBe(plain)
    })

    it('exports the variant helper and normalisers from the barrel', () => {
      expect(barrel.checkboxVariants).toBe(checkboxVariants)
      expect(barrel.normalizeCheckboxShape).toBe(normalizeCheckboxShape)
      expect(barrel.CHOICE_TONES).toBe(CHOICE_TONES)
      expect(barrel.CHECKBOX_SHAPES).toBe(CHECKBOX_SHAPES)
    })
  })

  describe('tone', () => {
    it.each(Object.entries(TONES).filter(([t]) => t !== 'primary'))('%s paints the checked and indeterminate surface with its own pair', (tone, { bg, fg }) => {
      const cls = box(mount(Checkbox, { props: { tone: tone as never }, attrs: named })).classes()
      for (const state of ['checked', 'indeterminate']) {
        expect(cls).toEqual(expect.arrayContaining([`data-[state=${state}]:bg-${bg}`, `data-[state=${state}]:border-${bg}`, `data-[state=${state}]:text-${fg}`]))
        // The default primary pair is replaced, not left next to it.
        expect(cls).not.toContain(`data-[state=${state}]:bg-primary`)
        expect(cls).not.toContain(`data-[state=${state}]:text-primary-foreground`)
      }
    })

    it('tones that differ from the default change the root HTML, and no two tones are the same', () => {
      const html = CHOICE_TONES.map((tone) => mount(Checkbox, { props: { tone }, attrs: named }).html())
      expect(new Set(html).size).toBe(CHOICE_TONES.length)
    })

    it('unknown tone falls back to primary', () => {
      expect(box(mount(Checkbox, { props: { tone: 'purple' as never }, attrs: named })).attributes('class')).toBe(DEFAULT_BOX)
      expect(normalizeChoiceTone(undefined)).toBe('primary')
      expect(normalizeChoiceTone(42)).toBe('primary')
    })

    it.each(CHOICE_TONES)('%s keeps the check glyph, aria-checked and the unchecked fill rules, and toggles on click', async (tone) => {
      const w = mount(Checkbox, { props: { tone }, attrs: named })
      expect(box(w).classes()).toEqual(expect.arrayContaining(['dark:data-[state=unchecked]:bg-input/30', 'border-input']))
      expect(w.find('svg').exists()).toBe(false)
      await box(w).trigger('click')
      expect(box(w).attributes('aria-checked')).toBe('true')
      expect(box(w).attributes('data-state')).toBe('checked')
      // State stays visible without colour: the glyph is rendered and the forced-colors fragments are untouched.
      expect(w.find('[data-slot="checkbox-indicator"] svg').exists()).toBe(true)
      expect(box(w).classes()).toContain('forced-colors:aria-invalid:border-dashed')
    })

    it('indeterminate shows the minus glyph in every tone', () => {
      for (const tone of CHOICE_TONES) {
        const w = mount(Checkbox, { props: { tone, modelValue: 'indeterminate' }, attrs: named })
        expect(box(w).attributes('aria-checked')).toBe('mixed')
        expect(w.find('[data-slot="checkbox-indicator"] svg').exists()).toBe(true)
      }
    })

    it('invalid keeps its destructive ring on top of any tone', () => {
      const cls = box(mount(Checkbox, { props: { tone: 'success', invalid: true }, attrs: named })).classes()
      expect(cls).toEqual(expect.arrayContaining(['aria-invalid:border-destructive', 'aria-invalid:ring-destructive/20']))
    })
  })

  describe('shape', () => {
    it.each([
      ['rounded', 'rounded-sm', ['rounded-none', 'rounded-full']],
      ['square', 'rounded-none', ['rounded-sm', 'rounded-full']],
      ['circle', 'rounded-full', ['rounded-sm', 'rounded-none']],
    ] as const)('%s uses %s', (shape, cls, absent) => {
      const classes = box(mount(Checkbox, { props: { shape }, attrs: named })).classes()
      expect(classes).toContain(cls)
      for (const a of absent) expect(classes).not.toContain(a)
    })

    it('every shape renders a different box', () => {
      expect(new Set(CHECKBOX_SHAPES.map((shape) => mount(Checkbox, { props: { shape }, attrs: named }).html())).size).toBe(3)
    })

    it('unknown shape falls back to rounded', () => {
      expect(box(mount(Checkbox, { props: { shape: 'blob' as never }, attrs: named })).attributes('class')).toBe(DEFAULT_BOX)
      expect(normalizeCheckboxShape(null)).toBe('rounded')
    })

    it('shape never uses an arbitrary radius', () => {
      for (const shape of CHECKBOX_SHAPES) expect(box(mount(Checkbox, { props: { shape }, attrs: named })).classes().join(' ')).not.toMatch(/rounded-\[/)
    })
  })

  describe('class prop', () => {
    it('wins over tone and shape classes', () => {
      const cls = box(mount(Checkbox, { props: { tone: 'danger', shape: 'circle', class: 'rounded-lg data-[state=checked]:bg-info' }, attrs: named })).classes()
      expect(cls).toContain('rounded-lg')
      expect(cls).not.toContain('rounded-full')
      expect(cls).toContain('data-[state=checked]:bg-info')
      expect(cls).not.toContain('data-[state=checked]:bg-destructive')
    })

    it('checkboxVariants can be used on a plain element and returns merged classes', () => {
      const out = checkboxVariants({ tone: 'success', shape: 'circle', size: 'lg', labeled: true, class: 'extra' })
      expect(out).toContain('data-[state=checked]:bg-success')
      expect(out).not.toContain('data-[state=checked]:bg-primary')
      expect(out).toContain('rounded-full')
      expect(out).not.toContain('rounded-sm')
      expect(out).toContain('size-5')
      expect(out).toContain('mt-0.5')
      expect(out.endsWith('extra')).toBe(true)
      expect(checkboxVariants()).toBe(DEFAULT_BOX)
    })
  })

  describe('labelPosition', () => {
    it('end keeps the label after the box; start reverses the row with a logical utility', () => {
      const end = mount(Checkbox, { props: { label: 'Accept', labelPosition: 'end' } })
      const start = mount(Checkbox, { props: { label: 'Accept', labelPosition: 'start' } })
      expect(end.find('[data-slot="checkbox-wrapper"]').classes()).not.toContain('flex-row-reverse')
      expect(start.find('[data-slot="checkbox-wrapper"]').classes()).toContain('flex-row-reverse')
      // Source order (and so the reading and tab order) is the same in both.
      for (const w of [end, start]) {
        const kids = [...w.find('[data-slot="checkbox-wrapper"]').element.children].map((c) => c.getAttribute('data-slot'))
        expect(kids).toEqual(['checkbox', 'checkbox-label'])
      }
    })

    it('uses no physical left or right utilities', () => {
      const w = mount(Checkbox, { props: { label: 'Accept', labelPosition: 'start', description: 'Hint' } })
      expect(w.html()).not.toMatch(/class="[^"]*\b(?:ml|mr|pl|pr|left|right|text-left|text-right)-/)
    })

    it('unknown value falls back to end', () => {
      const w = mount(Checkbox, { props: { label: 'Accept', labelPosition: 'top' as never } })
      expect(w.find('[data-slot="checkbox-wrapper"]').classes()).not.toContain('flex-row-reverse')
      expect(CHOICE_LABEL_POSITIONS).toEqual(['end', 'start'])
      expect(normalizeLabelPosition('start')).toBe('start')
      expect(normalizeLabelPosition(undefined)).toBe('end')
    })

    it('has no effect without a label', () => {
      const w = mount(Checkbox, { props: { labelPosition: 'start' }, attrs: named })
      expect(w.find('[data-slot="checkbox-wrapper"]').exists()).toBe(false)
      expect(box(w).attributes('class')).toBe(DEFAULT_BOX)
    })

    it('clicking the label still toggles when it is shown first', async () => {
      wrapper = mount(Checkbox, { props: { label: 'Accept', labelPosition: 'start' }, attachTo: document.body })
      await wrapper.find('label').trigger('click')
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    })
  })

  describe('description', () => {
    it('renders under the label and is linked with aria-describedby', () => {
      const w = mount(Checkbox, { props: { label: 'Newsletter', description: 'One email a month.', id: 'nl' } })
      const desc = w.find('[data-slot="checkbox-description"]')
      expect(desc.text()).toBe('One email a month.')
      expect(desc.attributes('id')).toBe('nl-description')
      expect(box(w).attributes('aria-describedby')).toBe('nl-description')
      // The label and description share a text column; the label still names the box.
      expect(w.find('[data-slot="checkbox-text"]').element.children[0].tagName).toBe('LABEL')
      expect(w.find('label').text()).toBe('Newsletter')
      expect(w.find('label').text()).not.toContain('One email')
    })

    it('description slot replaces the prop', () => {
      const w = mount(Checkbox, { props: { label: 'L', description: 'prop' }, slots: { description: '<em>slot text</em>' } })
      expect(w.find('[data-slot="checkbox-description"] em').text()).toBe('slot text')
      expect(w.find('[data-slot="checkbox-description"]').text()).not.toContain('prop')
    })

    it('slot alone is enough', () => {
      const w = mount(Checkbox, { props: { label: 'L' }, slots: { description: 'From slot' } })
      expect(box(w).attributes('aria-describedby')).toBe(w.find('[data-slot="checkbox-description"]').attributes('id'))
    })

    it('is not shown (and not referenced) without a label', () => {
      const w = mount(Checkbox, { props: { description: 'Orphan' }, attrs: named })
      expect(w.find('[data-slot="checkbox-description"]').exists()).toBe(false)
      expect(box(w).attributes('aria-describedby')).toBeUndefined()
    })

    it('an empty description renders nothing', () => {
      const w = mount(Checkbox, { props: { label: 'L', description: '' } })
      expect(w.find('[data-slot="checkbox-description"]').exists()).toBe(false)
      expect(box(w).attributes('aria-describedby')).toBeUndefined()
    })

    it('merges with Field hint and error ids and with an explicit aria-describedby, without duplicates', () => {
      wrapper = mount(Field, {
        props: { label: 'Terms', hint: 'Read them', error: 'Required', id: 'tos' },
        slots: { default: () => h(Checkbox, { label: 'I agree', description: 'Applies to this account.', 'aria-describedby': 'extra tos-hint' }) },
      })
      const ids = wrapper.find('[data-slot="checkbox"]').attributes('aria-describedby')!.split(' ')
      expect(ids).toEqual(['tos-hint', 'tos-error', 'extra', 'tos-description'])
      for (const id of ids.filter((i) => i !== 'extra')) expect(wrapper.find(`[id="${id}"]`).exists()).toBe(true)
    })

    it('an explicit aria-describedby alone is kept', () => {
      const w = mount(Checkbox, { props: { label: 'L' }, attrs: { 'aria-describedby': 'ext' } })
      expect(box(w).attributes('aria-describedby')).toBe('ext')
    })

    it('dims with the label when disabled and uses the smaller text on sm', () => {
      const w = mount(Checkbox, { props: { label: 'L', description: 'D', disabled: true, size: 'sm' } })
      const cls = w.find('[data-slot="checkbox-description"]').classes()
      expect(cls).toEqual(expect.arrayContaining(['opacity-50', 'text-muted-foreground', 'text-xs']))
    })

    it('handles very long unbroken text without leaving the text column', () => {
      const w = mount(Checkbox, { props: { label: 'L', description: 'x'.repeat(400) } })
      expect(w.find('[data-slot="checkbox-text"]').classes()).toContain('min-w-0')
      expect(w.find('[data-slot="checkbox-wrapper"]').classes()).toContain('max-w-full')
    })

    it('works together with label position start', () => {
      const w = mount(Checkbox, { props: { label: 'L', description: 'D', labelPosition: 'start' } })
      expect(w.find('[data-slot="checkbox-wrapper"]').classes()).toContain('flex-row-reverse')
      expect(w.find('[data-slot="checkbox-description"]').exists()).toBe(true)
    })
  })

  describe('combinations', () => {
    it.each(CHOICE_TONES.flatMap((tone) => CHECKBOX_SHAPES.flatMap((shape) => (['sm', 'md', 'lg'] as const).map((size) => [tone, shape, size] as const))))(
      'tone=%s shape=%s size=%s render without conflicting classes',
      (tone, shape, size) => {
        const cls = box(mount(Checkbox, { props: { tone, shape, size, label: 'L' } })).classes()
        const radius = cls.filter((c) => /^rounded-/.test(c))
        expect(radius).toHaveLength(1)
        expect(cls.filter((c) => /^size-/.test(c))).toHaveLength(1)
        expect(cls.filter((c) => /^data-\[state=checked\]:bg-/.test(c))).toHaveLength(1)
        expect(cls).toContain(`data-[state=checked]:bg-${TONES[tone].bg}`)
      },
    )

    it('tone + label position + description + invalid + disabled together', async () => {
      const w = mount(Checkbox, { props: { tone: 'info', labelPosition: 'start', label: 'L', description: 'D', invalid: true, defaultValue: true } })
      expect(box(w).attributes('aria-invalid')).toBe('true')
      expect(box(w).attributes('aria-checked')).toBe('true')
      await w.setProps({ disabled: true })
      expect(box(w).attributes('disabled')).toBeDefined()
      await box(w).trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('switching props after mount updates the classes', async () => {
      const w = mount(Checkbox, { attrs: named })
      await w.setProps({ tone: 'danger', shape: 'circle' })
      expect(box(w).classes()).toEqual(expect.arrayContaining(['data-[state=checked]:bg-destructive', 'rounded-full']))
      await w.setProps({ tone: undefined, shape: undefined })
      expect(box(w).attributes('class')).toBe(DEFAULT_BOX)
    })

    it('unmounts cleanly in every variation', () => {
      const w = mount(Checkbox, { props: { tone: 'neutral', shape: 'square', label: 'L', description: 'D', labelPosition: 'start' } })
      w.unmount()
      expect(document.body.innerHTML).toBe('')
    })
  })

  describe('accessibility', () => {
    it.each(CHOICE_TONES)('%s: role, label for/id and name are the same as the default', (tone) => {
      const w = mount(Checkbox, { props: { tone, shape: 'circle', label: 'Accept terms', id: 'terms' } })
      expect(box(w).attributes('role')).toBe('checkbox')
      expect(w.find('label').attributes('for')).toBe('terms')
      expect(box(w).attributes('id')).toBe('terms')
      expect(box(w).element.tagName).toBe('BUTTON')
    })

    it('keeps the 24px hit area and the coarse pointer area for every size and shape', () => {
      for (const shape of CHECKBOX_SHAPES) {
        for (const size of ['sm', 'md', 'lg'] as const) {
          expect(box(mount(Checkbox, { props: { shape, size }, attrs: named })).classes()).toEqual(
            expect.arrayContaining(['relative', 'after:absolute', 'pointer-coarse:after:-inset-3']),
          )
        }
      }
    })

    it('keeps the focus ring and forced-colors invalid border for every tone', () => {
      for (const tone of CHOICE_TONES) {
        expect(box(mount(Checkbox, { props: { tone }, attrs: named })).classes()).toEqual(
          expect.arrayContaining(['focus-visible:ring-3', 'focus-visible:ring-ring/40', 'forced-colors:aria-invalid:border-dashed', 'disabled:opacity-50']),
        )
      }
    })

    it('Space key toggles in a non-default variation', async () => {
      wrapper = mount(Checkbox, { props: { tone: 'success', shape: 'circle', label: 'L' }, attachTo: document.body })
      const el = wrapper.find('button').element as HTMLButtonElement
      el.focus()
      await wrapper.find('button').trigger('keydown', { key: ' ' })
      await wrapper.find('button').trigger('keyup', { key: ' ' })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })
  })
})
