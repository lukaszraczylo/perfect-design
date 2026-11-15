import { ref } from 'vue'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'ToastItem',
  group: 'feedback',
  subgroup: 'Toasts',
  summary: 'Presentational toast card: icon, title, description, optional action and dismiss button.',
  description:
    'You normally do not render `ToastItem` yourself: push toasts with `useToastStore()` and mount `<Toaster />` once. Use `ToastItem` directly to build a custom toast host or to show a static preview of a toast. Options: leave the status icon on (default), replace it with `icon`, or remove it with `hideIcon`; add a draining countdown bar with `progress` + `duration` (frozen by `paused`, hidden under reduced motion; it only visualises time, dismissal is owned by the store/Toaster). Note that `Toast` is the store item type, which is why the component is named `ToastItem`.',
  status: 'stable',
  props: [
    { name: 'title', type: 'string', required: true, description: 'Main message.' },
    { name: 'description', type: 'string', description: 'Secondary text.' },
    { name: 'variant', type: "'default' | 'success' | 'warning' | 'danger' | 'info'", default: "'default'", description: 'Tone (same names as the toast store). Unknown values fall back to `default`.' },
    { name: 'layout', type: "'default' | 'compact' | 'inline'", default: "'default'", description: '`default` puts the action under the text; `compact` is a dense card with smaller type and padding; `inline` keeps the size and moves the action to the end of the row. Unknown values fall back to `default`. Non-default values add `data-layout`.' },
    { name: 'appearance', type: "'default' | 'soft' | 'solid'", default: "'default'", description: '`default` is the popover surface with a tone border; `soft` is tinted; `solid` is filled with the tone colour and its foreground token (icon, text, progress bar and dismiss follow the text colour). Unknown values fall back to `default`. Non-default values add `data-appearance`.' },
    { name: 'action', type: '{ label: string; onClick: () => void }', description: 'Action button. Clicking it runs `onClick`, then emits `action` and `dismiss`.' },
    { name: 'icon', type: 'IconDefinition', description: 'Replaces the default status icon of the variant (colour still follows the variant).' },
    { name: 'hideIcon', type: 'boolean', default: 'false', description: 'Render without the leading icon. Wins over `icon`.' },
    { name: 'progress', type: 'boolean', default: 'false', description: 'Show a countdown bar along the bottom edge that drains over `duration`. Needs a finite `duration` > 0; otherwise no bar is rendered.' },
    { name: 'duration', type: 'number', description: 'Countdown length in ms for the progress bar. The component never dismisses itself; keep it in sync with the store duration.' },
    { name: 'announce', type: 'boolean', default: 'true', description: 'Make the toast its own live region (role status or alert). Toaster sets it to false and announces through one persistent region.' },
    { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the progress bar (Toaster sets it while the stack is hovered or focused).' },
    { name: 'dismissLabel', type: 'string', default: "'Dismiss notification'", description: 'Accessible label of the close button.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  emits: [
    { name: 'dismiss', payload: '[]', description: 'Close button or action was used.' },
    { name: 'action', payload: '[]', description: 'Action button clicked (after `action.onClick`).' },
  ],
  examples: [
    {
      title: 'Variants',
      code: `<div class="grid max-w-sm gap-2">
  <ToastItem title="Settings saved" description="Your changes are live." variant="success" />
  <ToastItem title="Connection lost" variant="danger" />
  <ToastItem title="Update available" variant="info" />
</div>`,
    },
    {
      title: 'With action',
      script: `import { ref } from 'vue'
import { faBell } from '@fortawesome/free-solid-svg-icons'\nconst undone = ref(false)`,
      code: `<div class="max-w-sm">
  <ToastItem title="Item archived" :action="{ label: 'Undo', onClick: () => (undone = true) }" />
  <p class="mt-2 text-sm text-muted-foreground">Undone: {{ undone }}</p>
</div>`,
      state: () => ({ undone: ref(false) }),
    },
    {
      title: 'Layout and appearance',
      description: '`compact` for dense dashboards, `inline` to keep a short message and its action on one row, `soft` and `solid` for stronger emphasis.',
      script: `import { ref } from 'vue'\nconst clicks = ref(0)`,
      code: `<div class="grid max-w-sm gap-2">
  <ToastItem title="Copied" layout="compact" variant="success" />
  <ToastItem title="Item archived" layout="inline" :action="{ label: 'Undo', onClick: () => clicks++ }" />
  <ToastItem title="Draft saved" description="Soft surface." appearance="soft" variant="info" />
  <ToastItem title="Upload failed" description="Solid surface, text follows the tone foreground." appearance="solid" variant="danger" :action="{ label: 'Retry', onClick: () => clicks++ }" />
</div>`,
      state: () => ({ clicks: ref(0) }),
    },
    {
      title: 'Without icon',
      description: '`hideIcon` removes the leading icon for a text-only toast.',
      code: `<div class="grid max-w-sm gap-2"><ToastItem title="Copied to clipboard" hide-icon /><ToastItem title="Export finished" description="3 files, 12 MB." variant="success" hide-icon /></div>`,
    },
    {
      title: 'Custom icon',
      description: '`icon` replaces the status icon; the colour still follows the variant.',
      code: `<div class="max-w-sm"><ToastItem title="New reminder" variant="info" :icon="faBell" /></div>`,
      script: `import { faBell } from '@fortawesome/free-solid-svg-icons'`,
      state: () => ({ faBell }),
    },
    {
      title: 'Progress countdown',
      description: '`progress` + `duration` shows a draining bar; toggle `paused` to freeze it. Under prefers-reduced-motion the bar is hidden.',
      code: `<div class="grid max-w-sm gap-2">
  <ToastItem title="Message sent" description="Undo within 8 seconds." variant="success" progress :duration="8000" :paused="paused" />
  <ToastItem title="Sync failed" variant="danger" progress :duration="8000" :paused="paused" />
  <Button size="sm" variant="outline" @click="paused = !paused">{{ paused ? 'Resume' : 'Pause' }} countdown</Button>
</div>`,
      script: `import { ref } from 'vue'\nconst paused = ref(false)`,
      state: () => ({ paused: ref(false) }),
    },
  ],
  a11y: [
    'Standalone, it is its own live region: role="status" for default, success and info, role="alert" for warning and danger. Inside a `Toaster`, `announce` is off and the Toaster announces instead.',
    'The dismiss button has an aria-label, is 28px square and 40px on coarse pointers. The action is a real <button>.',
    'Every layout and appearance keeps the title, the action and the dismiss button as real buttons with names; the status icon and the title carry the tone, the border or fill only supports it. Solid uses each tone with its foreground token.',
    'The progress bar is aria-hidden decoration (time is never the only cue). It is hidden under prefers-reduced-motion and its animation is cancelled on unmount.',
  ],
  related: ['Toaster', 'Alert'],
  requires: [
    'Throws a ContractError when a `ToastItem` has a blank `title`, a blank `dismissLabel` or an `action` with a blank `label`.',
  ],
  llmNotes: ['Use `layout="compact"` for dense UIs and `appearance="solid"` only for toasts that must not be missed.', 'Prefer useToastStore().push()/success()/error() over rendering ToastItem manually.', 'Use `hideIcon` for terse confirmations and `progress` only when users benefit from seeing the remaining time (undo windows).', 'Keep toast titles short; put detail in `description`.'],
  replaces: ['shadcn-vue Toast item', 'hand-rolled ToastItem markup in app code'],
}
export default doc
