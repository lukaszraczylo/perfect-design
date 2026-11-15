import type { VNode } from 'vue'

/** Visit a rendered vnode tree, descending into child components (the same walk Vue devtools does). */
export function walkVNodes(vnode: VNode | null | undefined, visit: (vnode: VNode) => void): void {
  if (!vnode) return
  visit(vnode)
  if (vnode.component) walkVNodes(vnode.component.subTree, visit)
  if (Array.isArray(vnode.children)) {
    for (const child of vnode.children) {
      if (child && typeof child === 'object' && 'type' in child) walkVNodes(child as VNode, visit)
    }
  }
}
