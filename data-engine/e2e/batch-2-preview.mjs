import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.POKOWEEK_E2E_BASE_URL ?? "http://127.0.0.1:3102";
const executablePath = process.env.POKOWEEK_CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const targets = [
  ["deoxys-normal", "테오키스 노말폼", "사이코부스트"],
  ["deoxys-attack", "테오키스 어택폼", "사이코부스트"],
  ["deoxys-speed", "테오키스 스피드폼", "사이코부스트"],
  ["shadow-piloswine", "그림자 메꾸리", "맘모꾸리"],
  ["shadow-mudkip", "그림자 물짱이", "하이드로캐논"],
];

const browser = await chromium.launch({ headless: true, executablePath });
try {
  for (const width of [375, 390, 430]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    for (const [id, name, expected] of targets) {
      const response = await page.goto(`${baseUrl}/pokemon/${id}?date=2026-11-26`, { waitUntil: "networkidle" });
      assert.equal(response?.status(), 200, `${id}: HTTP`);
      const body = await page.locator("body").innerText();
      assert.match(body, new RegExp(name));
      assert.match(body, new RegExp(expected));
      assert.match(body, /XL/);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, `${id} ${width}px overflow`);
      assert.equal(await page.locator("img").first().evaluate((image) => image.complete && image.naturalWidth > 0), true, `${id}: image`);
    }
    await page.close();
  }
  console.log(JSON.stringify({ widths: [375, 390, 430], routes: targets.map(([id]) => id), passed: true }, null, 2));
} finally {
  await browser.close();
}
