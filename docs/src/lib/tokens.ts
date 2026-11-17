/** Token catalogue shown on the Foundations pages. Names mirror packages/ui/src/styles/theme.css. */
export interface ColorToken { name: string; usage: string; on?: string }
export const COLOR_GROUPS: { title: string; tokens: ColorToken[] }[] = [
  { title: 'Surfaces', tokens: [
    { name: 'background', usage: 'Page background', on: 'foreground' },
    { name: 'card', usage: 'Cards, panels', on: 'card-foreground' },
    { name: 'popover', usage: 'Menus, dialogs, tooltips', on: 'popover-foreground' },
    { name: 'muted', usage: 'Subtle fills, skeletons', on: 'muted-foreground' },
    { name: 'secondary', usage: 'Secondary buttons', on: 'secondary-foreground' },
    { name: 'sidebar', usage: 'Navigation rails', on: 'sidebar-foreground' },
  ] },
  { title: 'Brand & interaction', tokens: [
    { name: 'primary', usage: 'Primary actions, links, focus', on: 'primary-foreground' },
    { name: 'accent', usage: 'Hover / selected backgrounds', on: 'accent-foreground' },
    { name: 'ring', usage: 'Focus ring colour' },
  ] },
  { title: 'Status', tokens: [
    { name: 'destructive', usage: 'Errors, destructive actions', on: 'destructive-foreground' },
    { name: 'success', usage: 'Success, approved, healthy', on: 'success-foreground' },
    { name: 'warning', usage: 'Caution, degraded', on: 'warning-foreground' },
    { name: 'info', usage: 'Neutral information', on: 'info-foreground' },
  ] },
  { title: 'Lines & overlays', tokens: [
    { name: 'border', usage: 'Dividers and card outlines' },
    { name: 'input', usage: 'Form control borders' },
    { name: 'scrim', usage: 'Modal backdrop' },
  ] },
  { title: 'Data visualisation', tokens: [1, 2, 3, 4, 5].map((n) => ({ name: `chart-${n}`, usage: `Series ${n}` })),
  },
]

export const TYPE_SCALE = [
  { cls: 'text-6xl', name: '6xl', sample: 'Display' },
  { cls: 'text-5xl', name: '5xl', sample: 'Hero headline' },
  { cls: 'text-4xl', name: '4xl', sample: 'Page title' },
  { cls: 'text-3xl', name: '3xl', sample: 'Section title' },
  { cls: 'text-2xl', name: '2xl', sample: 'Subsection title' },
  { cls: 'text-xl', name: 'xl', sample: 'Card title' },
  { cls: 'text-lg', name: 'lg', sample: 'Lead paragraph' },
  { cls: 'text-md', name: 'md', sample: 'Prose body (16px)' },
  { cls: 'text-base', name: 'base', sample: 'Default UI text (14px)' },
  { cls: 'text-sm', name: 'sm', sample: 'Secondary UI text (13px)' },
  { cls: 'text-xs', name: 'xs', sample: 'Captions and meta (12px)' },
  { cls: 'text-2xs', name: '2xs', sample: 'Micro labels (11px)' },
]

/** Class strings are written out in full: Tailwind only emits a utility that appears literally in the source. */
export const RADII = [
  { name: 'xs', cls: 'rounded-xs' },
  { name: 'sm', cls: 'rounded-sm' },
  { name: 'md', cls: 'rounded-md' },
  { name: 'lg', cls: 'rounded-lg' },
  { name: 'xl', cls: 'rounded-xl' },
  { name: '2xl', cls: 'rounded-2xl' },
] as const
export const SPACING = [1, 2, 3, 4, 6, 8, 12, 16]
export const SHADOWS = [
  { name: 'xs', cls: 'shadow-xs' },
  { name: 'sm', cls: 'shadow-sm' },
  { name: 'md', cls: 'shadow-md' },
  { name: 'lg', cls: 'shadow-lg' },
  { name: 'xl', cls: 'shadow-xl' },
] as const
/** Class strings are written out in full: Tailwind only emits a utility that appears literally in the source. */
export const ANIMATIONS = [
  { name: 'ds-fade-in', cls: 'animate-ds-fade-in' },
  { name: 'ds-pop-in', cls: 'animate-ds-pop-in' },
  { name: 'ds-slide-in-right', cls: 'animate-ds-slide-in-right' },
  { name: 'ds-slide-in-bottom', cls: 'animate-ds-slide-in-bottom' },
  { name: 'ds-collapse-down', cls: 'animate-ds-collapse-down' },
  { name: 'ds-shimmer', cls: 'animate-ds-shimmer' },
  { name: 'ds-indeterminate', cls: 'animate-ds-indeterminate' },
] as const

