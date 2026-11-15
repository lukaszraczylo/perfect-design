import type { ComponentDoc } from '../../../docs-types'

/** Display-only `<script setup>` line for a string constant (escapes backticks, backslashes and `${`). */
const show = (name: string, text: string) => `const ${name} = \`${text.replace(/[`\\]|\$\{/g, (m) => `\\${m}`)}\``

const before = `name = "sample-service"
port = 80
mode = "development"
debug = false
retries = 3`

const after = `name = "sample-service"
port = 8080
mode = "production"
debug = false
retries = 3
timeout = "5s"`

const long = (edit: boolean) =>
  Array.from({ length: 40 }, (_, i) => {
    if (edit && i === 4) return 'key_4 = "changed value"'
    if (edit && i === 31) return 'key_31 = "another changed value"'
    return `key_${i} = "value ${i}"`
  }).join('\n')

const patch = `--- a/app.conf
+++ b/app.conf
@@ -1,4 +1,4 @@
 name = "sample-service"
-port = 80
+port = 8080
 mode = "development"
 debug = false
@@ -10,3 +10,4 @@
 retries = 3
+timeout = "5s"
 tail = true`

const wrapped = {
  a: 'description = "A long single line of sample text that wraps inside the viewer instead of scrolling sideways when wrap is turned on."',
  b: 'description = "A long single line of sample text that wraps inside the viewer instead of scrolling sideways when wrap is switched on, with one clause added."',
}

const doc: ComponentDoc = {
  name: 'DiffViewer',
  group: 'data-display',
  subgroup: 'Code',
  summary: 'Read-only diff of two texts or a unified diff string, in unified, split or inline layout, with word highlights, folded unchanged lines and change-to-change navigation.',
  description:
    'Use `DiffViewer` to show what changed between two versions of a text: a config file, a document, generated output, a pull request excerpt. Pass `oldText` and `newText` (the viewer computes the diff in the browser with a Myers line diff and a word diff inside changed lines) or a `patch` string in unified diff format. `variant` is `unified` (default, one column), `split` (old and new side by side; below `splitMinWidth` of the viewer\'s own width it renders as unified) or `inline` (a changed line is one row with removed and added words marked in place). Added and removed lines carry a "+" or "-" marker, a distinct edge and hidden text, and changed words use underline and strike-through as well as a tint, so colour is never the only signal. Unchanged lines between changes fold behind "N unchanged lines" buttons. Long diffs render only the rows in view. All text is rendered as text, never as HTML. It is not an editor and does not merge or apply changes.',
  status: 'stable',
  props: [
    { name: 'oldText', type: 'string', description: 'The original text. A missing side counts as an empty text.' },
    { name: 'newText', type: 'string', description: 'The changed text.' },
    { name: 'patch', type: 'string', description: 'A unified diff (`git diff` output, one or several files). When it is not blank it is shown instead of `oldText` and `newText`. Lines between hunks are not in a patch, so they cannot be revealed. A "\\ No newline at end of file" line is ignored. Text that is not a diff shows a message instead.' },
    { name: 'label', type: 'string', description: 'Accessible name of the diff (the scroll region and the table caption). Required unless `aria-label` or `aria-labelledby` is set.' },
    { name: 'variant', type: "'unified' | 'split' | 'inline'", default: "'unified'", description: '`unified` one column, `split` side by side (falls back to unified when the viewer is narrower than `splitMinWidth`; the root carries `data-effective-variant`), `inline` changed lines merged into one row. Unknown values render `unified`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size and row height (24, 28 or 32px). Unknown values render `md`.' },
    { name: 'wrap', type: 'boolean', default: 'false', description: 'Wrap long lines inside the viewer instead of scrolling sideways.' },
    { name: 'lineNumbers', type: 'boolean', default: 'true', description: 'Show the line number columns (old and new in unified and inline, one per side in split).' },
    { name: 'collapse', type: 'boolean', default: 'true', description: 'Fold unchanged lines between changes. `false` shows them all.' },
    { name: 'context', type: 'number', default: '3', description: 'Unchanged lines kept around each change. Changes closer than twice this value share one hunk. Ignored for `patch`.' },
    { name: 'copy', type: 'boolean', default: 'true', description: 'Show the copy button. It copies the diff as unified text (the `patch` itself when one is given).' },
    { name: 'oldLabel', type: 'string', default: "'Original'", description: 'Heading of the old side (toolbar title, split column header, copied file header).' },
    { name: 'newLabel', type: 'string', default: "'Modified'", description: 'Heading of the new side.' },
    { name: 'splitMinWidth', type: 'number', default: '640', description: 'Width of the viewer in px under which `split` renders as `unified`. It is measured on the viewer, not on the viewport, so a narrow column on a wide screen falls back too.' },
    { name: 'height', type: 'number | string', description: 'Fixed height of the scrolling area (px or any CSS length).' },
    { name: 'maxHeight', type: 'number | string', description: 'Largest height of the scrolling area. Without `height` or `maxHeight` the area stops at 24rem.' },
    { name: 'maxCost', type: 'number', default: '1000', description: 'Largest edit distance the line diff searches. Beyond it the viewer settles for an approximate result and says so in a visible note.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'empty', description: 'Shown when there is nothing to show (identical texts or an unreadable patch). Defaults to "No differences." or a message about the patch.' }],
  emits: [
    { name: 'copy', payload: '[text: string]', description: 'The diff text was copied to the clipboard.' },
    { name: 'hunk', payload: '[event: { index: number; total: number }]', description: 'The current change moved by button or key. `index` is 1-based.' },
  ],
  examples: [
    {
      title: 'Unified (default)',
      description: 'Two texts, compared line by line. The changed words inside a line are marked. Sample data.',
      script: `${show('before', before)}\n${show('after', after)}`,
      code: `<DiffViewer label="Sample config changes" :old-text="before" :new-text="after" />`,
      state: () => ({ before, after }),
    },
    {
      title: 'Split',
      description: 'Old on the left, new on the right. When the viewer is narrower than `split-min-width` it shows the unified layout instead. Sample data.',
      script: `${show('before', before)}\n${show('after', after)}`,
      code: `<DiffViewer variant="split" label="Sample config changes, side by side" :old-text="before" :new-text="after" />`,
      state: () => ({ before, after }),
    },
    {
      title: 'Inline',
      description: 'A changed line is one row; removed words are struck through and added words underlined in place. Sample data.',
      script: `${show('before', before)}\n${show('after', after)}`,
      code: `<DiffViewer variant="inline" label="Sample config changes, inline" :old-text="before" :new-text="after" />`,
      state: () => ({ before, after }),
    },
    {
      title: 'From a unified diff',
      description: 'Pass `patch` instead of two texts. Sample data.',
      script: show('patch', patch),
      code: `<DiffViewer label="Sample patch" :patch="patch" old-label="a/app.conf" new-label="b/app.conf" />`,
      state: () => ({ patch }),
    },
    {
      title: 'Folded unchanged lines',
      description: 'Lines between the two changes are folded. "N unchanged lines" reveals up to 100 at a time, "Expand all" opens everything. `collapse` set to false shows them all from the start. Sample data.',
      script: `${show('before', long(false))}\n${show('after', long(true))}`,
      code: `<div class="flex flex-col gap-4">
  <DiffViewer label="Sample long file, folded" :context="2" :old-text="before" :new-text="after" />
  <DiffViewer label="Sample long file, fully expanded" :collapse="false" :copy="false" max-height="12rem" :old-text="before" :new-text="after" />
</div>`,
      state: () => ({ before: long(false), after: long(true) }),
    },
    {
      title: 'Moving between changes',
      description: 'Focus the diff area and press n for the next change and p for the previous one, or use the buttons. The current change is announced as "Change 2 of 2". Sample data.',
      script: `${show('before', long(false))}\n${show('after', long(true))}`,
      code: `<DiffViewer label="Sample long file, change navigation" :context="1" max-height="14rem" :old-text="before" :new-text="after" />`,
      state: () => ({ before: long(false), after: long(true) }),
    },
    {
      title: 'Wrapped long lines',
      description: '`wrap` keeps long lines inside the viewer instead of scrolling sideways. Sample data.',
      script: `${show('before', wrapped.a)}\n${show('after', wrapped.b)}`,
      code: `<DiffViewer wrap variant="inline" label="Sample wrapped line" :old-text="before" :new-text="after" />`,
      state: () => ({ before: wrapped.a, after: wrapped.b }),
    },
    {
      title: 'Size gallery',
      description: '`size` sm, md and lg: text and row height scale together. Sample data.',
      script: `${show('before', 'port = 80')}\n${show('after', 'port = 8080')}`,
      code: `<div class="flex flex-col gap-4">
  <DiffViewer size="sm" label="Small diff" :copy="false" :old-text="before" :new-text="after" />
  <DiffViewer size="md" label="Medium diff" :copy="false" :old-text="before" :new-text="after" />
  <DiffViewer size="lg" label="Large diff" :copy="false" :old-text="before" :new-text="after" />
</div>`,
      state: () => ({ before: 'port = 80', after: 'port = 8080' }),
    },
    {
      title: 'No differences',
      description: 'Identical texts show a message (or the `empty` slot) instead of an empty table. Sample data.',
      script: show('same', 'name = "sample-service"'),
      code: `<DiffViewer label="Identical sample texts" :old-text="same" :new-text="same" />`,
      state: () => ({ same: 'name = "sample-service"' }),
    },
  ],
  a11y: [
    'The diff is a `<table>` with a visually hidden caption (the `label`) inside a scroll region (`role="region"`, `tabindex="0"`, named by `label`), so keyboard users reach it with Tab and scroll with the arrow keys, Home, End, Page Up and Page Down. It reflows at 320px: wide lines scroll inside the region, or wrap with `wrap`.',
    'Added, removed and changed lines have a "+", "-" or "~" marker plus visually hidden "Added", "Removed", "Changed" or "Unchanged" text, and a distinct start edge (solid for added, dashed for removed) that survives forced-colors mode. Changed words are also underlined (added) or struck through (removed), so tint is never the only signal. Line numbers and marker glyphs are `aria-hidden` and not selectable, so copying yields clean text.',
    'Press n for the next change and p for the previous one while the diff area has focus (also the "Next change" and "Previous change" buttons). Focus moves to the hunk header, the current one is highlighted, and a polite `role="status"` says "Change 2 of 5". Navigation wraps around.',
    'Each fold is a button with the visible text "N unchanged lines" and the name "Expand N unchanged lines" (`aria-expanded="false"`). It reveals up to 100 lines and keeps focus on the next fold button, or on the diff area when nothing is left to reveal. Targets are 24px or more, 44px on coarse pointers.',
    'Long diffs (over 400 rows) render only the rows near the viewport with `aria-rowcount` and `aria-rowindex`; the spacer rows are `aria-hidden`. `split` falls back to unified from the width of the viewer itself, not the viewport. No animation is used, so reduced motion needs no special handling.',
  ],
  related: ['CodeViewer', 'CodeBlock', 'VirtualList', 'JsonViewer'],
  requires: [
    'Throws a ContractError when no accessible name is given (`label`, `aria-label` or `aria-labelledby`), so the diff region has a distinct name.',
    'Throws a ContractError when none of `oldText`, `newText` or `patch` is passed as a string. An empty string is valid.',
  ],
  llmNotes: [
    'Use DiffViewer to compare two versions of a text. Use CodeViewer to show one text, and do not use it as an editor or merge tool.',
    'Pass the exact texts as props (`old-text`, `new-text`) so whitespace survives, or a `patch` string for ready-made unified diffs.',
    'Always set `label` so the diff region has a distinct accessible name when a page shows several diffs.',
    'Choose `variant="split"` for wide containers and `unified` for narrow ones; `split` already falls back by itself below `split-min-width`.',
    'Keep `collapse` on for long files. The line diff is approximate beyond `max-cost` and the viewer says so; do not raise the cost for very different 10k-line files.',
    'Never pass HTML: all content is rendered as text. Override layout with `class`, not colours.',
  ],
  replaces: ['hand-rolled diff table markup in app code'],
}
export default doc
