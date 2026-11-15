/**
 * One shared interval for every `RelativeTime` that asks for live updates. Each subscriber states how often it wants to
 * be called; the single timer runs at the smallest requested period, and a subscriber is only called when its own
 * period has elapsed. The timer is created with the first subscriber, re-created when the smallest period changes and
 * cleared when the last subscriber leaves, so an idle page owns no timer.
 */
export const MIN_INTERVAL = 250
export const MAX_INTERVAL = 2_147_483_647

interface Subscriber {
  interval: number
  last: number
  callback: (now: number) => void
}

const subscribers = new Set<Subscriber>()
let timer: ReturnType<typeof setInterval> | null = null
let period = 0

/** Clamp an `updateInterval` value: not a positive finite number is 0 (off); otherwise 250 ms to the setInterval limit. */
export function normalizeInterval(value: unknown): number {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return 0
  return Math.min(MAX_INTERVAL, Math.max(MIN_INTERVAL, Math.trunc(n)))
}

function tick() {
  const now = Date.now()
  for (const s of [...subscribers]) {
    if (now - s.last >= s.interval - period / 2) {
      s.last = now
      s.callback(now)
    }
  }
}

function reschedule() {
  let next = 0
  for (const s of subscribers) next = next === 0 ? s.interval : Math.min(next, s.interval)
  if (next === period && (timer !== null) === (next > 0)) return
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
  period = next
  if (next > 0) timer = setInterval(tick, next)
}

/** Call `callback(Date.now())` about every `interval` ms until the returned function runs. Interval 0 or invalid: no-op. */
export function subscribeClock(interval: number, callback: (now: number) => void): () => void {
  const ms = normalizeInterval(interval)
  if (ms === 0) return () => {}
  const subscriber: Subscriber = { interval: ms, last: Date.now(), callback }
  subscribers.add(subscriber)
  reschedule()
  return () => {
    if (subscribers.delete(subscriber)) reschedule()
  }
}

/** For tests and debugging: how many subscribers, the timer period in ms (0 when idle) and whether a timer exists. */
export function clockStats() {
  return { subscribers: subscribers.size, period, active: timer !== null }
}
