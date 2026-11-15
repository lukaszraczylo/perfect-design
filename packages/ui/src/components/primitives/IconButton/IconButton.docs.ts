import { faGear, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'IconButton',
  group: 'primitives',
  subgroup: 'Buttons',
  summary: 'Square icon-only Button with a required accessible label and tooltip title.',
  description:
    'Use `IconButton` for toolbar and row actions that show only an icon. `label` is REQUIRED: it becomes `aria-label` and the native `title` tooltip. It composes `Button`, so `variant`, `loading`, `disabled`, `as` and `type` behave identically. Size names `xs|sm|md|lg|xl` are mapped to the square `icon-*` sizes. Defaults to the `ghost` variant.\n\n' +
    '**Sizes** (`size`): `xs` 24px, `sm` 32px, `md` 36px (44px on coarse pointers), `lg` 44px and `xl` 48px. `xs` is the smallest allowed target (24px); prefer `sm` or larger for the main action of a row. **Shape** (`shape`): `rounded` (default, rounded-md), `circle` (fully round, for floating and avatar-like actions) and `square` (no rounding, for dense toolbars). The button is always square, so a pill shape would be a circle. Unknown `size` and `shape` values fall back to `icon` (md) and `rounded`. `iconButtonVariants` returns the same classes for a plain `a` or `button`.',
  status: 'stable',
  props: [
    { name: 'label', type: 'string', required: true, description: 'Accessible name: used for aria-label and title.' },
    { name: 'icon', type: 'IconDefinition', description: 'FontAwesome icon. Omit when using the default slot.' },
    { name: 'variant', type: "'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive' | 'success' | 'soft'", default: "'ghost'", description: 'Button variant. Unknown values fall back to default (the Button rule).' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'", default: "'icon'", description: 'Square size: xs 24px, sm 32px, md 36px (44px on coarse pointers), lg 44px, xl 48px; icon, icon-xs, icon-sm and icon-lg are the Button sizes. Unknown values fall back to icon.' },
    { name: 'shape', type: "'rounded' | 'circle' | 'square'", default: "'rounded'", description: 'Corner shape: rounded-md, fully round or square corners. Unknown values fall back to rounded.' },
    { name: 'as', type: 'string | Component', default: "'button'", description: 'Element to render.' },
    { name: 'type', type: "'button' | 'submit' | 'reset'", default: "'button'", description: 'Native button type.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables interaction.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Replaces the icon with a spinner, sets aria-busy, blocks clicks.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Custom icon content replacing `icon`. Hidden while loading.' }],
  examples: [
    {
      title: 'Variants and sizes',
      code: `<div class="flex flex-wrap items-center gap-2">
  <IconButton label="Add" :icon="faPlus" />
  <IconButton label="Settings" :icon="faGear" variant="outline" />
  <IconButton label="Add" :icon="faPlus" variant="default" size="sm" />
  <IconButton label="Delete" :icon="faTrash" variant="destructive" size="lg" />
  <IconButton label="Unavailable" :icon="faGear" disabled />
</div>`,
      state: () => ({ faPlus, faGear, faTrash }),
    },
    {
      title: 'Loading',
      script: `const busy = ref(false)\nfunction run() { busy.value = true; setTimeout(() => (busy.value = false), 1500) }`,
      code: `<IconButton label="Save" :icon="faPlus" variant="outline" :loading="busy" @click="run" />`,
      state: () => {
        const busy = ref(false)
        return { faPlus, busy, run: () => { busy.value = true; setTimeout(() => (busy.value = false), 1500) } }
      },
    },
    {
      title: 'Sizes',
      description: 'xs, sm, md, lg and xl. All are square; xs is 24px and xl is 48px.',
      code: `<div class="flex flex-wrap items-center gap-2">
  <IconButton label="Extra small" :icon="faPlus" variant="outline" size="xs" />
  <IconButton label="Small" :icon="faPlus" variant="outline" size="sm" />
  <IconButton label="Medium" :icon="faPlus" variant="outline" size="md" />
  <IconButton label="Large" :icon="faPlus" variant="outline" size="lg" />
  <IconButton label="Extra large" :icon="faPlus" variant="outline" size="xl" />
</div>`,
      state: () => ({ faPlus }),
    },
    {
      title: 'Shapes',
      description: 'rounded (default), circle and square, with a filled and an outline variant.',
      code: `<div class="flex flex-wrap items-center gap-2">
  <IconButton label="Rounded" :icon="faGear" variant="outline" shape="rounded" />
  <IconButton label="Circle" :icon="faGear" variant="outline" shape="circle" />
  <IconButton label="Square" :icon="faGear" variant="outline" shape="square" />
  <IconButton label="Rounded, filled" :icon="faPlus" variant="default" shape="rounded" />
  <IconButton label="Circle, filled" :icon="faPlus" variant="default" shape="circle" size="lg" />
  <IconButton label="Square, soft" :icon="faTrash" variant="soft" shape="square" size="sm" />
</div>`,
      state: () => ({ faPlus, faGear, faTrash }),
    },
  ],
  a11y: ['`label` provides both aria-label and a visible tooltip (title) for pointer users.', 'Every size and shape keeps the required `label` (aria-label and title) and a target of at least 24px; `md` grows to 44px on coarse pointers and `lg` and `xl` are already 44px or more. Shape changes only the corner radius, so the focus ring and the hit area are the same.', 'Inherits Button semantics: Space/Enter, aria-busy while loading, disabled blocks clicks.'],
  related: ['Button', 'Icon'],
  requires: [
    'Throws a ContractError when `label` is missing or blank.',
    'Throws a ContractError when there is neither an `icon` nor default slot content.',
  ],
  llmNotes: ['ALWAYS provide `label`; it is required.', 'Use IconButton instead of Button size="icon" + manual aria-label.', 'Use `shape="circle"` for round actions; there is no pill shape because the button is square. Use `size="xl"` for large touch actions.', 'Prefer `icon` prop with a FontAwesome IconDefinition over inline SVG.'],
  replaces: ['Button size="icon" with manual aria-label', 'ad-hoc icon-only buttons'],
}
export default doc
