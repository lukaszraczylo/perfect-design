import { faBell, faCircleCheck, faGear } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Icon',
  group: 'primitives',
  subgroup: 'Display',
  summary: 'Inline SVG renderer for FontAwesome-shaped icon data, decorative by default.',
  description:
    'Use `Icon` to draw any `IconDefinition` (`{ icon: [width, height, , , path] }`) as inline SVG. No FontAwesome runtime is loaded. Library code imports icons from `lib/icons`; an app can pass icons from `@fortawesome/free-solid-svg-icons`. The icon takes the text colour (`fill-current`) and a size from the scale.\n\nAn icon is decorative unless it has a `label`. Put meaning in visible text; use `label` only for an icon that stands alone. For a clickable icon use `IconButton`, not an `Icon` with a handler.',
  status: 'stable',
  props: [
    { name: 'icon', type: 'IconDefinition', description: 'Required. FontAwesome-shaped icon data. An invalid definition renders nothing and raises a ContractError in strict mode.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Size: 12, 14, 16, 20 or 24px. Unknown values fall back to md.' },
    { name: 'spin', type: 'boolean', default: 'false', description: 'Rotate continuously. Slows to a pulse under reduced motion.' },
    { name: 'label', type: 'string', description: 'Accessible name. When set the SVG is `role="img"` with this `aria-label`; without it the SVG is `aria-hidden`.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  examples: [
    {
      title: 'Sizes and colour',
      description: 'The icon follows the current text colour.',
      code: `<div class="flex items-center gap-4 text-foreground">
  <Icon :icon="faGear" size="xs" />
  <Icon :icon="faGear" size="sm" />
  <Icon :icon="faGear" />
  <Icon :icon="faGear" size="lg" class="text-primary" />
  <Icon :icon="faGear" size="xl" class="text-muted-foreground" />
</div>`,
      state: () => ({ faGear }),
    },
    {
      title: 'Decorative and labelled',
      description: 'Beside text the icon stays decorative. Alone it needs a label.',
      code: `<div class="flex flex-col gap-3 text-sm">
  <span class="inline-flex items-center gap-2"><Icon :icon="faCircleCheck" class="text-success" /> Backup finished</span>
  <Icon :icon="faBell" label="Notifications are on" />
</div>`,
      state: () => ({ faBell, faCircleCheck }),
    },
    {
      title: 'Spinning',
      code: `<Icon :icon="faGear" spin size="lg" class="text-muted-foreground" />`,
      state: () => ({ faGear }),
    },
  ],
  a11y: [
    'Without `label` the SVG is `aria-hidden="true"` and `focusable="false"`: it is invisible to assistive tech, so the text next to it must carry the meaning.',
    'With `label` the SVG is `role="img"` with `aria-label`.',
    'Never rely on an icon alone to show state: pair it with text.',
    '`spin` respects `prefers-reduced-motion`.',
  ],
  related: ['IconButton', 'Button', 'Spinner'],
  llmNotes: [
    'Import icon data and pass it as `:icon`; never inline SVG paths in a template.',
    'Leave `label` off when text sits next to the icon. Set it only when the icon is the whole message.',
    'Use `IconButton` with a `label` for an icon you can click.',
  ],
  replaces: ['FontAwesome <i> markup', 'hand-rolled inline SVG icons'],
}
export default doc
