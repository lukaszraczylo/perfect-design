/** Replaces `{name}` placeholders in a translatable label; unknown placeholders stay as written. */
export function formatLabel(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match))
}
