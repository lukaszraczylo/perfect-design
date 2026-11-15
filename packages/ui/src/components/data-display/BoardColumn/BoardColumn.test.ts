import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createCommentVNode, defineComponent, h, nextTick, ref } from 'vue'
import { BoardCard } from '../BoardCard'
import { BOARD_CARD_MIME, getActiveBoardDrag, setActiveBoardDrag } from '../BoardCard/boardDrag'
import { BoardColumn, boardColumnVariants, type BoardColumnMoveEvent } from './index'

class FakeDataTransfer {
  data = new Map<string, string>()
  effectAllowed = 'uninitialized'
  dropEffect = 'none'
  throwOnGet = false
  get types() {
    return [...this.data.keys()]
  }
  setData(type: string, value: string) {
    this.data.set(type, value)
  }
  getData(type: string) {
    if (this.throwOnGet) throw new Error('protected')
    return this.data.get(type) ?? ''
  }
}

function fire(el: Element | Window, type: string, extra: Record<string, unknown> = {}) {
  const e = new Event(type, { bubbles: true, cancelable: true })
  for (const [k, v] of Object.entries(extra)) Object.defineProperty(e, k, { value: v })
  el.dispatchEvent(e)
  return e
}
const cardDt = (id: string, from?: string) => {
  const dt = new FakeDataTransfer()
  dt.setData(BOARD_CARD_MIME, JSON.stringify(from ? { id, from } : { id }))
  return dt
}

const mounted: VueWrapper[] = []
function mountColumn(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  const w = mount(BoardColumn, { props: { id: 'todo', title: 'To do', ...props }, slots: slots as never, attachTo: document.body })
  mounted.push(w)
  return w
}
const threeCards = () =>
  mountColumn({}, { default: () => ['a', 'b', 'c'].map((id) => h(BoardCard, { id, key: id }, () => id)) })

afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount())
  setActiveBoardDrag(null)
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('BoardColumn', () => {
  describe('good path', () => {
    it('renders title, count badge and cards in a labelled group', () => {
      const w = threeCards()
      expect(w.attributes('data-slot')).toBe('board-column')
      expect(w.attributes('role')).toBe('group')
      expect(w.attributes('data-column-id')).toBe('todo')
      const title = w.find('[data-slot="board-column-title"]')
      expect(title.text()).toBe('To do')
      expect(w.attributes('aria-labelledby')).toBe(title.attributes('id'))
      expect(w.find('[data-slot="board-column-count"]').text()).toBe('3')
      // aria-label is not allowed on a plain span: the unit is spoken through a sibling sr-only text instead
      expect(w.find('[data-slot="board-column-count"]').attributes('aria-label')).toBeUndefined()
      expect(w.find('[data-slot="board-column-count-label"]').text()).toBe('cards')
      const body = w.find('[data-slot="board-column-body"]')
      expect(body.attributes('role')).toBe('list')
      expect(body.attributes('aria-labelledby')).toBe(title.attributes('id'))
      expect(w.findAll('[data-slot="board-card"]')).toHaveLength(3)
      expect(w.find('[data-slot="board-column-empty"]').exists()).toBe(false)
    })

    it('count prop overrides the slot count', () => {
      expect(mountColumn({ count: 42 }, { default: () => h(BoardCard, { id: 'a' }) }).find('[data-slot="board-column-count"]').text()).toBe('42')
    })

    it('showCount=false hides the badge', () => {
      expect(mountColumn({ showCount: false }).find('[data-slot="board-column-count"]').exists()).toBe(false)
    })

    it('renders header and footer slots with scoped props', () => {
      const w = mountColumn(
        {},
        {
          header: (p: { title: string; count: number; over: boolean }) => h('b', { class: 'hdr' }, `${p.title}/${p.count}/${p.over}`),
          footer: (p: { count: number }) => h('i', { class: 'ftr' }, `foot ${p.count}`),
        },
      )
      expect(w.find('.hdr').text()).toBe('To do/0/false')
      expect(w.find('[data-slot="board-column-footer"] .ftr').text()).toBe('foot 0')
      expect(w.find('[data-slot="board-column-title"]').exists()).toBe(false)
    })

    it('has no footer element without a footer slot', () => {
      expect(mountColumn().find('[data-slot="board-column-footer"]').exists()).toBe(false)
    })

    it('shows the empty state, customisable by text and slot', () => {
      const w = mountColumn()
      expect(w.find('[data-slot="board-column-empty"]').text()).toBe('No cards')
      expect(w.find('[data-slot="board-column-body"]').attributes('role')).toBeUndefined()
      expect(mountColumn({ emptyText: 'Nothing here' }).find('[data-slot="board-column-empty"]').text()).toBe('Nothing here')
      const s = mountColumn({}, { empty: (p: { over: boolean }) => h('em', `slot ${p.over}`) })
      expect(s.find('[data-slot="board-column-empty"] em').text()).toBe('slot false')
    })

    it('count and empty state react to cards being added and removed', async () => {
      const ids = ref<string[]>([])
      const Host = defineComponent({
        setup: () => () => h(BoardColumn, { id: 'todo', title: 'T' }, () => ids.value.map((id) => h(BoardCard, { id, key: id }))),
      })
      const w = mount(Host, { attachTo: document.body })
      mounted.push(w as unknown as VueWrapper)
      expect(w.find('[data-slot="board-column-empty"]').exists()).toBe(true)
      ids.value = ['a', 'b']
      await nextTick()
      expect(w.find('[data-slot="board-column-count"]').text()).toBe('2')
      expect(w.find('[data-slot="board-column-empty"]').exists()).toBe(false)
      ids.value = []
      await nextTick()
      expect(w.find('[data-slot="board-column-count"]').text()).toBe('0')
    })

    it('provides its id to child cards as their source column', () => {
      const w = threeCards()
      const dt = new FakeDataTransfer()
      fire(w.find('[data-slot="board-card"]').element, 'dragstart', { dataTransfer: dt })
      expect(JSON.parse(dt.getData(BOARD_CARD_MIME))).toEqual({ id: 'a', from: 'todo' })
    })
  })

  describe('drop zone', () => {
    it('highlights on dragenter of a board card and clears on drop, emitting move', async () => {
      const w = mountColumn()
      const dt = cardDt('x', 'doing')
      const enter = fire(w.element, 'dragenter', { dataTransfer: dt })
      await nextTick()
      expect(enter.defaultPrevented).toBe(true)
      expect(w.attributes('data-over')).toBe('true')
      expect(w.classes()).toContain('ring-2')
      const over = fire(w.element, 'dragover', { dataTransfer: dt })
      expect(over.defaultPrevented).toBe(true)
      expect(dt.dropEffect).toBe('move')
      const drop = fire(w.element, 'drop', { dataTransfer: dt, clientY: 5 })
      await nextTick()
      expect(drop.defaultPrevented).toBe(true)
      expect(w.attributes('data-over')).toBeUndefined()
      expect(w.emitted('move')).toEqual([[{ cardId: 'x', from: 'doing', to: 'todo', index: 0 }]])
    })

    it('exposes over to slots', async () => {
      const w = mountColumn({}, { empty: (p: { over: boolean }) => h('em', `over=${p.over}`) })
      fire(w.element, 'dragenter', { dataTransfer: cardDt('x') })
      await nextTick()
      expect(w.find('em').text()).toBe('over=true')
    })

    it('computes the insertion index from card midpoints', () => {
      const w = threeCards()
      const rects = [
        { top: 0, height: 20 },
        { top: 30, height: 20 },
        { top: 60, height: 20 },
      ]
      w.findAll('[data-slot="board-card"]').forEach((c, i) => {
        c.element.getBoundingClientRect = () => rects[i] as DOMRect
      })
      const drop = (y: number, id = 'x') => {
        fire(w.element, 'drop', { dataTransfer: cardDt(id, 'doing'), clientY: y })
        return (w.emitted('move')!.at(-1)![0] as BoardColumnMoveEvent).index
      }
      expect(drop(-5)).toBe(0)
      expect(drop(5)).toBe(0)
      expect(drop(15)).toBe(1)
      expect(drop(45)).toBe(2)
      expect(drop(500)).toBe(3)
    })

    it('ignores the dragged card itself when computing the index (reorder inside a column)', () => {
      const w = threeCards()
      const rects: Record<string, { top: number; height: number }> = { a: { top: 0, height: 20 }, b: { top: 30, height: 20 }, c: { top: 60, height: 20 } }
      w.findAll('[data-slot="board-card"]').forEach((c) => {
        c.element.getBoundingClientRect = () => rects[(c.element as HTMLElement).dataset.cardId!] as DOMRect
      })
      fire(w.element, 'drop', { dataTransfer: cardDt('a', 'todo'), clientY: 500 })
      expect((w.emitted('move')![0][0] as BoardColumnMoveEvent).index).toBe(2)
    })

    it('appends when clientY is missing or NaN', () => {
      const w = threeCards()
      fire(w.element, 'drop', { dataTransfer: cardDt('x') })
      fire(w.element, 'drop', { dataTransfer: cardDt('x'), clientY: NaN })
      expect(w.emitted('move')!.map((m) => (m[0] as BoardColumnMoveEvent).index)).toEqual([3, 3])
    })

    it('leaves `from` undefined for cards without a source column', () => {
      const w = mountColumn()
      fire(w.element, 'drop', { dataTransfer: cardDt('x') })
      expect(w.emitted('move')![0][0]).toEqual({ cardId: 'x', from: undefined, to: 'todo', index: 0 })
    })

    it('uses the in-page drag record when dataTransfer is missing or unreadable', () => {
      const w = mountColumn()
      setActiveBoardDrag({ id: 'live', from: 'doing' })
      fire(w.element, 'drop')
      const dt = cardDt('ignored')
      dt.throwOnGet = true
      fire(w.element, 'drop', { dataTransfer: dt })
      expect(w.emitted('move')!.map((m) => (m[0] as BoardColumnMoveEvent).cardId)).toEqual(['live', 'live'])
    })

    it('sets no dropEffect when dataTransfer is missing', () => {
      const w = mountColumn()
      setActiveBoardDrag({ id: 'live' })
      expect(fire(w.element, 'dragover').defaultPrevented).toBe(true)
    })
  })

  describe('acceptFrom / disabled', () => {
    it('rejects cards from other columns, accepts listed ones and own reorders', async () => {
      const w = mountColumn({ acceptFrom: ['backlog'] })
      setActiveBoardDrag({ id: 'x', from: 'doing' })
      expect(fire(w.element, 'dragenter').defaultPrevented).toBe(false)
      expect(fire(w.element, 'dragover').defaultPrevented).toBe(false)
      await nextTick()
      expect(w.attributes('data-over')).toBeUndefined()
      fire(w.element, 'drop', { dataTransfer: cardDt('x', 'doing') })
      expect(w.emitted('move')).toBeUndefined()

      setActiveBoardDrag({ id: 'y', from: 'backlog' })
      expect(fire(w.element, 'dragenter').defaultPrevented).toBe(true)
      fire(w.element, 'drop', { dataTransfer: cardDt('y', 'backlog') })
      setActiveBoardDrag({ id: 'z', from: 'todo' })
      fire(w.element, 'drop', { dataTransfer: cardDt('z', 'todo') })
      expect(w.emitted('move')!.map((m) => (m[0] as BoardColumnMoveEvent).cardId)).toEqual(['y', 'z'])
    })

    it('rejects cards with unknown source when acceptFrom is set', () => {
      const w = mountColumn({ acceptFrom: ['backlog'] })
      fire(w.element, 'drop', { dataTransfer: cardDt('x') })
      expect(w.emitted('move')).toBeUndefined()
    })

    it('empty acceptFrom accepts everything', () => {
      const w = mountColumn({ acceptFrom: [] })
      fire(w.element, 'drop', { dataTransfer: cardDt('x', 'anywhere') })
      expect(w.emitted('move')).toHaveLength(1)
    })

    it('disabled column dims, never highlights and never emits', async () => {
      const w = mountColumn({ disabled: true })
      expect(w.attributes('aria-disabled')).toBe('true')
      expect(w.attributes('data-disabled')).toBe('true')
      expect(fire(w.element, 'dragenter', { dataTransfer: cardDt('x') }).defaultPrevented).toBe(false)
      expect(fire(w.element, 'dragover', { dataTransfer: cardDt('x') }).defaultPrevented).toBe(false)
      const drop = fire(w.element, 'drop', { dataTransfer: cardDt('x') })
      await nextTick()
      expect(drop.defaultPrevented).toBe(false)
      expect(w.attributes('data-over')).toBeUndefined()
      expect(w.emitted('move')).toBeUndefined()
    })
  })

  describe('foreign data', () => {
    it('ignores files and plain text drags', async () => {
      const w = mountColumn()
      const dt = new FakeDataTransfer()
      dt.setData('text/plain', 'hello')
      expect(fire(w.element, 'dragenter', { dataTransfer: dt }).defaultPrevented).toBe(false)
      expect(fire(w.element, 'dragover', { dataTransfer: dt }).defaultPrevented).toBe(false)
      const drop = fire(w.element, 'drop', { dataTransfer: dt })
      await nextTick()
      expect(drop.defaultPrevented).toBe(false)
      expect(w.attributes('data-over')).toBeUndefined()
      expect(w.emitted('move')).toBeUndefined()
    })

    it('ignores events without any dataTransfer', () => {
      const w = mountColumn()
      expect(fire(w.element, 'dragenter').defaultPrevented).toBe(false)
      fire(w.element, 'drop')
      expect(w.emitted('move')).toBeUndefined()
    })

    it('ignores drops carrying our MIME type with a malformed payload', () => {
      const w = mountColumn()
      for (const bad of ['{nope', '{}', '[]', 'null', '{"id":7}']) {
        const dt = new FakeDataTransfer()
        dt.setData(BOARD_CARD_MIME, bad)
        const e = fire(w.element, 'drop', { dataTransfer: dt })
        expect(e.defaultPrevented).toBe(false)
      }
      expect(w.emitted('move')).toBeUndefined()
    })

    it('accepts a cross-window drag by MIME type alone (no in-page record)', async () => {
      const w = mountColumn({ acceptFrom: ['elsewhere'] })
      expect(fire(w.element, 'dragenter', { dataTransfer: cardDt('x', 'other') }).defaultPrevented).toBe(true)
      await nextTick()
      expect(w.attributes('data-over')).toBe('true')
    })
  })

  describe('enter/leave counter', () => {
    it('stays highlighted while moving across children and clears on the last leave', async () => {
      const w = threeCards()
      const dt = cardDt('x')
      const child = w.find('[data-slot="board-card"]').element
      fire(w.element, 'dragenter', { dataTransfer: dt })
      fire(child, 'dragenter', { dataTransfer: dt }) // bubbles
      fire(w.element, 'dragleave') // leaving the column root, now over the child
      await nextTick()
      expect(w.attributes('data-over')).toBe('true')
      fire(child, 'dragleave')
      await nextTick()
      expect(w.attributes('data-over')).toBeUndefined()
    })

    it('extra leaves never drive the counter negative', async () => {
      const w = mountColumn()
      const dt = cardDt('x')
      fire(w.element, 'dragleave')
      fire(w.element, 'dragleave')
      fire(w.element, 'dragenter', { dataTransfer: dt })
      await nextTick()
      expect(w.attributes('data-over')).toBe('true')
      fire(w.element, 'dragleave')
      await nextTick()
      expect(w.attributes('data-over')).toBeUndefined()
    })

    it('survives 200 rapid enter/leave pairs', async () => {
      const w = mountColumn()
      const dt = cardDt('x')
      for (let i = 0; i < 200; i++) {
        fire(w.element, 'dragenter', { dataTransfer: dt })
        fire(w.element, 'dragleave')
      }
      await nextTick()
      expect(w.attributes('data-over')).toBeUndefined()
      fire(w.element, 'dragenter', { dataTransfer: dt })
      await nextTick()
      expect(w.attributes('data-over')).toBe('true')
    })

    it('a dragover without a prior dragenter still highlights and a leave clears it', async () => {
      const w = mountColumn()
      fire(w.element, 'dragover', { dataTransfer: cardDt('x') })
      await nextTick()
      expect(w.attributes('data-over')).toBe('true')
      fire(w.element, 'dragleave')
      await nextTick()
      expect(w.attributes('data-over')).toBeUndefined()
    })

    it('window dragend / drop reset a stuck highlight (cancelled drag)', async () => {
      const w = mountColumn()
      fire(w.element, 'dragenter', { dataTransfer: cardDt('x') })
      await nextTick()
      fire(window, 'dragend')
      await nextTick()
      expect(w.attributes('data-over')).toBeUndefined()
      fire(w.element, 'dragenter', { dataTransfer: cardDt('x') })
      await nextTick()
      fire(window, 'drop')
      await nextTick()
      expect(w.attributes('data-over')).toBeUndefined()
    })

    it('removes window listeners on unmount', () => {
      const add = vi.spyOn(window, 'addEventListener')
      const remove = vi.spyOn(window, 'removeEventListener')
      const w = mount(BoardColumn, { props: { id: 'a' } })
      const added = add.mock.calls.filter((c) => c[0] === 'dragend' || c[0] === 'drop')
      expect(added).toHaveLength(2)
      w.unmount()
      for (const [type, fn] of added) expect(remove).toHaveBeenCalledWith(type, fn)
    })
  })

  describe('customisation', () => {
    it('merges class last and falls attrs through', () => {
      const w = mountColumn({ class: 'p-10 custom' }, {})
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('p-10')
      expect(w.classes()).not.toContain('p-2')
      const a = mount(BoardColumn, { props: { id: 'a' }, attrs: { 'data-testid': 't', 'aria-label': 'Col' } })
      expect(a.attributes('data-testid')).toBe('t')
      expect(a.attributes('aria-label')).toBe('Col')
    })

    it.each(['default', 'muted', 'outline'] as const)('renders variant %s', (variant) => {
      expect(mountColumn({ variant }).classes().join(' ')).toContain(boardColumnVariants({ variant }).split(' ').find((c) => c.startsWith('bg-') || c.startsWith('border-'))!)
    })

    it.each([
      ['sm', 'text-xs'],
      ['md', 'text-sm'],
      ['lg', 'text-base'],
    ] as const)('renders size %s', (size, cls) => {
      expect(mountColumn({ size }).classes()).toContain(cls)
    })

    it('boardColumnVariants is reusable standalone', () => {
      expect(boardColumnVariants({ over: true })).toContain('ring-primary/30')
      expect(boardColumnVariants()).toContain('rounded-lg')
    })
  })

  describe('edge cases', () => {
    it('no title: no heading and no aria-labelledby', () => {
      const w = mountColumn({ title: undefined })
      expect(w.find('[data-slot="board-column-title"]').exists()).toBe(false)
      expect(w.attributes('aria-labelledby')).toBeUndefined()
    })

    it.each([-1, NaN, Infinity])('invalid count %s falls back to the slot count', (count) => {
      const w = mountColumn({ count }, { default: () => h(BoardCard, { id: 'a' }) })
      expect(w.find('[data-slot="board-column-count"]').text()).toBe('1')
    })

    it('count 0 is honoured and fractional counts are floored', () => {
      const w = mountColumn({ count: 0 }, { default: () => h(BoardCard, { id: 'a' }) })
      expect(w.find('[data-slot="board-column-count"]').text()).toBe('0')
      expect(w.find('[data-slot="board-column-empty"]').exists()).toBe(true)
      expect(mountColumn({ count: 2.9 }).find('[data-slot="board-column-count"]').text()).toBe('2')
    })

    it('counts fragments, ignores comments and blank text', () => {
      const w = mountColumn(
        {},
        {
          default: () => [createCommentVNode('c'), '  ', 'loose text', [h(BoardCard, { id: 'a' }), h(BoardCard, { id: 'b' })]],
        },
      )
      expect(w.find('[data-slot="board-column-count"]').text()).toBe('3')
    })

    it('copes with 1000 cards', () => {
      const w = mountColumn({}, { default: () => Array.from({ length: 1000 }, (_, i) => h(BoardCard, { id: `c${i}`, key: i })) })
      expect(w.find('[data-slot="board-column-count"]').text()).toBe('1000')
    })

    it('unicode / RTL titles render untouched', () => {
      expect(mountColumn({ title: 'قيد التنفيذ 🚧' }).find('[data-slot="board-column-title"]').text()).toBe('قيد التنفيذ 🚧')
    })

    it('end-to-end: dragging a card from one column and dropping on another', async () => {
      const moves: BoardColumnMoveEvent[] = []
      const Host = defineComponent({
        setup: () => () =>
          h('div', [
            h(BoardColumn, { id: 'todo', onMove: (e: BoardColumnMoveEvent) => moves.push(e) }, () => h(BoardCard, { id: 'a' })),
            h(BoardColumn, { id: 'done', onMove: (e: BoardColumnMoveEvent) => moves.push(e) }),
          ]),
      })
      const w = mount(Host, { attachTo: document.body })
      mounted.push(w as unknown as VueWrapper)
      const dt = new FakeDataTransfer()
      const card = w.find('[data-slot="board-card"]').element
      fire(card, 'dragstart', { dataTransfer: dt })
      const done = w.find('[data-column-id="done"]').element
      fire(done, 'dragenter', { dataTransfer: dt })
      fire(done, 'dragover', { dataTransfer: dt })
      fire(done, 'drop', { dataTransfer: dt, clientY: 10 })
      fire(card, 'dragend')
      await nextTick()
      expect(moves).toEqual([{ cardId: 'a', from: 'todo', to: 'done', index: 0 }])
      expect(getActiveBoardDrag()).toBeNull()
    })
  })

  describe('announcements', () => {
    it('has a polite status region that starts empty', () => {
      const w = threeCards()
      const s = w.find('[data-slot="board-column-status"]')
      expect(s.attributes('role')).toBe('status')
      expect(s.classes()).toContain('sr-only')
      expect(s.text()).toBe('')
    })

    it('announces a drop with the card title, the column and the position', async () => {
      const w = mountColumn({}, { default: () => [h(BoardCard, { id: 'a', title: 'Write docs' })] })
      const other = mount(BoardCard, { props: { id: 'x', title: 'Moved card' }, attachTo: document.body })
      fire(w.element, 'drop', { dataTransfer: cardDt('x', 'doing'), clientY: 0 })
      await nextTick()
      await nextTick()
      expect(w.find('[data-slot="board-column-status"]').text()).toBe('Moved Moved card to To do, position 1')
      other.unmount()
    })

    it('falls back to the card id and the column id, and announce() can be called for keyboard moves', async () => {
      const w = mountColumn({ title: undefined })
      fire(w.element, 'drop', { dataTransfer: cardDt('ghost'), clientY: 0 })
      await nextTick()
      await nextTick()
      expect(w.find('[data-slot="board-column-status"]').text()).toBe('Moved ghost to todo, position 1')
      ;(w.vm as unknown as { announce: (m: string) => void }).announce('Moved by keyboard')
      await nextTick()
      await nextTick()
      expect(w.find('[data-slot="board-column-status"]').text()).toBe('Moved by keyboard')
    })

    it('the count unit is singular for one card', () => {
      const w = mountColumn({}, { default: () => [h(BoardCard, { id: 'a' })] })
      expect(w.find('[data-slot="board-column-count-label"]').text()).toBe('card')
    })
  })
})
