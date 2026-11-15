/**
 * Real-browser test suite: serves the built docs site and runs
 *   1. self tests (the checks must FAIL on a deliberately broken page, otherwise they prove nothing),
 *   2. behaviour tests (scripts/browser/behaviour.mjs: tooltip/popover/dialog/slider/combobox/toast/theme controls with real
 *      pointers, focus and layout; each test also runs against a sabotaged page and must fail there),
 *   3. the accessibility + responsiveness sweep (axe WCAG 2.2 AA, overflow, console warnings),
 *   4. the state check (controls toggle, state is visible, focus is visible; light and dark).
 * The sweep and the state check run side by side (own report file, own browser) to stay near three minutes.
 *   pnpm test:browser          (build first: pnpm --filter docs build)
 *   pnpm test:browser -- --only behaviour|sweep|state      run a single stage
 *   PORT=4609 DIST=dist pnpm test:browser                  pick the port / the folder (relative to docs/) that is served
 * Not part of CI: it needs a local Google Chrome and a fresh docs build.
 */
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const args = process.argv.slice(2)
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : ''
const want = (stage) => !only || only === stage
const port = process.env.PORT ?? '4399'
const base = `http://localhost:${port}`
const server = spawn('node', ['scripts/serve-dist.mjs', port, process.env.DIST ?? 'dist'], { cwd: 'docs', stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 1500))
const reportDir = mkdtempSync(join(tmpdir(), 'pd-browser-'))
const runSync = (label, script, rest = []) => {
  console.log(`\n=== ${label}`)
  return spawnSync('node', [script, ...rest], { stdio: 'inherit' }).status ?? 1
}
const runAsync = (label, script, rest = []) =>
  new Promise((resolve) => {
    let out = ''
    const p = spawn('node', [script, ...rest], { stdio: ['ignore', 'pipe', 'pipe'] })
    p.stdout.on('data', (d) => (out += d))
    p.stderr.on('data', (d) => (out += d))
    p.on('close', (code) => {
      console.log(`\n=== ${label}\n${out}`)
      resolve(code ?? 1)
    })
  })

let failed = 0
try {
  if (want('state')) {
    // The state check must notice a checked checkbox that looks identical to an unchecked one (the real dark-mode bug).
    const broken = spawnSync('node', ['scripts/state-check.mjs', base, '--routes', '/components/forms/checkbox', '--inject', '[role=checkbox]{background:#444!important;border-color:#444!important;color:#444!important;box-shadow:none!important}[role=checkbox] *{display:none!important}'], { encoding: 'utf8' })
    if (broken.status === 0) {
      console.log('SELF TEST FAILED: state-check did not detect controls whose state is invisible')
      failed++
    } else console.log('self test ok: state-check detects invisible state')
  }
  if (want('behaviour')) failed += runSync('behaviour tests (real pointers, focus, layout)', 'scripts/browser/behaviour.mjs', [base]) ? 1 : 0
  const parallel = []
  if (want('sweep')) parallel.push(runAsync('accessibility and responsiveness sweep', 'scripts/a11y-sweep.mjs', [base, '--out', join(reportDir, 'a11y-sweep.json')]))
  if (want('state')) parallel.push(runAsync('state check', 'scripts/state-check.mjs', [base]))
  failed += (await Promise.all(parallel)).filter(Boolean).length
} finally {
  server.kill()
}
process.exit(failed ? 1 : 0)
