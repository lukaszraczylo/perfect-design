import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ComparisonTable from './ComparisonTable.vue'
import {
  COMPARISON_TABLE_SIZES,
  COMPARISON_TABLE_VARIANTS,
  comparisonKind,
  comparisonTableCellVariants,
  comparisonTableVariants,
  resolveComparisonTableSize,
  resolveComparisonTableVariant,
} from './variants'

const columns = [{ title: 'Free' }, { title: 'Pro', highlighted: true, badge: 'Popular', subtitle: '$29' }, { key: 'team', title: 'Team' }]
const rows = [
  { label: 'Projects', values: ['1', '10', 'Unlimited'] },
  { label: 'SSO', description: 'SAML + OIDC', values: [false, false, true] },
  { group: 'Support' },
  { label: 'Email', values: [true, true, true] },
  { label: 'Phone', values: [false, null] },
]

describe('ComparisonTable', () => {
  describe('good path', () => {
    it('renders a real table with scoped headers', () => {
      const w = mount(ComparisonTable, { props: { columns, rows } })
      expect(w.attributes('data-slot')).toBe('comparison-table')
      expect(w.attributes('role')).toBe('region')
      expect(w.attributes('tabindex')).toBe('0')
      expect(w.attributes('aria-label')).toBe('Comparison table')
      expect(w.find('table').exists()).toBe(true)
      expect(w.find('caption').classes()).toContain('sr-only')
      const heads = w.findAll('thead th')
      expect(heads).toHaveLength(4)
      expect(heads.every((h) => h.attributes('scope') === 'col')).toBe(true)
      expect(heads[0].text()).toBe('Features')
      expect(heads[2].text()).toContain('Popular')
      expect(heads[2].text()).toContain('$29')
      const rowHeads = w.findAll('tbody th[scope="row"]')
      expect(rowHeads.map((h) => h.text())).toEqual(['Projects', 'SSO SAML + OIDC', 'Email', 'Phone'])
      expect(w.findAll('[data-slot="comparison-table-row"]')).toHaveLength(4)
      expect(w.findAll('[data-slot="comparison-table-cell"]')).toHaveLength(12)
    })
    it('renders check, cross, text and dash cells with sr-only text', () => {
      const w = mount(ComparisonTable, { props: { columns, rows } })
      const cells = w.findAll('tbody tr[data-slot="comparison-table-row"]')[1].findAll('[data-slot="comparison-table-value"]')
      expect(cells.map((c) => c.attributes('data-kind'))).toEqual(['no', 'no', 'yes'])
      expect(cells[0].find('.sr-only').text()).toBe('Not included')
      expect(cells[2].find('.sr-only').text()).toBe('Included')
      expect(cells[2].find('svg').exists()).toBe(true)
      const text = w.findAll('tbody tr')[0].findAll('[data-slot="comparison-table-value"]')
      expect(text.map((c) => c.text())).toEqual(['1', '10', 'Unlimited'])
      expect(text[0].find('svg').exists()).toBe(false)
      const last = w.findAll('[data-slot="comparison-table-row"]')[3].findAll('[data-slot="comparison-table-value"]')
      expect(last.map((c) => c.attributes('data-kind'))).toEqual(['no', 'none', 'none']) // null + missing entry
      expect(last[1].find('.sr-only').text()).toBe('Not available')
    })
    it('groups become their own tbody with a spanning rowgroup header', () => {
      const w = mount(ComparisonTable, { props: { columns, rows } })
      const sections = w.findAll('tbody')
      expect(sections).toHaveLength(2)
      const g = w.find('[data-slot="comparison-table-group"] th')
      expect(g.attributes('scope')).toBe('rowgroup')
      expect(g.attributes('colspan')).toBe('4')
      expect(g.text()).toBe('Support')
      expect(sections[0].find('[data-slot="comparison-table-group"]').exists()).toBe(false)
      expect(sections[1].findAll('tr')).toHaveLength(3)
    })
    it('highlighted column marks header and cells', () => {
      const w = mount(ComparisonTable, { props: { columns, rows } })
      expect(w.findAll('[data-highlighted]').length).toBe(1 + 4)
      const h = w.findAll('thead th')[2]
      expect(h.attributes('data-highlighted')).toBeDefined()
      expect(h.classes()).toContain('bg-accent')
      expect(w.findAll('[data-slot="comparison-table-cell"][data-highlighted]')[0].classes()).toContain('bg-primary/5')
    })
    it('regression: group headings are sentence case (no uppercase/tracking) and alignment is logical', () => {
      const w = mount(ComparisonTable, { props: { columns, rows, stickyFirstColumn: true } })
      const g = w.find('[data-slot="comparison-table-group"] th')
      expect(g.classes().join(' ')).not.toMatch(/uppercase|tracking/)
      expect(g.classes()).toContain('text-start')
      expect(w.html()).not.toMatch(/text-left|left-0|\bz-\[|min-w-\[|rounded-xl/)
      expect(w.find('table').classes()).toContain('min-w-xl')
    })
    it('caption, labels and cornerLabel are customisable', () => {
      const w = mount(ComparisonTable, {
        props: { columns, rows, caption: 'Plans', cornerLabel: 'Funktionen', includedLabel: 'Ja', excludedLabel: 'Nein', unavailableLabel: 'n/a' },
      })
      expect(w.attributes('aria-label')).toBe('Plans')
      expect(w.find('caption').text()).toBe('Plans')
      expect(w.find('thead th').text()).toBe('Funktionen')
      const sr = w.findAll('.sr-only').map((s) => s.text())
      expect(sr).toEqual(expect.arrayContaining(['Ja', 'Nein', 'n/a']))
    })
    it('slots: corner, column-header, cell, row-label, column-footer', () => {
      const w = mount(ComparisonTable, {
        props: { columns: columns.slice(0, 2), rows: rows.slice(0, 2) },
        slots: {
          corner: '<i class="corner">C</i>',
          'column-header': '<template #column-header="{ column, index }"><b class="h">{{ index }}:{{ column.title }}</b></template>',
          cell: '<template #cell="{ value, row, column, rowIndex, columnIndex }"><u class="c">{{ rowIndex }}{{ columnIndex }}{{ row.label }}{{ column.title }}{{ value }}</u></template>',
          'row-label': '<template #row-label="{ row }"><s class="l">{{ row.label }}!</s></template>',
          'column-footer': '<template #column-footer="{ column }"><button>{{ column.title }}</button></template>',
        },
      })
      expect(w.find('.corner').exists()).toBe(true)
      expect(w.findAll('.h').map((h) => h.text())).toEqual(['0:Free', '1:Pro'])
      expect(w.findAll('.c').map((c) => c.text())).toEqual(['00ProjectsFree1', '01ProjectsPro10', '10SSOFreefalse', '11SSOProfalse'])
      expect(w.findAll('.l').map((l) => l.text())).toEqual(['Projects!', 'SSO!'])
      expect(w.findAll('tfoot button').map((b) => b.text())).toEqual(['Free', 'Pro'])
      expect(w.find('[data-slot="comparison-table-value"]').exists()).toBe(false)
    })
    it('no tfoot without a column-footer slot', () => {
      expect(mount(ComparisonTable, { props: { columns, rows } }).find('tfoot').exists()).toBe(false)
    })
  })
  describe('variants and options', () => {
    it('default variant', () => {
      const w = mount(ComparisonTable, { props: { columns, rows } })
      expect(w.attributes('data-variant')).toBe('default')
      expect(w.attributes('data-size')).toBe('md')
      expect(w.classes()).toEqual(expect.arrayContaining(['overflow-x-auto', 'rounded-lg', 'border']))
    })
    it.each(COMPARISON_TABLE_VARIANTS)('variant %s renders all cells', (variant) => {
      const w = mount(ComparisonTable, { props: { columns, rows, variant } })
      expect(w.attributes('data-variant')).toBe(variant)
      expect(w.findAll('[data-slot="comparison-table-cell"]')).toHaveLength(12)
      expect(comparisonTableVariants({ variant })).toBeTruthy()
    })
    it('striped shades every other feature row across groups', () => {
      const w = mount(ComparisonTable, { props: { columns, rows, variant: 'striped' } })
      const shaded = w.findAll('[data-slot="comparison-table-row"]').map((r) => r.find('td').classes().includes('bg-muted/40'))
      expect(shaded).toEqual([false, true, false, true])
      const plain = mount(ComparisonTable, { props: { columns, rows } })
      expect(plain.findAll('td').some((t) => t.classes().includes('bg-muted/40'))).toBe(false)
    })
    it('bordered adds cell borders; minimal has no frame', () => {
      const b = mount(ComparisonTable, { props: { columns, rows, variant: 'bordered' } })
      expect(b.find('td').classes()).toContain('border')
      expect(comparisonTableCellVariants({ variant: 'bordered' })).toContain('border')
      const m = mount(ComparisonTable, { props: { columns, rows, variant: 'minimal' } })
      expect(m.classes()).not.toContain('border')
      expect(m.classes()).not.toContain('rounded-xl')
    })
    it.each(COMPARISON_TABLE_SIZES)('size %s', (size) => {
      const w = mount(ComparisonTable, { props: { columns, rows, size } })
      expect(w.attributes('data-size')).toBe(size)
      const pad = { sm: 'px-3', md: 'px-4', lg: 'px-6' }[size]
      expect(w.find('td').classes()).toContain(pad)
    })
    it('stickyHeader makes header cells sticky', () => {
      const w = mount(ComparisonTable, { props: { columns, rows, stickyHeader: true } })
      expect(w.attributes('data-sticky-header')).toBeDefined()
      for (const th of w.findAll('thead th').filter((_, i) => i !== 2)) expect(th.classes()).toEqual(expect.arrayContaining(['sticky', 'top-0', 'bg-background']))
      expect(w.findAll('thead th')[2].classes().join(' ')).toContain('bg-accent')
      expect(w.findAll('thead th')[2].classes().join(' ')).not.toContain('color-mix')
      const off = mount(ComparisonTable, { props: { columns, rows } })
      expect(off.attributes('data-sticky-header')).toBeUndefined()
      // The corner still sticks to the inline edge because the first column does; it must not stick to the top.
      expect(off.find('thead th').classes()).not.toContain('top-0')
    })
    it('stickyFirstColumn is on by default and can be turned off', () => {
      const on = mount(ComparisonTable, { props: { columns, rows } })
      expect(on.find('tbody th[scope="row"]').classes()).toEqual(expect.arrayContaining(['sticky', 'start-0', 'bg-background']))
      expect(on.find('thead th').classes()).toEqual(expect.arrayContaining(['sticky', 'start-0']))
      const off = mount(ComparisonTable, { props: { columns, rows, stickyFirstColumn: false } })
      expect(off.find('tbody th[scope="row"]').classes()).not.toContain('sticky')
      expect(off.find('thead th').classes()).not.toContain('sticky')
    })
    it('stickyFirstColumn pins row headers and the corner', () => {
      const w = mount(ComparisonTable, { props: { columns, rows, stickyFirstColumn: true } })
      expect(w.find('tbody th[scope="row"]').classes()).toEqual(expect.arrayContaining(['sticky', 'start-0']))
      expect(w.find('thead th').classes()).toEqual(expect.arrayContaining(['sticky', 'start-0', 'z-10']))
      expect(w.find('thead th').classes()).not.toContain('top-0')
    })
    it('both sticky: corner sits above everything', () => {
      const w = mount(ComparisonTable, { props: { columns, rows, stickyHeader: true, stickyFirstColumn: true } })
      expect(w.find('thead th').classes()).toEqual(expect.arrayContaining(['sticky', 'start-0', 'top-0', 'z-20']))
    })
    it('table scrolls horizontally with a minimum width', () => {
      expect(mount(ComparisonTable).find('table').classes()).toContain('min-w-xl')
    })
  })
  describe('customisation', () => {
    it('merges class last and passes attrs', () => {
      const w = mount(ComparisonTable, { props: { class: 'rounded-none max-h-96 custom' }, attrs: { id: 'cmp', 'data-test': 'x', 'aria-label': 'Mine' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['custom', 'max-h-96', 'rounded-none']))
      expect(w.classes()).not.toContain('rounded-xl')
      expect(w.attributes('id')).toBe('cmp')
      expect(w.attributes('data-test')).toBe('x')
      expect(w.attributes('aria-label')).toBe('Mine')
    })
  })
  describe('bad path', () => {
    it('unknown variant and size fall back', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(ComparisonTable, { props: { columns, rows, variant: 'neon', size: 'huge' } })
      expect(w.attributes('data-variant')).toBe('default')
      expect(w.attributes('data-size')).toBe('md')
      for (const v of [undefined, null, 4, 'STRIPED']) expect(resolveComparisonTableVariant(v)).toBe('default')
      for (const v of [undefined, null, 'xl', 1]) expect(resolveComparisonTableSize(v)).toBe('md')
      expect(resolveComparisonTableVariant('striped')).toBe('striped')
      expect(resolveComparisonTableSize('lg')).toBe('lg')
    })
    it('empty columns and rows render an empty but valid table', () => {
      const w = mount(ComparisonTable)
      expect(w.find('table').exists()).toBe(true)
      expect(w.findAll('thead th')).toHaveLength(1)
      expect(w.findAll('tbody')).toHaveLength(0)
      const onlyCols = mount(ComparisonTable, { props: { columns } })
      expect(onlyCols.findAll('thead th')).toHaveLength(4)
      const onlyRows = mount(ComparisonTable, { props: { rows } })
      expect(onlyRows.findAll('[data-slot="comparison-table-cell"]')).toHaveLength(0)
      expect(onlyRows.findAll('tbody th[scope="row"]')).toHaveLength(4)
    })
    it('malformed rows and columns are skipped', () => {
      // @ts-expect-error deliberately invalid entries
      const w = mount(ComparisonTable, { props: { columns: [null, 'x', { title: 'Ok' }], rows: [null, 5, { nolabel: 1 }, { group: 3 }, { label: 'Real', values: 'nope' }, { label: 'V', values: [true] }] } })
      expect(w.findAll('thead th')).toHaveLength(2)
      expect(w.findAll('tbody th[scope="row"]').map((h) => h.text())).toEqual(['Real', 'V'])
      expect(w.findAll('[data-slot="comparison-table-value"]').map((v) => v.attributes('data-kind'))).toEqual(['none', 'yes'])
    })
    it('comparisonKind classifies odd values', () => {
      expect(comparisonKind(true)).toBe('yes')
      expect(comparisonKind(false)).toBe('no')
      expect(comparisonKind('x')).toBe('text')
      expect(comparisonKind(0)).toBe('text')
      expect(comparisonKind(-1.5)).toBe('text')
      for (const v of ['', NaN, Infinity, null, undefined, {}, [], Symbol.iterator]) expect(comparisonKind(v)).toBe('none')
    })
    it('number values render as text, including 0', () => {
      const w = mount(ComparisonTable, { props: { columns: [{ title: 'A' }, { title: 'B' }], rows: [{ label: 'n', values: [0, 12.5] }] } })
      expect(w.findAll('[data-slot="comparison-table-value"]').map((v) => v.text())).toEqual(['0', '12.5'])
    })
  })
  describe('edge cases', () => {
    it('1 column x 1 row and 100 x 100', () => {
      expect(mount(ComparisonTable, { props: { columns: [{ title: 'A' }], rows: [{ label: 'r', values: [true] }] } }).findAll('td')).toHaveLength(1)
      const cols = Array.from({ length: 100 }, (_, i) => ({ title: `C${i}` }))
      const rs = Array.from({ length: 100 }, (_, i) => ({ label: `R${i}`, values: cols.map((_, j) => (i + j) % 3 === 0) }))
      const w = mount(ComparisonTable, { props: { columns: cols, rows: rs, variant: 'striped' } })
      expect(w.findAll('td')).toHaveLength(10000)
    })
    it('duplicate labels and keys do not warn or break', () => {
      const w = mount(ComparisonTable, { props: { columns: [{ title: 'A', key: 'k' }, { title: 'A', key: 'k2' }], rows: [{ label: 'x', values: [true, true] }, { label: 'x', values: [true, true] }] } })
      expect(w.findAll('tbody tr')).toHaveLength(2)
    })
    it('very long and unicode text', () => {
      const w = mount(ComparisonTable, {
        props: { columns: [{ title: '名'.repeat(500), subtitle: '🎉' }], rows: [{ label: 'ß'.repeat(2000), description: 'مرحبا', values: ['日本語 '.repeat(100)] }] },
      })
      expect(w.find('tbody th').text()).toContain('ß'.repeat(2000))
      expect(w.text()).toContain('🎉')
      expect(w.text()).toContain('مرحبا')
    })
    it('a group with no rows still renders its heading', () => {
      const w = mount(ComparisonTable, { props: { columns, rows: [{ group: 'Empty' }] } })
      expect(w.find('[data-slot="comparison-table-group"]').text()).toBe('Empty')
    })
    it('reacts to prop changes and unmounts cleanly', async () => {
      const w = mount(ComparisonTable, { props: { columns, rows } })
      await w.setProps({ rows: rows.slice(0, 1) })
      expect(w.findAll('tbody tr')).toHaveLength(1)
      await w.setProps({ stickyHeader: true, variant: 'striped', size: 'lg' })
      expect(w.attributes('data-size')).toBe('lg')
      expect(() => w.unmount()).not.toThrow()
    })
  })
})
