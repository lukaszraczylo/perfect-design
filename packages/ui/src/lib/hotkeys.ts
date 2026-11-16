/**
 * `useHotkeys`: keyboard shortcuts as data.
 *
 * - Combos: `"mod+k"` (`mod` is Cmd on macOS, Ctrl elsewhere), `"shift+/"`-style punctuation is written as the character
 *   it produces (`"?"`), sequences are joined with `then` (`"g then d"`, at most `MAX_SEQUENCE_STEPS` steps).
 * - Scope: the whole document by default, or one element (it must contain focus); events from text fields are ignored
 *   unless `allowInInputs` is set.
 * - Registry: every registration is listed in a reactive registry so `ShortcutsDialog` (or your own help screen) can show
 *   them with their `description` and `group`. Registration happens on mount in the browser only, so SSR never fills it.
 * - Conflicts (same combo, or one sequence being the start of another, in overlapping scopes) warn in development and are
 *   silent in production. Invalid combos are ignored (and warned about in development), never thrown.
 * No dependencies beyond Vue; every listener and timer is removed when the owning scope is disposed.
 */
import { computed, getCurrentInstance, getCurrentScope, onMounted, onScopeDispose, shallowRef, toValue, watch, type ComputedRef, type MaybeRefOrGetter, type ShallowRef } from 'vue'

/* ------------------------------------------------------------------ types */

export type HotkeyHandler = (event: KeyboardEvent) => void

/** Per-binding options; the same names are accepted as defaults in `UseHotkeysOptions`. */
export interface HotkeyOptions {
  /** What the shortcut does. Entries without a description are not listed in `ShortcutsDialog`. */
  description?: string
  /** Heading the shortcut is listed under. Default `General`. */
  group?: string
  /** Fire while focus is in an input, textarea, select or contenteditable element. Default `false`. */
  allowInInputs?: boolean
  /** Fire while a modal dialog (`aria-modal="true"`) is open and the key is pressed outside it. Default `false`. */
  allowInModal?: boolean
  /** Call `event.preventDefault()` when the shortcut fires. Default `true`. */
  preventDefault?: boolean
  /** Keep the shortcut out of the registry listing (it still works). Default `false`. */
  hidden?: boolean
  /** Turn the shortcut off without unregistering it. Read every time a key is pressed. Default `true`. */
  enabled?: MaybeRefOrGetter<boolean>
}

export interface HotkeyBinding extends HotkeyOptions {
  /** Combo such as `mod+k`, `?` or `g then d`. */
  keys: string
  handler: HotkeyHandler
}

export type HotkeyMap = Record<string, HotkeyHandler | (HotkeyOptions & { handler: HotkeyHandler })>
export type HotkeyInput = HotkeyMap | HotkeyBinding[]

/** An element, document or window to listen on, or a component instance (its `$el` is used). */
export type HotkeyTarget = EventTarget | { $el?: unknown } | null | undefined

export interface UseHotkeysOptions extends HotkeyOptions {
  /** Listen on this element (it must contain focus) instead of the document. Refs and getters are accepted. */
  target?: MaybeRefOrGetter<HotkeyTarget>
  /** Milliseconds allowed between the steps of a sequence. Default 1000. */
  timeout?: number
}

/** One key press of a combo, with `mod` already resolved to Meta or Ctrl. */
export interface HotkeyStep {
  /** Lowercase `event.key` (`k`, `?`, `escape`, `arrowup`, `f5`) or `space`. */
  key: string
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
}

export interface ParsedHotkey {
  steps: HotkeyStep[]
}

/** What the registry holds for each registered shortcut. */
export interface HotkeyRegistryEntry {
  id: number
  keys: string
  steps: HotkeyStep[]
  description: string
  group: string
  hidden: boolean
  enabled: () => boolean
  scope: EventTarget
}

/** A shortcut ready to show: key labels per step and a spoken form for screen readers. */
export interface HotkeyListItem {
  id: number
  keys: string
  /** One array of labels per step of the sequence, e.g. `[['Ctrl', 'K']]` or `[['G'], ['D']]`. */
  labels: string[][]
  /** Plain-language form, e.g. `Control plus K` or `G then D`. */
  spoken: string
  description: string
  group: string
}

export interface FormattedHotkey {
  labels: string[][]
  spoken: string
}

/* ------------------------------------------------------------------ constants */

export const MAX_SEQUENCE_STEPS = 5
export const DEFAULT_SEQUENCE_TIMEOUT = 1000
const MAX_KEYS_LENGTH = 200
const DEFAULT_GROUP = 'General'

const MODIFIER_NAMES: Record<string, 'ctrl' | 'alt' | 'shift' | 'meta' | 'mod'> = {
  ctrl: 'ctrl',
  control: 'ctrl',
  alt: 'alt',
  option: 'alt',
  opt: 'alt',
  shift: 'shift',
  meta: 'meta',
  cmd: 'meta',
  command: 'meta',
  mod: 'mod',
}

const KEY_ALIASES: Record<string, string> = {
  esc: 'escape',
  return: 'enter',
  del: 'delete',
  ins: 'insert',
  spacebar: 'space',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  pgup: 'pageup',
  pgdn: 'pagedown',
  plus: '+',
  minus: '-',
}

const NAMED_KEYS = new Set(['escape', 'enter', 'tab', 'space', 'backspace', 'delete', 'insert', 'home', 'end', 'pageup', 'pagedown', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'])
const FUNCTION_KEY = /^f([1-9]|1\d|2[0-4])$/

/** Keys that never count as the "main" key of a combo: pressing them alone neither fires nor breaks a sequence. */
const MODIFIER_EVENT_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'AltGraph', 'OS', 'Hyper', 'Super', 'CapsLock', 'NumLock', 'ScrollLock', 'Fn', 'FnLock'])

const NON_TEXT_INPUT_TYPES = new Set(['button', 'checkbox', 'radio', 'range', 'submit', 'reset', 'image', 'file', 'color'])

/* ------------------------------------------------------------------ platform and environment */

/** True on macOS, iOS and iPadOS. Never throws; returns false during SSR. */
export function isMacPlatform(): boolean {
  try {
    if (typeof navigator === 'undefined') return false
    const hinted = (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform
    const platform = hinted || navigator.platform || navigator.userAgent || ''
    return /mac|iphone|ipad|ipod/i.test(String(platform))
  } catch {
    return false
  }
}

/** Development builds warn about conflicts and invalid combos; production builds (and unknown bundlers) stay silent. */
function isDev(): boolean {
  const env = (import.meta as { env?: { DEV?: boolean; PROD?: boolean } }).env
  const node = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV
  const production = env?.PROD === true || env?.DEV === false || node === 'production'
  const development = env?.DEV === true || node === 'development' || node === 'test'
  return development && !production
}

function warn(message: string) {
  if (isDev()) console.warn(`[perfect-design] useHotkeys: ${message}`)
}

/* ------------------------------------------------------------------ parsing */

/** Own-property lookup, so hostile names such as `constructor` or `__proto__` never reach `Object.prototype`. */
const own = <T>(table: Record<string, T>, key: string): T | undefined => (Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined)

const isSymbol = (key: string) => key.length === 1 && !/[a-z0-9]/i.test(key)

function parseStep(raw: string, mac: boolean): HotkeyStep | null {
  const text = raw.trim().toLowerCase()
  if (text === '') return null
  let tokens: string[]
  if (text === '+') tokens = ['+']
  else if (text.endsWith('++')) tokens = [...text.slice(0, -2).split('+'), '+']
  else tokens = text.split('+')
  tokens = tokens.map((t) => t.trim())
  if (tokens.some((t) => t === '')) return null

  const step: HotkeyStep = { key: '', ctrl: false, alt: false, shift: false, meta: false }
  const keyToken = tokens[tokens.length - 1]
  for (const token of tokens.slice(0, -1)) {
    const modifier = own(MODIFIER_NAMES, token)
    if (!modifier) return null
    if (modifier === 'mod') step[mac ? 'meta' : 'ctrl'] = true
    else step[modifier] = true
  }
  if (own(MODIFIER_NAMES, keyToken)) return null // modifier-only

  const key = own(KEY_ALIASES, keyToken) ?? keyToken
  const single = [...key].length === 1
  if (!single && !NAMED_KEYS.has(key) && !FUNCTION_KEY.test(key)) return null
  if (single && /\s/.test(key)) return null
  step.key = key
  // Punctuation is written as the character it produces (`?`), so shift is layout dependent and never compared.
  if (isSymbol(key)) step.shift = false
  return step
}

/**
 * Parse a combo. Returns `null` for anything that cannot be matched: empty or oversized text, modifier-only combos, unknown
 * key names, empty sequence steps and sequences longer than `MAX_SEQUENCE_STEPS`.
 */
export function parseHotkey(keys: unknown, mac: boolean = isMacPlatform()): ParsedHotkey | null {
  if (typeof keys !== 'string' || keys.trim() === '' || keys.length > MAX_KEYS_LENGTH) return null
  const parts = keys.split(/\s+then\s+/i)
  if (parts.length > MAX_SEQUENCE_STEPS) return null
  const steps: HotkeyStep[] = []
  for (const part of parts) {
    const step = parseStep(part, mac)
    if (!step) return null
    steps.push(step)
  }
  return { steps }
}

const signature = (s: HotkeyStep) => `${s.ctrl ? 'c' : ''}${s.alt ? 'a' : ''}${s.shift ? 's' : ''}${s.meta ? 'm' : ''}:${s.key}`

/* ------------------------------------------------------------------ formatting */

const KEY_LABELS: Record<string, string> = {
  escape: 'Esc',
  enter: 'Enter',
  tab: 'Tab',
  space: 'Space',
  backspace: 'Backspace',
  delete: 'Delete',
  insert: 'Insert',
  home: 'Home',
  end: 'End',
  pageup: 'Page Up',
  pagedown: 'Page Down',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
}

const KEY_SPOKEN: Record<string, string> = {
  escape: 'Escape',
  arrowup: 'Up arrow',
  arrowdown: 'Down arrow',
  arrowleft: 'Left arrow',
  arrowright: 'Right arrow',
  '?': 'Question mark',
  '/': 'Slash',
  '.': 'Period',
  ',': 'Comma',
  '+': 'Plus',
  '-': 'Minus',
  '=': 'Equals',
  '[': 'Left bracket',
  ']': 'Right bracket',
  '\\': 'Backslash',
  ';': 'Semicolon',
  "'": 'Apostrophe',
  '`': 'Backtick',
}

const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function stepLabels(step: HotkeyStep, mac: boolean): { labels: string[]; spoken: string } {
  const labels: string[] = []
  const spoken: string[] = []
  if (step.ctrl) (labels.push(mac ? '⌃' : 'Ctrl'), spoken.push('Control'))
  if (step.alt) (labels.push(mac ? '⌥' : 'Alt'), spoken.push(mac ? 'Option' : 'Alt'))
  if (step.shift) (labels.push(mac ? '⇧' : 'Shift'), spoken.push('Shift'))
  if (step.meta) (labels.push(mac ? '⌘' : 'Meta'), spoken.push(mac ? 'Command' : 'Windows'))
  labels.push(own(KEY_LABELS, step.key) ?? (FUNCTION_KEY.test(step.key) ? step.key.toUpperCase() : upperFirst(step.key)))
  spoken.push(own(KEY_SPOKEN, step.key) ?? own(KEY_LABELS, step.key) ?? (FUNCTION_KEY.test(step.key) ? step.key.toUpperCase() : upperFirst(step.key)))
  return { labels, spoken: spoken.join(' plus ') }
}

/** Key labels and a spoken form for a combo, using Mac symbols on macOS. `null` when the combo is invalid. */
export function formatHotkey(keys: unknown, mac: boolean = isMacPlatform()): FormattedHotkey | null {
  const parsed = parseHotkey(keys, mac)
  if (!parsed) return null
  const parts = parsed.steps.map((s) => stepLabels(s, mac))
  return { labels: parts.map((p) => p.labels), spoken: parts.map((p) => p.spoken).join(' then ') }
}

/* ------------------------------------------------------------------ registry */

let nextId = 1
const registry: ShallowRef<HotkeyRegistryEntry[]> = shallowRef([])

function removeEntries(ids: Set<number>) {
  registry.value = registry.value.filter((e) => !ids.has(e.id))
}

const isGlobalScope = (scope: EventTarget) => typeof Document !== 'undefined' && (scope instanceof Document || (typeof Window !== 'undefined' && scope instanceof Window))
const scopesOverlap = (a: EventTarget, b: EventTarget) => a === b || isGlobalScope(a) || isGlobalScope(b)

/** Equal combos, or one sequence being the beginning of the other (the shorter one would always win). */
function stepsCollide(a: HotkeyStep[], b: HotkeyStep[]): boolean {
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) if (signature(a[i]) !== signature(b[i])) return false
  return true
}

function checkConflicts(entry: HotkeyRegistryEntry, existing: HotkeyRegistryEntry[]) {
  if (!isDev()) return
  for (const other of existing) {
    if (!scopesOverlap(entry.scope, other.scope) || !stepsCollide(entry.steps, other.steps)) continue
    const what = other.description ? ` (${other.description})` : ''
    warn(`"${entry.keys}" conflicts with "${other.keys}"${what}. Both can fire, or the shorter sequence wins; give them different keys.`)
  }
}

/** Reactive list of everything registered, in registration order. Replace-on-write: do not mutate it. */
export function useHotkeyRegistry(): Readonly<ShallowRef<HotkeyRegistryEntry[]>> {
  return registry
}

/** Entries that are documented, visible and enabled, formatted for display. Reactive when read inside `computed`/render. */
export function listHotkeys(mac: boolean = isMacPlatform()): HotkeyListItem[] {
  const out: HotkeyListItem[] = []
  for (const entry of registry.value) {
    if (entry.hidden || entry.description.trim() === '' || !entry.enabled()) continue
    const formatted = formatHotkey(entry.keys, mac)
    if (!formatted) continue
    out.push({ id: entry.id, keys: entry.keys, labels: formatted.labels, spoken: formatted.spoken, description: entry.description, group: entry.group })
  }
  return out
}

/** `listHotkeys` as a computed ref. */
export function useRegisteredHotkeys(): ComputedRef<HotkeyListItem[]> {
  return computed(() => listHotkeys())
}

/* ------------------------------------------------------------------ event helpers */

function resolveTarget(target: MaybeRefOrGetter<HotkeyTarget> | undefined): EventTarget | null {
  if (target === undefined) return typeof document === 'undefined' ? null : document
  const value = toValue(target)
  const el = value && typeof (value as { addEventListener?: unknown }).addEventListener !== 'function' ? (value as { $el?: unknown }).$el : value
  return el && typeof (el as EventTarget).addEventListener === 'function' ? (el as EventTarget) : null
}

function isEditableTarget(event: KeyboardEvent): boolean {
  const first = typeof event.composedPath === 'function' ? event.composedPath()[0] : undefined
  const el = (first ?? event.target) as Element | null
  if (!el || typeof el.tagName !== 'string') return false
  const tag = el.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (tag === 'INPUT') return !NON_TEXT_INPUT_TYPES.has(String((el as HTMLInputElement).type).toLowerCase())
  if (typeof (el as HTMLElement).isContentEditable === 'boolean') return (el as HTMLElement).isContentEditable
  return typeof el.closest === 'function' && el.closest('[contenteditable]:not([contenteditable="false"])') !== null
}

/**
 * Candidate keys for an event. Alt keeps the produced character when it is a plain letter or digit (right on any layout) and
 * falls back to `event.code` when Alt rewrote it (macOS Option). Shift+digit adds the digit from `event.code`.
 */
function eventKeys(event: KeyboardEvent): string[] {
  const key = event.key === ' ' ? 'space' : event.key.toLowerCase()
  const fromCode = () => {
    const m = typeof event.code === 'string' ? (/^Key([A-Z])$/.exec(event.code) ?? /^Digit(\d)$/.exec(event.code)) : null
    return m ? m[1].toLowerCase() : null
  }
  if (event.altKey) {
    if (/^[a-z0-9]$/.test(key)) return [key]
    const code = fromCode()
    return code ? [code] : [key]
  }
  if (event.shiftKey && typeof event.code === 'string') {
    const digit = /^Digit(\d)$/.exec(event.code)
    if (digit) return [key, digit[1]]
  }
  return [key]
}

function stepMatches(step: HotkeyStep, event: KeyboardEvent, keys: string[]): boolean {
  if (event.ctrlKey !== step.ctrl || event.altKey !== step.alt || event.metaKey !== step.meta) return false
  if (!isSymbol(step.key) && event.shiftKey !== step.shift) return false
  return keys.includes(step.key)
}

/** Events this library already prevented, so a second `useHotkeys` listener still sees them while foreign `preventDefault` calls are respected. */
const ours = new WeakSet<Event>()
function prevent(event: Event) {
  ours.add(event)
  event.preventDefault()
}

function inModalOutside(event: KeyboardEvent): boolean {
  if (typeof document === 'undefined') return false
  const modals = document.querySelectorAll('[aria-modal="true"]')
  if (modals.length === 0) return false
  const first = typeof event.composedPath === 'function' ? event.composedPath()[0] : undefined
  const el = (first ?? event.target) as Node | null
  return !el || ![...modals].some((m) => m.contains(el))
}

/* ------------------------------------------------------------------ useHotkeys */

interface ActiveBinding {
  entry: HotkeyRegistryEntry
  steps: HotkeyStep[]
  handler: HotkeyHandler
  allowInInputs: boolean
  allowInModal: boolean
  preventDefault: boolean
}

function normalizeInput(input: HotkeyInput | null | undefined): HotkeyBinding[] {
  if (!input || typeof input !== 'object') return []
  if (Array.isArray(input)) return input.filter((b) => b && typeof b === 'object' && typeof b.handler === 'function')
  const out: HotkeyBinding[] = []
  for (const [keys, value] of Object.entries(input)) {
    if (typeof value === 'function') out.push({ keys, handler: value })
    else if (value && typeof value.handler === 'function') out.push({ ...value, keys })
  }
  return out
}

/**
 * Register keyboard shortcuts for the lifetime of the calling component (or effect scope). Pass a map
 * (`{ 'mod+k': open, 'g then d': goDashboard }`), an array of bindings, or a getter returning either (re-registered when
 * what the getter reads changes). Returns `stop()` to unregister early.
 */
export function useHotkeys(input: MaybeRefOrGetter<HotkeyInput | null | undefined>, options: UseHotkeysOptions = {}): { stop: () => void } {
  const timeout = Number.isFinite(options.timeout) && (options.timeout as number) > 0 ? (options.timeout as number) : DEFAULT_SEQUENCE_TIMEOUT
  let detach: (() => void) | null = null
  let stopped = false

  function teardown() {
    detach?.()
    detach = null
  }

  function attach() {
    teardown()
    if (stopped) return
    const scope = resolveTarget(options.target)
    if (!scope) return

    const mac = isMacPlatform()
    const active: ActiveBinding[] = []
    const ids = new Set<number>()
    const globalEnabled = () => (options.enabled === undefined ? true : toValue(options.enabled) !== false)

    for (const binding of normalizeInput(toValue(input))) {
      const parsed = parseHotkey(binding.keys, mac)
      if (!parsed) {
        warn(`ignored invalid shortcut ${JSON.stringify(String(binding.keys).slice(0, 60))}. Use combos like "mod+k", "?" or "g then d".`)
        continue
      }
      const bindingEnabled = binding.enabled
      const entry: HotkeyRegistryEntry = {
        id: nextId++,
        keys: binding.keys.trim(),
        steps: parsed.steps,
        description: binding.description ?? options.description ?? '',
        group: binding.group || options.group || DEFAULT_GROUP,
        hidden: binding.hidden ?? options.hidden ?? false,
        enabled: () => globalEnabled() && (bindingEnabled === undefined ? true : toValue(bindingEnabled) !== false),
        scope,
      }
      checkConflicts(entry, [...registry.value, ...active.map((a) => a.entry)])
      ids.add(entry.id)
      active.push({
        entry,
        steps: parsed.steps,
        handler: binding.handler,
        allowInInputs: binding.allowInInputs ?? options.allowInInputs ?? false,
        allowInModal: binding.allowInModal ?? options.allowInModal ?? false,
        preventDefault: binding.preventDefault ?? options.preventDefault ?? true,
      })
    }
    if (active.length === 0) return
    registry.value = [...registry.value, ...active.map((a) => a.entry)]

    const progress = new Map<ActiveBinding, number>()
    let timer: ReturnType<typeof setTimeout> | undefined
    const clearTimer = () => {
      if (timer !== undefined) clearTimeout(timer)
      timer = undefined
    }

    const onKeydown = (raw: Event) => {
      const event = raw as KeyboardEvent
      if ((event.defaultPrevented && !ours.has(event)) || typeof event.key !== 'string' || event.isComposing || event.key === 'Process' || event.repeat || MODIFIER_EVENT_KEYS.has(event.key)) return
      const key = eventKeys(event)
      const inField = isEditableTarget(event)
      const modalOutside = inModalOutside(event)
      const fired: ActiveBinding[] = []

      for (const b of active) {
        if (!b.entry.enabled() || (inField && !b.allowInInputs) || (modalOutside && !b.allowInModal)) {
          progress.delete(b)
          continue
        }
        let index = progress.get(b) ?? 0
        if (!stepMatches(b.steps[index], event, key)) {
          progress.delete(b)
          if (index === 0 || !stepMatches(b.steps[0], event, key)) continue
          index = 0 // a failed sequence may restart with this very key
        }
        if (index === b.steps.length - 1) fired.push(b)
        else {
          progress.set(b, index + 1)
          const s = b.steps[index]
          if (b.preventDefault && (s.ctrl || s.meta || s.alt)) prevent(event)
        }
      }

      if (fired.length > 0) {
        progress.clear()
        clearTimer()
        let failure: { error: unknown } | undefined
        for (const b of fired) {
          if (b.preventDefault) prevent(event)
          try {
            b.handler(event)
          } catch (error) {
            failure ??= { error }
          }
        }
        if (failure) throw failure.error
        return
      }
      clearTimer()
      if (progress.size > 0) {
        timer = setTimeout(() => {
          timer = undefined
          progress.clear()
        }, timeout)
      }
    }

    scope.addEventListener('keydown', onKeydown)
    detach = () => {
      scope.removeEventListener('keydown', onKeydown)
      clearTimer()
      progress.clear()
      removeEntries(ids)
    }
  }

  let stopWatch: (() => void) | undefined
  function stop() {
    stopped = true
    stopWatch?.()
    teardown()
  }

  const instance = getCurrentInstance()
  if (instance) onMounted(attach)
  else if (typeof document !== 'undefined') attach()

  if (instance || typeof document !== 'undefined') {
    stopWatch = watch(
      () => [toValue(input), resolveTarget(options.target)] as const,
      () => {
        if (!instance || instance.isMounted) attach()
      },
      { flush: 'post' },
    )
  }
  if (getCurrentScope()) onScopeDispose(stop)
  return { stop }
}
