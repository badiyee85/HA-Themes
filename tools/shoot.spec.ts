/**
 * Real-app acceptance for the HA Themes pack.
 *
 * Boots a real Hermes Desktop (built dist) + real `hermes serve` in a throwaway
 * sandbox HOME under Xvfb, with only the LLM faked. The pack is installed by the
 * documented disk delivery — the built plugin.js at
 * `$HERMES_HOME/desktop-plugins/ha-themes/plugin.js` — and themes are selected the
 * documented way (`/skin <name>` in a Desktop chat, which picks from the same list
 * as Settings -> Appearance). Nothing is injected by the test.
 *
 * Env (set by tools/shoot.sh): PACK_ROOT, OUT;
 *      W/H window size (default 1082x710 = the WinForms reference screenshot).
 */
import * as fs from 'node:fs'
import * as path from 'node:path'

import { type ElectronApplication, expect, type Page, test } from '@playwright/test'

import {
  coreAppEnv,
  createCoreSandbox,
  type CoreSandbox,
  launchCoreApp,
  send,
  waitForInteractive,
  writeProviderHome
} from './hermes-src/apps/desktop/e2e/core/harness'
import { startScriptedProvider } from './hermes-src/apps/desktop/e2e/core/provider'

const OUT = process.env.OUT!
const W = Number(process.env.W || 1082)
const H = Number(process.env.H || 710)
const PACK = 'ha-themes'

const describeOpen = () =>
  Array.from(
    document.querySelectorAll('[data-state="open"][data-slot$="-content"], [role="menu"], [role="listbox"], [role="dialog"]')
  ).map(el => {
    const cs = getComputedStyle(el)

    return {
      slot: el.getAttribute('data-slot'),
      role: el.getAttribute('role'),
      radius: cs.borderTopLeftRadius,
      bg: cs.backgroundColor,
      border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
      shadow: cs.boxShadow
    }
  })

const themeState = (page: Page) =>
  page.evaluate(() => ({
    theme: document.documentElement.dataset.hermesTheme,
    css: (document.getElementById('hermes-desktop-custom-css')?.textContent ?? '').length,
    body: getComputedStyle(document.body).backgroundColor
  }))

const painted = (page: Page) =>
  page.evaluate(() => {
    const bg = (sel: string) => {
      const el = document.querySelector(sel)

      return el ? getComputedStyle(el).backgroundColor : null
    }

    // Visible rounded corners left on screen (circles excluded): a measure, not a gate.
    const rounded = Array.from(document.querySelectorAll('body *'))
      .filter(el => {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        const rad = parseFloat(cs.borderTopLeftRadius)

        return r.width > 8 && r.height > 8 && rad > 0 && rad < Math.min(r.width, r.height) / 2 && cs.visibility !== 'hidden'
      })
      .map(el => `${el.tagName.toLowerCase()}${el.getAttribute('data-slot') ? `[${el.getAttribute('data-slot')}]` : ''}`)

    return {
      title: bg("[data-window-top='true'] > [data-panel-header]"),
      face: getComputedStyle(document.body).backgroundColor,
      transcript: bg("[data-chat-surface] [data-slot='aui_thread-viewport']"),
      composer: bg("[data-slot='composer-surface']"),
      status: bg("[data-slot='statusbar']"),
      composerRadius: getComputedStyle(document.querySelector("[data-slot='composer-surface']")!).borderTopLeftRadius,
      font: getComputedStyle(document.body).fontFamily,
      roundedLeft: rounded.length,
      roundedSample: [...new Set(rounded)].slice(0, 12)
    }
  })

function newSandbox(label: string): CoreSandbox {
  const sandbox = createCoreSandbox(label)
  fs.writeFileSync(
    path.join(sandbox.userDataDir, 'window-state.json'),
    JSON.stringify({ x: 0, y: 0, width: W, height: H, isMaximized: false })
  )

  return sandbox
}

async function boot(sandbox: CoreSandbox): Promise<{ app: ElectronApplication; page: Page }> {
  const launched = await launchCoreApp(coreAppEnv(sandbox))
  await waitForInteractive(launched.app, launched.page)
  await launched.page.waitForTimeout(1500)

  return launched
}

/** The disk door (the docs' recommended delivery): the built plugin.js in desktop-plugins/<id>/. */
function installDiskCopy(sandbox: CoreSandbox) {
  const dir = path.join(sandbox.hermesHome, 'desktop-plugins', PACK)
  fs.mkdirSync(dir, { recursive: true })
  fs.copyFileSync(path.join(process.env.PACK_ROOT!, 'desktop', 'plugin.js'), path.join(dir, 'plugin.js'))
}

async function selectTheme(page: Page, name: string) {
  await send(page, `/skin ${name}`)
  await expect.poll(async () => (await themeState(page)).theme, { timeout: 30_000 }).toBe(name)
}

test('both themes are listed, selectable, and paint the window', async () => {
  test.setTimeout(300_000)
  fs.mkdirSync(OUT, { recursive: true })
  const sandbox = newSandbox('ha-themes')
  const provider = await startScriptedProvider()
  provider.scriptPrompt('hello', 'what can you do', [
    {
      text: [
        'I can help with a few things:\n\n',
        '- **Files**: read, search and edit them\n',
        '- **Shell**: run commands\n',
        '- **Web**: search and fetch pages\n\n',
        'For example:\n\n```python\nprint("hello from Hermes")\n```\n'
      ]
    }
  ])
  provider.scriptPrompt('tool', 'list the files', [
    { toolCalls: [{ name: 'terminal', args: { command: 'echo readme.txt notes.md' } }] },
    { text: ['There are two files: `readme.txt` and `notes.md`.'] }
  ])
  writeProviderHome(sandbox.hermesHome, provider.url)
  installDiskCopy(sandbox)
  const { app, page } = await boot(sandbox)

  try {
    // Docs: "Registering a theme lists it; it does not select it."
    const before = await themeState(page)
    expect(before.theme).not.toBe('winforms')
    await page.screenshot({ path: path.join(OUT, '0-before.png') })

    await selectTheme(page, 'winforms')
    await page.waitForTimeout(800)
    const p = await painted(page)
    const s = await themeState(page)
    fs.writeFileSync(path.join(OUT, 'painted.json'), JSON.stringify({ before, after: s, ...p }, null, 1))
    expect(s.css).toBeGreaterThan(1000)
    expect(p.title).toBe('rgb(76, 74, 72)')
    expect(p.face).toBe('rgb(240, 240, 240)')
    expect(p.transcript).toBe('rgb(255, 255, 255)')
    expect(p.composer).toBe('rgb(255, 255, 255)')
    expect(p.status).toBe('rgb(240, 240, 240)')
    expect(p.composerRadius).toBe('0px')
    expect(p.font).toContain('Segoe UI')
    await page.screenshot({ path: path.join(OUT, '1-empty.png') })

    await send(page, 'Hello Hermes, what can you do?')
    await expect(page.getByText('hello from Hermes').first()).toBeVisible({ timeout: 60_000 })
    await send(page, 'Please list the files here.')
    await expect(page.getByText('There are two files').first()).toBeVisible({ timeout: 90_000 })
    await page.waitForTimeout(1200)
    await page.screenshot({ path: path.join(OUT, '2-chat.png') })
    fs.writeFileSync(path.join(OUT, 'painted-chat.json'), JSON.stringify(await painted(page), null, 1))

    const popups: Record<string, unknown> = {}
    await page.locator('[data-slot="composer-root"] button[aria-label^="Model"]').first().click()
    await page.waitForTimeout(700)
    await page.screenshot({ path: path.join(OUT, '5-menu.png') })
    popups.menu = await page.evaluate(describeOpen)
    await page.keyboard.press('Escape')
    await page.locator('[data-slot="sidebar-group-content"] [data-slot="context-menu-trigger"]').last().click({ button: 'right' })
    await page.waitForTimeout(700)
    await page.screenshot({ path: path.join(OUT, '6-context.png') })
    popups.context = await page.evaluate(describeOpen)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    await page.keyboard.press('Control+k')
    await page.waitForTimeout(700)
    await page.screenshot({ path: path.join(OUT, '3-palette.png') })
    popups.palette = await page.evaluate(describeOpen)
    fs.writeFileSync(path.join(OUT, 'popups.json'), JSON.stringify(popups, null, 1))
    await page.keyboard.press('Escape')
    await page.keyboard.press('Control+Comma')
    await page.waitForTimeout(1200)
    await page.screenshot({ path: path.join(OUT, '4-settings.png') })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // Second theme in the pack: Badi Dark (no customCSS; a pure palette theme).
    await selectTheme(page, 'badi-dark-desktop')
    await page.waitForTimeout(800)
    const dark = await themeState(page)
    fs.writeFileSync(path.join(OUT, 'painted-badi-dark.json'), JSON.stringify(dark, null, 1))
    expect(dark.css).toBe(0)
    expect(dark.body).not.toBe('rgb(240, 240, 240)')
    await page.screenshot({ path: path.join(OUT, '9-badi-dark.png') })
  } finally {
    await app.close().catch(() => {})
    await provider.close()
    sandbox.cleanup()
  }
})

test('the pick persists across relaunch; switching away and removing the pack leave nothing', async () => {
  test.setTimeout(300_000)
  fs.mkdirSync(OUT, { recursive: true })
  const sandbox = newSandbox('ha-life')
  const provider = await startScriptedProvider()
  writeProviderHome(sandbox.hermesHome, provider.url)
  installDiskCopy(sandbox)
  const log: Record<string, unknown> = {}

  try {
    let { app, page } = await boot(sandbox)
    await selectTheme(page, 'winforms')
    await app.close()

    ;({ app, page } = await boot(sandbox))
    log.relaunch = await themeState(page)
    expect((log.relaunch as any).theme).toBe('winforms')
    expect((log.relaunch as any).css).toBeGreaterThan(1000)

    await selectTheme(page, 'nous')
    log.switchedAway = await themeState(page)
    expect((log.switchedAway as any).css).toBe(0)
    expect((log.switchedAway as any).body).not.toBe('rgb(240, 240, 240)')
    await page.screenshot({ path: path.join(OUT, '7-switched-away.png') })

    await selectTheme(page, 'winforms')
    await app.close()
    fs.rmSync(path.join(sandbox.hermesHome, 'desktop-plugins', PACK), { recursive: true, force: true })
    ;({ app, page } = await boot(sandbox))
    await page.waitForTimeout(2000)
    log.afterRemove = await themeState(page)
    expect((log.afterRemove as any).css).toBe(0)
    await page.screenshot({ path: path.join(OUT, '8-after-remove.png') })
    await app.close()
  } finally {
    fs.writeFileSync(path.join(OUT, 'lifecycle.json'), JSON.stringify(log, null, 1))
    await provider.close()
    sandbox.cleanup()
  }
})
