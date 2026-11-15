---
paths:
  - "packages/ui/src/components/**"
---

# Writing and changing components

## Folder contract (enforced by `src/__tests__/structure.test.ts`)
Each component lives in `components/<group>/<Name>/` with `<Name>.vue`, optional `variants.ts` and part files (`<Name><Part>.vue`), `<Name>.test.ts`, `<Name>.docs.ts` and `index.ts` (barrel: component, props type, variants). Add `export * from './<Name>'` to the group barrel with a single atomic `echo >>`; never rewrite a barrel another change may be editing. `src/index.ts` re-exports the group barrels.

## The customisation contract (every component, every part)
1. **`class` wins.** Final classes are `cn(internal, props.class)` with the consumer's last.
2. **`variant` / `size` / `tone` / `appearance` / `layout` / `density` / `shape` / `orientation`** are cva variants (`lib/cva`) exported as `xVariants` so plain elements can reuse them. Use these exact prop names for a look: the variation matrix test discovers them by name.
3. **`as` / `asChild`** (reka-ui `Primitive`) wherever the element is a reasonable consumer choice.
4. **`data-slot="<kebab-name>"`** on every root and `data-slot="<name>-<part>"` on every part.
5. **Attributes fall through** (`aria-*`, `data-*`, `id`, listeners). If the root is not the element that should receive them use `defineOptions({ inheritAttrs: false })` and bind `$attrs` deliberately.
6. **Slots for content, props for appearance/behaviour.** Compound parts for composite UI (`Card`, `CardHeader`, ...).
7. **`v-model`** via `modelValue`/`update:modelValue` (or reka's `v-model:open`); support controlled and uncontrolled use.
8. **Icons** are FontAwesome-shaped data passed to `<Icon :icon>`; library code imports icons from `lib/icons`, never from `@fortawesome`.
9. **Logical properties** (`ms-`/`pe-`/`start-`/`text-start`) so right-to-left works; no physical `left/right` for layout.

## Variants
- Defaults must keep their existing class output (tests pin it). Add values, do not change the default.
- Unknown values fall back to the default; never render broken markup.
- Every documented variation value needs its own example and test; `src/__tests__/variants-matrix.test.ts` fails when a documented value renders the same as the default. New dimensions use the standard names above.
- Tone/appearance combinations may only use token pairs that `src/__tests__/contrast.test.ts` already covers. A new pairing needs a contrast test first.

## Pitfalls that have bitten this repo
- **Tailwind only emits literal class names.** Never build classes from strings (`` `animate-${name}` ``, `` `bg-${tone}` ``). Write every class out, or map a value to a literal class in a lookup object. `src/__tests__/css-validity.test.ts` checks every rendered class generates CSS.
- **Tailwind v4 syntax:** `z-(--z-modal)`, not `z-[--z-modal]` (v3 syntax silently emits invalid CSS). Use `outline-hidden`, not `outline-none`, in focus styles so forced-colors mode keeps an outline.
- **Specificity ties between `dark:` and state variants:** an unscoped `dark:bg-input/30` beat `data-[state=checked]:bg-primary` and the checked checkbox never filled in dark mode. Scope dark overrides to the state they apply to (`dark:data-[state=unchecked]:bg-input/30`). `scripts/state-check.mjs` catches this class of bug in a real browser.
- **SSR/hydration:** the first client render must equal the server render. No `window`/`document`/`localStorage` reads during setup or render; read them in `onMounted`. State that depends on the visitor (saved theme) shows after mount.
- **Overlays:** content that is portalled and closed renders nothing; do not check or style it as if it were mounted.
- **Never put a literal `</script>` or a `<script setup>` sample inside an SFC string**; sample code lives in `.ts` files.
- **Do not hand-roll accessible patterns reka-ui already provides** (focus trap, roving focus, typeahead, listbox). Wrap it and add the design-system styling and contract.
- **Spacing-based sizes shrink in dense style packs.** `h-6`, `size-6` and `leading-6` follow `--spacing`, which `workbench` and `terminal` reduce. Keep controls that must stay 24px reachable through the pack floor in `styles/packs/*.css` (`button`, `[role="button"]`, the code-viewer fold cell) and run `node scripts/a11y-sweep.mjs <url> --style workbench` and `--style terminal` after adding a small interactive element.
- **Shared variation helpers:** text fields take `variant`/`shape`/`status`/`size` from `forms/Field/field-variants.ts` and `FieldStatusIcon.vue`; feedback components use `feedback/pick.ts` for unknown-value fallback (`lib/cva` does not fall back). A status is always icon plus text, never colour alone. Chart components share `data-display/_chart` (math, frame, text, tones, data table); Mermaid parsing and layout live in `data-display/_diagram` and `MermaidDiagram/` (`parseMermaid`, `layoutGraph`, `renderModel`; text nodes only, never `v-html`).
- **Browser checks:** `state-check` accepts a focus ring on the control or on one of its three nearest ancestors (`focus-within` wrappers). Both scripts navigate to `about:blank` between runs, because a page's theme store can persist its own mode while unloading and corrupt the next page's theme.
