import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useControllableState, useDisclosure } from './index'

describe('useDisclosure', () => {
  it('starts closed by default and toggles/opens/closes', () => {
    const d = useDisclosure()
    expect(d.isOpen.value).toBe(false)
    d.open()
    expect(d.isOpen.value).toBe(true)
    d.toggle()
    expect(d.isOpen.value).toBe(false)
    d.toggle()
    d.close()
    expect(d.isOpen.value).toBe(false)
  })
  it('honours the initial value and coerces set() input', () => {
    const d = useDisclosure(true)
    expect(d.isOpen.value).toBe(true)
    d.set(false)
    expect(d.isOpen.value).toBe(false)
    // @ts-expect-error truthy non-boolean on purpose
    d.set('yes')
    expect(d.isOpen.value).toBe(true)
  })
  it('is idempotent: open() twice stays open', () => {
    const d = useDisclosure()
    d.open()
    d.open()
    expect(d.isOpen.value).toBe(true)
  })
})

describe('useControllableState', () => {
  it('uses local state when uncontrolled and still notifies', () => {
    const onChange = vi.fn()
    const s = useControllableState<string>(() => undefined, 'a', onChange)
    expect(s.value).toBe('a')
    s.value = 'b'
    expect(s.value).toBe('b')
    expect(onChange).toHaveBeenCalledWith('b')
  })
  it('follows the prop when controlled and does not mutate local state', () => {
    const prop = ref<string | undefined>('x')
    const onChange = vi.fn()
    const s = useControllableState<string>(() => prop.value, 'a', onChange)
    expect(s.value).toBe('x')
    s.value = 'y'
    expect(s.value).toBe('x') // parent has not accepted the change
    expect(onChange).toHaveBeenCalledWith('y')
    prop.value = 'y'
    expect(s.value).toBe('y')
  })
  it('falls back to local state when a controlled prop becomes undefined; null counts as controlled', () => {
    const prop = ref<string | null | undefined>(null)
    const s = useControllableState<string | null>(() => prop.value, 'a', () => {})
    expect(s.value).toBeNull()
    prop.value = undefined
    expect(s.value).toBe('a')
  })
})
