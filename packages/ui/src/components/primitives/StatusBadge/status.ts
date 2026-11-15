import type { Tone } from '../../../lib/types'

export type StatusBadgeTone = Tone

const TONES: readonly StatusBadgeTone[] = ['neutral', 'primary', 'success', 'warning', 'danger', 'info']

/**
 * Built-in status -> tone map. Keys are normalised (lower case, words joined with `_`).
 * Statuses missing from the map (and overrides) resolve to `neutral`.
 */
export const statusBadgeDefaultTones: Readonly<Record<string, StatusBadgeTone>> = Object.freeze({
  // healthy / done
  active: 'success',
  online: 'success',
  healthy: 'success',
  ok: 'success',
  success: 'success',
  succeeded: 'success',
  completed: 'success',
  complete: 'success',
  approved: 'success',
  enabled: 'success',
  connected: 'success',
  ready: 'success',
  passed: 'success',
  resolved: 'success',
  available: 'success',
  // waiting / needs attention
  pending: 'warning',
  warning: 'warning',
  degraded: 'warning',
  queued: 'warning',
  paused: 'warning',
  waiting: 'warning',
  expiring: 'warning',
  // work in progress
  running: 'info',
  in_progress: 'info',
  processing: 'info',
  syncing: 'info',
  starting: 'info',
  deploying: 'info',
  // informational
  info: 'info',
  new: 'info',
  draft: 'info',
  scheduled: 'info',
  // broken / blocked
  error: 'danger',
  failed: 'danger',
  failure: 'danger',
  offline: 'danger',
  down: 'danger',
  rejected: 'danger',
  critical: 'danger',
  unhealthy: 'danger',
  denied: 'danger',
  revoked: 'danger',
  blocked: 'danger',
  quarantined: 'danger',
  expired: 'danger',
  // inert
  inactive: 'neutral',
  disabled: 'neutral',
  unknown: 'neutral',
  archived: 'neutral',
  decommissioned: 'neutral',
  cancelled: 'neutral',
  canceled: 'neutral',
  stopped: 'neutral',
  idle: 'neutral',
})

const has = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key)
const isTone = (v: unknown): v is StatusBadgeTone => typeof v === 'string' && (TONES as readonly string[]).includes(v)

/** `'In Progress'`, `'in-progress'`, `' IN_PROGRESS '` -> `'in_progress'`. null/empty -> `'unknown'`. */
export function normalizeStatus(status: string | null | undefined): string {
  const key = String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '_')
  return key || 'unknown'
}

/** `'in_progress'` -> `'In progress'`. null/empty -> `'Unknown'`. */
export function humanizeStatus(status: string | null | undefined): string {
  const text = String(status ?? '')
    .replace(/[\s_-]+/g, ' ')
    .trim()
    .toLowerCase()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Unknown'
}

/**
 * Resolve the tone for a status string. `overrides` win over the built-in map; override keys are
 * normalised the same way as the status, and override values that are not valid tones are ignored.
 */
export function statusTone(status: string | null | undefined, overrides?: Record<string, StatusBadgeTone>): StatusBadgeTone {
  const key = normalizeStatus(status)
  if (overrides) {
    for (const [k, v] of Object.entries(overrides)) {
      if (normalizeStatus(k) === key && isTone(v)) return v
    }
  }
  return has(statusBadgeDefaultTones, key) ? statusBadgeDefaultTones[key]! : 'neutral'
}
