/**
 * Contract tests for the data-display group: every documented requirement throws a ContractError naming the component,
 * the missing thing and the fix, every accepted alternative passes, and the modes 'warn' / 'off' never throw.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured, ref, type VNodeChild } from 'vue'
import { configureStrictMode } from '../../lib/contract'
import {
  BarChart, BoardCard, BoardColumn, Card, Carousel, CarouselContent, CarouselItem, CodeViewer, DataTable, DescriptionItem, DescriptionList,
  DetailField, DonutChart, Gauge, GoViewer, Heatmap, KpiTile, LineChart, List, ListItem, Sparkline, StatBar, Table, TableBody, TableCaption,
  TableCell, TableHead, TableHeader, TableRow, Timeline, TimelineItem, Tree, VirtualList, YamlViewer,
} from './index'

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

const errors: Error[] = []
let wrapper: VueWrapper | undefined
/** Mount a tree in strict mode and collect everything Vue routes to the error handler. */
const open = async (root: () => VNodeChild) => {
  errors.length = 0
  wrapper?.unmount()
  wrapper = mount(
    defineComponent({
      setup() {
        onErrorCaptured((e) => {
          errors.push(e as Error)
          return false
        })
        return root
      },
    }),
    { attachTo: document.body },
  )
  await settle()
}
const messages = () => errors.map((e) => e.message)
/** Mount and expect exactly one ContractError whose message contains every fragment. */
const fails = async (root: () => VNodeChild, ...fragments: string[]) => {
  await open(root)
  expect(errors, messages().join('\n')).toHaveLength(1)
  expect(errors[0].name).toBe('ContractError')
  for (const f of fragments) expect(errors[0].message).toContain(f)
}
const passes = async (root: () => VNodeChild) => {
  await open(root)
  expect(messages()).toEqual([])
}

beforeEach(() => {
  errors.length = 0
  configureStrictMode('throw')
  // Several cases pass props of the wrong type on purpose; Vue's own prop warnings are not what is tested here.
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.mocked(console.warn).mockRestore()
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  configureStrictMode('off')
})

const cols = [{ key: 'name', header: 'Name' }, { key: 'plan', header: 'Plan' }]
const rows = [{ id: 1, name: 'Item A', plan: 'Plan 1' }, { id: 2, name: 'Item B', plan: 'Plan 2' }]

describe('DataTable contract', () => {
  const table = (props: Record<string, unknown> = {}, slots?: Record<string, () => VNodeChild>) => () => h(DataTable as never, { columns: cols, rows, label: 'Sample items', ...props }, slots)

  it('needs a caption or a label, reported once (not again by the inner Table)', async () => {
    await fails(table({ label: undefined }), 'DataTable: requires `caption` or `label`', 'Name the table')
    await passes(table({ label: undefined, caption: 'Sample items' }))
    await passes(table({ label: 'Sample items' }))
  })
  it('needs a non-empty columns array', async () => {
    await fails(table({ columns: [] }), 'DataTable: requires a non-empty `columns` array')
  })
  it('needs a non-empty, unique key on every column', async () => {
    await fails(table({ columns: [{ key: '', header: 'Name' }] }), 'every column needs a non-empty string `key`')
    await fails(table({ columns: [{ key: 'a', header: 'A' }, { key: 'a', header: 'B' }] }), 'column keys must be unique', '"a"')
    await passes(table())
  })
  it('needs a header text or a header slot for every column', async () => {
    await fails(table({ columns: [{ key: 'a', header: '' }] }), 'column "a" needs a `header`')
    await passes(table({ columns: [{ key: 'a', header: '' }] }, { 'header-a': () => 'Custom' }))
  })
  it('needs rowKey to be a property name or a function', async () => {
    await fails(table({ rowKey: {} }), 'needs `rowKey`')
    await fails(table({ rowKey: '' }), 'needs `rowKey`')
    await passes(table({ rowKey: 'id' }))
    await passes(table({ rowKey: (row: { id: number }) => `row-${row.id}` }))
    await passes(table({ rowKey: 0 }))
  })
  it('with selectable, rows need an id and ids must be unique', async () => {
    await fails(table({ selectable: true, rows: [{ name: 'No id' }] }), 'row 1 has no string or number id', 'rowKey')
    await fails(table({ selectable: true, rows: [{ id: 1, name: 'A' }, { id: 1, name: 'B' }] }), 'row ids must be unique', '"1"', 'selected together')
    await passes(table({ selectable: true }))
    await passes(table({ selectable: true, rowKey: 'sku', rows: [{ sku: 'a' }, { sku: 'b' }] }))
    await passes(table({ selectable: true, rowKey: (_r: unknown, i: number) => i, rows: [{}, {}] }))
  })
  it('duplicate or missing ids are only a problem when rows can be selected', async () => {
    await passes(table({ rows: [{ id: 1, name: 'A' }, { id: 1, name: 'B' }, { name: 'C' }] }))
  })
  it('checks rows that arrive after mount', async () => {
    const data = ref<unknown[]>([])
    await open(() => h(DataTable as never, { columns: cols, rows: data.value, selectable: true, label: 'Sample items' }))
    expect(messages()).toEqual([])
    errors.length = 0
    data.value = [{ id: 'a', name: 'A' }, { id: 'a', name: 'B' }]
    await settle()
    expect(messages().join('\n')).toContain('row ids must be unique')
  })
})

describe('Table contract', () => {
  it('needs a name: caption, label, aria-label or aria-labelledby', async () => {
    await fails(() => h(Table, null, () => h(TableBody)), 'Table: needs an accessible name', 'TableCaption')
    await passes(() => h(Table, null, () => [h(TableCaption, { hidden: true }, () => 'Invoices'), h(TableBody)]))
    await passes(() => h(Table, { label: 'Invoices' }, () => h(TableBody)))
    await passes(() => h(Table, { 'aria-label': 'Invoices' }, () => h(TableBody)))
    await passes(() => h(Table, { 'aria-labelledby': 'heading' }, () => h(TableBody)))
  })
  it('TableHead belongs in a TableRow, and a column header in TableHeader', async () => {
    const named = (children: () => VNodeChild) => () => h(Table, { label: 'Invoices' }, children)
    await fails(named(() => h(TableHeader, null, () => h(TableHead, null, () => 'Name'))), 'TableHead: must be rendered inside a TableRow')
    await fails(named(() => h(TableBody, null, () => h(TableRow, null, () => h(TableHead, null, () => 'Name')))), 'TableHead: with `scope="col"` must be inside TableHeader', 'scope="row"')
    await passes(named(() => h(TableHeader, null, () => h(TableRow, null, () => h(TableHead, null, () => 'Name')))))
  })
  it('a row header with scope="row" may sit in TableBody', async () => {
    await passes(() => h(Table, { label: 'Invoices' }, () => h(TableBody, null, () => h(TableRow, null, () => [h(TableHead, { scope: 'row' }, () => 'A'), h(TableCell, null, () => '1')]))))
  })
  it('TableRow must be inside a Table', async () => {
    await fails(() => h('table', null, h('tbody', null, h(TableRow))), 'TableRow: must be rendered inside a Table')
  })
})

describe('Tree contract', () => {
  const items = [{ id: 'src', label: 'src', children: [{ id: 'a', label: 'a.ts' }] }, { id: 'readme', label: 'README' }]
  it('needs a name', async () => {
    await fails(() => h(Tree, { items }), 'Tree: needs an accessible name', 'aria-label')
    await passes(() => h(Tree, { items, label: 'Files' }))
    await passes(() => h(Tree, { items, 'aria-label': 'Files' }))
    await passes(() => h(Tree, { items, 'aria-labelledby': 'heading' }))
  })
  it('needs non-empty ids that are unique across the whole tree, collapsed branches included', async () => {
    await fails(() => h(Tree, { items: [{ id: '', label: 'No id' }], label: 'Files' }), 'every node needs a non-empty string `id`', 'No id')
    await fails(() => h(Tree, { items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B', children: [{ id: 'a', label: 'Again' }] }], label: 'Files' }), 'node ids must be unique', '"a"')
  })
  it('checks items that arrive after mount', async () => {
    const data = ref<{ id: string; label: string }[]>([])
    await open(() => h(Tree, { items: data.value, label: 'Files' }))
    expect(messages()).toEqual([])
    data.value = [{ id: 'x', label: 'X' }, { id: 'x', label: 'Y' }]
    await settle()
    expect(messages().join('\n')).toContain('node ids must be unique')
  })
})

describe('VirtualList contract', () => {
  const list = (props: Record<string, unknown> = {}) => () => h(VirtualList as never, { items: [1, 2, 3], itemHeight: 32, height: 120, label: 'Rows', ...props }, { default: ({ item }: { item: number }) => String(item) })
  it('needs a positive itemHeight', async () => {
    await fails(list({ itemHeight: 0 }), 'VirtualList: needs `itemHeight`', 'got 0')
    await fails(list({ itemHeight: Number.NaN }), 'needs `itemHeight`')
    await fails(list({ itemHeight: undefined }), 'needs `itemHeight`')
    await passes(list())
  })
  it('needs a bounded height: the height prop, a height class or an inline height', async () => {
    await fails(list({ height: undefined }), 'VirtualList: needs a bounded height', 'height="100%"')
    await fails(list({ height: undefined, class: 'rounded-md border min-h-0' }), 'needs a bounded height')
    await passes(list({ height: undefined, class: 'h-80 rounded-md' }))
    await passes(list({ height: undefined, class: ['rounded-md', { 'max-h-96': true }] }))
    await passes(list({ height: undefined, class: 'md:h-96' }))
    await passes(list({ height: undefined, class: 'flex-1' }))
    await passes(list({ height: undefined, style: { height: '200px' } }))
    await passes(list({ height: undefined, style: 'max-height: 200px' }))
    await passes(list({ height: '100%' }))
  })
  it('needs a name: label, aria-label or aria-labelledby', async () => {
    await fails(list({ label: undefined }), 'VirtualList: needs an accessible name')
    await passes(list({ label: undefined, 'aria-label': 'Rows' }))
    await passes(list({ label: undefined, 'aria-labelledby': 'heading' }))
  })
})

describe('Carousel contract', () => {
  const slide = () => h(CarouselItem, null, () => 'Slide')
  const carousel = (props: Record<string, unknown> = {}, content: () => VNodeChild = () => h(CarouselContent, null, () => [slide(), slide()])) => () => h(Carousel, { label: 'Highlights', ...props }, content)
  it('needs a CarouselContent', async () => {
    await fails(carousel({}, () => null), 'Carousel: requires a CarouselContent', 'Carousel > CarouselContent > CarouselItem')
  })
  it('needs at least one CarouselItem', async () => {
    await fails(carousel({}, () => h(CarouselContent)), 'Carousel: requires a CarouselItem', 'at least one CarouselItem')
    await passes(carousel({}, () => h(CarouselContent, null, slide)))
  })
  it('needs a label (no generic default)', async () => {
    await fails(carousel({ label: undefined }), 'Carousel: requires `label` or `aria-label` or `aria-labelledby`', 'Product photos')
    await passes(carousel({ label: undefined, 'aria-label': 'Highlights' }))
    await passes(carousel({ label: undefined, 'aria-labelledby': 'heading' }))
    await passes(carousel())
    expect(wrapper!.find('[data-slot="carousel"]').attributes('aria-label')).toBe('Highlights')
  })
})

describe('Board contract', () => {
  const card = (id: string, title = 'Card') => h(BoardCard, { id, title })
  it('BoardColumn needs an id and a name', async () => {
    await fails(() => h(BoardColumn, { id: ' ', title: 'To do' }), 'BoardColumn: requires a non-empty `id`')
    await fails(() => h(BoardColumn, { id: 'todo' }), 'BoardColumn: requires `title` or `aria-label` or `aria-labelledby`')
    await passes(() => h(BoardColumn, { id: 'todo', title: 'To do' }))
    await passes(() => h(BoardColumn, { id: 'todo', 'aria-label': 'To do' }))
    await passes(() => h(BoardColumn, { id: 'todo', 'aria-labelledby': 'heading' }))
  })
  it('BoardCard needs an id', async () => {
    await fails(() => h(BoardColumn, { id: 'todo', title: 'To do' }, () => card('')), 'BoardCard: requires a non-empty `id`')
  })
  it('BoardCard must live inside a list', async () => {
    await fails(() => h('div', null, card('a')), 'BoardCard: must be rendered inside a list', 'BoardColumn')
    await passes(() => h('div', { role: 'list' }, card('a')))
    await passes(() => h('ul', null, card('a')))
    await passes(() => h(BoardColumn, { id: 'todo', title: 'To do' }, () => card('a')))
  })
  it('card ids must be unique across the whole board, reported once per duplicate', async () => {
    const board = (secondColumnId: string) => () =>
      h('div', null, [h(BoardColumn, { id: 'todo', title: 'To do' }, () => card('a')), h(BoardColumn, { id: 'done', title: 'Done' }, () => card(secondColumnId))])
    await fails(board('a'), 'card ids must be unique across the whole board', '"a"')
    await passes(board('b'))
  })
  it('the same card id on two separate boards is fine', async () => {
    await passes(() => h('div', null, [h('div', null, h(BoardColumn, { id: 'todo', title: 'To do' }, () => card('a'))), h('div', null, h(BoardColumn, { id: 'todo', title: 'To do' }, () => card('a')))]))
  })
})

describe('KpiTile, StatBar and Gauge contracts', () => {
  it('KpiTile needs a label', async () => {
    await fails(() => h(KpiTile, { label: '', value: 1 }), 'KpiTile: requires a non-empty `label`')
    await passes(() => h(KpiTile, { label: 'Requests', value: 1 }))
  })
  it('KpiTile with a sparkline names it itself', async () => {
    await passes(() => h(KpiTile, { label: 'Requests', value: 1, sparkline: [1, 2, 3] }))
  })
  it('StatBar needs a label, a finite value and a positive max', async () => {
    await fails(() => h(StatBar, { label: ' ', value: 5 }), 'StatBar: requires a non-empty `label`')
    await fails(() => h(StatBar, { label: 'Storage', value: Number.NaN }), 'StatBar: requires a finite number `value`')
    await fails(() => h(StatBar, { label: 'Storage', value: 5, max: 0 }), 'StatBar: needs `max` to be a finite number above 0')
    await passes(() => h(StatBar, { label: 'Storage', value: 5 }))
    await passes(() => h(StatBar, { label: 'Storage', value: 5, max: 10 }))
  })
  it('Gauge needs a label or an aria-label', async () => {
    await fails(() => h(Gauge, { value: 40 }), 'Gauge: requires `label` or `aria-label` or `aria-labelledby`', 'label="CPU"')
    await passes(() => h(Gauge, { value: 40, label: 'CPU' }))
    await passes(() => h(Gauge, { value: 40, 'aria-label': 'CPU' }))
    await passes(() => h(Gauge, { value: null, 'aria-labelledby': 'heading' }))
  })
})

describe('chart contracts', () => {
  const bar = (props: Record<string, unknown> = {}) => () => h(BarChart as never, { label: 'Orders', labels: ['Mon', 'Tue'], series: [{ name: 'Orders', data: [1, 2] }], ...props })
  const line = (props: Record<string, unknown> = {}) => () => h(LineChart as never, { label: 'Orders', labels: ['Mon', 'Tue'], series: [{ name: 'Orders', data: [1, 2] }], ...props })
  for (const [name, make] of [['BarChart', bar], ['LineChart', line]] as const) {
    it(`${name} needs a name, labels and series of the right shape`, async () => {
      await fails(make({ label: undefined }), `${name}: requires \`label\` or \`aria-label\` or \`aria-labelledby\``, 'label="Requests per day"')
      await fails(make({ labels: undefined }), `${name}: requires \`labels\``)
      await fails(make({ series: undefined }), `${name}: requires \`series\``)
      await fails(make({ series: [{ name: 'A' }] }), 'series 1 needs a `data` array')
      await fails(make({ series: ['x'] }), 'series 1 needs a `data` array')
      await passes(make())
    })
    it(`${name} accepts aria-label or aria-labelledby, names the image with it, and an empty array is the empty state`, async () => {
      await passes(make({ label: undefined, 'aria-label': 'Orders per day' }))
      expect(wrapper!.find('[role="img"]').attributes('aria-label')).toBe('Orders per day')
      expect(wrapper!.find('[data-slot$="chart"]').attributes('aria-label')).toBeUndefined()
      await passes(make({ label: undefined, 'aria-labelledby': 'heading' }))
      expect(wrapper!.find('[role="img"]').attributes('aria-labelledby')).toBe('heading')
      await passes(make({ labels: [], series: [] }))
      await passes(make({ label: undefined, 'aria-label': 'Orders per day', labels: [], series: [] }))
      expect(wrapper!.find('[role="img"]').attributes('aria-label')).toBe('Orders per day')
    })
  }
  it('DonutChart needs a name and segments with a label and a finite value', async () => {
    const donut = (props: Record<string, unknown> = {}) => () => h(DonutChart as never, { label: 'Budget', data: [{ label: 'Spent', value: 40 }, { label: 'Left', value: 60 }], ...props })
    await fails(donut({ label: undefined }), 'DonutChart: requires `label` or `aria-label` or `aria-labelledby`')
    await fails(donut({ data: undefined }), 'DonutChart: requires `data`')
    await fails(donut({ data: [{ label: 'Spent' }] }), 'segment 1 needs a non-empty string `label` and a finite number `value`')
    await fails(donut({ data: [{ label: '', value: 1 }] }), 'segment 1 needs')
    await fails(donut({ data: [{ label: 'A', value: Number.NaN }] }), 'segment 1 needs')
    await passes(donut())
    await passes(donut({ label: undefined, 'aria-label': 'Budget' }))
    expect(wrapper!.find('svg').attributes('aria-label')).toBe('Budget')
    await passes(donut({ data: [] }))
  })
  it('Heatmap needs a name and rows of values', async () => {
    const heat = (props: Record<string, unknown> = {}) => () => h(Heatmap as never, { label: 'Commits', values: [[1, 2], [3, null]], ...props })
    await fails(heat({ label: undefined }), 'Heatmap: requires `label` or `aria-label` or `aria-labelledby`')
    await fails(heat({ values: undefined }), 'Heatmap: requires `values`')
    await fails(heat({ values: [1, 2] }), 'each row is an array')
    await passes(heat())
    await passes(heat({ label: undefined, 'aria-label': 'Commits' }))
    expect(wrapper!.find('[data-slot="heatmap"]').attributes('aria-label')).toBe('Commits')
    await passes(heat({ values: [] }))
  })
  it('Sparkline needs a name (label, aria-label or aria-labelledby) and an array', async () => {
    await fails(() => h(Sparkline, { data: [1, 2, 3] }), 'Sparkline: requires `label` or `aria-label` or `aria-labelledby`', 'Signups, last 7 days')
    await fails(() => h(Sparkline, { data: undefined as never, label: 'Signups' }), 'Sparkline: requires `data`')
    await passes(() => h(Sparkline, { data: [1, 2, 3], label: 'Signups' }))
    await passes(() => h(Sparkline, { data: [1, 2, 3], 'aria-label': 'Signups' }))
    expect(wrapper!.find('svg').attributes('aria-label')).toBe('Signups')
    await passes(() => h(Sparkline, { data: [], 'aria-labelledby': 'heading' }))
  })
})

describe('List and Timeline contracts', () => {
  it('ListItem must be inside a List or another list element', async () => {
    await fails(() => h('div', null, h(ListItem, null, () => 'Item')), 'ListItem: must be rendered inside a List')
    await passes(() => h(List, null, () => h(ListItem, null, () => 'Item')))
    await passes(() => h('ul', null, h(ListItem, null, () => 'Item')))
    await passes(() => h('div', { role: 'list' }, h(ListItem, { as: 'div' }, () => 'Item')))
  })
  it('TimelineItem needs a title or a time', async () => {
    await fails(() => h(Timeline, null, () => h(TimelineItem, null, () => 'Only a body')), 'TimelineItem: requires a `title` or a `time`')
    await passes(() => h(Timeline, null, () => h(TimelineItem, { title: 'Shipped' })))
    await passes(() => h(Timeline, null, () => h(TimelineItem, { time: 'Mon 09:12' })))
    await passes(() => h(Timeline, null, () => h(TimelineItem, null, { title: () => 'Shipped' })))
    await passes(() => h(Timeline, null, () => h(TimelineItem, null, { time: () => 'Mon' })))
  })
  it('a horizontal Timeline (a focusable scroll region) needs a name; the others do not', async () => {
    const step = () => h(TimelineItem, { title: 'Step' })
    await fails(() => h(Timeline, { layout: 'horizontal' }, step), 'Timeline: requires `label` or `aria-label` or `aria-labelledby`', 'horizontal timeline')
    await passes(() => h(Timeline, { layout: 'horizontal', label: 'Delivery steps' }, step))
    await passes(() => h(Timeline, { layout: 'horizontal', 'aria-label': 'Delivery steps' }, step))
    await passes(() => h(Timeline, null, step))
    await passes(() => h(Timeline, { layout: 'alternating' }, step))
  })
})

describe('DescriptionList contract', () => {
  it('DescriptionItem needs a term, as a prop or in the term slot', async () => {
    const item = (props: Record<string, unknown>, slots: Record<string, () => VNodeChild> = { default: () => 'eu-west' }) => () => h(DescriptionList, null, () => h(DescriptionItem, props, slots))
    await fails(item({}), 'DescriptionItem: requires a `term`')
    await fails(item({ term: '  ' }), 'requires a `term`')
    await passes(item({ term: 'Region' }))
    await passes(item({}, { term: () => 'Region', default: () => 'eu-west' }))
    await passes(item({}, { term: () => h('span', { 'aria-label': 'Region' }), default: () => 'eu-west' }))
  })
  it('DescriptionItem must be inside a DescriptionList', async () => {
    await fails(() => h('div', null, h(DescriptionItem, { term: 'Region' }, () => 'eu-west')), 'DescriptionItem: must be rendered inside a DescriptionList')
  })
  it('DetailField needs a label', async () => {
    await fails(() => h(DetailField, { label: '', value: 'eu-west' }), 'DetailField: requires a non-empty `label`')
    await passes(() => h(DetailField, { label: 'Region', value: 'eu-west' }))
  })
})

describe('Card contract', () => {
  it('a plain card needs nothing', async () => {
    await passes(() => h(Card, null, () => 'Body'))
    await passes(() => h(Card, null))
  })
  it('a selectable card takes its name from its text, aria-label or aria-labelledby', async () => {
    await fails(() => h(Card, { selectable: true }), 'Card: needs an accessible name', 'role="region"')
    await passes(() => h(Card, { selectable: true }, () => 'Starter plan'))
    await passes(() => h(Card, { selectable: true, 'aria-label': 'Starter plan' }))
    await passes(() => h(Card, { selectable: true, 'aria-labelledby': 'plan' }, () => h('span', { id: 'plan' }, 'Starter plan')))
  })
  it('a card made a region needs aria-label or aria-labelledby', async () => {
    await fails(() => h(Card, { role: 'region' }, () => 'Body text is not a name for a region'), 'Card: needs an accessible name')
    await passes(() => h(Card, { role: 'region', 'aria-label': 'Billing' }, () => 'Body'))
    await passes(() => h(Card, { role: 'region', 'aria-labelledby': 'billing' }, () => h('h3', { id: 'billing' }, 'Billing')))
  })
})

describe('viewer contracts', () => {
  it('CodeViewer needs a filename or a label', async () => {
    await fails(() => h(CodeViewer, { source: 'a = 1' }), 'CodeViewer: requires `filename` or `label`', 'config.yaml')
    await passes(() => h(CodeViewer, { source: 'a = 1', filename: 'config.toml' }))
    await passes(() => h(CodeViewer, { source: 'a = 1', label: 'Config excerpt' }))
  })
  it('CodeViewer needs a source string, and an empty string is allowed content', async () => {
    await fails(() => h(CodeViewer, { filename: 'a.txt' }), 'CodeViewer: requires `source`', 'empty string is fine')
    await fails(() => h(CodeViewer, { filename: 'a.txt', source: 42 as never }), 'CodeViewer: requires `source`')
    await passes(() => h(CodeViewer, { filename: 'a.txt', source: '' }))
  })
  it('YamlViewer reports under its own name, once', async () => {
    await fails(() => h(YamlViewer, { source: 'a: 1' }), 'YamlViewer: requires `filename` or `label`')
    await fails(() => h(YamlViewer, { filename: 'a.yaml' }), 'YamlViewer: requires `source`', '`value`')
    await passes(() => h(YamlViewer, { filename: 'a.yaml', source: '' }))
    await passes(() => h(YamlViewer, { filename: 'a.yaml', value: { a: 1 } }))
    await passes(() => h(YamlViewer, { filename: 'a.yaml', value: null }))
    await passes(() => h(YamlViewer, { label: 'Limits', value: [] }))
  })
  it('GoViewer reports under its own name, once', async () => {
    await fails(() => h(GoViewer, { source: 'package main' }), 'GoViewer: requires `filename` or `label`')
    await fails(() => h(GoViewer, { filename: 'main.go' }), 'GoViewer: requires `source`', '`value`')
    await passes(() => h(GoViewer, { filename: 'main.go', source: 'package main' }))
    await passes(() => h(GoViewer, { filename: 'value.go', value: { a: 1 } }))
  })
})

describe('modes', () => {
  const broken: [string, () => VNodeChild][] = [
    ['DataTable', () => h(DataTable as never, { columns: [], rows: [] })],
    ['Table', () => h(Table, null, () => h(TableBody))],
    ['Tree', () => h(Tree, { items: [] })],
    ['VirtualList', () => h(VirtualList as never, { items: [], itemHeight: 0 })],
    ['Carousel', () => h(Carousel)],
    ['BoardColumn', () => h(BoardColumn, { id: 'a' })],
    ['KpiTile', () => h(KpiTile, { label: '' })],
    ['StatBar', () => h(StatBar, { label: '', value: Number.NaN })],
    ['Gauge', () => h(Gauge, { value: 1 })],
    ['BarChart', () => h(BarChart as never, { labels: [], series: [] })],
    ['Sparkline', () => h(Sparkline, { data: [1] })],
    ['Heatmap', () => h(Heatmap as never, { values: [] })],
    ['TimelineItem', () => h(Timeline, null, () => h(TimelineItem))],
    ['DescriptionItem', () => h(DescriptionList, null, () => h(DescriptionItem))],
    ['Card', () => h(Card, { selectable: true })],
    ['CodeViewer', () => h(CodeViewer, {})],
  ]
  it.each(broken)('%s: warn mode logs the message and does not throw; off mode is silent', async (name, root) => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(root)
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).startsWith(`[perfect-design] ${name}:`))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(root)
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('[perfect-design]'))).toBe(false)
    spy.mockRestore()
  })
})
