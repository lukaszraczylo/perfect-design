import { THEME_ACCENTS, THEME_STORAGE_KEY, THEME_STYLES } from './theme'

/**
 * Inline script for `<head>` that applies the saved colour mode, accent and style pack before first paint, so a returning
 * visitor never sees the default look flash before `useThemeStore().init()` runs. It reads the same storage key and
 * accepts only the values the store accepts.
 *
 * @example
 * // SSR template or a build step that writes index.html:
 * html.replace('</head>', `<script>${themeBootScript}</script></head>`)
 */
export const themeBootScript = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||'{}'),r=document.documentElement,A=${JSON.stringify(THEME_ACCENTS)},S=${JSON.stringify(THEME_STYLES)};var d=s.mode==='dark'||((!s.mode||s.mode==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);r.classList.toggle('dark',d);if(s.accent!=='default'&&A.indexOf(s.accent)>-1)r.setAttribute('data-theme',s.accent);if(s.style!=='quiet'&&S.indexOf(s.style)>-1)r.setAttribute('data-style',s.style)}catch(e){}})()`
