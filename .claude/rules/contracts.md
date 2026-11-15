---
paths:
  - "packages/ui/src/components/**"
  - "packages/ui/src/lib/contract*"
---

# Required parts are enforced (`ContractError`)

If a component documents something as required (a `DialogTitle` in `DialogContent`, a label on an icon-only button, an `alt` on an informative image, a submit handler on a form), missing it must fail loudly, not ship. The mechanism is `packages/ui/src/lib/contract.ts`; the reference implementation is `components/overlays/{Dialog,AlertDialog,Sheet}`.

## When you add or change a component
1. List what a user or an LLM could plausibly forget and that breaks or de-accessibilises the component. Start from the docs' own words: ALWAYS, MUST, required, needs, never.
2. Enforce each item, accepting every legitimate alternative (a `Field` label, `aria-label`, `aria-labelledby`, visually hidden text, a wrapping `<label>`):
   - compound parts: owner calls `useRequiredParts('Owner', [{ part, orAttrs, hint }], useAttrs())` and renders `<RequiredPartsProbe owner="Owner" />` inside the content that exists only when it is really shown; the part calls `useRegisterPart('Owner', 'Part')`;
   - props: `requireText`, `requireOneOf`;
   - names: `useRequireAccessibleName('Component', () => el.value, hint, when?)`;
   - wiring: `violation(component, rule, message)` from an async `onMounted`.
3. **Never throw during setup or render.** Checks run in `onMounted` (after `await nextTick()` where reka-ui renders slots a tick later). Vue re-throws errors from lifecycle hooks in development and logs them in production, so a missing title cannot blank a live page. Messages name the component, what is missing and the fix.
4. Add `requires: ['Throws a ContractError when ...']` to the component's `*.docs.ts`; the docs site renders it under "Required by the component" and `llms-full.txt` lists it.
5. Test every rule with strict mode on (below). `src/__tests__/requires-tested.test.ts` fails when a documented requirement has no such test; `src/__tests__/strict-examples.test.ts` mounts every docs example in strict mode, so examples must model correct usage.

## Testing a contract
Unit tests run with strict mode off (`vitest.setup.ts`) so they can mount partial trees. Contract tests switch it on:
```ts
beforeEach(() => configureStrictMode('throw'))
afterEach(() => configureStrictMode('off'))
// capture through a wrapper component with onErrorCaptured; await settle() (several ticks + setTimeout 0) before asserting
```
Cover for each rule: throws when missing (assert the message), passes with each accepted alternative, a closed overlay is not checked, `warn` logs without throwing, `off` is silent. Pattern: `components/overlays/contract.test.ts`.

Apps choose `configureStrictMode('throw' | 'warn' | 'off')` (default `'throw'`) and can route errors with `app.config.errorHandler` (`err instanceof ContractError`). The user-facing explanation is the "Required parts and strict mode" guide in the docs.
