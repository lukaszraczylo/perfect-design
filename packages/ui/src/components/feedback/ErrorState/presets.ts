/** Ready-made copy for common HTTP statuses. Used by `<ErrorState status="404" />`; any prop overrides it. */
export interface ErrorStatePreset {
  title: string
  message: string
  /** Whether a retry button makes sense for this status. */
  retryable: boolean
}

export const ERROR_STATE_PRESETS: Readonly<Record<string, ErrorStatePreset>> = {
  '403': { title: 'Access denied', message: 'You do not have permission to view this page.', retryable: false },
  '404': { title: 'Page not found', message: 'The page you are looking for does not exist or has been moved.', retryable: false },
  '500': { title: 'Server error', message: 'Something went wrong on our end. Please try again in a moment.', retryable: true },
  '503': { title: 'Service unavailable', message: 'The service is temporarily unavailable. Please try again shortly.', retryable: true },
}

export function getErrorStatePreset(status: unknown): ErrorStatePreset | undefined {
  if (status === undefined || status === null) return undefined
  const key = String(status)
  return Object.hasOwn(ERROR_STATE_PRESETS, key) ? ERROR_STATE_PRESETS[key] : undefined
}
