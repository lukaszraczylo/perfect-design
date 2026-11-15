import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'BackToTop',
  group: 'navigation',
  subgroup: 'Accessibility',
  summary: 'Floating button that appears after scrolling down and scrolls the window back to the top.',
  description:
    'Mount once near the root of a long page. It is rendered only while `window` has scrolled past `threshold` px (tracked with the library\'s own `useWindowScroll` helper, no extra dependency), is fixed to the bottom end corner (`end-6 bottom-6`, so it mirrors in RTL; override with `class`), and scrolls smoothly unless `smooth` is false or the user prefers reduced motion. It tracks the window only; for scrollable containers build the button yourself.',
  status: 'stable',
  props: [
    { name: 'threshold', type: 'number', default: '300', description: 'Scroll distance in px after which the button appears. Invalid or negative values fall back to 300.' },
    { name: 'label', type: 'string', default: "'Back to top'", description: 'aria-label and title.' },
    { name: 'variant', type: "'button' | 'pill'", default: "'button'", description: '`button`: icon-only circle. `pill`: the arrow plus the `label` as visible text. Unknown values fall back to `button`.' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Circle: 36px, 44px or 56px. Pill: 32px, 36px or 44px high (at least 44px on coarse pointers). Unknown values fall back to `md`.' },
    { name: 'smooth', type: 'boolean', default: 'true', description: 'Smooth scrolling (ignored under prefers-reduced-motion).' },
    { name: 'class', type: 'string | object | array', description: 'Merged last (e.g. `left-6 right-auto`).' },
  ],
  slots: [{ name: 'default', description: 'Replaces the arrow icon (and, in the `pill` variant, the visible label).' }],
  examples: [
    {
      title: 'Default (appears after 300px)',
      code: `<div class="text-sm text-muted-foreground">Scroll the page down: a button appears at the bottom end corner.<BackToTop /></div>`,
    },
    {
      title: 'Custom threshold and position',
      code: `<div class="text-sm text-muted-foreground">Appears after 100px, bottom-start corner.<BackToTop :threshold="100" label="Jump to top" class="end-auto start-6" /></div>`,
    },
    {
      title: 'Pill with a visible label',
      code: `<div class="text-sm text-muted-foreground">Scroll the page down: a pill with the arrow and the label appears at the bottom end corner.<BackToTop variant="pill" size="sm" :threshold="200" label="Back to top" /></div>`,
    },
  ],
  a11y: [
    'Native button with an accessible name (`label`, also used as the title); not rendered at all while hidden, so it is never a hidden tab stop.',
    'The `pill` variant shows the label as visible text, which is also its accessible name (label in name). Target is a 44px circle by default (36px at `sm`, which grows to 44px on coarse pointers; 56px at `lg`). Smooth scrolling and the fade-in are off under prefers-reduced-motion.',
    'It sits at the end of the DOM-order tab sequence only when the page is scrolled; place it last in the document.',
  ],
  related: ['SkipLink', 'TableOfContents'],
  llmNotes: ['Mount a single BackToTop per page.', 'Do not wrap it in a container with transform/overflow that breaks position: fixed.'],
  replaces: ['hand-rolled BackToTop markup in app code'],
}
export default doc
