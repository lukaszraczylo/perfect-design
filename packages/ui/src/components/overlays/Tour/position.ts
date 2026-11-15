export type TourPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface TourRect {
  top: number
  left: number
  width: number
  height: number
}

export interface TourPosition {
  top: number
  left: number
  /** Placement actually used after flipping; `center` when there is no target rect. */
  placement: TourPlacement | 'center'
}

export const TOUR_PLACEMENTS: readonly TourPlacement[] = ['top', 'bottom', 'left', 'right']

const OPPOSITE: Record<TourPlacement, TourPlacement> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

export function isTourPlacement(value: unknown): value is TourPlacement {
  return TOUR_PLACEMENTS.includes(value as TourPlacement)
}

const finite = (n: number, fallback = 0) => (Number.isFinite(n) ? n : fallback)
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max < min ? min : max))

/**
 * Place a card of `card` size next to `target` (viewport coordinates). Flips to the opposite side
 * when the preferred side overflows and the opposite fits, then clamps into the viewport with `margin`.
 * Without a target the card is centred.
 */
export function computeTourPosition(
  target: TourRect | null,
  card: { width: number; height: number },
  viewport: { width: number; height: number },
  placement: TourPlacement = 'bottom',
  offset = 12,
  margin = 8,
): TourPosition {
  const cw = finite(card.width)
  const ch = finite(card.height)
  const vw = finite(viewport.width)
  const vh = finite(viewport.height)
  if (!target) {
    return { top: clamp((vh - ch) / 2, margin, vh - ch - margin), left: clamp((vw - cw) / 2, margin, vw - cw - margin), placement: 'center' }
  }
  const t = { top: finite(target.top), left: finite(target.left), width: finite(target.width), height: finite(target.height) }
  const preferred = isTourPlacement(placement) ? placement : 'bottom'
  const space: Record<TourPlacement, number> = {
    top: t.top - margin,
    bottom: vh - (t.top + t.height) - margin,
    left: t.left - margin,
    right: vw - (t.left + t.width) - margin,
  }
  const need = (p: TourPlacement) => (p === 'top' || p === 'bottom' ? ch : cw) + offset
  let used = preferred
  if (space[preferred] < need(preferred) && space[OPPOSITE[preferred]] >= need(OPPOSITE[preferred])) used = OPPOSITE[preferred]

  let top: number
  let left: number
  if (used === 'top') top = t.top - offset - ch
  else if (used === 'bottom') top = t.top + t.height + offset
  else top = t.top + t.height / 2 - ch / 2
  if (used === 'left') left = t.left - offset - cw
  else if (used === 'right') left = t.left + t.width + offset
  else left = t.left + t.width / 2 - cw / 2

  return { top: clamp(top, margin, vh - ch - margin), left: clamp(left, margin, vw - cw - margin), placement: used }
}

/** Resolve a step target (selector, element or getter) to a connected element, or null. Never throws. */
export function resolveTourTarget(target: unknown): HTMLElement | null {
  if (typeof document === 'undefined' || target == null) return null
  let el: unknown = target
  try {
    if (typeof target === 'function') el = (target as () => unknown)()
    else if (typeof target === 'string') el = target.trim() ? document.querySelector(target) : null
  } catch {
    return null
  }
  if (typeof HTMLElement === 'undefined' || !(el instanceof HTMLElement)) return null
  return el.isConnected ? el : null
}
