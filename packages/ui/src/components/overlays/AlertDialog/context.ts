import { inject, type InjectionKey } from 'vue'
import type { OverlayTone } from '../overlayTone'

/** Provided by `AlertDialogContent`: lets `AlertDialogAction` default to a destructive button in a `danger` dialog. */
export const ALERT_DIALOG_TONE_KEY: InjectionKey<() => OverlayTone> = Symbol('perfect-design:alert-dialog-tone')

export const useAlertDialogTone = (): OverlayTone => inject(ALERT_DIALOG_TONE_KEY, null)?.() ?? 'neutral'
