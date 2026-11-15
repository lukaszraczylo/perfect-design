import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import {
  TABLE_DENSITIES,
  TABLE_LAYOUTS,
  TABLE_SIZES,
  TABLE_VARIANTS,
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
  tableVariants,
} from './index'

const DEFAULT_TABLE = 'group/table w-full caption-bottom border-collapse text-sm'
const DEFAULT_HEAD = 'h-10 px-3 align-middle text-sm font-medium whitespace-nowrap text-muted-foreground group-data-[density=compact]/table:h-8 group-data-[density=compact]/table:px-2 group-data-[sticky]/table:sticky group-data-[sticky]/table:top-0 group-data-[sticky]/table:z-10 group-data-[sticky]/table:bg-background text-start'
const DEFAULT_CELL = 'p-3 align-middle group-data-[density=compact]/table:p-2 text-start'

function build(props: Record<string, unknown> = {}, cellProps: Record<string, unknown> = {}) {
  return mount(Table, {
    props: { label: 'Sample data', ...props },
    slots: {
      default: () => [
        h(TableHeader, null, () => h(TableRow, null, () => [h(TableHead, null, () => 'Name'), h(TableHead, { align: 'right' }, () => 'Seats')])),
        h(TableBody, null, () => [
          h(TableRow, null, () => [h(TableHead, { scope: 'row' }, () => 'Item A'), h(TableCell, { label: 'Seats', numeric: true, ...cellProps }, () => '12')]),
          h(TableRow, null, () => [h(TableCell, { label: 'Name' }, () => 'Item B'), h(TableCell, { numeric: true }, () => '3')]),
        ]),
        h(TableFooter, null, () => h(TableRow, null, () => h(TableCell, { colspan: 2 }, () => 'Total'))),
      ],
    },
  })
}
const cls = (w: ReturnType<typeof build>, sel: string) => w.find(sel).classes().join(' ')

describe('Table variations', () => {
  describe('default output is unchanged', () => {
    it('keeps today\'s exact class strings and adds no new attributes or roles', () => {
      const w = build()
      expect(w.find('table').attributes('class')).toBe(DEFAULT_TABLE)
      expect(w.find('thead th').attributes('class')).toBe(DEFAULT_HEAD)
      expect(w.find('tbody tr:nth-child(2) td').attributes('class')).toBe(DEFAULT_CELL)
      const table = w.find('table')
      for (const attr of ['data-size', 'data-variant', 'data-layout', 'role']) expect(table.attributes(attr), attr).toBeUndefined()
      for (const el of w.findAll('thead,tbody,tfoot,tr,th,td')) expect(el.attributes('role'), el.element.tagName).toBeUndefined()
      expect(w.find('[data-slot=table-cell-label]').exists()).toBe(false)
      expect(w.find('tbody').attributes('class')).toBe('[&_tr:last-child]:border-0')
      expect(w.find('thead').attributes('class')).toBe('[&_tr]:border-b')
    })
    it('exposes the value lists and plain class helpers', () => {
      expect(TABLE_DENSITIES).toEqual(['default', 'compact', 'comfortable'])
      expect(TABLE_SIZES).toEqual(['sm', 'md', 'lg'])
      expect(TABLE_VARIANTS).toEqual(['default', 'borderless', 'filled'])
      expect(TABLE_LAYOUTS).toEqual(['table', 'cards'])
      expect(tableVariants()).toBe(DEFAULT_TABLE)
      expect(tableVariants({ size: 'sm' })).toContain('text-xs')
      expect(tableVariants({ size: 'lg' })).toContain('text-base')
      expect(tableVariants({ layout: 'cards' })).toContain('max-sm:block')
      expect(tableHeadVariants()).toBe(DEFAULT_HEAD)
      expect(tableCellVariants()).toBe(DEFAULT_CELL)
    })
  })

  describe('density', () => {
    it('comfortable adds roomier header and cell padding', () => {
      const w = build({ density: 'comfortable' })
      expect(w.find('table').attributes('data-density')).toBe('comfortable')
      expect(cls(w, 'thead th')).toContain('h-12 px-4')
      expect(cls(w, 'tbody td')).toContain('p-4')
    })
    it('compact keeps its own group classes and no extra comfortable classes', () => {
      const w = build({ density: 'compact' })
      expect(w.find('table').attributes('data-density')).toBe('compact')
      expect(cls(w, 'thead th')).not.toContain('h-12')
      expect(cls(w, 'tbody td')).not.toContain('p-4')
    })
    it('unknown values fall back to default', () => {
      const w = build({ density: 'huge' })
      expect(w.find('table').attributes('data-density')).toBe('default')
      expect(w.find('tbody tr:nth-child(2) td').attributes('class')).toBe(DEFAULT_CELL)
    })
    it('class wins over the density padding', () => {
      const w = build({ density: 'comfortable' }, { class: 'p-1' })
      const c = w.find('tbody td').classes()
      expect(c).toContain('p-1')
      expect(c).not.toContain('p-4')
    })
  })

  describe('size', () => {
    it.each([
      ['sm', 'text-xs'],
      ['lg', 'text-base'],
    ] as const)('%s sets %s on the table, headers, cells and the empty message', (size, text) => {
      const w = mount(Table, {
        props: { size, label: 'Sample' },
        slots: { default: () => [h(TableHeader, null, () => h(TableRow, null, () => h(TableHead, null, () => 'Name'))), h(TableBody, null, () => [h(TableRow, null, () => h(TableCell, null, () => 'A')), h(TableEmpty)])] },
      })
      expect(w.find('table').attributes('data-size')).toBe(size)
      for (const sel of ['table', 'th', 'tbody tr:first-child td', '[data-slot=table-empty-cell]']) {
        const c = w.find(sel).classes()
        expect(c, sel).toContain(text)
        expect(c, sel).not.toContain('text-sm')
      }
    })
    it('md is the default look and sets no attribute', () => {
      const w = build({ size: 'md' })
      expect(w.find('table').attributes('class')).toBe(DEFAULT_TABLE)
      expect(w.find('table').attributes('data-size')).toBeUndefined()
    })
    it('unknown values fall back to md', () => {
      const w = build({ size: 'xl' })
      expect(w.find('table').attributes('class')).toBe(DEFAULT_TABLE)
      expect(w.find('thead th').attributes('class')).toBe(DEFAULT_HEAD)
    })
    it('class wins over the size', () => {
      const w = build({ size: 'sm', class: 'text-lg' })
      expect(w.find('table').classes()).toContain('text-lg')
      expect(w.find('table').classes()).not.toContain('text-xs')
    })
  })

  describe('variant', () => {
    it('borderless makes body row rules transparent and keeps the header rule', () => {
      const w = build({ variant: 'borderless' })
      expect(w.find('table').attributes('data-variant')).toBe('borderless')
      for (const tr of w.findAll('tbody tr')) expect(tr.classes()).toContain('in-[tbody]:border-transparent')
      expect(cls(w, 'thead')).toContain('[&_tr]:border-b')
      expect(cls(w, 'tbody')).toContain('[&_tr:last-child]:border-0')
    })
    it('filled puts a muted band on header cells, also when sticky', () => {
      const w = build({ variant: 'filled', stickyHeader: true })
      expect(w.find('table').attributes('data-variant')).toBe('filled')
      const c = w.find('thead th').classes()
      expect(c).toContain('bg-muted')
      expect(c).toContain('group-data-[sticky]/table:bg-muted')
      expect(c).not.toContain('group-data-[sticky]/table:bg-background')
      expect(w.find('tbody td').classes()).not.toContain('bg-muted')
    })
    it('default sets no variant attribute and no extra row or header classes', () => {
      const w = build({ variant: 'default' })
      expect(w.find('table').attributes('data-variant')).toBeUndefined()
      expect(w.find('thead th').attributes('class')).toBe(DEFAULT_HEAD)
      expect(w.find('tbody tr').classes()).not.toContain('in-[tbody]:border-transparent')
    })
    it('unknown values fall back to default', () => {
      const w = build({ variant: 'fancy' })
      expect(w.find('table').attributes('data-variant')).toBeUndefined()
      expect(w.find('thead th').attributes('class')).toBe(DEFAULT_HEAD)
    })
    it('class wins over the header band', () => {
      const w = mount(Table, {
        props: { variant: 'filled', label: 'x' },
        slots: { default: () => h(TableHeader, null, () => h(TableRow, null, () => h(TableHead, { class: 'bg-card' }, () => 'Name'))) },
      })
      expect(w.find('th').classes()).toContain('bg-card')
      expect(w.find('th').classes()).not.toContain('bg-muted')
    })
    it('combines with striped, bordered and non-hoverable without dropping any of them', () => {
      const w = build({ variant: 'borderless', striped: true, bordered: true, hoverable: false })
      const t = w.find('table')
      expect(t.attributes('data-variant')).toBe('borderless')
      for (const a of ['data-striped', 'data-bordered']) expect(t.attributes(a), a).toBe('')
      expect(t.attributes('data-hoverable')).toBe('false')
      const row = w.find('tbody tr').classes()
      expect(row).toContain('in-[tbody]:border-transparent')
      expect(row).toContain('in-[tbody]:even:bg-muted/30')
      expect(row).not.toContain('hover:bg-muted/50')
    })
  })

  describe('cell valign', () => {
    it('top and bottom replace the middle alignment', () => {
      expect(mount(TableCell, { props: { valign: 'top' } }).classes()).toContain('align-top')
      expect(mount(TableCell, { props: { valign: 'top' } }).classes()).not.toContain('align-middle')
      expect(mount(TableCell, { props: { valign: 'bottom' } }).classes()).toContain('align-bottom')
    })
    it('middle and unknown values keep the default', () => {
      expect(mount(TableCell, { props: { valign: 'middle' } }).attributes('class')).toBe(DEFAULT_CELL)
      expect(mount(TableCell, { props: { valign: 'sideways' as never } }).attributes('class')).toBe(DEFAULT_CELL)
    })
    it('class wins', () => {
      const c = mount(TableCell, { props: { valign: 'top' }, attrs: { class: 'align-baseline' } }).classes()
      expect(c).toContain('align-baseline')
      expect(c).not.toContain('align-top')
    })
  })

  describe('layout cards', () => {
    const cards = () => build({ layout: 'cards' })

    it('keeps table semantics with explicit roles, since display changes can drop them', () => {
      const w = cards()
      expect(w.find('table').attributes('role')).toBe('table')
      expect(w.find('table').attributes('data-layout')).toBe('cards')
      for (const sel of ['thead', 'tbody', 'tfoot']) expect(w.find(sel).attributes('role'), sel).toBe('rowgroup')
      for (const tr of w.findAll('tr')) expect(tr.attributes('role')).toBe('row')
      expect(w.findAll('thead th').map((th) => th.attributes('role'))).toEqual(['columnheader', 'columnheader'])
      expect(w.find('tbody th').attributes('role')).toBe('rowheader')
      expect(w.find('tbody th').attributes('scope')).toBe('row')
      for (const td of w.findAll('td')) expect(td.attributes('role')).toBe('cell')
    })
    it('maps colgroup and rowgroup scopes to the matching header roles', () => {
      const w = mount(Table, {
        props: { layout: 'cards', label: 'x' },
        slots: { default: () => h(TableBody, null, () => h(TableRow, null, () => [h(TableHead, { scope: 'colgroup' }, () => 'A'), h(TableHead, { scope: 'rowgroup' }, () => 'B')])) },
      })
      expect(w.findAll('th').map((t) => t.attributes('role'))).toEqual(['columnheader', 'rowheader'])
    })
    it('shows the cell label as an aria-hidden visual label that only appears below sm', () => {
      const w = cards()
      const label = w.find('tbody td [data-slot=table-cell-label]')
      expect(label.text()).toBe('Seats')
      expect(label.attributes('aria-hidden')).toBe('true')
      expect(label.classes()).toEqual(expect.arrayContaining(['hidden', 'max-sm:inline']))
      expect(w.find('tbody td [data-slot=table-cell-value]').text()).toBe('12')
      expect(w.find('tbody td').text()).toContain('12')
    })
    it('leaves cells without a label as plain content', () => {
      const w = cards()
      const plain = w.findAll('tbody td')[2]!
      expect(plain.find('[data-slot=table-cell-label]').exists()).toBe(false)
      expect(plain.find('[data-slot=table-cell-value]').exists()).toBe(false)
      expect(plain.text()).toBe('3')
    })
    it('ignores the label outside the cards layout', () => {
      const w = build({ layout: 'table' })
      expect(w.find('[data-slot=table-cell-label]').exists()).toBe(false)
      expect(w.find('tbody td').text()).toBe('12')
    })
    it('lays out the card pieces below sm only', () => {
      const w = cards()
      expect(cls(w, 'table')).toContain('max-sm:block')
      expect(cls(w, 'thead')).toEqual(expect.stringContaining('max-sm:sr-only'))
      expect(cls(w, 'thead')).toContain('max-sm:focus-within:not-sr-only')
      expect(cls(w, 'tbody')).toContain('sm:[&_tr:last-child]:border-0')
      expect(w.find('tbody').classes()).not.toContain('[&_tr:last-child]:border-0')
      expect(cls(w, 'tfoot')).toContain('max-sm:block')
      expect(w.find('tbody tr').classes()).toEqual(expect.arrayContaining(['max-sm:block', 'max-sm:in-[tbody]:rounded-lg', 'max-sm:in-[tbody]:border', 'max-sm:in-[tbody]:border-border']))
      expect(cls(w, 'tbody td')).toContain('max-sm:flex')
      expect(cls(w, 'thead th')).toContain('max-sm:block')
    })
    it('uses logical padding and no fixed widths in the card pieces', () => {
      const w = cards()
      const all = w.findAll('*').map((e) => e.classes().join(' ')).join(' ')
      expect(all).not.toMatch(/\b(?:max-sm:)?(?:pl|pr|ml|mr)-\d/)
      expect(all).not.toMatch(/\bw-\[|\bmin-w-\[/)
    })
    it('keeps header cells in the accessibility tree and caption/footer in the block flow', async () => {
      const w = mount(Table, {
        props: { layout: 'cards' },
        slots: { default: () => [h(TableCaption, { hidden: true }, () => 'Sample caption'), h(TableHeader, null, () => h(TableRow, null, () => h(TableHead, null, () => 'Name')))] },
      })
      await nextTick()
      expect(w.find('caption').classes()).toEqual(expect.arrayContaining(['max-sm:block', 'sr-only']))
      expect(w.find('th').text()).toBe('Name')
      expect(w.find('thead').attributes('aria-hidden')).toBeUndefined()
      expect(w.find('[data-slot=table-container]').attributes('aria-labelledby')).toBeTruthy()
    })
    it('gives the empty row table roles too, and handles zero rows', () => {
      const w = mount(Table, {
        props: { layout: 'cards', label: 'Empty cards' },
        slots: { default: () => h(TableBody, null, () => h(TableEmpty, { colspan: 3 })) },
      })
      expect(w.find('tr').attributes('role')).toBe('row')
      expect(w.find('td').attributes('role')).toBe('cell')
      expect(w.find('td').attributes('colspan')).toBe('3')
      expect(w.text()).toBe('No results')
    })
    it('unknown layout falls back to table', () => {
      const w = build({ layout: 'grid' })
      expect(w.find('table').attributes('data-layout')).toBeUndefined()
      expect(w.find('table').attributes('role')).toBeUndefined()
      expect(w.find('table').attributes('class')).toBe(DEFAULT_TABLE)
    })
    it('class and a consumer role still win', () => {
      const w = mount(Table, { props: { layout: 'cards', class: 'max-sm:flex', label: 'x' }, attrs: { role: 'grid' } })
      expect(w.find('table').attributes('role')).toBe('grid')
      expect(w.find('table').classes()).toContain('max-sm:flex')
      expect(w.find('table').classes()).not.toContain('max-sm:block')
    })
    it('handles very long labels and values without extra markup', () => {
      const long = 'Wide column heading '.repeat(20)
      const w = mount(Table, {
        props: { layout: 'cards', label: 'Long' },
        slots: { default: () => h(TableBody, null, () => h(TableRow, null, () => h(TableCell, { label: long }, () => 'v'.repeat(300)))) },
      })
      expect(w.find('[data-slot=table-cell-label]').text()).toBe(long.trim())
      expect(w.find('[data-slot=table-cell-value]').classes()).toContain('break-words')
      expect(w.find('[data-slot=table-cell-value]').classes()).toContain('min-w-0')
    })
  })

  describe('combinations', () => {
    it('density, size and variant together reach header and cells', () => {
      const w = build({ density: 'comfortable', size: 'lg', variant: 'filled' })
      expect(w.find('thead th').classes()).toEqual(expect.arrayContaining(['h-12', 'px-4', 'text-base', 'bg-muted']))
      expect(w.find('thead th').classes()).not.toContain('text-sm')
      expect(w.find('tbody td').classes()).toEqual(expect.arrayContaining(['p-4', 'text-base']))
    })
    it('cards with compact density and borderless rows keep the card frame colour', () => {
      const w = build({ layout: 'cards', density: 'compact', variant: 'borderless' })
      const row = w.find('tbody tr').classes()
      expect(row).toContain('in-[tbody]:border-transparent')
      expect(row).toContain('max-sm:in-[tbody]:border-border')
      expect(cls(w, 'tbody td')).toContain('max-sm:group-data-[density=compact]/table:py-1')
    })
    it('cards with striped rows and size sm', () => {
      const w = build({ layout: 'cards', striped: true, size: 'sm' })
      expect(w.find('tbody tr').classes()).toContain('in-[tbody]:even:bg-muted/30')
      expect(w.find('tbody td').classes()).toContain('text-xs')
      expect(w.find('[data-slot=table-cell-label]').exists()).toBe(true)
    })
  })

  describe('a11y that survives every look', () => {
    it.each([
      { density: 'comfortable' },
      { size: 'lg' },
      { variant: 'filled' },
      { variant: 'borderless' },
      { layout: 'cards' },
    ])('keeps the focusable named region and header scopes for %o', (props) => {
      const w = build(props)
      const region = w.find('[data-slot=table-container]')
      expect(region.attributes('tabindex')).toBe('0')
      expect(region.attributes('role')).toBe('region')
      expect(region.attributes('aria-label')).toBe('Sample data')
      expect(w.findAll('thead th').every((th) => th.attributes('scope') === 'col')).toBe(true)
    })
  })
})
