---
name: auditing-components
description: Reviews Perfect Design components against the library's contracts and finds gaps that the guard tests do not catch, such as fixed English text, missing narrow layouts, undocumented options or reka-ui behaviour leaks, then writes a ranked findings list. Use when asked to audit, review or inventory components, to find what apps cannot customise or translate, or to plan component cleanup. Not for fixing one known bug (use developing-components) or running checks (use validating-components).
---

# Auditing components

The guard tests in `packages/ui/src/__tests__` already enforce structure, docs contract, axe, strict examples, variants, CSS validity, contrast and slop. Run them first. An audit looks for what they cannot see.

## 1. Scope
Name the components or groups under audit. For the whole library, split the work by group (`primitives typography layout forms feedback overlays navigation data-display marketing`).

## 2. Baseline
```sh
cd packages/ui && ./node_modules/.bin/vitest run src/__tests__
```
Record failures and the `KNOWN_NOOP` entries in `src/__tests__/variants-matrix.test.ts`. Each `KNOWN_NOOP` entry is a documented value that changes nothing: it is a finding.

## 3. Checks
- **Fixed English text** (`consumers.md`). List candidate files that do not use `useConfigLabels`:
  ```sh
  cd packages/ui/src/components
  for f in $(find . -name '*.vue'); do grep -q useConfigLabels "$f" && continue
    n=$(grep -cE "(['\`>])[A-Z][a-z]+( [a-z]+)+[.]?(['\`<])" "$f"); [ "$n" -gt 0 ] && echo "$n $f"; done | sort -rn
  ```
  Read each hit. A string is a finding when it reaches the screen or a screen reader and no prop or label can replace it. `ContractError` messages and text props with an English default are not findings.
- **Text that changes with a number:** units, "item" against "items", "{count} included". The component needs both forms or a placeholder string.
- **Narrow screens:** a default width above 320px with no stacked variant, `min-w-*` on content that sits in an app grid, a table without its own scroll region.
- **reka-ui behaviour:** `forceMount` without hiding inactive content, controlled and uncontrolled use that do not both work.
- **Docs truth:** each claim in `description`, `a11y` and `llmNotes` matches the code. Each prop in the code is in `props`. Each variation has an example.
- **Defaults:** a new option changes no default output (search the tests for a pinned default).

## 4. Findings
Write one row per finding: component, file:line, rule from `consumers.md` or another rule file, what an app cannot do, and the proposed opt-in fix. Rank by how many apps or pages it reaches, then by severity (broken behaviour, then accessibility, then translation, then layout, then docs).

Save the list under `reports/` with the date in the file name. Do not fix findings during the audit unless the user asks. Fixes go through `developing-components`.
