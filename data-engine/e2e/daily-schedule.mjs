import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.POKOWEEK_E2E_BASE_URL ?? "http://127.0.0.1:3100";
const executablePath = process.env.POKOWEEK_CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ headless: true, executablePath });

async function expectDailyShell(page, date) {
  await page.goto(`${baseUrl}/?date=${date}`, { waitUntil: "networkidle" });
  assert.match(page.url(), new RegExp(`/schedule\\?.*date=${date}`));
  assert.equal(await page.locator(".schedule-day-tabs a").count(), 7);
  assert.equal(await page.locator(".schedule-day-tabs a[aria-current='date']").count(), 1);
  assert.equal(await page.locator(".fresh-bottom-nav a").count(), 3);
  assert.deepEqual(await page.locator(".fresh-bottom-nav span").allTextContents(), ["일정", "공략", "준비"]);
  assert.equal(await page.locator(".schedule-day-list").count(), 0);
}

try {
  for (const width of [375, 390, 430]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    await expectDailyShell(page, "2026-11-24");
    const bodyOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert.equal(bodyOverflow, false, `${width}px: horizontal overflow`);
    await page.screenshot({ path: `/tmp/pokoweek-daily-${width}.png`, fullPage: true });
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await expectDailyShell(page, "2026-11-18");

  await page.locator(".schedule-day-tabs a", { hasText: "19" }).click();
  await page.waitForURL(/date=2026-11-19/);
  assert.match(await page.locator(".schedule-list-section h2").innerText(), /19일/);

  await page.getByLabel("이전 주").click();
  await page.waitForURL(/week=2026-11-09/);
  assert.match(page.url(), /date=2026-11-12/);
  assert.match(await page.locator(".schedule-list-section h2").innerText(), /12일/);

  await page.locator(".schedule-day-tabs a", { hasText: "13" }).click();
  await page.waitForURL(/date=2026-11-13/);
  await page.getByRole("link", { name: "3성" }).click();
  await page.waitForURL(/category=tier3/);
  await page.waitForFunction(() => localStorage.getItem("pokoweek:schedule-category") === "tier3");
  assert.match(page.url(), /week=2026-11-09/);
  const fridayEvents = (await page.locator(".schedule-event-row h3").allTextContents()).join(" ");
  assert.match(fridayEvents, /크리만/);
  assert.match(fridayEvents, /꿈트렁/);
  const guideSelection = page.getByRole("link", { name: "공략 선택" }).first();
  assert.equal(await guideSelection.count(), 1);
  await guideSelection.click();
  await page.waitForLoadState("networkidle");
  assert.match(page.url(), /date=2026-11-13/);
  assert.match((await page.locator("body").innerText()), /크리만/);
  assert.match((await page.locator("body").innerText()), /꿈트렁/);
  await page.locator(".fresh-bottom-nav a", { hasText: "일정" }).click();
  await page.waitForURL(/\/schedule\?/);
  assert.match(page.url(), /date=2026-11-13/);
  assert.match(page.url(), /category=tier3/);

  for (const date of ["2026-11-13", "2026-11-18", "2026-11-24", "2026-11-26"]) {
    await page.goto(`${baseUrl}/schedule?date=${date}`, { waitUntil: "networkidle" });
    assert.match(page.url(), new RegExp(`date=${date}`));
    assert.equal(await page.locator(".schedule-day-tabs a[aria-current='date']").count(), 1);
    assert.equal(await page.locator(".schedule-selected-day").count(), 1);
  }

  await page.goto(`${baseUrl}/pokemon/zamazenta-crowned?date=2026-11-13`, { waitUntil: "networkidle" });
  const zamazentaText = await page.locator("body").innerText();
  assert.match(zamazentaText, /아이언헤드를 배운 역전의 용사 자마젠타/);
  assert.match(zamazentaText, /실드 에너지/);
  assert.doesNotMatch(zamazentaText, /방패왕 에너지/);

  for (const id of ["zekrom", "reshiram"]) {
    await page.goto(`${baseUrl}/pokemon/${id}?date=2026-11-13`, { waitUntil: "networkidle" });
    assert.match(await page.locator("body").innerText(), /대단한 기술머신스페셜 습득 가능 여부 확인/);
  }

  await page.goto(`${baseUrl}/pokemon/orthworm?date=2026-11-13`, { waitUntil: "networkidle" });
  const orthwormText = await page.locator("body").innerText();
  assert.match(orthwormText, /슈퍼리그 CP 1,500 이하/);
  assert.match(orthwormText, /하이퍼리그 CP 2,500 이하/);
  await page.close();
  console.log(JSON.stringify({ ok: true, viewports: [375, 390, 430], dates: ["2026-11-13", "2026-11-18", "2026-11-24", "2026-11-26"], candidateGuides: ["zamazenta-crowned", "zekrom", "reshiram", "orthworm"] }, null, 2));
} finally {
  await browser.close();
}
