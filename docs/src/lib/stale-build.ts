// A deploy replaces every hashed chunk. A tab opened before it still asks for the old file names, so every lazy page
// fails until the user reloads. Loading the requested URL again fetches the new build.

const KEY = 'pd-docs-stale-reload'
/** A second failure within this window is a real outage, not a stale tab: show the error instead of looping. */
export const RELOAD_WINDOW_MS = 30_000

/** True for the errors browsers and Vite raise when a dynamically imported chunk cannot be fetched. */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '')
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS|ChunkLoadError/i.test(message)
}

interface StaleBuildEnv {
  storage: Pick<Storage, 'getItem' | 'setItem'> | null
  now: () => number
  navigate: (url: string) => void
}

/**
 * Loads `url` again once, so a stale tab picks up the current build. Returns false (and does nothing) when it already
 * reloaded within `RELOAD_WINDOW_MS`, or when storage is unavailable, so the caller can show its error state.
 */
export function reloadForNewBuild(url: string, env: StaleBuildEnv): boolean {
  if (!env.storage) return false
  try {
    const last = Number(env.storage.getItem(KEY))
    if (Number.isFinite(last) && env.now() - last < RELOAD_WINDOW_MS) return false
    env.storage.setItem(KEY, String(env.now()))
  } catch {
    return false
  }
  env.navigate(url)
  return true
}

/** The browser environment: session storage, the clock and a full page load. */
export function browserEnv(): StaleBuildEnv {
  let storage: Storage | null = null
  try {
    storage = window.sessionStorage
  } catch {
    storage = null
  }
  return { storage, now: () => Date.now(), navigate: (url) => window.location.assign(url) }
}
