import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { BoardCard, boardCardVariants } from './index'
import { BOARD_CARD_MIME, BoardColumnIdKey, getActiveBoardDrag, parseBoardDragPayload, setActiveBoardDrag } from './boardDrag'

class FakeDataTransfer {
  data = new Map<string, string>()
  effectAllowed = 'uninitialized'
  dropEffect = 'none'
  throwOnSet = false
  get types() {
    return [...this.data.keys()]
  }
  setData(type: string, value: string) {
    if (this.throwOnSet) throw new Error('nope')
    this.data.set(type, value)
  }
  getData(type: string) {
    return this.data.get(type) ?? ''
  }
}

function fire(el: Element, type: string, extra: Record<string, unknown> = {}) {
  const e = new Event(type, { bubbles: true, cancelable: true })
  for (const [k, v] of Object.entries(extra)) Object.defineProperty(e, k, { value: v })
  el.dispatchEvent(e)
  return e
}

afterEach(() => setActiveBoardDrag(null))

describe('BoardCard', () => {
  describe('good path', () => {
    it('renders a focusable draggable list item with slot content and title', () => {
      const w = mount(BoardCard, { props: { id: 'c1', title: 'Fix bug' }, slots: { default: 'Body text' } })
      expect(w.attributes('data-slot')).toBe('board-card')
      expect(w.attributes('role')).toBe('listitem')
      expect(w.attributes('draggable')).toBe('true')
      expect(w.attributes('tabindex')).toBe('0')
      expect(w.attributes('data-card-id')).toBe('c1')
      expect(w.attributes('aria-keyshortcuts')).toContain('Alt+ArrowLeft')
      expect(w.find('[data-slot="board-card-title"]').text()).toBe('Fix bug')
      expect(w.text()).toContain('Body text')
    })

    it('omits the title element without a title', () => {
      expect(mount(BoardCard, { props: { id: 'c1' } }).find('[data-slot="board-card-title"]').exists()).toBe(false)
    })

    it('dragstart writes the payload, marks dragging and emits', async () => {
      const w = mount(BoardCard, { props: { id: 'c1', columnId: 'todo' } })
      const dt = new FakeDataTransfer()
      fire(w.element, 'dragstart', { dataTransfer: dt })
      await nextTick()
      expect(JSON.parse(dt.getData(BOARD_CARD_MIME))).toEqual({ id: 'c1', from: 'todo' })
      expect(dt.getData('text/plain')).toBe('c1')
      expect(dt.effectAllowed).toBe('move')
      expect(w.attributes('data-dragging')).toBe('true')
      expect(w.classes()).toContain('opacity-50')
      expect(w.emitted('dragstart')).toEqual([['c1']])
      expect(getActiveBoardDrag()).toEqual({ id: 'c1', from: 'todo' })
    })

    it('dragend clears dragging and emits once', async () => {
      const w = mount(BoardCard, { props: { id: 'c1' } })
      fire(w.element, 'dragstart', { dataTransfer: new FakeDataTransfer() })
      fire(w.element, 'dragend')
      fire(w.element, 'dragend') // duplicate dragend is ignored
      await nextTick()
      expect(w.attributes('data-dragging')).toBeUndefined()
      expect(w.emitted('dragend')).toEqual([['c1']])
      expect(getActiveBoardDrag()).toBeNull()
    })

    it('exposes dragging to the default slot', async () => {
      const w = mount(BoardCard, { props: { id: 'c1' }, slots: { default: ({ dragging }: { dragging: boolean }) => (dragging ? 'moving' : 'idle') } })
      expect(w.text()).toContain('idle')
      fire(w.element, 'dragstart', { dataTransfer: new FakeDataTransfer() })
      await nextTick()
      expect(w.text()).toContain('moving')
    })

    it('reads the column id from an enclosing BoardColumn provider', () => {
      const Parent = defineComponent({
        setup: () => {
          return () => h(BoardCard, { id: 'c1' })
        },
        provide: { [BoardColumnIdKey as symbol]: ref('doing') },
      })
      const w = mount(Parent)
      const dt = new FakeDataTransfer()
      fire(w.element, 'dragstart', { dataTransfer: dt })
      expect(JSON.parse(dt.getData(BOARD_CARD_MIME)).from).toBe('doing')
    })

    it('columnId prop wins over the provider', () => {
      const Parent = defineComponent({
        setup: () => () => h(BoardCard, { id: 'c1', columnId: 'own' }),
        provide: { [BoardColumnIdKey as symbol]: ref('doing') },
      })
      const dt = new FakeDataTransfer()
      fire(mount(Parent).element, 'dragstart', { dataTransfer: dt })
      expect(JSON.parse(dt.getData(BOARD_CARD_MIME)).from).toBe('own')
    })
  })

  describe('keyboard alternative', () => {
    it.each([
      ['ArrowUp', 'up'],
      ['ArrowDown', 'down'],
      ['ArrowLeft', 'left'],
      ['ArrowRight', 'right'],
    ])('Alt+%s emits move %s', async (key, direction) => {
      const w = mount(BoardCard, { props: { id: 'c1', columnId: 'todo' } })
      await w.trigger('keydown', { key, altKey: true })
      expect(w.emitted('move')).toEqual([[{ cardId: 'c1', direction, from: 'todo' }]])
    })

    it('prevents default scrolling on Alt+Arrow', () => {
      const w = mount(BoardCard, { props: { id: 'c1' } })
      expect(fire(w.element, 'keydown', { key: 'ArrowLeft', altKey: true }).defaultPrevented).toBe(true)
    })

    it('ignores plain arrows, other keys and extra modifiers', async () => {
      const w = mount(BoardCard, { props: { id: 'c1' } })
      await w.trigger('keydown', { key: 'ArrowLeft' })
      await w.trigger('keydown', { key: 'a', altKey: true })
      await w.trigger('keydown', { key: 'ArrowLeft', altKey: true, ctrlKey: true })
      await w.trigger('keydown', { key: 'ArrowLeft', altKey: true, metaKey: true })
      await w.trigger('keydown', { key: 'ArrowLeft', altKey: true, shiftKey: true })
      expect(w.emitted('move')).toBeUndefined()
    })

    it('ignores keys typed inside nested controls', () => {
      const w = mount(BoardCard, { props: { id: 'c1' }, slots: { default: '<input class="inner" />' } })
      fire(w.find('.inner').element, 'keydown', { key: 'ArrowLeft', altKey: true })
      expect(w.emitted('move')).toBeUndefined()
    })
  })

  describe('customisation', () => {
    it('merges class last so it wins', () => {
      const w = mount(BoardCard, { props: { id: 'c1', class: 'p-8 custom' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('p-8')
      expect(w.classes()).not.toContain('p-3')
    })

    it('falls attrs through', () => {
      const w = mount(BoardCard, { props: { id: 'c1' }, attrs: { 'data-testid': 'x', 'aria-label': 'Card' } })
      expect(w.attributes('data-testid')).toBe('x')
      expect(w.attributes('aria-label')).toBe('Card')
    })

    it.each(['default', 'outline', 'flat'] as const)('renders variant %s', (variant) => {
      expect(mount(BoardCard, { props: { id: 'c1', variant } }).classes().join(' ')).toContain(boardCardVariants({ variant }).split(' ')[0])
    })

    it.each([
      ['sm', 'text-xs'],
      ['md', 'text-sm'],
      ['lg', 'text-base'],
    ] as const)('renders size %s', (size, cls) => {
      expect(mount(BoardCard, { props: { id: 'c1', size } }).classes()).toContain(cls)
    })

    it('boardCardVariants is reusable standalone', () => {
      expect(boardCardVariants({ variant: 'flat', class: 'x' })).toContain('bg-secondary')
      expect(boardCardVariants()).toContain('border')
    })
  })

  describe('bad path', () => {
    it('disabled blocks dragstart, keyboard move and removes draggable', async () => {
      const w = mount(BoardCard, { props: { id: 'c1', disabled: true } })
      expect(w.attributes('draggable')).toBe('false')
      expect(w.attributes('aria-disabled')).toBe('true')
      expect(w.attributes('aria-keyshortcuts')).toBeUndefined()
      const e = fire(w.element, 'dragstart', { dataTransfer: new FakeDataTransfer() })
      expect(e.defaultPrevented).toBe(true)
      expect(w.emitted('dragstart')).toBeUndefined()
      expect(getActiveBoardDrag()).toBeNull()
      await w.trigger('keydown', { key: 'ArrowLeft', altKey: true })
      expect(w.emitted('move')).toBeUndefined()
    })

    it('survives a missing dataTransfer', () => {
      const w = mount(BoardCard, { props: { id: 'c1' } })
      fire(w.element, 'dragstart')
      expect(w.emitted('dragstart')).toEqual([['c1']])
      expect(getActiveBoardDrag()).toEqual({ id: 'c1' })
    })

    it('survives dataTransfer.setData throwing', () => {
      const w = mount(BoardCard, { props: { id: 'c1' } })
      const dt = new FakeDataTransfer()
      dt.throwOnSet = true
      expect(() => fire(w.element, 'dragstart', { dataTransfer: dt })).not.toThrow()
      expect(w.emitted('dragstart')).toHaveLength(1)
    })

    it('dragend without a dragstart is ignored', () => {
      const w = mount(BoardCard, { props: { id: 'c1' } })
      fire(w.element, 'dragend')
      expect(w.emitted('dragend')).toBeUndefined()
    })

    it('dragend does not clear another card\'s record', () => {
      const w = mount(BoardCard, { props: { id: 'c1' } })
      fire(w.element, 'dragstart', { dataTransfer: new FakeDataTransfer() })
      setActiveBoardDrag({ id: 'other' })
      fire(w.element, 'dragend')
      expect(getActiveBoardDrag()).toEqual({ id: 'other' })
    })
  })

  describe('edge cases', () => {
    it('unmounting mid-drag clears the active record', () => {
      const w = mount(BoardCard, { props: { id: 'c1' } })
      fire(w.element, 'dragstart', { dataTransfer: new FakeDataTransfer() })
      expect(getActiveBoardDrag()).not.toBeNull()
      w.unmount()
      expect(getActiveBoardDrag()).toBeNull()
    })

    it('unmounting an idle card leaves a foreign record alone', () => {
      const w = mount(BoardCard, { props: { id: 'c1' } })
      setActiveBoardDrag({ id: 'other' })
      w.unmount()
      expect(getActiveBoardDrag()).toEqual({ id: 'other' })
    })

    it('unmounting mid-drag does not clear a different card\'s record', () => {
      const w = mount(BoardCard, { props: { id: 'c1' } })
      fire(w.element, 'dragstart', { dataTransfer: new FakeDataTransfer() })
      setActiveBoardDrag({ id: 'other' })
      w.unmount()
      expect(getActiveBoardDrag()).toEqual({ id: 'other' })
    })

    it('handles unicode and empty-looking ids in the payload', () => {
      const w = mount(BoardCard, { props: { id: 'карта-🚀' } })
      const dt = new FakeDataTransfer()
      fire(w.element, 'dragstart', { dataTransfer: dt })
      expect(parseBoardDragPayload(dt.getData(BOARD_CARD_MIME))).toEqual({ id: 'карта-🚀' })
    })

    it('rapid dragstart/dragend cycles stay consistent', async () => {
      const w = mount(BoardCard, { props: { id: 'c1' } })
      for (let i = 0; i < 50; i++) {
        fire(w.element, 'dragstart', { dataTransfer: new FakeDataTransfer() })
        fire(w.element, 'dragend')
      }
      await nextTick()
      expect(w.emitted('dragstart')).toHaveLength(50)
      expect(w.emitted('dragend')).toHaveLength(50)
      expect(w.attributes('data-dragging')).toBeUndefined()
    })
  })
})

describe('parseBoardDragPayload', () => {
  it('parses valid payloads', () => {
    expect(parseBoardDragPayload('{"id":"a","from":"x"}')).toEqual({ id: 'a', from: 'x' })
    expect(parseBoardDragPayload('{"id":"a"}')).toEqual({ id: 'a' })
    expect(parseBoardDragPayload('{"id":"a","from":""}')).toEqual({ id: 'a' })
    expect(parseBoardDragPayload('{"id":"a","from":5}')).toEqual({ id: 'a' })
  })

  it.each([undefined, null, '', 'not json', 'null', '5', '"str"', '{}', '{"id":""}', '{"id":5}', '[]'])('rejects %j', (raw) => {
    expect(parseBoardDragPayload(raw)).toBeNull()
  })

  describe('keyboard hint', () => {
    it('describes the Alt+Arrow shortcut to assistive technology', () => {
      const w = mount(BoardCard, { props: { id: 'k' } })
      const hint = w.find('[data-slot="board-card-hint"]')
      expect(hint.text()).toBe('Hold Alt and press an arrow key to move this card.')
      expect(hint.classes()).toContain('sr-only')
      expect(w.attributes('aria-describedby')).toBe(hint.attributes('id'))
    })

    it('a disabled card has no hint and no description', () => {
      const w = mount(BoardCard, { props: { id: 'k', disabled: true } })
      expect(w.find('[data-slot="board-card-hint"]').exists()).toBe(false)
      expect(w.attributes('aria-describedby')).toBeUndefined()
    })
  })
})
