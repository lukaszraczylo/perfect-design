import { faXmark } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'VisuallyHidden',
  group: 'primitives',
  subgroup: 'Layout helpers',
  summary: 'Hides content visually while keeping it available to screen readers.',
  description:
    'Use `VisuallyHidden` for text that only assistive technology needs: labels for icon-only controls, extra context for links, headings that structure a page without being shown. It keeps the element in the accessibility tree (unlike `display: none`/`hidden`). Prefer a visible label whenever the design allows. Use `as-child` to hide an existing element such as a heading.',
  status: 'stable',
  props: [
    { name: 'as', type: 'string | Component', default: "'span'", description: 'Element to render.' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Apply the hiding styles to the single slot child instead of a wrapper (reka-ui).' },
    { name: 'class', type: 'string | object | array', description: 'Merged with the root class.' },
  ],
  slots: [{ name: 'default', description: 'Content read by screen readers only.' }],
  examples: [
    {
      title: 'Label for an icon-only button',
      code: `<Button size="icon" variant="outline">
  <Icon :icon="faXmark" />
  <VisuallyHidden>Close</VisuallyHidden>
</Button>`,
      state: () => ({ faXmark }),
    },
    {
      title: 'Hidden heading via asChild',
      code: `<section>
  <VisuallyHidden as-child><h2>Account settings</h2></VisuallyHidden>
  <p class="text-sm text-muted-foreground">The heading above is announced but not shown.</p>
</section>`,
    },
  ],
  a11y: [
    'Content stays in the accessibility tree and is read by screen readers.',
    'Not focusable by default: do not put interactive controls inside unless they are meant to be reached while invisible.',
  ],
  related: ['Label', 'Button'],
  llmNotes: [
    'Use for accessible names of icon-only controls instead of aria-label when text must be translatable in the DOM.',
    'Never use it to hide interactive content; keyboard users would focus something they cannot see.',
    'Use as-child to hide an existing semantic element (h2, label) rather than nesting it.',
  ],
  replaces: ['Tailwind `sr-only` spans', 'shadcn-vue/radix VisuallyHidden'],
}
export default doc
