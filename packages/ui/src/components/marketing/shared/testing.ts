/** Test helpers for marketing components (IntersectionObserver / rAF / matchMedia fakes). Not exported from the barrel. */
import { vi } from 'vitest'

export interface FakeIO {
  callback: IntersectionObserverCallback
  options?: IntersectionObserverInit
  targets: Element[]
  disconnected: boolean
  fire(isIntersecting: boolean): void
}

/** Installs a controllable IntersectionObserver. Returns the list of created instances. */
export function installIntersectionObserver(): FakeIO[] {
  const instances: FakeIO[] = []
  class FakeObserver {
    fake: FakeIO
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.fake = {
        callback,
        options,
        targets: [],
        disconnected: false,
        fire: (isIntersecting) => {
          this.fake.callback(
            this.fake.targets.map((target) => ({ isIntersecting, target }) as IntersectionObserverEntry),
            this as unknown as IntersectionObserver,
          )
        },
      }
      instances.push(this.fake)
    }
    observe(el: Element) {
      this.fake.targets.push(el)
    }
    unobserve(el: Element) {
      this.fake.targets = this.fake.targets.filter((t) => t !== el)
    }
    disconnect() {
      this.fake.disconnected = true
    }
    takeRecords() {
      return []
    }
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver)
  return instances
}

/** Installs a manual requestAnimationFrame queue. `flush(ts)` runs the queued callbacks once with that timestamp. */
export function installRaf() {
  let queue = new Map<number, FrameRequestCallback>()
  let id = 0
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queue.set(++id, cb)
    return id
  })
  const cancel = vi.fn((n: number) => {
    queue.delete(n)
  })
  vi.stubGlobal('cancelAnimationFrame', cancel)
  return {
    cancel,
    pending: () => queue.size,
    flush(ts: number) {
      const current = queue
      queue = new Map()
      current.forEach((cb) => cb(ts))
    },
  }
}

export function mockMatchMedia(reduced: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduced && query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }))
}
