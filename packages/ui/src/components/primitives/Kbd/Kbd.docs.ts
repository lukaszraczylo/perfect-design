import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Kbd',
  group: 'primitives',
  subgroup: 'Display',
  summary: 'Keyboard key chip (`<kbd>`) and a group that joins keys with a separator.',
  description:
    'Use `Kbd` to show a single key and `KbdGroup` for shortcuts made of several keys. `KbdGroup` takes either a `keys` array or `Kbd` children and can draw a `separator` (`+`, `then`) between them.\n\nVariations:\n\n- `variant`: `default` (muted fill with border), `outline` (border only, for use on tinted surfaces), `ghost` (no border or fill, for dense menus) and `solid` (inverted: foreground fill, background text, for tooltips and hints that need to stand out).\n- `size`: `xs` (16px), `sm` (20px), `md` (24px, default), `lg` (28px). Pick the size that matches the surrounding text: `xs` or `sm` beside 12px text, `lg` beside headings.\n- `KbdGroup` also takes `variant` and `size` for the chips it generates from `keys` (slotted `Kbd` children keep their own props) and `gap` (`none`, `sm`, `md`, `lg`) for the space between chips.\n\nKeys are not interactive, so the 24px target size does not apply.',
  status: 'stable',
  parts: [
    {
      name: 'KbdGroup',
      description: 'Inline container that renders keys (from `keys` and/or slot) joined by an aria-hidden separator.',
      props: [
        { name: 'keys', type: 'string[]', default: '[]', description: 'Keys rendered as `Kbd` chips before any slot children.' },
        { name: 'separator', type: 'string', default: "''", description: 'Text between keys; empty = none.' },
        { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Size of chips generated from `keys` and of the separator text. Unknown values fall back to md.' },
        { name: 'variant', type: "'default' | 'outline' | 'ghost' | 'solid'", default: "'default'", description: 'Surface of chips generated from `keys`. Unknown values fall back to default.' },
        { name: 'gap', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Space between chips and separators: 0, 2px, 4px, 8px. Unknown values fall back to md.' },
        { name: 'as', type: 'string | Component', default: "'span'", description: 'Element to render.' },
        { name: 'class', type: 'string | object | array', description: 'Merged last.' },
      ],
    },
  ],
  props: [
    { name: 'variant', type: "'default' | 'outline' | 'ghost' | 'solid'", default: "'default'", description: 'Surface: muted fill with border, border only, no border or fill, or inverted (foreground fill). Unknown values fall back to default.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Chip height: h-4, h-5, h-6 or h-7. Unknown values fall back to md.' },
    { name: 'as', type: 'string | Component', default: "'kbd'", description: 'Element to render.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'The key label (text, symbol or icon).' }],
  examples: [
    {
      title: 'Single keys',
      code: `<p class="text-sm text-muted-foreground">Press <Kbd>Esc</Kbd> to close or <Kbd size="sm">?</Kbd> for help.</p>`,
    },
    {
      title: 'Shortcut groups',
      code: `<div class="flex flex-col gap-2">
  <KbdGroup :keys="['Ctrl', 'K']" separator="+" />
  <KbdGroup separator="then"><Kbd>G</Kbd><Kbd>D</Kbd></KbdGroup>
  <KbdGroup :keys="['Cmd', 'Shift', 'P']" />
</div>`,
    },
    {
      title: 'Variants',
      description: 'All four surfaces side by side. `ghost` and `solid` keep a border in forced-colors mode.',
      code: `<div class="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
  <span class="flex items-center gap-1.5"><Kbd>Esc</Kbd> default</span>
  <span class="flex items-center gap-1.5"><Kbd variant="outline">Esc</Kbd> outline</span>
  <span class="flex items-center gap-1.5"><Kbd variant="ghost">Esc</Kbd> ghost</span>
  <span class="flex items-center gap-1.5"><Kbd variant="solid">Esc</Kbd> solid</span>
</div>`,
    },
    {
      title: 'Sizes',
      description: 'From `xs` to `lg`, aligned on the text baseline.',
      code: `<div class="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
  <span class="flex items-center gap-1.5"><Kbd size="xs">K</Kbd> xs</span>
  <span class="flex items-center gap-1.5"><Kbd size="sm">K</Kbd> sm</span>
  <span class="flex items-center gap-1.5"><Kbd size="md">K</Kbd> md</span>
  <span class="flex items-center gap-1.5"><Kbd size="lg">K</Kbd> lg</span>
</div>`,
    },
    {
      title: 'Group variations',
      description: '`variant`, `size` and `gap` on a group style the chips generated from `keys`.',
      code: `<div class="flex flex-col items-start gap-2">
  <KbdGroup :keys="['Ctrl', 'K']" separator="+" variant="outline" />
  <KbdGroup :keys="['Ctrl', 'Shift', 'P']" separator="+" variant="solid" size="sm" />
  <KbdGroup :keys="['G', 'D']" separator="then" variant="ghost" size="lg" gap="lg" />
  <KbdGroup :keys="['Alt', 'Enter']" size="xs" gap="none" />
</div>`,
    },
  ],
  a11y: ['Rendered as a native `<kbd>` element, which assistive tech exposes as keyboard input.', 'Separators are aria-hidden so screen readers read the keys in sequence.', 'Spell modifier keys as words (Cmd, Ctrl) rather than symbols so they are announced reliably.', 'Keys are inline text: they wrap with the surrounding paragraph at 320px.', 'Every variant keeps the key text readable: `default`, `outline` and `ghost` use muted-foreground, `solid` uses background on foreground (both are tested token pairs). The `xs` size is 11px text, so use it only beside equally small text.', '`ghost` and `solid` rely on a fill that forced-colors mode removes, so they keep a `forced-colors:border-current` border.'],
  related: ['Badge'],
  llmNotes: ['Match `size` to the surrounding text; use `variant="solid"` only where a key hint must stand out.', 'Use KbdGroup with `keys` for multi-key shortcuts instead of several loose Kbd.', 'Write modifier names consistently (Ctrl, Shift, Alt, Cmd).'],
  replaces: ['shadcn-vue Kbd', 'ad-hoc <kbd> styles'],
}
export default doc
