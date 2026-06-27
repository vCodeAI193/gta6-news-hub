import { defineConfig, devices } from '@playwright/test'

/**
 * E2E-Tests gegen den Preview-Build. Startet automatisch den Dev-Server.
 * Im Remote-Container nutzt Chromium den vorinstallierten Pfad
 * (PLAYWRIGHT_BROWSERS_PATH), daher kein `playwright install` nötig.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    // In Umgebungen mit vorinstalliertem Browser (z. B. Remote-Container) kann
    // der Pfad via PW_CHROMIUM_PATH gesetzt werden, statt Browser zu laden.
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : {},
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
