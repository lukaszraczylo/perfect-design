import type { HTMLAttributes } from 'vue'

/** Every component accepts `class`; it is merged LAST so it always wins over internal classes. */
export interface BaseProps {
  class?: HTMLAttributes['class']
}

/** Shared size scale. Components may support a subset and document which. */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** Shared semantic tone scale used by Badge, Alert, Progress, Callout, StatusDot... */
export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

/** Anything renderable as an element swap (reka-ui Primitive contract). */
export type AsTag = string | object
