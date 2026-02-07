import chromium from "@sparticuz/chromium";
import puppeteerCore, { Browser, Page } from "puppeteer-core";

/**
 * Headless Chromium launcher compatible with local dev, Docker, and serverless.
 *
 * - Tries @sparticuz/chromium for serverless environments
 * - Falls back to CHROME_PATH env var if provided
 * - Optionally falls back to full puppeteer (if installed) for local dev
 *
 * You can set CHROME_PATH to your local Chrome executable to avoid full puppeteer.
 *   Windows example: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe
 *   macOS example: /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
 *   Linux example: /usr/bin/google-chrome
 */
export async function launchBrowser(): Promise<Browser> {
  let executablePath: string | null = null;

  // First check for CHROME_PATH env var (recommended for local dev)
  if (process.env.CHROME_PATH) {
    executablePath = process.env.CHROME_PATH;
  }

  // If no CHROME_PATH, try full puppeteer (local dev with bundled Chromium)
  if (!executablePath) {
    try {
      const puppeteer = (await import("puppeteer")).default;
      return await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      }) as any as Browser;
    } catch (err) {
      // Silently try next method
    }
  }

  // Try @sparticuz/chromium for serverless environments
  if (!executablePath) {
    try {
      // @sparticuz/chromium.executablePath can be a string or Promise<string>
      const chromiumExecPath: any = chromium.executablePath;
      if (typeof chromiumExecPath === 'string') {
        executablePath = chromiumExecPath;
      } else if (typeof chromiumExecPath === 'function') {
        executablePath = await chromiumExecPath();
      } else {
        executablePath = await chromiumExecPath;
      }
    } catch (err) {
      console.error("@sparticuz/chromium failed:", err);
      executablePath = null;
    }
  }

  // If still no executable path, throw helpful error
  if (!executablePath) {
    throw new Error(
      "No Chromium executable found. For local development:\n" +
      "1. Set CHROME_PATH environment variable to your Chrome installation, e.g.:\n" +
      "   Windows: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\n" +
      "   macOS: /Applications/Google Chrome.app/Contents/MacOS/Google Chrome\n" +
      "   Linux: /usr/bin/google-chrome\n" +
      "2. Or ensure 'puppeteer' package is installed (already in package.json)\n" +
      "Run: pnpm install"
    );
  }

  // Launch using puppeteer-core with found executable
  const browser = await puppeteerCore.launch({
    headless: true,
    executablePath,
    args: [
      ...chromium.args,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    defaultViewport: (chromium as any).defaultViewport ?? { width: 1280, height: 800 },
  });

  return browser;
}

/**
 * Opens a new page with sane defaults:
 * - Desktop user-agent (overridable via SCRAPER_USER_AGENT)
 * - Accept-Language header derived from SCRAPER_LANG or defaults to en-US
 * - Basic timeouts and navigation behaviors
 */
export async function newPageWithDefaults(browser: Browser): Promise<Page> {
  const page = await browser.newPage();

  const userAgent =
    process.env.SCRAPER_USER_AGENT ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36";
  const acceptLanguage = process.env.SCRAPER_LANG || "en-US,en;q=0.9";

  await page.setUserAgent(userAgent);
  await page.setExtraHTTPHeaders({
    "Accept-Language": acceptLanguage,
  });
  // Reasonable defaults
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(45000);

  return page;
}

/**
 * Safe browser close helper
 */
export async function closeBrowser(browser: Browser | null | undefined) {
  if (!browser) return;
  try {
    await browser.close();
  } catch {
    // noop
  }
}
