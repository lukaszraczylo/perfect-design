import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FaqList from './FaqList.vue'
import { FAQ_LIST_VARIANTS, faqListVariants, resolveFaqListVariant } from './variants'

const items = [
  { q: 'What?', a: 'This.' },
  { q: 'Why?', a: 'Because.' },
  { q: 'How?', a: 'Like so.' },
]

/** jsdom does not toggle <details> on summary click; emulate the browser: set open then fire `toggle`. */
async function setOpen(w: ReturnType<typeof mount>, i: number, open: boolean) {
  const el = w.findAll('details')[i].element as HTMLDetailsElement
  el.open = open
  el.dispatchEvent(new Event('toggle'))
  await nextTick()
}
const openState = (w: ReturnType<typeof mount>) => w.findAll('details').map((d) => (d.element as HTMLDetailsElement).open)

describe('FaqList heading level', () => {
  const cat = [{ q: 'A?', a: 'a', category: 'Billing' }, { q: 'B?', a: 'b', category: 'Setup' }]
  it('defaults category titles to h3 and honours headingLevel 2 to 6', () => {
    expect(mount(FaqList, { props: { items: cat, variant: 'with-categories' } }).find('[data-slot="faq-category-title"]').element.tagName).toBe('H3')
    expect(mount(FaqList, { props: { items: cat, variant: 'with-categories', headingLevel: 2 } }).find('[data-slot="faq-category-title"]').element.tagName).toBe('H2')
  })
  it('falls back to h3 for invalid levels', () => {
    for (const v of [1, 7, 2.5, 'x', null]) expect(mount(FaqList, { props: { items: cat, variant: 'with-categories', headingLevel: v as never } }).find('[data-slot="faq-category-title"]').element.tagName).toBe('H3')
  })
})

describe('FaqList', () => {
  describe('good path', () => {
    it('renders a <details> per item with question and answer', () => {
      const w = mount(FaqList, { props: { items } })
      expect(w.attributes('data-slot')).toBe('faq-list')
      expect(w.findAll('details')).toHaveLength(3)
      expect(w.findAll('summary')[1].text()).toBe('Why?')
      expect(w.findAll('[data-slot="faq-answer"]')[1].text()).toBe('Because.')
      expect(openState(w)).toEqual([false, false, false])
    })
    it('defaultOpen opens the given items', () => {
      expect(openState(mount(FaqList, { props: { items, defaultOpen: [0, 2] } }))).toEqual([true, false, true])
    })
    it('multiple answers can stay open and emits toggle', async () => {
      const w = mount(FaqList, { props: { items } })
      await setOpen(w, 0, true)
      await setOpen(w, 1, true)
      expect(openState(w)).toEqual([true, true, false])
      expect(w.emitted('toggle')).toEqual([[{ index: 0, open: true }], [{ index: 1, open: true }]])
      await setOpen(w, 0, false)
      expect(openState(w)).toEqual([false, true, false])
      expect(w.emitted('toggle')![2]).toEqual([{ index: 0, open: false }])
    })
    it('single mode closes the others', async () => {
      const w = mount(FaqList, { props: { items, single: true, defaultOpen: [0] } })
      expect(openState(w)).toEqual([true, false, false])
      await setOpen(w, 2, true)
      expect(openState(w)).toEqual([false, false, true])
    })
    it('answer slot is scoped', () => {
      const w = mount(FaqList, { props: { items }, slots: { answer: '<template #answer="{ item, index }"><b>{{ index }}:{{ item.q }}</b></template>' } })
      expect(w.findAll('b')[1].text()).toBe('1:Why?')
    })
    it('summary exposes a decorative chevron', () => {
      expect(mount(FaqList, { props: { items } }).find('summary svg').attributes('aria-hidden')).toBe('true')
    })
  })
  describe('customisation', () => {
    it('merges class last and passes attrs', () => {
      const w = mount(FaqList, { props: { items, class: 'border-0 custom' }, attrs: { id: 'faq' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('border-y')
      expect(w.attributes('id')).toBe('faq')
    })
  })
  describe('bad path', () => {
    it('empty items renders no details', () => {
      expect(mount(FaqList, { props: { items: [] } }).findAll('details')).toHaveLength(0)
    })
    it('ignores invalid defaultOpen indexes and duplicates', () => {
      expect(openState(mount(FaqList, { props: { items, defaultOpen: [-1, 1, 1, 9, 1.5] } }))).toEqual([false, true, false])
    })
    it('single mode with many defaultOpen keeps only the first', () => {
      expect(openState(mount(FaqList, { props: { items, single: true, defaultOpen: [1, 2] } }))).toEqual([false, true, false])
    })
    it('toggle events that do not change state are ignored', async () => {
      const w = mount(FaqList, { props: { items } })
      await setOpen(w, 0, false)
      expect(w.emitted('toggle')).toBeUndefined()
    })
  })
  describe('edge cases', () => {
    it('enabling single later collapses extra open items', async () => {
      const w = mount(FaqList, { props: { items, defaultOpen: [0, 1, 2] } })
      await w.setProps({ single: true })
      expect(openState(w)).toEqual([true, false, false])
    })
    it('removing items drops stale open indexes', async () => {
      const w = mount(FaqList, { props: { items, defaultOpen: [2] } })
      await w.setProps({ items: items.slice(0, 1) })
      await w.setProps({ items })
      expect(openState(w)).toEqual([false, false, false])
    })
    it('very long/unicode text, 1 and 100 items, duplicate questions', () => {
      const long = mount(FaqList, { props: { items: [{ q: '¿'.repeat(3000), a: '答'.repeat(3000) }] } })
      expect(long.find('summary').text()).toHaveLength(3000)
      const many = Array.from({ length: 100 }, () => ({ q: 'same', a: 'same' }))
      expect(mount(FaqList, { props: { items: many } }).findAll('details')).toHaveLength(100)
    })
    it('rapid toggles settle on the last state', async () => {
      const w = mount(FaqList, { props: { items } })
      for (let n = 0; n < 20; n++) await setOpen(w, 0, n % 2 === 0)
      expect(openState(w)[0]).toBe(false)
    })
  })

  describe('variants', () => {
    it('defaults to bordered', () => {
      const w = mount(FaqList, { props: { items } })
      expect(w.attributes('data-variant')).toBe('bordered')
      expect(w.classes()).toEqual(expect.arrayContaining(['divide-y', 'border-y']))
    })
    it.each([
      ['bordered', 'divide-y', 'py-4'],
      ['separated', 'gap-3', 'rounded-lg'],
      ['plain', 'gap-2', 'py-3'],
      ['two-column', 'md:grid-cols-2', 'border-b'],
      ['numbered', 'divide-y', 'py-4'],
    ] as const)('variant %s root and item classes; native details kept', (variant, rootCls, itemCls) => {
      const w = mount(FaqList, { props: { items, variant } })
      expect(w.attributes('data-variant')).toBe(variant)
      expect(w.classes()).toContain(rootCls)
      expect(w.find('details').classes()).toContain(itemCls)
      expect(w.findAll('details')).toHaveLength(3)
      expect(w.findAll('summary')).toHaveLength(3)
    })
    it('separated: every item is a card', () => {
      const w = mount(FaqList, { props: { items, variant: 'separated' } })
      expect(w.findAll('details').every((d) => d.classes().includes('bg-card'))).toBe(true)
      expect(w.classes()).not.toContain('divide-y')
    })
    it('numbered: shows a decorative number per question (no zero padding)', () => {
      const many = Array.from({ length: 12 }, (_, i) => ({ q: `Q${i}`, a: 'A' }))
      const w = mount(FaqList, { props: { items: many, variant: 'numbered' } })
      const nums = w.findAll('[data-slot="faq-number"]')
      expect(nums).toHaveLength(12)
      expect(nums[0].text()).toBe('1.')
      expect(nums[11].text()).toBe('12.')
      expect(nums[0].attributes('aria-hidden')).toBe('true')
      expect(w.findAll('[data-slot="faq-answer"]')[0].classes()).toContain('ps-10')
    })
    it('other variants have no numbers', () => {
      expect(mount(FaqList, { props: { items } }).find('[data-slot="faq-number"]').exists()).toBe(false)
    })
    it('two-column variant still toggles and emits', async () => {
      const w = mount(FaqList, { props: { items, variant: 'two-column' } })
      await setOpen(w, 1, true)
      expect(w.emitted('toggle')).toEqual([[{ index: 1, open: true }]])
    })
    it('unknown variant falls back to bordered', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(FaqList, { props: { items, variant: 'fancy' } })
      expect(w.attributes('data-variant')).toBe('bordered')
      expect(w.classes()).toContain('divide-y')
    })
    it('exports helpers', () => {
      expect(FAQ_LIST_VARIANTS).toHaveLength(6)
      expect(resolveFaqListVariant('plain')).toBe('plain')
      expect(resolveFaqListVariant(null)).toBe('bordered')
      expect(faqListVariants({ variant: 'separated' })).toContain('gap-3')
    })
    it('class override wins and attrs pass through in every variant', () => {
      for (const variant of FAQ_LIST_VARIANTS) {
        const w = mount(FaqList, { props: { items, variant, class: 'gap-0 custom' }, attrs: { id: 'f' } })
        expect(w.classes()).toContain('custom')
        expect(w.classes()).not.toContain('gap-3')
        expect(w.classes()).not.toContain('gap-10')
        expect(w.attributes('id')).toBe('f')
      }
    })
    it('answer slot works in every variant', () => {
      for (const variant of FAQ_LIST_VARIANTS) {
        const w = mount(FaqList, { props: { items, variant }, slots: { answer: '<template #answer="{ index }"><i>idx{{ index }}</i></template>' } })
        expect(w.findAll('i').map((i) => i.text())).toEqual(['idx0', 'idx1', 'idx2'])
      }
    })
    it('single and defaultOpen work in every variant', async () => {
      for (const variant of FAQ_LIST_VARIANTS) {
        const w = mount(FaqList, { props: { items, variant, single: true, defaultOpen: [1] } })
        expect(openState(w)).toEqual([false, true, false])
        await setOpen(w, 2, true)
        expect(openState(w)).toEqual([false, false, true])
      }
    })
  })

  describe('with-categories', () => {
    const cat = [
      { q: 'Price?', a: 'Cheap.', category: 'Billing' },
      { q: 'Install?', a: 'npm.', category: 'Setup' },
      { q: 'Refund?', a: 'Yes.', category: 'Billing' },
      { q: 'Misc?', a: 'Sure.' },
    ]
    it('headings mode groups items under category headings in order of first appearance', () => {
      const w = mount(FaqList, { props: { items: cat, variant: 'with-categories' } })
      expect(w.attributes('data-category-mode')).toBe('headings')
      expect(w.findAll('[data-slot="faq-category-title"]').map((h) => h.text())).toEqual(['Billing', 'Setup', 'Other'])
      // regression: a labelled group (not a <section> region landmark per category)
      const group = w.findAll('[data-slot="faq-category"]')[0]
      expect(group.element.tagName).toBe('DIV')
      expect(group.attributes('role')).toBe('group')
      expect(group.attributes('aria-label')).toBeUndefined()
      expect(group.attributes('aria-labelledby')).toBe(group.find('h3').attributes('id'))
      expect(w.findAll('[data-slot="faq-category"]').map((g) => g.attributes('aria-labelledby'))).toEqual(
        [...new Set(w.findAll('[data-slot="faq-category"]').map((g) => g.attributes('aria-labelledby')))],
      )
      const first = w.findAll('[data-slot="faq-category"]')[0]
      expect(first.findAll('summary').map((s) => s.text())).toEqual(['Price?', 'Refund?'])
      expect(first.find('h3').exists()).toBe(true)
    })
    it('tabs mode names the tablist and customises it with categoriesLabel', () => {
      const w = mount(FaqList, { props: { items: cat, variant: 'with-categories', categoryMode: 'tabs' }, attachTo: document.body })
      expect(w.find('[role="tablist"]').attributes('aria-label')).toBe('Question categories')
      const x = mount(FaqList, { props: { items: cat, variant: 'with-categories', categoryMode: 'tabs', categoriesLabel: 'Kategorien' } })
      expect(x.find('[role="tablist"]').attributes('aria-label')).toBe('Kategorien')
      w.unmount()
    })
    it('questions meet the coarse-pointer target height and use logical alignment', () => {
      const w = mount(FaqList, { props: { items } })
      const q = w.find('summary')
      expect(q.classes()).toContain('pointer-coarse:min-h-11')
      expect(q.classes()).toContain('text-start')
      expect(q.classes()).not.toContain('text-left')
    })
    it('uncategorizedLabel customises the fallback group', () => {
      const w = mount(FaqList, { props: { items: cat, variant: 'with-categories', uncategorizedLabel: 'General' } })
      expect(w.findAll('h3').map((h) => h.text())).toContain('General')
    })
    it('open state and toggle events use the original item index across groups', async () => {
      const w = mount(FaqList, { props: { items: cat, variant: 'with-categories', defaultOpen: [2] } })
      const summaries = w.findAll('summary').map((s) => s.text())
      expect(summaries).toEqual(['Price?', 'Refund?', 'Install?', 'Misc?'])
      expect(openState(w)).toEqual([false, true, false, false])
      await setOpen(w, 2, true) // DOM position 2 = "Install?" = item index 1
      expect(w.emitted('toggle')).toEqual([[{ index: 1, open: true }]])
    })
    it('single mode works across categories', async () => {
      const w = mount(FaqList, { props: { items: cat, variant: 'with-categories', single: true, defaultOpen: [0] } })
      await setOpen(w, 2, true)
      expect(openState(w)).toEqual([false, false, true, false])
    })
    it('no categories at all renders a flat list', () => {
      const w = mount(FaqList, { props: { items, variant: 'with-categories' } })
      expect(w.find('[data-slot="faq-category"]').exists()).toBe(false)
      expect(w.attributes('data-category-mode')).toBeUndefined()
      expect(w.findAll('details')).toHaveLength(3)
    })
    it('blank or non-string categories count as uncategorised', () => {
      const w = mount(FaqList, { props: { items: [{ q: 'a', a: 'b', category: '   ' }, { q: 'c', a: 'd', category: 5 as never }], variant: 'with-categories' } })
      expect(w.find('[data-slot="faq-category"]').exists()).toBe(false)
    })
    it('unknown categoryMode falls back to headings', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(FaqList, { props: { items: cat, variant: 'with-categories', categoryMode: 'accordion' } }).attributes('data-category-mode')).toBe('headings')
    })
    it('category is ignored by other variants', () => {
      const w = mount(FaqList, { props: { items: cat, variant: 'bordered' } })
      expect(w.find('[data-slot="faq-category"]').exists()).toBe(false)
      expect(w.findAll('details')).toHaveLength(4)
    })
    it('duplicate category names with different case/whitespace are trimmed but case-sensitive', () => {
      const w = mount(FaqList, { props: { items: [{ q: '1', a: 'a', category: ' A ' }, { q: '2', a: 'a', category: 'A' }, { q: '3', a: 'a', category: 'a' }], variant: 'with-categories' } })
      expect(w.findAll('h3').map((h) => h.text())).toEqual(['A', 'a'])
    })
    it('answer slot receives the original index', () => {
      const w = mount(FaqList, {
        props: { items: cat, variant: 'with-categories' },
        slots: { answer: '<template #answer="{ item, index }"><b>{{ index }}:{{ item.q }}</b></template>' },
      })
      expect(w.findAll('b').map((b) => b.text())).toEqual(['0:Price?', '2:Refund?', '1:Install?', '3:Misc?'])
    })

    describe('tabs mode', () => {
      const tabsProps = { items: cat, variant: 'with-categories' as const, categoryMode: 'tabs' as const }
      const mountTabs = (extra: object = {}) => mount(FaqList, { props: { ...tabsProps, ...extra }, attachTo: document.body })
      const tabs = (w: ReturnType<typeof mount>) => w.findAll('[role="tab"]')
      it('renders a tablist with one tab per category and only the active panel', () => {
        const w = mountTabs()
        expect(w.attributes('data-category-mode')).toBe('tabs')
        expect(w.find('[role="tablist"]').exists()).toBe(true)
        expect(tabs(w).map((t) => t.text())).toEqual(['Billing', 'Setup', 'Other'])
        expect(tabs(w)[0].attributes('aria-selected')).toBe('true')
        expect(w.findAll('[role="tabpanel"]:not([hidden])')).toHaveLength(1)
        expect(w.findAll('summary').map((s) => s.text())).toEqual(['Price?', 'Refund?'])
        w.unmount()
      })
      it('switching tabs shows that category and keeps open state by item index', async () => {
        const w = mountTabs({ defaultOpen: [1] })
        await tabs(w)[1].trigger('mousedown', { button: 0, ctrlKey: false })
        await nextTick()
        expect(tabs(w)[1].attributes('aria-selected')).toBe('true')
        expect(w.findAll('summary').map((s) => s.text())).toEqual(['Install?'])
        expect(openState(w)).toEqual([true])
        w.unmount()
      })
      it('toggles from the active panel report the original index', async () => {
        const w = mountTabs()
        await tabs(w)[1].trigger('mousedown', { button: 0, ctrlKey: false })
        await nextTick()
        await setOpen(w, 0, true)
        expect(w.emitted('toggle')).toEqual([[{ index: 1, open: true }]])
        w.unmount()
      })
      it('defaultCategory selects a tab; unknown value selects the first', () => {
        const a = mountTabs({ defaultCategory: 'Setup' })
        expect(tabs(a)[1].attributes('aria-selected')).toBe('true')
        a.unmount()
        const b = mountTabs({ defaultCategory: 'Nope' })
        expect(tabs(b)[0].attributes('aria-selected')).toBe('true')
        b.unmount()
      })
      it('falls back to the first category if the selected one disappears', async () => {
        const w = mountTabs({ defaultCategory: 'Setup' })
        await w.setProps({ items: cat.filter((i) => i.category !== 'Setup') })
        expect(tabs(w)[0].attributes('aria-selected')).toBe('true')
        w.unmount()
      })
      it('class and attrs on the root', () => {
        const w = mountTabs({ class: 'custom' })
        expect(w.classes()).toContain('custom')
        w.unmount()
      })
    })
  })

  describe('variant edge cases', () => {
    it('empty items render nothing in every variant', () => {
      for (const variant of FAQ_LIST_VARIANTS) {
        expect(mount(FaqList, { props: { items: [], variant } }).findAll('details')).toHaveLength(0)
        expect(mount(FaqList, { props: { items: [], variant, categoryMode: 'tabs' } }).findAll('details')).toHaveLength(0)
      }
    })
    it('100 numbered items and 1 item per variant', () => {
      const many = Array.from({ length: 100 }, (_, i) => ({ q: `q${i}`, a: 'a', category: `c${i % 4}` }))
      expect(mount(FaqList, { props: { items: many, variant: 'numbered' } }).findAll('[data-slot="faq-number"]')).toHaveLength(100)
      expect(mount(FaqList, { props: { items: many, variant: 'with-categories' } }).findAll('details')).toHaveLength(100)
      for (const variant of FAQ_LIST_VARIANTS) expect(mount(FaqList, { props: { items: [items[0]], variant } }).findAll('details')).toHaveLength(1)
    })
    it('very long and unicode category/question text', () => {
      const w = mount(FaqList, { props: { items: [{ q: '数'.repeat(3000), a: 'a', category: '🙂'.repeat(200) }], variant: 'with-categories' } })
      expect(w.find('h3').text()).toHaveLength(400)
      expect(w.find('summary').text()).toHaveLength(3000)
    })
    it('rapid variant switching and unmount are clean', async () => {
      const w = mount(FaqList, { props: { items: [{ q: 'a', a: 'b', category: 'X' }, ...items] } })
      for (let n = 0; n < 18; n++) await w.setProps({ variant: FAQ_LIST_VARIANTS[n % 6], categoryMode: n % 2 ? 'tabs' : 'headings' })
      expect(w.findAll('details').length).toBeGreaterThan(0)
      w.unmount()
    })
  })
})
