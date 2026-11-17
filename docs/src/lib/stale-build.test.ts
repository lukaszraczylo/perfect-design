import { describe, expect, it, vi } from 'vitest'
import { isChunkLoadError, reloadForNewBuild, RELOAD_WINDOW_MS } from './stale-build'

function memoryEnv(start = 1_000_000) {
  const store = new Map<string, string>()
  let clock = start
  const navigate = vi.fn()
  return {
    env: { storage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) }, now: () => clock, navigate },
    navigate,
    advance: (ms: number) => (clock += ms),
  }
}

describe('isChunkLoadError', () => {
  it('recognises the chunk errors of Chrome, Firefox, Safari and Vite', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/assets/Button.docs-abc.js'))).toBe(true)
    expect(isChunkLoadError(new TypeError('error loading dynamically imported module'))).toBe(true)
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(isChunkLoadError(new Error('Unable to preload CSS for /assets/x.css'))).toBe(true)
  })
  it('ignores other errors and non-errors', () => {
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false)
    expect(isChunkLoadError(undefined)).toBe(false)
    expect(isChunkLoadError('plain string')).toBe(false)
  })
})

describe('reloadForNewBuild', () => {
  it('loads the requested URL once', () => {
    const { env, navigate } = memoryEnv()
    expect(reloadForNewBuild('/components/primitives/button', env)).toBe(true)
    expect(navigate).toHaveBeenCalledWith('/components/primitives/button')
  })
  it('does not loop: a second failure inside the window returns false and does not navigate', () => {
    const { env, navigate, advance } = memoryEnv()
    reloadForNewBuild('/a', env)
    advance(RELOAD_WINDOW_MS - 1)
    expect(reloadForNewBuild('/a', env)).toBe(false)
    expect(navigate).toHaveBeenCalledTimes(1)
  })
  it('reloads again after the window, for a later deploy', () => {
    const { env, navigate, advance } = memoryEnv()
    reloadForNewBuild('/a', env)
    advance(RELOAD_WINDOW_MS + 1)
    expect(reloadForNewBuild('/b', env)).toBe(true)
    expect(navigate).toHaveBeenLastCalledWith('/b')
  })
  it('does nothing without storage or when storage throws', () => {
    const navigate = vi.fn()
    expect(reloadForNewBuild('/a', { storage: null, now: () => 0, navigate })).toBe(false)
    const throwing = { getItem: () => { throw new Error('blocked') }, setItem: () => undefined }
    expect(reloadForNewBuild('/a', { storage: throwing, now: () => 0, navigate })).toBe(false)
    expect(navigate).not.toHaveBeenCalled()
  })
})
