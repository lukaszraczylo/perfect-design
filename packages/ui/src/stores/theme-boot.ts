import { THEME_ATTRIBUTES, THEME_STORAGE_KEY } from './theme'

const attributes = Object.entries(THEME_ATTRIBUTES).map(([key, { attr, values }]) => [key, attr, values] as const)

/**
 * Inline script for `<head>` that applies the saved colour mode, accent, palette, style pack, font family, corner shape and code theme
 * before first paint, so a returning visitor never sees the default look flash before `useThemeStore().init()` runs. It
 * reads the same storage key and accepts only the values the store accepts; a saved palette wins over a saved accent.
 *
 * @example
 * // SSR template or a build step that writes index.html:
 * html.replace('</head>', `<script>${themeBootScript}</script></head>`)
 */
export const themeBootScript = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||'{}'),r=document.documentElement,A=${JSON.stringify(attributes)};var d=s.mode==='dark'||((!s.mode||s.mode==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);r.classList.toggle('dark',d);if(s.palette&&s.palette!=='default')s.accent='default';for(var i=0;i<A.length;i++){var v=s[A[i][0]];if(v!==A[i][2][0]&&A[i][2].indexOf(v)>-1)r.setAttribute(A[i][1],v)}}catch(e){}})()`
