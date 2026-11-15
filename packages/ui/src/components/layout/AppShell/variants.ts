import { cn } from '../../../lib/cn'

/**
 * `top-nav-sidebar` (default): header spans the full width above sidebar + content.
 * `sidebar-left` / `sidebar-right`: full-height sidebar, the header sits above the content column only.
 * `top-nav`: header + content, no sidebar.
 * `dual-sidebar`: full-height start sidebar (`sidebar` slot) and end sidebar (`sidebar-end` slot).
 */
export type AppShellLayout = 'top-nav-sidebar' | 'sidebar-left' | 'sidebar-right' | 'top-nav' | 'dual-sidebar'
export type AppShellBreakpoint = 'md' | 'lg'
export type AppShellSidebarWidth = 'sm' | 'md' | 'lg'
export type AppShellRailWidth = 'sm' | 'md' | 'lg'
export type AppShellCollapseMode = 'rail' | 'hidden'
export type AppShellSide = 'start' | 'end'

export const appShellLayouts: readonly string[] = ['top-nav-sidebar', 'sidebar-left', 'sidebar-right', 'top-nav', 'dual-sidebar']
export const appShellBreakpoints: readonly string[] = ['md', 'lg']
export const appShellWidths: readonly string[] = ['sm', 'md', 'lg']
export const appShellCollapseModes: readonly string[] = ['rail', 'hidden']

/** Media-query widths matching Tailwind's `md` / `lg`. */
export const appShellMediaQueries: Record<AppShellBreakpoint, string> = {
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
}

type ByBp<T> = Record<AppShellBreakpoint, T>

/** Every class is literal so Tailwind's scanner generates it. */
const hiddenClasses: ByBp<string> = { md: 'hidden md:flex', lg: 'hidden lg:flex' }
const shrinkClasses: ByBp<string> = { md: 'md:shrink-0', lg: 'lg:shrink-0' }
const fullHeightClasses: ByBp<string> = { md: 'md:sticky md:top-0 md:h-dvh', lg: 'lg:sticky lg:top-0 lg:h-dvh' }
const collapsedHiddenClasses: ByBp<string> = { md: 'md:hidden', lg: 'lg:hidden' }

/** Open drawer: fixed over the page, static again from the breakpoint up. */
const drawerClasses: Record<AppShellSide, ByBp<string>> = {
  start: {
    md: 'fixed inset-y-0 start-0 z-(--z-modal) flex md:static md:z-auto',
    lg: 'fixed inset-y-0 start-0 z-(--z-modal) flex lg:static lg:z-auto',
  },
  end: {
    md: 'fixed inset-y-0 end-0 z-(--z-modal) flex md:static md:z-auto',
    lg: 'fixed inset-y-0 end-0 z-(--z-modal) flex lg:static lg:z-auto',
  },
}
const drawerWidthClasses: Record<AppShellSidebarWidth, string> = { sm: 'w-56 max-w-full', md: 'w-64 max-w-full', lg: 'w-72 max-w-full' }
const widthClasses: ByBp<Record<AppShellSidebarWidth, string>> = {
  md: { sm: 'md:w-56', md: 'md:w-64', lg: 'md:w-72' },
  lg: { sm: 'lg:w-56', md: 'lg:w-64', lg: 'lg:w-72' },
}
const railClasses: ByBp<Record<AppShellRailWidth, string>> = {
  md: { sm: 'md:w-12', md: 'md:w-14', lg: 'md:w-16' },
  lg: { sm: 'lg:w-12', md: 'lg:w-14', lg: 'lg:w-16' },
}

export interface AppShellSidebarClassOptions {
  side: AppShellSide
  open: boolean
  collapsed: boolean
  breakpoint: AppShellBreakpoint
  width: AppShellSidebarWidth
  rail: AppShellRailWidth
  collapseMode: AppShellCollapseMode
  fullHeight: boolean
}

export function appShellSidebarClasses(o: AppShellSidebarClassOptions): string {
  return cn(
    'flex-col overflow-y-auto border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] motion-reduce:transition-none',
    o.side === 'end' ? 'border-s' : 'border-e',
    o.open ? [drawerClasses[o.side][o.breakpoint], drawerWidthClasses[o.width]] : hiddenClasses[o.breakpoint],
    o.collapsed && o.collapseMode === 'hidden' ? collapsedHiddenClasses[o.breakpoint] : null,
    o.collapsed && o.collapseMode === 'rail' ? railClasses[o.breakpoint][o.rail] : widthClasses[o.breakpoint][o.width],
    shrinkClasses[o.breakpoint],
    o.fullHeight && fullHeightClasses[o.breakpoint],
  )
}
