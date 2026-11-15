/**
 * Tab-separated text for the clipboard, escaped the way spreadsheets expect: a cell that holds a tab, a line break or a
 * double quote is wrapped in double quotes and its quotes are doubled. Cells are plain text; nothing is ever evaluated.
 */

const NUMERIC = /^[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/
// A leading `=`, `+`, `-`, `@`, tab or carriage return makes a spreadsheet read the cell as a formula (CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/

/** Prefix text that a spreadsheet would run as a formula with an apostrophe (shown as plain text there). Numbers are left alone. */
export function neutralizeFormula(text: string): string {
  return FORMULA_START.test(text) && !NUMERIC.test(text) ? `'${text}` : text
}

export function escapeTsvCell(text: string, neutralize = true): string {
  const t = neutralize ? neutralizeFormula(text) : text
  return /[\t\r\n"]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

/** `cells[row][col]` -> TSV, rows separated by a line feed. Numbers never need neutralising, so pass them as `number`. */
export function toTsv(cells: readonly (readonly (string | number | null | undefined)[])[], neutralize = true): string {
  return cells
    .map((row) => row.map((c) => (typeof c === 'number' ? (Number.isFinite(c) ? String(c) : '') : escapeTsvCell(c == null ? '' : String(c), neutralize))).join('\t'))
    .join('\n')
}
