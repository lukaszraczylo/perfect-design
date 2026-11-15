/** Longest message shown for an unknown error; longer text is cut and ends with an ellipsis. */
export const MAX_ERROR_LENGTH = 300

const BIDI_CONTROLS = /[‪-‮⁦-⁩]/g
const CONTROLS = /\p{Cc}/gu

function rawText(error: unknown): string {
  try {
    if (typeof error === 'string') return error
    if (typeof error === 'number' || typeof error === 'bigint' || typeof error === 'boolean') return String(error)
    if (error && typeof error === 'object') {
      const message = (error as { message?: unknown }).message
      if (typeof message === 'string') return message
    }
  } catch {
    // A hostile getter or proxy: show nothing rather than throw while rendering.
  }
  return ''
}

/**
 * Turn anything that can be thrown or rejected (string, Error, `{ message }`, number, unknown) into one short, plain line of text.
 * The result is only ever rendered as a text node, never as HTML. Control characters and bidirectional overrides are removed,
 * whitespace is collapsed and the text is cut at `max` characters. Returns '' when there is nothing usable.
 */
export function describeError(error: unknown, max = MAX_ERROR_LENGTH): string {
  const text = rawText(error).replace(BIDI_CONTROLS, '').replace(CONTROLS, ' ').replace(/\s+/g, ' ').trim()
  const limit = Number.isFinite(max) && max > 1 ? Math.floor(max) : MAX_ERROR_LENGTH
  if (text.length <= limit) return text
  let cut = text.slice(0, limit - 1)
  const last = cut.charCodeAt(cut.length - 1)
  if (last >= 0xd800 && last <= 0xdbff) cut = cut.slice(0, -1) // do not leave half of a surrogate pair
  return `${cut.trimEnd()}…`
}
