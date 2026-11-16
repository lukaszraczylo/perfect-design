/**
 * The component and docs suites deliberately exercise hostile input — wrong prop types, a required prop
 * omitted, a compound part (Dialog/Sheet content) mounted without its title or description — and jsdom
 * does not implement canvas 2D or cross-document navigation. Each of those emits a *known* stream of
 * dev warnings (hundreds of lines per full run) that would drown the real signal in CI.
 *
 * `shouldSuppressKnownTestWarning` decides, from the final formatted console message, whether a line is
 * one of those known shapes. Wire it into a vitest project as `test.onConsoleLog` — vitest calls it for
 * every captured console log (in every console mode) and prints the line only when it does not return
 * `false`. Anything that does not match a known shape is still printed, so a new, unexpected warning
 * will still surface.
 *
 * The patterns deliberately match the distinctive phrase of each warning, not the leading prefix
 * (`[Vue warn]:`, `Warning:`, `Not implemented:` is the one exception that IS the phrase), so they stay
 * correct even when the runner colours or reflows the line.
 */
const KNOWN_TEST_WARNING_PATTERNS: RegExp[] = [
  // Vue dev warnings, from a component mounted with deliberately bad input.
  /Invalid prop: type check failed for prop/, // hostile prop type
  /Missing required prop:/, // hostile input omits a required prop
  /Component is missing template or render function/, // a stub component with no render
  /Extraneous non-props attributes/, // attrs passed to a fragment / teleport root
  /injection .+ not found/, // a store-backed component mounted outside a Pinia app
  /cannot be child of/, // hostile table / list markup
  /Hydration (mismatch|bug|error)/, // hostile SSR / hydration case
  // reka-ui accessibility warnings, from a Dialog/Sheet/Drawer content mounted without its title or description.
  /requires a `[A-Za-z]+` for the component to be accessible/,
  /Missing `Description` or `aria-describedby/,
  // jsdom "Not implemented" notices (canvas 2D, cross-document navigation), forwarded through its VirtualConsole.
  /Not implemented:/,
]

/** True when a single console message is one of the known, intentionally-triggered test warnings. */
export function filterKnownTestWarning(content: string): boolean {
  return KNOWN_TEST_WARNING_PATTERNS.some((re) => re.test(content))
}

/** Alias kept for the setup-file API: install the console wrapper on `target` (default `globalThis.console`). */
export function filterKnownTestWarnings(target: Console = globalThis.console): void {
  const t = target as Console & { __pdTestWarningFilter?: boolean }
  if (t.__pdTestWarningFilter) return
  t.__pdTestWarningFilter = true
  Object.defineProperty(t, '__pdTestWarningFilter', { enumerable: false })

  const wrap = (method: 'warn' | 'error' | 'log') => {
    const original = t[method].bind(t)
    const wrapped = ((...args: unknown[]) => {
      let known = false
      try {
        // Coerce non-string arguments (Vue appends component objects); a throwing coercion must not surface as a spurious error from inside the wrapper.
        const text = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ')
        known = filterKnownTestWarning(text)
      } catch {
        known = false
      }
      if (!known) original(...args)
    }) as Console['warn']
    Object.assign(wrapped, { __pdTestWarningFilter: true })
    Object.defineProperty(t, method, { value: wrapped, writable: true, configurable: true, enumerable: false })
  }
  wrap('warn')
  wrap('error')
  wrap('log')
}
