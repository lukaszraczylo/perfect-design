/**
 * Shared `tone` for the modal surfaces (Dialog, AlertDialog, Sheet). The tone tints the panel border only; it never
 * carries meaning on its own, so the title, description and action labels must say what the tone says.
 * `neutral` (the default) adds no classes.
 */
export const overlayTones = ['neutral', 'danger', 'warning', 'success', 'info'] as const
export type OverlayTone = (typeof overlayTones)[number]

export const overlayToneBorder: Record<OverlayTone, string> = {
  neutral: '',
  danger: 'border-destructive/50',
  warning: 'border-warning',
  success: 'border-success/50',
  info: 'border-info/50',
}

/** Unknown / missing values fall back to `neutral`. */
export const normalizeOverlayTone = (value: unknown): OverlayTone => ((overlayTones as readonly unknown[]).includes(value) ? (value as OverlayTone) : 'neutral')
