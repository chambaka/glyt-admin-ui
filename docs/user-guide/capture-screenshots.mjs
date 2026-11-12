/**
 * Refresh auth / users screenshots for the admin user guide.
 * Requires Vite on :5180 and API (real or mock-api.mjs) on :8070.
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, 'screenshots')
const base = process.env.GUIDE_UI_URL || 'http://127.0.0.1:5180'
const chromePath =
  process.env.CHROME_PATH ||
  ['/usr/bin/google-chrome', '/usr/bin/chromium-browser'].find(Boolean)

async function loadPuppeteer() {
  try {
    const require = createRequire(import.meta.url)
    return require('puppeteer-core')
  } catch {
    // Fall through to dynamic install via npx is too heavy; use CDP script below.
    return null
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function withChrome(run) {
  const puppeteer = await loadPuppeteer()
  if (!puppeteer) {
    throw new Error('puppeteer-core is required. Run: npm i -D puppeteer-core')
  }
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900']
  })
  try {
    await run(browser)
  } finally {
    await browser.close()
  }
}

async function shot(page, name) {
  const file = path.join(outDir, name)
  await page.screenshot({ path: file, type: 'png' })
  console.log('wrote', file)
}

async function main() {
  await mkdir(outDir, { recursive: true })
  await withChrome(async (browser) => {
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })

    async function clearSession() {
      await page.goto(base + '/', { waitUntil: 'networkidle0' })
      await page.evaluate(() => sessionStorage.clear())
      await page.goto(base + '/', { waitUntil: 'networkidle0' })
      await sleep(400)
    }

    await clearSession()
    await shot(page, 'guide-01-login.png')

    // Forgot password — open panel then request SMS step / code step
    await page.evaluate(() => {
      const links = [...document.querySelectorAll('a')]
      const target = links.find((a) => /forgot/i.test(a.textContent || ''))
      if (target) target.click()
    })
    await sleep(300)
    await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button')]
      const send = buttons.find((b) => /send sms/i.test(b.textContent || ''))
      if (send) send.click()
    })
    await sleep(900)
    await shot(page, 'guide-01b-forgot-sms.png')

    // Forced password change view via injected session
    await page.evaluate(() => {
      const user = {
        id: 5,
        fullName: 'Amina Hassan',
        email: 'lead@golyt.co.tz',
        phone: '+255700000001',
        role: 'ADMIN',
        location: 'ALL',
        active: true,
        mustChangePassword: true
      }
      sessionStorage.setItem('golytToken', 'guide-shot-token')
      sessionStorage.setItem('golytRefresh', 'guide-shot-refresh')
      sessionStorage.setItem('golytUser', JSON.stringify(user))
    })
    await page.goto(base + '/', { waitUntil: 'networkidle0' })
    await sleep(500)
    await page.evaluate(() => {
      const inputs = [...document.querySelectorAll('input[type="password"]')]
      const neu = inputs[1]
      if (!neu) return
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(neu, 'Golyt#2026')
      neu.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await sleep(250)
    await shot(page, 'guide-01c-change-password.png')

    // Full login for users pages
    await clearSession()
    await page.click('input[type="email"]', { clickCount: 3 })
    await page.type('input[type="email"]', 'lead@golyt.co.tz', { delay: 8 })
    await page.click('input[type="password"]', { clickCount: 3 })
    await page.type('input[type="password"]', 'Golyt#2026', { delay: 8 })
    await page.click('button[type="submit"]')
    await sleep(1500)

    await page.evaluate(() => {
      const items = [...document.querySelectorAll('button, a, .nav-item, nav *')]
      const users = items.find((el) => (el.textContent || '').trim() === 'Users')
      if (users) users.click()
    })
    await sleep(900)
    await shot(page, 'guide-14-users.png')

    await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button')]
      const add = buttons.find((b) => /add user/i.test(b.textContent || ''))
      if (add) add.click()
    })
    await sleep(400)
    await page.evaluate(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      const fill = (el, value) => {
        if (!el) return
        setter.call(el, value)
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
      const inputs = [...document.querySelectorAll('.modal-panel input')]
      fill(inputs[0], 'Neema Ally')
      fill(inputs[1], 'neema@golyt.co.tz')
      fill(inputs[2], '+255700000099')
      fill(inputs[3], 'Golyt#2026Ops')
    })
    await sleep(350)
    await shot(page, 'guide-15-users-add-dialog.png')
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
