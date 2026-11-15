import { onMounted } from 'vue'
import { violation } from '../../../lib/contract'

export interface ModelPickerOption {
  /** Stable identifier; this is the `v-model` value. Non-empty and unique across all groups. */
  id: string
  /** Visible name. It is shown in the input once selected and matched while typing. */
  label: string
  /** One line under the label. Also matched while typing. */
  description?: string
  /** Short text tags shown after the label ("Fast", "Preview"). Rendered as text, not matched while typing. */
  badges?: string[]
  disabled?: boolean
  /** Group heading for a flat list. Options with the same `group` are gathered under one heading, in order of first appearance. */
  group?: string
}

export interface ModelPickerGroup {
  /** Visible group heading (required). */
  label: string
  options: ModelPickerOption[]
}

export interface ResolvedGroup {
  /** Heading, or `''` for options that belong to no group. */
  label: string
  options: ModelPickerOption[]
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const isGroup = (v: unknown): v is ModelPickerGroup => isObject(v) && Array.isArray(v.options)
const isUsable = (o: unknown): o is ModelPickerOption => isObject(o) && typeof o.id === 'string' && o.id.trim() !== ''

/** Options that can be rendered: an object with a non-empty string `id`. The contract check reports the rest. */
export function usableOptions(options: unknown): ModelPickerOption[] {
  return flatten(options).filter(isUsable)
}

function flatten(options: unknown): unknown[] {
  if (!Array.isArray(options)) return []
  return options.flatMap((e) => (isGroup(e) ? (e.options as unknown[]) : [e]))
}

/**
 * Normalises the `options` prop into ordered groups. An entry with an `options` array is a group; any other entry is an option
 * and joins the group named by its `group` key (or the unnamed group). Unusable options are skipped, empty groups dropped.
 */
export function resolveGroups(options: unknown): ResolvedGroup[] {
  if (!Array.isArray(options)) return []
  const out: ResolvedGroup[] = []
  const byLabel = new Map<string, ResolvedGroup>()
  const bucket = (label: string, merge: boolean): ResolvedGroup => {
    const found = merge ? byLabel.get(label) : undefined
    if (found) return found
    const g: ResolvedGroup = { label, options: [] }
    out.push(g)
    if (merge) byLabel.set(label, g)
    return g
  }
  for (const entry of options) {
    if (isGroup(entry)) {
      const g = bucket(typeof entry.label === 'string' ? entry.label : '', false)
      g.options.push(...entry.options.filter(isUsable))
    } else if (isUsable(entry)) {
      bucket(typeof entry.group === 'string' ? entry.group.trim() : '', true).options.push(entry)
    }
  }
  return out.filter((g) => g.options.length > 0)
}

/** Text the typed search is matched against: the label and the description. */
export const searchText = (o: ModelPickerOption): string => [o.label, o.description].filter((s) => typeof s === 'string' && s).join(' ')

/**
 * Contract: every option needs a non-empty unique `id` and a non-empty `label`, every group a non-empty `label`.
 * Reports the first problem from a mounted hook (never during setup or render).
 */
export function useModelPickerContract(options: () => unknown): void {
  onMounted(() => {
    const seen = new Set<string>()
    const entries = Array.isArray(options()) ? (options() as unknown[]) : []
    for (const entry of entries) {
      if (isGroup(entry) && (typeof entry.label !== 'string' || entry.label.trim() === '')) {
        violation('ModelPicker', 'requires-group-label', 'requires a non-empty `label` on every group. Give each `{ label, options }` group a heading, or put the options in a flat list without groups.')
        return
      }
    }
    for (const o of flatten(entries)) {
      if (!isObject(o) || typeof o.id !== 'string' || o.id.trim() === '') {
        violation('ModelPicker', 'requires-id', 'requires a non-empty string `id` on every option. Give each option its own id (an empty id is reserved for "nothing selected").')
        return
      }
      if (seen.has(o.id)) {
        violation('ModelPicker', 'unique-id', `requires a unique \`id\` on every option, but "${o.id}" is used more than once. Give each option its own id.`)
        return
      }
      seen.add(o.id)
      if (typeof o.label !== 'string' || o.label.trim() === '') {
        violation('ModelPicker', 'requires-label', `requires a non-empty \`label\` on every option, but "${o.id}" has none. The label is the visible and accessible name of the option.`)
        return
      }
    }
  })
}
