import { Fragment, Text, type VNode } from 'vue'

/** Text of the string children of a slot (elements and components are ignored). */
export function vnodesToText(nodes: readonly VNode[] | undefined): string {
  let out = ''
  for (const node of nodes ?? []) {
    if (node.type === Text && typeof node.children === 'string') out += node.children
    else if (node.type === Fragment && Array.isArray(node.children)) out += vnodesToText(node.children as VNode[])
  }
  return out
}

/** Remove the indentation shared by all non-blank lines and drop leading and trailing blank lines. */
export function dedent(text: string): string {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  while (lines.length && lines[0].trim() === '') lines.shift()
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop()
  let indent = Infinity
  for (const line of lines) {
    if (line.trim() === '') continue
    let n = 0
    while (n < line.length && (line[n] === ' ' || line[n] === '\t')) n += 1
    indent = Math.min(indent, n)
  }
  if (!Number.isFinite(indent) || indent === 0) return lines.join('\n')
  return lines.map((line) => line.slice(indent)).join('\n')
}
