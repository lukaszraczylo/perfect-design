import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Marquee',
  group: 'marketing',
  subgroup: 'Motion',
  summary: 'Infinite CSS ticker (horizontal or vertical) for logos or short text, paused on hover and focus.',
  description:
    'Use for decorative, repeating strips: partner names, tech stack, announcements. Content is duplicated once (the copy is aria-hidden) and translated with a pure CSS animation. `direction` is `left`, `right` (horizontal) or `up`, `down` (vertical, needs a height: `h-64` by default, override with `class`). A visible pause/resume button (`pausable`, on by default) lets anyone stop it (WCAG 2.2.2); it also pauses on hover and focus-within and fades at the edges (`fade`). For users who prefer reduced motion it stops animating, hides the duplicate and the button, and becomes a focusable, named, manually scrollable row. Do not use for important content that must be read; a moving target fails many users, so use `LogoCloud` for static display.',
  status: 'stable',
  props: [
    { name: 'items', type: 'string[]', default: '[]', description: 'Simple text items (ignored when the default slot is used).' },
    { name: 'duration', type: 'number', default: '30', description: 'Seconds per loop; invalid or <= 0 is ignored (then `speed` applies, else 30); clamped to 0.1-86400. Wins over `speed`.' },
    { name: 'speed', type: "'slow' | 'normal' | 'fast'", description: 'Preset for `duration`: slow = 60s, normal = 30s, fast = 15s per loop. Alias for quick tuning; an explicit valid `duration` always wins. Unknown values are ignored.' },
    { name: 'direction', type: "'left' | 'right' | 'up' | 'down'", default: "'left'", description: 'Scroll direction. `up`/`down` make a vertical strip (set its height via `class`, default `h-64`). Unknown values fall back to `left`.' },
    { name: 'pauseOnHover', type: 'boolean', default: 'true', description: 'Pause while hovered or focused within.' },
    { name: 'gap', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'", description: 'Space between items (0 / 1 / 2 / 3 rem); unknown values fall back to `md`.' },
    { name: 'fade', type: 'boolean', default: 'true', description: 'Fade both ends of the strip with a CSS mask (horizontal or vertical to match the axis).' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Text size of `items` (text-sm / text-lg / text-2xl). Slot content is not affected. Unknown values fall back to `md`. The resolved value is exposed as `data-size` on the root, also when slot content replaces `items`.' },
    { name: 'label', type: 'string', description: 'Optional accessible name; sets role="group".' },
    { name: 'pausable', type: 'boolean', default: 'true', description: 'Render the pause/resume button below the strip. Keep it on: moving content that lasts longer than 5 seconds needs a pause mechanism (WCAG 2.2.2).' },
    { name: 'paused', type: 'boolean', description: '`v-model:paused`. Leave undefined for uncontrolled use.' },
    { name: 'pauseLabel', type: 'string', default: "'Pause scrolling'", description: 'Button text while the strip moves (localise here).' },
    { name: 'playLabel', type: 'string', default: "'Resume scrolling'", description: 'Button text while the strip is paused.' },
    { name: 'scrollLabel', type: 'string', default: "'Scrollable content'", description: 'Accessible name of the strip when it becomes a scrollable row under prefers-reduced-motion.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last on the root; wins over internal classes (e.g. `h-96` for vertical strips).' },
  ],
  emits: [{ name: 'update:paused', payload: '[paused: boolean]', description: 'The pause button was used.' }],
  slots: [{ name: 'default', description: 'Rich items (logos, badges). Rendered twice; do not attach unique ids inside.' }],
  examples: [
    { title: 'Basic: text items', code: `<Marquee :items="['Vue 3', 'Tailwind 4', 'TypeScript', 'Vitest', 'Pinia']" />` },
    {
      title: 'Realistic: slot content, reversed and slower',
      code: `<Marquee direction="right" :duration="45" label="Technologies">
  <Badge variant="secondary">Accessible</Badge>
  <Badge variant="secondary">Themeable</Badge>
  <Badge variant="secondary">Typed</Badge>
</Marquee>`,
    },
    {
      title: 'Left direction with speed preset',
      description: 'Default direction; `speed` is a quick preset for `duration`.',
      code: `<Marquee speed="fast" :items="['Typed', 'Tested', 'Themeable', 'Accessible']" />`,
    },
    {
      title: 'Right direction without edge fade',
      code: `<Marquee direction="right" :fade="false" gap="lg" size="lg" :items="['Alpha', 'Beta', 'Gamma', 'Delta']" />`,
    },
    {
      title: 'Vertical: up',
      description: 'Vertical strip for sidebars and announcement columns. Height comes from `class`.',
      code: `<Marquee direction="up" class="h-40 max-w-xs" size="sm" gap="sm" :items="['First sample item', 'Second sample item', 'Third sample item', 'Fourth sample item']" />`,
    },
    {
      title: 'Vertical: down, no pause',
      code: `<Marquee direction="down" :pause-on-hover="false" :duration="20" class="h-32 max-w-xs" :items="['One', 'Two', 'Three']" />`,
    },
    {
      title: 'Custom duration beats speed',
      description: 'When both are set, a valid `duration` (seconds) wins.',
      code: `<Marquee speed="slow" :duration="10" :items="['Quick', 'Brown', 'Fox']" />`,
    },
  ],
  requires: [
    'Throws a ContractError when `pausable` is false while the strip moves (no reduced-motion preference, items present) and `paused` is not bound to your own control (WCAG 2.2.2).',
  ],
  a11y: [
    'Pause mechanism (WCAG 2.2.2): a real "Pause scrolling" / "Resume scrolling" button (Tab to it, Enter or Space) stops and restarts the animation; the label changes with the state. It is at least 24px tall and 44px on coarse pointers, sits outside the faded edges and has the shared focus ring. The strip also pauses on hover and while focus is inside it.',
    'prefers-reduced-motion: the animation never runs, the duplicate and the button are hidden, and the strip becomes a scrollable row (or column) that is focusable (`tabindex="0"`), named (`scrollLabel`) and operable with the arrow keys.',
    'The duplicate copy is aria-hidden so content is announced once; `label` names the group.',
    'Treat as decorative: do not place the only copy of critical information here. Gaps use logical padding so RTL works; the strip clips inside its own box, so 320px screens never scroll sideways.',
  ],
  related: ['LogoCloud', 'SectionReveal'],
  llmNotes: ['Use only for decorative strips.', 'Prefer `speed` (slow/normal/fast) for tuning; use `duration` only for an exact loop time.', 'Use `direction="up"`/`"down"` only in a container with a fixed height (set `class="h-48"` etc.). Horizontal is the default for logo and tech-stack rows.', 'Set `:fade="false"` when the strip sits edge-to-edge or on a tinted section.', 'No interactive elements with unique ids in the slot (it renders twice).', 'Give a `label` if the strip carries meaning.', 'Keep `pausable` on; WCAG 2.2.2 requires a way to stop moving content.'],
  replaces: ['hand-rolled Marquee markup in app code'],
}
export default doc
