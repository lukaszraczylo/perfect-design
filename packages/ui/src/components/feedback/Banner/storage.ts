/** Persisted banner dismissal. All access is guarded: storage can be missing (SSR) or throw (privacy mode, quota). */
export const BANNER_STORAGE_PREFIX = 'pd-banner:'

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export function isBannerDismissed(key: string | undefined): boolean {
  if (!key) return false
  try {
    return storage()?.getItem(BANNER_STORAGE_PREFIX + key) === '1'
  } catch {
    return false
  }
}

export function persistBannerDismissal(key: string | undefined): void {
  if (!key) return
  try {
    storage()?.setItem(BANNER_STORAGE_PREFIX + key, '1')
  } catch {
    /* ignore: dismissal then lasts for this page view only */
  }
}
