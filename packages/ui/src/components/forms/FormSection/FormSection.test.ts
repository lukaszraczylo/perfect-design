import { afterEach, describe, expect, it } from 'vitest'
import { mount as vtuMount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import FormSection from './FormSection.vue'
import { FormSection as Exported, formSectionFieldsVariants, formSectionVariants } from './index'

const mounted: VueWrapper[] = []
const mount = ((c: unknown, o: Record<string, unknown> = {}) => {
  const w = vtuMount(c as never, o)
  mounted.push(w)
  return w
}) as unknown as typeof vtuMount
afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount()
})

const fields = (w: VueWrapper) => w.find('[data-slot="form-section-fields"]')

describe('FormSection', () => {
  describe('good path', () => {
    it('is exported from the barrel', () => expect(Exported).toBe(FormSection))

    it('renders a section landmark labelled by its heading and described by its description', () => {
      const w = mount(FormSection, { props: { title: 'Profile', description: 'Public info' }, slots: { default: '<input id="f" />' } })
      expect(w.element.tagName).toBe('SECTION')
      expect(w.attributes('data-slot')).toBe('form-section')
      const title = w.find('[data-slot="form-section-title"]')
      expect(title.element.tagName).toBe('H3')
      expect(w.attributes('aria-labelledby')).toBe(title.attributes('id'))
      const desc = w.find('[data-slot="form-section-description"]')
      expect(w.attributes('aria-describedby')).toBe(desc.attributes('id'))
      expect(desc.text()).toBe('Public info')
      expect(fields(w).find('#f').exists()).toBe(true)
    })

    it('renders title, description and aside slots', () => {
      const w = mount(FormSection, { slots: { title: '<em>T</em>', description: '<b>D</b>', aside: '<button>Edit</button>', default: 'body' } })
      expect(w.find('[data-slot="form-section-title"] em').exists()).toBe(true)
      expect(w.find('[data-slot="form-section-description"] b').exists()).toBe(true)
      expect(w.find('[data-slot="form-section-aside"] button').text()).toBe('Edit')
      expect(w.attributes('aria-labelledby')).toBeTruthy()
    })

    it.each([1, 2, 3, 4, 5, 6] as const)('heading level %s', (level) => {
      const w = mount(FormSection, { props: { title: 'x', level } })
      expect(w.find('[data-slot="form-section-title"]').element.tagName).toBe(`H${level}`)
    })

    it.each([
      [1, []],
      [2, ['sm:grid-cols-2']],
      [3, ['sm:grid-cols-2', 'lg:grid-cols-3']],
      [4, ['sm:grid-cols-2', 'lg:grid-cols-4']],
    ] as const)('columns=%s', (columns, expected) => {
      const cls = fields(mount(FormSection, { props: { columns } })).classes()
      expect(cls).toContain('grid-cols-1')
      for (const e of expected) expect(cls).toContain(e)
      if (columns === 1) expect(cls.some((c) => c.startsWith('sm:'))).toBe(false)
    })

    it('split variant places header beside fields from lg', () => {
      const w = mount(FormSection, { props: { title: 'x', variant: 'split' } })
      expect(w.attributes('data-variant')).toBe('split')
      expect(w.classes()).toContain('lg:grid-cols-3')
      expect(fields(w).classes()).toContain('lg:col-span-2')
    })

    it('divider adds a bottom border', () => {
      expect(mount(FormSection, { props: { divider: true } }).classes()).toEqual(expect.arrayContaining(['border-b', 'pb-8']))
      expect(mount(FormSection).classes()).not.toContain('border-b')
    })
  })

  describe('customisation', () => {
    it('merges class last and falls attrs through to the section', () => {
      const w = mount(FormSection, { props: { class: 'gap-2 custom', divider: true }, attrs: { id: 'sec', 'aria-label': 'Named', 'data-testid': 'x' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['gap-2', 'custom']))
      expect(w.classes()).not.toContain('gap-6')
      expect(w.attributes('id')).toBe('sec')
      expect(w.attributes('aria-label')).toBe('Named')
      expect(w.attributes('data-testid')).toBe('x')
    })

    it('exposes variants for reuse', () => {
      expect(formSectionVariants()).toContain('gap-6')
      expect(formSectionVariants({ variant: 'split', divider: true })).toContain('border-b')
      expect(formSectionFieldsVariants({ columns: 3 })).toContain('lg:grid-cols-3')
    })

    it('uses only tokens (no hard-coded colours)', () => {
      const w = mount(FormSection, { props: { title: 't', description: 'd', divider: true } })
      expect(w.html()).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|oklch\(/i)
    })
  })

  describe('bad path', () => {
    it.each([0, 7, -1, NaN, 2.5, '9' as never])('invalid level %s falls back to h3', (level) => {
      const w = mount(FormSection, { props: { title: 'x', level: level as never } })
      expect(w.find('[data-slot="form-section-title"]').element.tagName).toBe('H3')
    })

    it.each([0, 5, -2, NaN, 'x' as never])('invalid columns %s falls back to 1', (columns) => {
      const cls = fields(mount(FormSection, { props: { columns: columns as never } })).classes()
      expect(cls.some((c) => c.startsWith('sm:') || c.startsWith('lg:'))).toBe(false)
    })

    it('unknown variant falls back to stacked', () => {
      const w = mount(FormSection, { props: { variant: 'wat' as never } })
      expect(w.attributes('data-variant')).toBe('stacked')
    })

    it('no title: no aria-labelledby, no heading; no description: no aria-describedby', () => {
      const w = mount(FormSection, { slots: { default: 'x' } })
      expect(w.attributes('aria-labelledby')).toBeUndefined()
      expect(w.attributes('aria-describedby')).toBeUndefined()
      expect(w.find('[data-slot="form-section-header"]').exists()).toBe(false)
      expect(w.find('[data-slot="form-section-title"]').exists()).toBe(false)
    })

    it('aside alone still renders a header without heading', () => {
      const w = mount(FormSection, { slots: { aside: 'A' } })
      expect(w.find('[data-slot="form-section-header"]').exists()).toBe(true)
      expect(w.find('[data-slot="form-section-title"]').exists()).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('empty default slot renders an empty fields grid', () => {
      expect(fields(mount(FormSection, { props: { title: 'x' } })).text()).toBe('')
    })

    it('renders many fields, unicode and very long text', () => {
      const w = mount(FormSection, {
        props: { title: `عنوان 🚀 ${'x'.repeat(5000)}`, columns: 4 },
        slots: { default: () => Array.from({ length: 500 }, (_, i) => h('div', { key: i }, `f${i}`)) },
      })
      expect(fields(w).element.children).toHaveLength(500)
      expect(w.find('[data-slot="form-section-title"]').text()).toContain('🚀')
    })

    it('each instance gets unique ids', () => {
      const w = mount({ render: () => [h(FormSection, { title: 'a' }), h(FormSection, { title: 'b' })] })
      const [a, b] = w.findAll('section')
      expect(a.attributes('aria-labelledby')).not.toBe(b.attributes('aria-labelledby'))
    })
  })
})

describe('FormSection fields grid size', () => {
  it.each([
    { size: 'sm', gap: ['gap-x-4', 'gap-y-3'], dropped: ['gap-x-6', 'gap-y-4'] },
    { size: 'lg', gap: ['gap-x-8', 'gap-y-6'], dropped: ['gap-x-6', 'gap-y-4'] },
    { size: 'md', gap: ['gap-x-6', 'gap-y-4'], dropped: [] },
  ] as const)('size $size leaves exactly one gap per axis on the fields grid', ({ size, gap, dropped }) => {
    const w = vtuMount(FormSection, { props: { title: 'Profile', size }, slots: { default: '<input aria-label="x" />' } })
    const cls = w.find('[data-slot="form-section-fields"]').classes()
    for (const c of gap) expect(cls).toContain(c)
    for (const c of dropped) expect(cls).not.toContain(c)
    w.unmount()
  })
})
