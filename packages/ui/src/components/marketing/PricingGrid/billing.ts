import { computed, getCurrentInstance, nextTick, onMounted, ref } from 'vue'
import { requireText, violation } from '../../../lib/contract'
import { BILLING_VALUES, normalizeBilling, type PricingBilling } from '../PricingCard/pricing'

/**
 * Controlled + uncontrolled billing state. `controlled()` returning undefined means uncontrolled (internal state seeded by `initial()`).
 * `set()` ignores unknown values and no-op changes, so rapid or repeated clicks emit once per real change.
 */
export function useBillingState(controlled: () => unknown, initial: () => unknown, onUpdate: (value: PricingBilling) => void) {
  const internal = ref<PricingBilling>(normalizeBilling(initial()))
  const billing = computed<PricingBilling>(() => {
    const c = controlled()
    return c === undefined ? internal.value : normalizeBilling(c)
  })
  function set(value: unknown) {
    if (!(BILLING_VALUES as readonly unknown[]).includes(value) || value === billing.value) return
    if (controlled() === undefined) internal.value = value as PricingBilling
    onUpdate(value as PricingBilling)
  }
  return { billing, set }
}

interface BillingContractInput {
  /** Controlled value (`v-model:billing`); undefined means uncontrolled. */
  billing: () => unknown
  defaultBilling: () => unknown
  toggleVisible: () => boolean
  billingLabel: () => unknown
  monthlyLabel: () => unknown
  yearlyLabel: () => unknown
}

const describe = (v: unknown) => (typeof v === 'string' ? `"${v}"` : String(v))

/**
 * Contract of the billing toggle shared by PricingGrid and PricingTable (call from setup; the checks run in onMounted):
 * `billing` / `defaultBilling` hold 'monthly' or 'yearly', a visible toggle has accessible labels, and a controlled
 * `billing` has an `update:billing` listener (without one the toggle can never change anything).
 */
export function useBillingContract(owner: string, input: BillingContractInput) {
  const instance = getCurrentInstance()
  onMounted(async () => {
    await nextTick()
    for (const [prop, value] of [['billing', input.billing()], ['defaultBilling', input.defaultBilling()]] as const) {
      if (value !== undefined && !(BILLING_VALUES as readonly unknown[]).includes(value)) {
        violation(owner, 'requires-valid-billing', `requires \`${prop}\` to be 'monthly' or 'yearly' (got ${describe(value)}). Any other value silently falls back to 'monthly'.`)
      }
    }
    if (!input.toggleVisible()) return
    requireText(owner, 'billingLabel', input.billingLabel(), 'It names the monthly/yearly radio group.')
    requireText(owner, 'monthlyLabel', input.monthlyLabel(), 'It is the text of the monthly option.')
    requireText(owner, 'yearlyLabel', input.yearlyLabel(), 'It is the text of the yearly option.')
    if (input.billing() !== undefined && !instance?.vnode.props?.['onUpdate:billing']) {
      violation(owner, 'requires-billing-listener', 'has a controlled `billing` but no `update:billing` listener, so its toggle can never change. Use `v-model:billing`, or drop `billing` to let it keep its own state.')
    }
  })
}
