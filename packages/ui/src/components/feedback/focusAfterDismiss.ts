const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Move focus out of a notice that is about to unmount, so keyboard and screen reader users do not land on `<body>`.
 * Target: the next focusable sibling, else the parent region (made programmatically focusable).
 */
export function focusAfterDismiss(el: HTMLElement | null | undefined): void {
  if (!el) return
  let target: HTMLElement | null = null
  for (let s = el.nextElementSibling; s && !target; s = s.nextElementSibling) {
    target = s.matches(FOCUSABLE) ? (s as HTMLElement) : s.querySelector<HTMLElement>(FOCUSABLE)
  }
  const parent = el.parentElement
  if (!target && parent && parent !== document.body) {
    if (!parent.hasAttribute('tabindex')) parent.setAttribute('tabindex', '-1')
    target = parent
  }
  target?.focus()
}
