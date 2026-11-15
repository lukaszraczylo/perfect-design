/**
 * Contract check shared by the message components (Alert, Banner, Callout): a notice with nothing in it is a mistake
 * (a forgotten slot, an `v-if` that dropped the text), and an empty live region announces nothing.
 */
import { nextTick, onMounted } from 'vue'
import { violation } from '../../lib/contract'

/** Text, a labelled image or a labelled icon counts as content. */
export const hasContent = (el: Element): boolean =>
  !!el.textContent?.trim() || !!el.querySelector('img[alt]:not([alt=""]), [role="img"][aria-label], [aria-label]:not([aria-hidden="true"]):not(button)')

/** After mount, `el` must hold something a person can read. `hint` says how to fix it. */
export function useRequireContent(component: string, el: () => Element | null | undefined, hint: string) {
  onMounted(async () => {
    await nextTick()
    const node = el()
    if (node && !hasContent(node)) violation(component, 'requires-content', `is empty and requires a title or text. ${hint}`)
  })
}

/** Run `check` once the component is mounted and the DOM has settled; a throw is routed through Vue's error handling. */
export function checkAfterMount(check: () => void) {
  onMounted(async () => {
    await nextTick()
    check()
  })
}
