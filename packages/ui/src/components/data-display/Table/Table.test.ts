import doc from './Table.docs'
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmpty,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  tableCellVariants,
  tableHeadVariants,
  tableRowClasses,
  tableRowSelectedTones,
  tableRowStaticClasses,
  tableRowStripedClasses,
  tableRowStripedHoverClasses,
} from './index'

function build(tableProps: Record<string, unknown> = {}) {
  return mount(Table, {
    props: tableProps,
    slots: {
      default: () => [
        h(TableCaption, null, () => 'People'),
        h(TableHeader, null, () => h(TableRow, null, () => [h(TableHead, null, () => 'Name'), h(TableHead, { align: 'right' }, () => 'Age')])),
        h(TableBody, null, () => h(TableRow, null, () => [h(TableCell, null, () => 'Ada'), h(TableCell, { numeric: true }, () => '36')])),
        h(TableFooter, null, () => h(TableRow, null, () => h(TableCell, { colspan: 2 }, () => 'Total'))),
      ],
    },
  })
}

describe('Table', () => {
  describe('good path', () => {
    it('renders container + native table semantics with data-slots', () => {
      const w = build()
      expect(w.attributes('data-slot')).toBe('table-container')
      expect(w.classes()).toContain('overflow-x-auto')
      const table = w.find('table')
      expect(table.attributes('data-slot')).toBe('table')
      expect(table.attributes('data-density')).toBe('default')
      expect(table.attributes('data-sticky')).toBeUndefined()
      for (const slot of ['table-header', 'table-body', 'table-footer', 'table-row', 'table-head', 'table-cell', 'table-caption']) {
        expect(w.find(`[data-slot=${slot}]`).exists(), slot).toBe(true)
      }
      expect(w.find('thead').exists() && w.find('tbody').exists() && w.find('tfoot').exists() && w.find('caption').exists()).toBe(true)
    })

    it('th defaults to scope=col and accepts aria-sort', () => {
      const w = mount(TableHead, { attrs: { 'aria-sort': 'ascending' } })
      expect(w.element.tagName).toBe('TH')
      expect(w.attributes('scope')).toBe('col')
      expect(w.attributes('aria-sort')).toBe('ascending')
      expect(mount(TableHead, { props: { scope: 'row' } }).attributes('scope')).toBe('row')
    })

    it('density compact sets data-density; cells carry group variants', () => {
      const w = build({ density: 'compact' })
      expect(w.find('table').attributes('data-density')).toBe('compact')
      expect(w.find('table').classes()).toContain('group/table')
      expect(w.find('td').classes().join(' ')).toContain('group-data-[density=compact]/table:p-2')
    })

    it('stickyHeader sets data-sticky and head cells have sticky classes', () => {
      const w = build({ stickyHeader: true })
      expect(w.find('table').attributes('data-sticky')).toBeDefined()
      expect(w.find('th').classes().join(' ')).toContain('group-data-[sticky]/table:sticky')
      expect(w.find('th').classes().join(' ')).toContain('group-data-[sticky]/table:bg-background')
    })

    it('row selected -> data-state + class', () => {
      const w = mount(TableRow, { props: { selected: true } })
      expect(w.attributes('data-state')).toBe('selected')
      expect(w.classes().join(' ')).toContain('hover:bg-muted/50')
      expect(mount(TableRow).attributes('data-state')).toBeUndefined()
    })

    it('alignment and numeric on cells and heads', () => {
      expect(mount(TableCell, { props: { align: 'center' } }).classes()).toContain('text-center')
      expect(mount(TableCell).classes()).toContain('text-start')
      const n = mount(TableCell, { props: { numeric: true } })
      expect(n.classes()).toEqual(expect.arrayContaining(['text-end', 'tabular-nums']))
      expect(mount(TableCell, { props: { numeric: true, align: 'left' } }).classes()).toContain('text-start')
      expect(mount(TableHead, { props: { align: 'right' } }).classes()).toContain('text-end')
      expect(tableHeadVariants({ align: 'center' })).toContain('text-center')
      expect(tableCellVariants({ numeric: true })).toContain('tabular-nums')
    })

    it('caption hidden -> sr-only', () => {
      expect(mount(TableCaption, { props: { hidden: true }, slots: { default: 'c' } }).classes()).toContain('sr-only')
      expect(mount(TableCaption).classes()).not.toContain('sr-only')
    })

    it('TableEmpty renders one cell spanning colspan with default text', () => {
      const w = mount(TableEmpty, { props: { colspan: 4 } })
      expect(w.element.tagName).toBe('TR')
      expect(w.findAll('td')).toHaveLength(1)
      expect(w.find('td').attributes('colspan')).toBe('4')
      expect(w.text()).toBe('No results')
      expect(w.find('td').classes()).toContain('text-muted-foreground')
      expect(mount(TableEmpty, { slots: { default: 'Nothing' } }).text()).toBe('Nothing')
    })
  })

  describe('variants', () => {
    const rows = (tableProps: Record<string, unknown> = {}, rowProps: Record<string, unknown> = {}) =>
      mount(Table, {
        props: tableProps,
        slots: {
          default: () => [
            h(TableHeader, null, () => h(TableRow, { 'data-h': '1' }, () => h(TableHead, null, () => 'H'))),
            h(TableBody, null, () => [
              h(TableRow, { ...rowProps }, () => h(TableCell, null, () => '1')),
              h(TableRow, { selected: true }, () => h(TableCell, null, () => '2')),
            ]),
          ],
        },
      })
    const body = (w: ReturnType<typeof rows>) => w.findAll('tbody tr')
    const head = (w: ReturnType<typeof rows>) => w.find('thead tr')

    it('filled bands the column header only; a body row header keeps the row surface', () => {
      const w = mount(Table, {
        props: { variant: 'filled' },
        slots: {
          default: () => [
            h(TableHeader, null, () => h(TableRow, null, () => h(TableHead, null, () => 'Name'))),
            h(TableBody, null, () => h(TableRow, null, () => h(TableHead, { scope: 'row' }, () => 'Item A'))),
          ],
        },
      })
      expect(w.find('thead th').classes()).toContain('bg-muted')
      expect(w.find('tbody th').classes()).not.toContain('bg-muted')
    })
    it('default output is unchanged: same row classes, no extra attrs', () => {
      const w = rows()
      expect(body(w)[0]!.classes().join(' ')).toBe(tableRowClasses)
      const t = w.find('table')
      for (const a of ['data-striped', 'data-bordered', 'data-hoverable']) expect(t.attributes(a)).toBeUndefined()
      expect(w.classes()).toEqual(expect.arrayContaining(['relative', 'w-full', 'overflow-x-auto']))
      expect(t.classes()).toEqual(['group/table', 'w-full', 'caption-bottom', 'border-collapse', 'text-sm'])
    })

    it('striped sets data-striped and rows carry a tbody-scoped stripe (so header rows are never tinted)', () => {
      const w = rows({ striped: true })
      expect(w.find('table').attributes('data-striped')).toBeDefined()
      expect(body(w)[0]!.classes()).toEqual(expect.arrayContaining([tableRowStripedClasses, tableRowStripedHoverClasses]))
      expect(tableRowStripedClasses).toContain('in-[tbody]')
      expect(head(w)!.classes().join(' ')).toContain('in-[tbody]:even:bg-muted/30')
    })

    it('striped with hoverable=false drops the striped hover tint', () => {
      const w = rows({ striped: true, hoverable: false })
      expect(body(w)[0]!.classes()).toContain(tableRowStripedClasses)
      expect(body(w)[0]!.classes()).not.toContain(tableRowStripedHoverClasses)
    })

    it('bordered frames the container and adds column rules on the table', () => {
      const w = rows({ bordered: true })
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-md', 'border', 'border-border']))
      expect(w.find('table').attributes('data-bordered')).toBeDefined()
      expect(w.find('table').classes().join(' ')).toContain('border-s')
    })

    it('compact uses group classes on cells (density variant)', () => {
      const w = rows({ density: 'compact' })
      expect(w.find('table').attributes('data-density')).toBe('compact')
      expect(w.find('th').classes().join(' ')).toContain('group-data-[density=compact]/table:h-8')
    })

    it('hoverable=false removes the hover tint but keeps selected styling', () => {
      const w = rows({ hoverable: false })
      expect(w.find('table').attributes('data-hoverable')).toBe('false')
      const cls = body(w)[0]!.classes().join(' ')
      expect(cls).not.toContain('hover:bg-muted/50')
      expect(cls).toBe(tableRowStaticClasses)
      expect(cls).toContain('data-[state=selected]:bg-muted')
    })

    it('hoverable defaults to true and is explicit-true safe', () => {
      expect(body(rows({ hoverable: true }))[0]!.classes()).toContain('hover:bg-muted/50')
      expect(rows({ hoverable: true }).find('table').attributes('data-hoverable')).toBeUndefined()
    })

    it('selected row exposes data-state without aria-selected', () => {
      const w = rows()
      expect(body(w)[1]!.attributes('data-state')).toBe('selected')
      expect(body(w)[1]!.attributes('aria-selected')).toBeUndefined()
      expect(body(w)[0]!.attributes('data-state')).toBeUndefined()
    })

    it('accent tone on the table styles selected / aria-selected rows with the primary tint', () => {
      const w = rows({ selectedTone: 'accent' })
      const cls = body(w)[1]!.classes().join(' ')
      expect(cls).toContain('data-[state=selected]:bg-primary/10')
      expect(cls).toContain('aria-selected:bg-primary/10')
      expect(cls).not.toContain('shadow-[inset')
      expect(cls).not.toContain('data-[state=selected]:bg-muted')
    })

    it('a row-level selectedTone overrides the table tone', () => {
      const w = rows({ selectedTone: 'accent' }, { selectedTone: 'muted' })
      expect(body(w)[0]!.classes().join(' ')).toContain('data-[state=selected]:bg-muted')
      expect(body(w)[0]!.classes().join(' ')).not.toContain('bg-primary/10')
      const standalone = mount(TableRow, { props: { selectedTone: 'accent', selected: true } })
      expect(standalone.classes().join(' ')).toContain('bg-primary/10')
    })

    it('unknown selectedTone falls back to muted (table and row)', () => {
      const w = rows({ selectedTone: 'neon' as never }, {})
      expect(body(w)[1]!.classes().join(' ')).toContain('data-[state=selected]:bg-muted')
      const r = mount(TableRow, { props: { selectedTone: 'neon' as never } })
      expect(r.classes().join(' ')).toBe(tableRowClasses)
    })

    it('rows outside a Table keep the default look', () => {
      expect(mount(TableRow).classes().join(' ')).toBe(tableRowClasses)
      expect(tableRowSelectedTones.muted).toBe('')
    })

    it('variants combine and survive prop changes', async () => {
      const w = rows({ striped: true, bordered: true, density: 'compact', stickyHeader: true, hoverable: false, selectedTone: 'accent' })
      const t = w.find('table')
      for (const a of ['data-striped', 'data-bordered', 'data-sticky']) expect(t.attributes(a), a).toBeDefined()
      await w.setProps({ striped: false, bordered: false, hoverable: true })
      expect(w.find('table').attributes('data-striped')).toBeUndefined()
      expect(w.classes()).not.toContain('rounded-md')
      expect(body(w)[0]!.classes()).toContain('hover:bg-muted/50')
    })

    it('class overrides still win on rows, table and container with variants on', () => {
      const w = rows({ bordered: true, class: 'border-s-0 text-lg', containerClass: 'rounded-none' }, { class: 'bg-transparent' })
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-md')
      expect(w.find('table').classes()).toContain('text-lg')
      expect(body(w)[0]!.classes()).toContain('bg-transparent')
    })

    it('empty striped / bordered table renders', () => {
      const w = mount(Table, { props: { striped: true, bordered: true, hoverable: false } })
      expect(w.find('table').text()).toBe('')
    })
  })

  describe('customisation', () => {
    it('class goes on <table>, containerClass on wrapper, merged last', () => {
      const w = build({ class: 'text-lg w-auto', containerClass: 'max-h-96 overflow-x-hidden' })
      expect(w.find('table').classes()).toEqual(expect.arrayContaining(['text-lg', 'w-auto']))
      expect(w.find('table').classes()).not.toContain('w-full')
      expect(w.classes()).toContain('max-h-96')
      expect(w.classes()).not.toContain('overflow-x-auto')
      expect(w.classes()).toContain('overflow-x-hidden')
    })

    it('attrs fall through to <table>, not the container', () => {
      const w = mount(Table, { attrs: { id: 't1', 'aria-label': 'People', 'data-x': '1' } })
      expect(w.find('table').attributes()).toMatchObject({ id: 't1', 'aria-label': 'People', 'data-x': '1' })
      expect(w.attributes('id')).toBeUndefined()
    })

    it('parts merge class last', () => {
      expect(mount(TableRow, { props: { class: 'border-0' } }).classes()).toContain('border-0')
      expect(mount(TableRow, { props: { class: 'border-0' } }).classes()).not.toContain('border-b')
      expect(mount(TableHead, { props: { class: 'h-20' } }).classes()).toContain('h-20')
      expect(mount(TableCell, { props: { class: 'p-8' } }).classes()).toContain('p-8')
      expect(mount(TableHeader, { props: { class: 'x1' } }).classes()).toContain('x1')
      expect(mount(TableBody, { props: { class: 'x2' } }).classes()).toContain('x2')
      expect(mount(TableFooter, { props: { class: 'x3' } }).classes()).toContain('x3')
      expect(mount(TableCaption, { props: { class: 'x4' } }).classes()).toContain('x4')
      expect(mount(TableEmpty, { props: { class: 'x5' } }).find('td').classes()).toContain('x5')
    })

    it('parts pass attrs and listeners', async () => {
      const w = mount(TableRow, { attrs: { 'data-id': '7' } })
      expect(w.attributes('data-id')).toBe('7')
      let clicked = 0
      const c = mount(TableCell, { attrs: { onClick: () => clicked++ } })
      await c.trigger('click')
      expect(clicked).toBe(1)
    })
  })

  describe('bad path', () => {
    it('unknown density falls back to default', () => {
      expect(mount(Table, { props: { density: 'huge' as never } }).find('table').attributes('data-density')).toBe('default')
    })

    it.each([0, -3, NaN, Infinity, 2.7])('TableEmpty colspan %s is sanitised', (colspan) => {
      const v = mount(TableEmpty, { props: { colspan } }).find('td').attributes('colspan')
      expect(Number(v)).toBeGreaterThanOrEqual(1)
      expect(Number.isInteger(Number(v))).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('renders with no slot content', () => {
      const w = mount(Table)
      expect(w.find('table').text()).toBe('')
    })

    it('unicode / RTL / long text cells', () => {
      const long = 'x'.repeat(5000)
      const w = mount(TableCell, { slots: { default: 'مرحبا שלום 日本語 😀 ' + long } })
      expect(w.text()).toContain('مرحبا')
      expect(w.text()).toContain('😀')
      expect(w.text().length).toBeGreaterThan(5000)
    })
  })

  describe('scroll region (WCAG 2.1.1, axe scrollable-region-focusable)', () => {
    it('is keyboard focusable and shows the shared focus ring', () => {
      const c = build().find('[data-slot="table-container"]')
      expect(c.attributes('tabindex')).toBe('0')
      expect(c.classes()).toContain('focus-visible:ring-inset')
      expect(c.classes().join(' ')).toContain('focus-visible:ring-3')
    })

    it('is a region named by the caption when there is one', async () => {
      const w = build()
      await nextTick()
      const c = w.find('[data-slot="table-container"]')
      const cap = w.find('caption')
      expect(c.attributes('role')).toBe('region')
      expect(cap.attributes('id')).toBeTruthy()
      expect(c.attributes('aria-labelledby')).toBe(cap.attributes('id'))
      expect(c.attributes('aria-label')).toBeUndefined()
    })

    it('prefers the `label` prop, then the table aria-label, over the caption', async () => {
      const labelled = build({ label: 'Team' })
      await nextTick()
      expect(labelled.find('[data-slot="table-container"]').attributes('aria-label')).toBe('Team')
      expect(labelled.find('[data-slot="table-container"]').attributes('aria-labelledby')).toBeUndefined()
      const attr = mount(Table, { attrs: { 'aria-label': 'Invoices' }, slots: { default: () => h(TableBody) } })
      expect(attr.find('[data-slot="table-container"]').attributes('aria-label')).toBe('Invoices')
      expect(attr.find('table').attributes('aria-label')).toBe('Invoices')
    })

    it('without any name the region stays focusable but is not exposed as a region', () => {
      const w = mount(Table, { slots: { default: () => h(TableBody) } })
      const c = w.find('[data-slot="table-container"]')
      expect(c.attributes('tabindex')).toBe('0')
      expect(c.attributes('role')).toBeUndefined()
      expect(c.attributes('aria-label')).toBeUndefined()
    })

    it('drops the caption name when the caption unmounts', async () => {
      const show = ref(true)
      const Root = defineComponent({
        setup: () => () => h(Table, null, () => (show.value ? h(TableCaption, null, () => 'Cap') : h(TableBody))),
      })
      const w = mount(Root)
      await nextTick()
      expect(w.find('[data-slot="table-container"]').attributes('role')).toBe('region')
      show.value = false
      await nextTick()
      expect(w.find('[data-slot="table-container"]').attributes('role')).toBeUndefined()
    })

    it('a caption outside a Table does not throw', () => {
      expect(() => mount(TableCaption, { slots: { default: 'x' } })).not.toThrow()
    })

    it('alignment is logical (RTL mirrors it)', () => {
      expect(tableHeadVariants({ align: 'left' })).toContain('text-start')
      expect(tableHeadVariants({ align: 'right' })).toContain('text-end')
      expect(tableCellVariants({ align: 'right', numeric: true })).toContain('tabular-nums')
    })

    it('the accent selected tone is a plain tint: no inset stripe', () => {
      expect(tableRowSelectedTones.accent).not.toContain('shadow')
      expect(tableRowSelectedTones.accent).toContain('bg-primary/10')
    })
  })
})

describe('Table docs: selection checkboxes', () => {
  // A native checkbox drawn with accent-color changes no computed style, so state-check sees no visible change; the styled box does.
  it('every checkbox in an example uses the styled box with a checked fill and a focus ring', () => {
    const boxes = (doc.examples ?? []).flatMap((e) => [...e.code.matchAll(/<input type="checkbox" class="([^"]*)"/g)].map((m) => m[1]!))
    expect(boxes.length).toBeGreaterThan(1)
    for (const cls of boxes) {
      expect(cls).toContain('checked:bg-primary')
      expect(cls).toContain('focus-visible:ring-3')
      expect(cls).not.toContain('accent-')
    }
  })
})
