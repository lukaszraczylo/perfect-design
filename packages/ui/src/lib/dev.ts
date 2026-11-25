/** Development builds warn about misuse; production builds (and unknown bundlers) stay silent. */
export function isDev(): boolean {
  const env = (import.meta as { env?: { DEV?: boolean; PROD?: boolean } }).env
  const node = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV
  const production = env?.PROD === true || env?.DEV === false || node === 'production'
  const development = env?.DEV === true || node === 'development' || node === 'test'
  return development && !production
}
