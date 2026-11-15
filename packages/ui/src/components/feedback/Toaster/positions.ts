export type ToasterPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

/** Anchoring classes for each of the six position presets. */
export const TOASTER_POSITION_CLASSES: Record<ToasterPosition, string> = {
  'top-left': 'top-0 left-0',
  'top-center': 'top-0 left-1/2 -translate-x-1/2',
  'top-right': 'top-0 right-0',
  'bottom-left': 'bottom-0 left-0',
  'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-0 right-0',
}

/** All six position presets: top/bottom x left/center/right. */
export const TOASTER_POSITIONS = Object.keys(TOASTER_POSITION_CLASSES) as ToasterPosition[]
