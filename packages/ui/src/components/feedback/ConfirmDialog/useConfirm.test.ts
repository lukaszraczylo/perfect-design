import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { DEFAULT_CONFIRM_TITLE, useConfirm, useConfirmStore } from './useConfirm'

beforeEach(() => setActivePinia(createPinia()))

describe('useConfirmStore', () => {
  it('starts empty', () => {
    const s = useConfirmStore()
    expect(s.current).toBeNull()
    expect(s.queue).toHaveLength(0)
  })

  it('confirm() exposes the request as current and resolves true on accept', async () => {
    const s = useConfirmStore()
    const p = s.confirm({ title: 'Delete?', description: 'Sure', destructive: true })
    expect(s.current).toMatchObject({ title: 'Delete?', description: 'Sure', destructive: true })
    s.accept()
    await expect(p).resolves.toBe(true)
    expect(s.current).toBeNull()
  })

  it('resolves false on cancel', async () => {
    const s = useConfirmStore()
    const p = s.confirm({ title: 'x' })
    s.cancel()
    await expect(p).resolves.toBe(false)
  })

  it('queues concurrent requests and shows them one at a time, in order', async () => {
    const s = useConfirmStore()
    const a = s.confirm({ title: 'A' })
    const b = s.confirm({ title: 'B' })
    const c = s.confirm({ title: 'C' })
    expect(s.current?.title).toBe('A')
    s.accept()
    expect(s.current?.title).toBe('B')
    s.cancel()
    expect(s.current?.title).toBe('C')
    s.accept()
    await expect(Promise.all([a, b, c])).resolves.toEqual([true, false, true])
  })

  it('accept/cancel with nothing pending is a no-op', () => {
    const s = useConfirmStore()
    expect(() => {
      s.accept()
      s.cancel()
    }).not.toThrow()
  })

  it('blank or missing title falls back to a default', () => {
    const s = useConfirmStore()
    void s.confirm({ title: '   ' })
    expect(s.current?.title).toBe(DEFAULT_CONFIRM_TITLE)
    s.clear()
    void s.confirm({} as never)
    expect(s.current?.title).toBe(DEFAULT_CONFIRM_TITLE)
    void s.confirm(undefined as never)
    s.clear()
  })

  it('clear() resolves every pending request with false', async () => {
    const s = useConfirmStore()
    const ps = [s.confirm({ title: '1' }), s.confirm({ title: '2' }), s.confirm({ title: '3' })]
    s.clear()
    await expect(Promise.all(ps)).resolves.toEqual([false, false, false])
    expect(s.queue).toHaveLength(0)
  })

  it('request ids are unique', () => {
    const s = useConfirmStore()
    void s.confirm({ title: 'a' })
    void s.confirm({ title: 'b' })
    expect(new Set(s.queue.map((r) => r.id)).size).toBe(2)
    s.clear()
  })

  it('handles unicode / very long titles', () => {
    const s = useConfirmStore()
    const title = '削除 ' + 'x'.repeat(5000) + ' 🗑'
    void s.confirm({ title })
    expect(s.current?.title).toBe(title)
    s.clear()
  })
})

describe('useConfirm', () => {
  it('returns a confirm function bound to the store', async () => {
    const { confirm } = useConfirm()
    const p = confirm({ title: 'Go?' })
    useConfirmStore().accept()
    await expect(p).resolves.toBe(true)
  })
})
