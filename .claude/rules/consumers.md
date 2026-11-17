---
paths:
  - "packages/ui/src/components/**"
  - "packages/ui/src/lib/**"
  - "packages/ui/src/styles/**"
---

# Changes that apps depend on

Apps install `@perfect-design/ui` from npm and use its components directly. They do not wrap them. When an app needs a behaviour that a component does not have, the change goes into this library and ships in a release. The skills `developing-components`, `validating-components`, `releasing-components` and `auditing-components` hold the procedures.

## Compatibility
- **Additive and default-preserving.** A new prop, field or variant value is optional. Without it, the rendered output stays exactly the same. Existing tests pin the default output: do not edit a pinned expectation to make a change pass.
- **Data shapes grow, they do not change.** Add an optional field to a data type (`UsageDimension.unitSingular`) instead of changing the meaning of an existing field.
- **Fix the documented behaviour, not the symptom.** When a component breaks its own docs (for example `TabsContent` with `forceMount` showed every panel), fix the component and add a test that fails on the old code.
- A change that breaks a consumer is a minor version bump before 1.0. Name what breaks in the commit body.

## Every visible string can be translated
- A component renders no fixed English text that an app cannot replace. This includes hint text, empty states, button labels, screen-reader names and `role="status"` announcements.
- Built-in strings use one pattern. A `DEFAULT_LABELS` object holds the English text. `useConfigLabels('<camelName>', DEFAULT_LABELS)` reads a surrounding `ConfigProvider`. A `labels?: Partial<XLabels>` prop overrides both. The precedence is the prop, then the provider, then the English default. `Pagination` and `UsageEstimator` are the reference implementations.
- Add every new key to `ConfigLabelKey` in `layout/ConfigProvider/config.ts`, and to the key list in `ConfigProvider.docs.ts`.
- Use `{name}` placeholders for numbers and values (`'{count} included'`). Format the number with the component `locale` before you replace the placeholder.
- A single-purpose text prop with an English default (`totalLabel`, `retryLabel`) is also acceptable. Developer-facing `ContractError` messages stay in English.
- Units and nouns that change with a number need both forms when the component shows both (`unit` and `unitSingular`).

## reka-ui behaviour to remember
- `forceMount` sets `present` to true, so reka-ui removes the `hidden` attribute from inactive content. A component that accepts `forceMount` must hide inactive content itself (`data-[state=inactive]:hidden`).
- reka-ui renders some slots one tick after mount. Contract checks run in `onMounted` after `await nextTick()`.

## Layout inside apps
- Components sit in app grids and flex rows that this repo does not control. A wide child (a table with `min-w-*`) inside a single implicit grid track widens the track and every sibling. Give layout examples `grid-cols-1` (or `min-w-0`) on the narrow layout, and give wide content its own scroll region.
- `variant="list"` or a stacked layout must exist for any component that is wider than 320px in its default form.
