import type { InjectionKey, Ref } from 'vue'

/** Custom MIME type placed on `dataTransfer` so columns can tell board cards from foreign drags. */
export const BOARD_CARD_MIME = 'application/x-perfect-design-board-card'

/** What a dragged card tells a column. `from` is the id of the column the card currently lives in, when known. */
export interface BoardDragPayload {
  id: string
  from?: string
}

/**
 * `dataTransfer.getData` is blocked while dragging over a target (only `types` are readable), so the card also
 * records itself here. Columns use it for `acceptFrom` checks during dragover. Module scope is SSR-safe: it is only
 * written from browser drag events.
 */
let active: BoardDragPayload | null = null
export const getActiveBoardDrag = (): BoardDragPayload | null => active
export const setActiveBoardDrag = (payload: BoardDragPayload | null): void => {
  active = payload
}

/** Provided by `BoardColumn` so child cards know where they live without a prop. */
export const BoardColumnIdKey: InjectionKey<Readonly<Ref<string>>> = Symbol('board-column-id')

/** Validate untrusted JSON from `dataTransfer`. Returns null for anything that is not a well-formed payload. */
export function parseBoardDragPayload(raw: string | null | undefined): BoardDragPayload | null {
  if (!raw) return null
  try {
    const data: unknown = JSON.parse(raw)
    if (data === null || typeof data !== 'object') return null
    const { id, from } = data as Record<string, unknown>
    if (typeof id !== 'string' || id === '') return null
    return typeof from === 'string' && from !== '' ? { id, from } : { id }
  } catch {
    return null
  }
}
