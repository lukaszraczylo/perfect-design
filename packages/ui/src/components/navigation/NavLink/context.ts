import type { InjectionKey } from 'vue'

/**
 * Optional app-level active-route predicate. Provide it once (e.g. from vue-router) and every NavLink,
 * SidebarNav and DocsSidebar resolves its active state from the link target:
 * `app.provide(NAV_IS_ACTIVE_KEY, (to) => route.path === to)`.
 */
export type NavIsActive = (target: string) => boolean
export const NAV_IS_ACTIVE_KEY: InjectionKey<NavIsActive> = Symbol('pd-nav-is-active')
