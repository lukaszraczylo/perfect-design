import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { DescriptionItem, DescriptionList, DetailField, descriptionDetailsVariants, descriptionGridColumns, descriptionItemVariants, descriptionListVariants } from './index'

let written: string[] = []
beforeEach(() => {
  written = []
  // jsdom has no Clipboard API/permissions, so @vueuse's legacy path (textarea + execCommand) is exercised.
  ;(document as unknown as { execCommand: unknown }).execCommand = vi.fn(() => {
    written.push((document.querySelector('textarea') as HTMLTextAreaElement).value)
    return true
  })
})
afterEach(() => {
  document.body.innerHTML = ""
  delete (document as unknown as { execCommand?: unknown }).execCommand
  vi.useRealTimers()
})

const list = (props: Record<string, unknown> = {}, body = '<DescriptionItem term="Region">eu-west-1</DescriptionItem>') =>
  mount({ components: { DescriptionList, DescriptionItem }, props: ['p'], template: `<DescriptionList v-bind="p">${body}</DescriptionList>` }, { props: { p: props } })

describe('DescriptionList', () => {
  describe('good path', () => {
    it('renders dl > div > dt + dd with slots', () => {
      const w = list()
      expect(w.element.tagName).toBe('DL')
      expect(w.attributes('data-slot')).toBe('description-list')
      expect(w.find('[data-slot="description-item"]').element.tagName).toBe('DIV')
      expect(w.find('dt').text()).toBe('Region')
      expect(w.find('dd').text()).toBe('eu-west-1')
    })

    it('stacked is default; horizontal and divided are reflected', () => {
      expect(list().attributes('data-orientation')).toBe('stacked')
      expect(list().attributes('data-divided')).toBe('false')
      const w = list({ orientation: 'horizontal', divided: true })
      expect(w.attributes('data-orientation')).toBe('horizontal')
      expect(w.attributes('data-divided')).toBe('true')
      expect(w.classes()).toContain('divide-y')
    })

    it('supports a rich term slot', () => {
      const w = mount({ components: { DescriptionItem }, template: `<DescriptionItem><template #term><b>Rich</b></template>v</DescriptionItem>` })
      expect(w.find('dt b').text()).toBe('Rich')
    })

    it('copyable shows a copy button that copies the rendered text and emits copy', async () => {
      const w = mount(DescriptionItem, { props: { term: 'ID', copyable: true }, slots: { default: ' abc-123 ' } })
      const btn = w.find('[data-slot="copy-button"]')
      // the name says what is copied and stays constant; the result goes to a sibling role=status
      expect(btn.attributes('aria-label')).toBe('Copy ID')
      await btn.trigger('click')
      await flushPromises()
      expect(written).toEqual(['abc-123'])
      expect(w.emitted('copy')?.[0]).toEqual(['abc-123'])
      expect(w.find('[data-slot="copy-button"]').attributes('aria-label')).toBe('Copy ID')
      expect(w.find('[data-slot="copy-button-status"]').text()).toBe('Copied')
      expect(w.find('[data-slot="copy-button-status"]').attributes('role')).toBe('status')
      expect(w.find('[data-slot="copy-button"] [role="status"]').exists()).toBe(false)
    })

    it('copyText overrides the rendered text', async () => {
      const w = mount(DescriptionItem, { props: { term: 'Key', copyable: true, copyText: 'secret' }, slots: { default: '••••' } })
      await w.find('button').trigger('click')
      await flushPromises()
      expect(written).toEqual(['secret'])
    })

    it('copied state resets after the timeout', async () => {
      vi.useFakeTimers()
      const w = mount(DescriptionItem, { props: { term: 'ID', copyable: true }, slots: { default: 'x' } })
      await w.find('button').trigger('click')
      await flushPromises()
      expect(w.find('[data-slot="copy-button-status"]').text()).toBe('Copied')
      vi.advanceTimersByTime(2000)
      await flushPromises()
      expect(w.find('[data-slot="copy-button-status"]').text()).toBe('')
      expect(w.find('button').attributes('aria-label')).toBe('Copy ID')
    })
  })

  describe('variants', () => {
    const item = (w: ReturnType<typeof list>) => w.find('[data-slot="description-item"]')
    const two = '<DescriptionItem term="A">1</DescriptionItem><DescriptionItem term="B">2</DescriptionItem>'

    it('stacked is the default and keeps the original output', () => {
      const w = list()
      expect(w.attributes('data-variant')).toBe('stacked')
      expect(w.classes()).toEqual(['group/dl', 'flex', 'flex-col', 'text-sm', 'gap-3'])
      expect(item(w).classes()).not.toContain('flex')
      expect(item(w).classes()).toContain('grid')
      expect(w.find('dd').classes()).toEqual(['flex', 'min-w-0', 'items-start', 'gap-1.5', 'break-words', 'font-medium', 'text-foreground'])
    })

    it('inline puts term left and value right on one row', () => {
      const w = list({ variant: 'inline' })
      expect(w.attributes('data-variant')).toBe('inline')
      expect(item(w).classes()).toEqual(expect.arrayContaining(['flex', 'justify-between', 'items-baseline']))
      expect(item(w).classes()).not.toContain('grid')
      expect(w.find('dd').classes()).toEqual(expect.arrayContaining(['justify-end', 'text-end']))
    })

    it('inline composes with divided', () => {
      const w = list({ variant: 'inline', divided: true })
      expect(w.classes()).toContain('divide-y')
      expect(w.classes()).not.toContain('gap-3')
    })

    it('grid lays items out in responsive columns (default 3) and ignores divided', () => {
      const w = list({ variant: 'grid', divided: true }, two)
      expect(w.classes()).toEqual(expect.arrayContaining(['grid', 'sm:grid-cols-2', 'lg:grid-cols-3', 'gap-x-6']))
      expect(w.classes()).not.toContain('flex')
      expect(w.classes()).not.toContain('divide-y')
      expect(w.findAll('[data-slot="description-item"]')).toHaveLength(2)
      expect(item(w).classes()).toContain('grid')
    })

    it.each([
      [1, 'grid-cols-1', ['sm:grid-cols-2']],
      [2, 'sm:grid-cols-2', ['lg:grid-cols-3', 'lg:grid-cols-4']],
      [4, 'lg:grid-cols-4', ['lg:grid-cols-3']],
    ])('grid columns=%s', (columns, has, hasNot) => {
      const w = list({ variant: 'grid', columns })
      expect(w.classes()).toContain(has)
      for (const c of hasNot) expect(w.classes()).not.toContain(c)
    })

    it('invalid columns fall back to 3', () => {
      expect(list({ variant: 'grid', columns: 9 }).classes()).toContain('lg:grid-cols-3')
    })

    it('columns is ignored outside grid', () => {
      expect(list({ columns: 4 }).classes()).not.toContain('lg:grid-cols-4')
    })

    it('striped frames the list and tints alternate items', () => {
      const w = list({ variant: 'striped' }, two)
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-md', 'border', 'overflow-hidden', 'gap-0']))
      expect(w.classes()).not.toContain('gap-3')
      expect(item(w).classes()).toEqual(expect.arrayContaining(['odd:bg-muted/50', 'px-3', 'py-2']))
    })

    it('striped works with horizontal orientation', () => {
      const w = list({ variant: 'striped', orientation: 'horizontal' })
      expect(w.attributes('data-orientation')).toBe('horizontal')
      expect(item(w).classes().join(' ')).toContain('group-data-[orientation=horizontal]/dl:sm:grid-cols')
    })

    it('unknown variant falls back to stacked without throwing', () => {
      const w = list({ variant: 'masonry' })
      expect(w.attributes('data-variant')).toBe('stacked')
      expect(w.classes()).toContain('flex-col')
      expect(item(w).classes()).not.toContain('odd:bg-muted/50')
    })

    it('items outside a list behave as stacked', () => {
      const w = mount(DescriptionItem, { props: { term: 'x' } })
      expect(w.classes()).toContain('grid')
      expect(w.classes()).not.toContain('justify-between')
    })

    it('empty list renders for every variant', () => {
      for (const variant of ['stacked', 'inline', 'grid', 'striped']) {
        const w = mount(DescriptionList, { props: { variant: variant as never } })
        expect(w.element.tagName).toBe('DL')
        expect(w.text()).toBe('')
      }
    })

    it('variant reacts to prop changes', async () => {
      const w = list({ variant: 'stacked' })
      await w.setProps({ p: { variant: 'inline' } })
      expect(item(w).classes()).toContain('justify-between')
    })

    it('class overrides variant classes (list and item)', () => {
      expect(list({ variant: 'striped', class: 'rounded-none gap-2' }).classes()).toEqual(expect.arrayContaining(['rounded-none', 'gap-2']))
      expect(list({ variant: 'striped', class: 'rounded-none' }).classes()).not.toContain('rounded-md')
      const w = mount({ components: { DescriptionList, DescriptionItem }, template: '<DescriptionList variant="striped"><DescriptionItem class="px-8" term="a">b</DescriptionItem></DescriptionList>' })
      expect(item(w as never).classes()).toContain('px-8')
      expect(item(w as never).classes()).not.toContain('px-3')
    })

    it('exports cva helpers for reuse', () => {
      expect(descriptionListVariants({ variant: 'grid' })).toContain('grid')
      expect(descriptionItemVariants({ variant: 'inline' })).toContain('justify-between')
      expect(descriptionDetailsVariants({ variant: 'inline' })).toContain('text-end')
      expect(descriptionGridColumns[4]).toContain('lg:grid-cols-4')
    })
  })

  describe('customisation', () => {
    it('merges classes on list, item and field', () => {
      expect(list({ class: 'gap-8 custom' }).classes()).toContain('gap-8')
      expect(mount(DescriptionItem, { props: { class: 'py-9' } }).classes()).toContain('py-9')
      expect(mount(DetailField, { props: { label: 'L', class: 'text-lg' } }).classes()).toContain('text-lg')
    })
    it('passes attributes through', () => {
      expect(list({ 'aria-label': 'Details', id: 'x' }).attributes('aria-label')).toBe('Details')
      expect(mount(DescriptionItem, { attrs: { 'data-test': 'i' } }).attributes('data-test')).toBe('i')
    })
  })

  describe('bad path / edge cases', () => {
    it('copy failure is swallowed and does not flip to Copied', async () => {
      ;(document as unknown as { execCommand: unknown }).execCommand = vi.fn(() => { throw new Error('nope') })
      const w = mount(DescriptionItem, { props: { term: 'ID', copyable: true }, slots: { default: 'x' } })
      await w.find('button').trigger('click')
      await flushPromises()
      expect(w.emitted('copy')).toBeUndefined()
      expect(w.find('button').attributes('aria-label')).toBe('Copy ID')
      expect(w.find('[data-slot="copy-button-status"]').text()).toBe('Copy failed')
      expect(w.find('button').attributes('data-failed')).toBeDefined()
    })
    it('copy button without a term falls back to a generic name', () => {
      const w = mount(DescriptionItem, { props: { copyable: true }, slots: { default: 'x' } })
      expect(w.find('button').attributes('aria-label')).toBe('Copy value')
    })
    it('not copyable by default', () => {
      expect(mount(DescriptionItem, { props: { term: 'x' } }).find('button').exists()).toBe(false)
    })
    it('empty item renders', () => {
      const w = mount(DescriptionItem)
      expect(w.find('dt').text()).toBe('')
      expect(w.find('dd').text()).toBe('')
    })
    it('copyable with an empty definition copies an empty string', async () => {
      const w = mount(DescriptionItem, { props: { copyable: true } })
      await w.find('button').trigger('click')
      await flushPromises()
      expect(w.emitted('copy')?.[0]).toEqual([''])
    })
    it('long unicode / RTL text', () => {
      const w = mount(DescriptionItem, { props: { term: 'مفتاح' }, slots: { default: 'ж'.repeat(3000) } })
      expect(w.find('dt').text()).toBe('مفتاح')
      expect(w.find('dd').text()).toHaveLength(3000)
      expect(w.find('dd').classes()).toContain('break-words')
    })
  })

  describe('DetailField', () => {
    it('renders label and value', () => {
      const w = mount(DetailField, { props: { label: 'Owner', value: 'Ana' } })
      expect(w.element.tagName).toBe('DL')
      expect(w.attributes('data-slot')).toBe('detail-field')
      expect(w.find('dt').text()).toBe('Owner')
      expect(w.find('dd').text()).toBe('Ana')
    })
    it('renders numbers including 0, and slot content over value', () => {
      expect(mount(DetailField, { props: { label: 'n', value: 0 } }).find('dd').text()).toBe('0')
      expect(mount(DetailField, { props: { label: 'n', value: 'a' }, slots: { default: 'slot' } }).find('dd').text()).toBe('slot')
    })
    it('empty / null / undefined values show the placeholder and hide copy', () => {
      for (const value of [undefined, null, '']) {
        const w = mount(DetailField, { props: { label: 'x', value, copyable: true } })
        expect(w.find('dd').text()).toBe('–')
        expect(w.find('button').exists()).toBe(false)
      }
      expect(mount(DetailField, { props: { label: 'x', emptyText: 'n/a' } }).find('dd').text()).toBe('n/a')
    })
    it('copyable copies the value', async () => {
      const w = mount(DetailField, { props: { label: 'x', value: 42, copyable: true } })
      await w.find('button').trigger('click')
      await flushPromises()
      expect(written).toEqual(['42'])
      expect(w.emitted('copy')?.[0]).toEqual(['42'])
    })
  })
})
