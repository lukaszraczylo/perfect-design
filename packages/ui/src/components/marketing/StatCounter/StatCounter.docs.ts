import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'StatCounter',
  group: 'marketing',
  subgroup: 'Stats',
  summary: 'Inline number with prefix, suffix, locale formatting and tabular figures. Static: it does not count up.',
  description:
    'Use for a figure you can source, next to the claim it supports. It renders the final value immediately, formatted with `Intl` (`locale`, `decimals`) and set in tabular figures so columns of numbers line up. Non-finite values render `fallback` instead of "NaN". The count-up animation and its `animate` and `duration` props were removed (a count-up on statistics is a stock effect and moves text that people are trying to read); both props are still accepted and ignored. Used by `StatGrid`. `size`, `tone` and `align` are optional looks: unset, the figure is an inline span that inherits the surrounding size and colour.',
  status: 'stable',
  props: [
    { name: 'value', type: 'number', required: true, description: 'Number to show. NaN/Infinity render `fallback`.' },
    { name: 'prefix', type: 'string', default: "''", description: 'Text before the number, e.g. "$".' },
    { name: 'suffix', type: 'string', default: "''", description: 'Text after the number, e.g. "%".' },
    { name: 'decimals', type: 'number', default: '0', description: 'Fraction digits, clamped to 0-6.' },
    { name: 'locale', type: 'string', default: "'en-US'", description: 'Locale for grouping/decimal separators. Invalid locales fall back to plain digits.' },
    { name: 'fallback', type: 'string', default: "'n/a'", description: 'Shown when `value` is not a finite number.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", description: 'Figure size, semibold: `sm` 24px, `md` 36px, `lg` 60px. Unset inherits the surrounding type size (the original behaviour, and what `StatGrid` relies on). Unknown values are ignored. Reflected as `data-size`.' },
    { name: 'tone', type: "'default' | 'primary' | 'muted' | 'success' | 'info' | 'danger'", default: "'default'", description: 'Figure colour. `default` inherits the surrounding colour; the others use the `text-primary`, `text-muted-foreground`, `text-success`, `text-info` and `text-destructive` tokens. Unknown values fall back to `default`. Reflected as `data-tone`.' },
    { name: 'align', type: "'start' | 'center' | 'end'", description: 'Text alignment. Setting it makes the figure a block (`block text-start|center|end`); unset it stays inline. Logical values, so they mirror in right-to-left pages. Unknown values are ignored. Reflected as `data-align`.' },
    { name: 'duration', type: 'number', description: 'Deprecated no-op. The count-up animation was removed.' },
    { name: 'animate', type: 'boolean', description: 'Deprecated no-op. The number is always static.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last; wins over internal classes.' },
  ],
  requires: ['Throws a ContractError when `value` is not a finite number (NaN, Infinity, undefined), unless an explicit `fallback` text is set for the unavailable state.'],
  examples: [
    {
      title: 'Static value',
      code: `<StatCounter :value="170" class="text-4xl font-semibold" />`,
    },
    {
      title: 'Decimals, prefix and fallback',
      code: `<div class="flex flex-wrap gap-x-8 gap-y-2 text-3xl font-semibold">
  <StatCounter :value="12.5" :decimals="1" suffix="%" />
  <StatCounter :value="49" prefix="$" />
  <StatCounter :value="missing" fallback="not reported" />
</div>`,
      state: () => ({ missing: Number.NaN }),
    },
    {
      title: 'Locale formatting',
      code: `<StatCounter :value="1234.5" :decimals="2" locale="de-DE" class="text-3xl font-semibold" />`,
    },
    {
      title: 'Size gallery: sm, md, lg',
      description: 'Static figures. Unset `size` inherits the surrounding size, as in the examples above. Sample values.',
      code: `<div class="flex flex-wrap items-baseline gap-8">
  <StatCounter :value="1200" size="sm" suffix="+" />
  <StatCounter :value="1200" size="md" suffix="+" />
  <StatCounter :value="1200" size="lg" suffix="+" />
</div>`,
    },
    {
      title: 'Tone gallery: default, primary, muted, success, info, danger',
      description: 'The colour only styles the number. Always put a visible label next to it, so the meaning does not depend on colour.',
      code: `<dl class="grid gap-4 sm:grid-cols-3">
  <div><dt class="text-sm text-muted-foreground">Default tone (sample)</dt><dd><StatCounter :value="42" size="md" tone="default" /></dd></div>
  <div><dt class="text-sm text-muted-foreground">Primary tone (sample)</dt><dd><StatCounter :value="42" size="md" tone="primary" /></dd></div>
  <div><dt class="text-sm text-muted-foreground">Muted tone (sample)</dt><dd><StatCounter :value="42" size="md" tone="muted" /></dd></div>
  <div><dt class="text-sm text-muted-foreground">Success tone, passing checks (sample)</dt><dd><StatCounter :value="42" size="md" tone="success" /></dd></div>
  <div><dt class="text-sm text-muted-foreground">Info tone, notices (sample)</dt><dd><StatCounter :value="42" size="md" tone="info" /></dd></div>
  <div><dt class="text-sm text-muted-foreground">Danger tone, failing checks (sample)</dt><dd><StatCounter :value="42" size="md" tone="danger" /></dd></div>
</dl>`,
    },
    {
      title: 'Align gallery: start, center, end',
      description: 'Setting `align` makes the figure a block so the text can align inside its container.',
      code: `<div class="grid gap-4 sm:grid-cols-3">
  <div class="rounded-lg border p-4"><StatCounter :value="2048" size="md" align="start" /></div>
  <div class="rounded-lg border p-4"><StatCounter :value="2048" size="md" align="center" /></div>
  <div class="rounded-lg border p-4"><StatCounter :value="2048" size="md" align="end" /></div>
</div>`,
    },
  ],
  a11y: [
    'A plain text node: screen readers read the formatted number once. There is no aria-hidden copy, no live region and no animation to pause or to reduce.',
    '`tabular-nums` keeps digits the same width so numbers do not shift or misalign.',
    '`size`, `tone` and `align` change looks only; the text node is the same. A tone is colour only and never the signal (a red number still needs its label); the tone tokens are tested against the page and card surfaces. `align` uses logical values and mirrors in right-to-left pages. The largest size is 60px semibold; it stays inside its container because the figure is text that wraps.',
    'Give the number a visible label (StatGrid uses a description list); the number alone carries no meaning.',
  ],
  related: ['StatGrid'],
  llmNotes: [
    'Pass numbers, never user-supplied strings.',
    'Use `suffix` and `prefix` for units instead of concatenating outside.',
    'Only show figures you can source. Do not invent metrics.',
    'Do not pass `animate` or `duration`; they are ignored.',
    'Leave `size` unset inside a heading or `StatGrid`; set it for a standalone figure. Use `tone` sparingly and always with a visible label.',
  ],
  replaces: ['hand-rolled StatCounter markup in app code'],
}
export default doc
