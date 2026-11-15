import { Comment, Fragment, Text, type VNode } from 'vue'

/** Flatten slot vnodes: unwraps Fragments (v-for / template), drops comments (v-if=false) and blank text. */
export function flattenVNodes(nodes: VNode[] | undefined): VNode[] {
  const out: VNode[] = []
  for (const node of nodes ?? []) {
    if (node.type === Fragment && Array.isArray(node.children)) out.push(...flattenVNodes(node.children as VNode[]))
    else if (node.type === Comment) continue
    else if (node.type === Text && typeof node.children === 'string' && node.children.trim() === '') continue
    else out.push(node)
  }
  return out
}
