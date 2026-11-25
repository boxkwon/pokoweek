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

function readScheduleContext(url) {
  const parsed = new URL(url);
  return {
    week: parsed.searchParams.get("week"),
    date: parsed.searchParams.get("date"),
    category: parsed.searchParams.get("category"),
    scheduleCategory: parsed.searchParams.get("scheduleCategory"),
  };
}

async function clickBottomTab(page, label, pathname) {
  await page.locator(".fresh-bottom-nav a", { hasText: label }).click();
  await page.waitForURL((url) => url.pathname === pathname);
  await page.waitForLoadState("networkidle");
}

async function expectScheduleContext(page, expected) {
  const context = readScheduleContext(page.url());
  assert.equal(context.week, expected.week);
  assert.equal(context.date, expected.date);
  assert.equal(context.category, expected.category);
  assert.equal(await page.locator(".schedule-day-tabs a[aria-current='date'] b").innerText(), String(Number(expected.date.slice(-2))));
}

try {
  for (const width of [375, 390, 430]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    await expectDailyShell(page, "2026-11-24");
    const bodyOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert.equal(bodyOverflow, false, `${width}px: horizontal overflow`);
    await page.goto(`${baseUrl}/schedule?date=2026-11-19&category=event`, { waitUntil: "networkidle" });
    const dynamaxTrails = page.locator(".schedule-event-row", { hasText: "Dynamax Trails" }).first();
    assert.equal(await dynamaxTrails.count(), 1);
    assert.equal(await dynamaxTrails.getByRole("link", { name: /이벤트 상세/ }).count(), 0);
    assert.equal(await dynamaxTrails.locator(".range-continuation-link").count(), 0);
    assert.match(await dynamaxTrails.innerText(), /상세 안내 미등록/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, `${width}px: event card horizontal overflow`);
    await page.goto(`${baseUrl}/schedule?week=2026-11-23&date=2026-11-26&category=all`, { waitUntil: "networkidle" });
    await clickBottomTab(page, "공략", "/guide");
    assert.deepEqual(readScheduleContext(page.url()), { week: "2026-11-23", date: "2026-11-26", category: null, scheduleCategory: "all" });
    await clickBottomTab(page, "일정", "/schedule");
    await expectScheduleContext(page, { week: "2026-11-23", date: "2026-11-26", category: "all" });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, `${width}px: restored schedule horizontal overflow`);

    await page.goto(`${baseUrl}/schedule?date=2026-11-18&category=shadow`, { waitUntil: "networkidle" });
    const shadowThreeStar = page.locator(".schedule-raid-row", { hasText: "그림자 팽태자 · 메꾸리 · 슈륙챙이" }).first();
    assert.equal(await shadowThreeStar.count(), 1);
    assert.equal(await shadowThreeStar.locator(".schedule-raid-artworks img").count(), 3);
    assert.equal(await shadowThreeStar.locator(".schedule-raid-touch-target").count(), 1);
    assert.equal(await shadowThreeStar.locator("img").first().getAttribute("alt"), "그림자 팽태자");
    assert.match(await shadowThreeStar.locator("img").first().getAttribute("src"), /pokeapi-394-prinplup\.png/);
    assert.equal(await shadowThreeStar.locator("img").evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)), true);
    await shadowThreeStar.locator("img").first().click();
    await page.waitForURL(/\/guide\?event=shadow-three-star-2026-11/);
    assert.match(await page.locator("body").innerText(), /그림자 팽태자/);
    await page.goBack({ waitUntil: "networkidle" });
    assert.match(page.url(), /date=2026-11-18/);
    assert.match(page.url(), /category=shadow/);
    await page.screenshot({ path: `/tmp/pokoweek-daily-${width}.png`, fullPage: true });
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await expectDailyShell(page, "2026-11-18");

  const currentContext = { week: "2026-11-23", date: "2026-11-26", category: "all" };
  await page.goto(`${baseUrl}/schedule?week=${currentContext.week}&date=${currentContext.date}&category=${currentContext.category}`, { waitUntil: "networkidle" });
  await clickBottomTab(page, "준비", "/prepare");
  await clickBottomTab(page, "일정", "/schedule");
  await expectScheduleContext(page, currentContext);
  await clickBottomTab(page, "공략", "/guide");
  await clickBottomTab(page, "준비", "/prepare");
  await clickBottomTab(page, "일정", "/schedule");
  await expectScheduleContext(page, currentContext);

  await page.goto(`${baseUrl}/schedule?date=2026-11-18`, { waitUntil: "networkidle" });
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

  const pastContext = { week: "2026-11-09", date: "2026-11-13", category: "tier3" };
  await page.goto(`${baseUrl}/schedule?week=${pastContext.week}&date=${pastContext.date}&category=${pastContext.category}`, { waitUntil: "networkidle" });
  await clickBottomTab(page, "공략", "/guide");
  assert.deepEqual(readScheduleContext(page.url()), { week: pastContext.week, date: pastContext.date, category: null, scheduleCategory: pastContext.category });
  await page.locator(".guide-filters a", { hasText: "레이드" }).click();
  await page.waitForURL(/category=raid/);
  assert.deepEqual(readScheduleContext(page.url()), { week: pastContext.week, date: pastContext.date, category: "raid", scheduleCategory: pastContext.category });
  await clickBottomTab(page, "준비", "/prepare");
  assert.deepEqual(readScheduleContext(page.url()), { week: pastContext.week, date: pastContext.date, category: null, scheduleCategory: pastContext.category });
  await clickBottomTab(page, "일정", "/schedule");
  await expectScheduleContext(page, pastContext);

  await page.reload({ waitUntil: "networkidle" });
  await expectScheduleContext(page, pastContext);
  await clickBottomTab(page, "준비", "/prepare");
  await page.goBack({ waitUntil: "networkidle" });
  await expectScheduleContext(page, pastContext);
  await page.goForward({ waitUntil: "networkidle" });
  assert.deepEqual(readScheduleContext(page.url()), { week: pastContext.week, date: pastContext.date, category: null, scheduleCategory: pastContext.category });
  await clickBottomTab(page, "일정", "/schedule");
  await expectScheduleContext(page, pastContext);

  await page.goto(`${baseUrl}/schedule?week=2026-11-16&date=2026-11-18&category=all`, { waitUntil: "networkidle" });
  await page.getByLabel("다음 주").click();
  await page.waitForURL(/week=2026-11-23/);
  const nextWeekContext = readScheduleContext(page.url());
  assert.deepEqual(nextWeekContext, { week: "2026-11-23", date: "2026-11-25", category: "all", scheduleCategory: null });
  await clickBottomTab(page, "공략", "/guide");
  await clickBottomTab(page, "일정", "/schedule");
  await expectScheduleContext(page, { week: "2026-11-23", date: "2026-11-25", category: "all" });

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

  await page.goto(`${baseUrl}/schedule?date=2026-11-14&category=event`, { waitUntil: "networkidle" });
  const wildAreaCard = page.locator(".schedule-event-row", { hasText: "GO WILD AREA DAY 1" }).first();
  const eventDetailLink = wildAreaCard.getByRole("link", { name: "이벤트 상세" });
  assert.equal(await eventDetailLink.count(), 1);
  assert.match(await eventDetailLink.getAttribute("href"), /^\/events\/go-wild-area-global-2026\?date=2026-11-14$/);
  await eventDetailLink.click();
  await page.waitForURL(/\/events\/go-wild-area-global-2026\?date=2026-11-14/);
  assert.match(await page.locator("body").innerText(), /GO WILD AREA 2026/);
  await page.goBack({ waitUntil: "networkidle" });
  assert.match(page.url(), /date=2026-11-14/);
  assert.match(page.url(), /category=event/);

  const timedCases = [
    { date: "2026-11-21", category: "max", title: "무한다이맥스 무한다이노", time: /11:00\s*~\s*14:00/ },
    { date: "2026-11-28", category: "special", title: "슈퍼 메가픽시", time: /11\/28 14:00\s*~\s*11\/28 17:00/ },
    { date: "2026-11-25", category: "tier5", title: "테오키스 레이드아워", time: /18:00\s*~\s*19:00/ },
    { date: "2026-11-19", category: "event", title: "스포트라이트 아워", time: /18:00\s*~\s*19:00/ },
  ];
  for (const item of timedCases) {
    await page.goto(`${baseUrl}/schedule?date=${item.date}&category=${item.category}`, { waitUntil: "networkidle" });
    const card = page.locator(".schedule-event-row", { hasText: item.title }).first();
    assert.equal(await card.count(), 1, `${item.date}: missing ${item.title}`);
    assert.equal(await card.locator(".schedule-date-cue", { hasText: "시간 한정" }).count(), 1, `${item.date}: missing time-limited badge`);
    assert.match(await card.innerText(), item.time);
    if (item.date === "2026-11-21" || item.date === "2026-11-28") {
      await card.screenshot({ path: `/tmp/pokoweek-time-limited-${item.date}.png` });
    }
  }

  await page.goto(`${baseUrl}/schedule?date=2026-11-24&category=tier5`, { waitUntil: "networkidle" });
  const multiDayCard = page.locator(".schedule-event-row", { hasText: "크레세리아 · 다크라이" }).first();
  assert.equal(await multiDayCard.count(), 1);
  assert.equal(await multiDayCard.locator(".schedule-date-cue", { hasText: "시간 한정" }).count(), 0);

  await page.goto(`${baseUrl}/schedule?date=2026-11-09&category=tier5`, { waitUntil: "networkidle" });
  const zacianHour = page.locator(".schedule-raid-row", { hasText: "검왕 자시안 레이드아워" }).first();
  await zacianHour.locator("img").click();
  await page.waitForURL(/\/pokemon\/zacian-crowned\?date=2026-11-09/);
  await page.goBack({ waitUntil: "networkidle" });
  assert.match(page.url(), /category=tier5/);

  const unavailableCases = [
    { date: "2026-11-14", category: "tier3", title: "모던 재킷 괴력몬", image: /pm68\.icon\.png/ },
    { date: "2026-11-21", category: "shadow", title: "그림자 토네로스 화신폼", image: /pokemon_icon_641_11\.png/ },
    { date: "2026-11-28", category: "special", title: "슈퍼 메가픽시", image: /pokeapi-36-clefable\.png/ },
  ];
  for (const item of unavailableCases) {
    await page.goto(`${baseUrl}/schedule?date=${item.date}&category=${item.category}`, { waitUntil: "networkidle" });
    const card = page.locator(".schedule-raid-row", { hasText: item.title }).first();
    assert.match(await card.locator("img").getAttribute("src"), item.image);
    const before = page.url();
    await card.locator("img").click();
    const dialog = page.getByRole("dialog");
    assert.equal(await dialog.count(), 1);
    assert.match(await dialog.innerText(), new RegExp(item.title));
    assert.equal(page.url(), before);
    await dialog.getByRole("button", { name: "확인" }).click();
    assert.equal(await dialog.count(), 0);
  }

  await page.goto(`${baseUrl}/schedule?date=2026-11-28&category=all`, { waitUntil: "networkidle" });
  const tornadusTrigger = page.locator(".schedule-raid-row", { hasText: "그림자 토네로스 화신폼" }).first().locator(".schedule-raid-touch-target");
  const clefableTrigger = page.locator(".schedule-raid-row", { hasText: "슈퍼 메가픽시" }).first().locator(".schedule-raid-touch-target");
  await tornadusTrigger.focus();
  await page.keyboard.press("Enter");
  const trappedDialog = page.getByRole("dialog");
  assert.equal(await trappedDialog.count(), 1);
  const closeButton = trappedDialog.getByRole("button", { name: "확인" });
  assert.equal(await closeButton.evaluate((element) => document.activeElement === element), true);
  await page.keyboard.press("Tab");
  assert.equal(await closeButton.evaluate((element) => document.activeElement === element), true);
  await page.keyboard.press("Shift+Tab");
  assert.equal(await closeButton.evaluate((element) => document.activeElement === element), true);
  assert.equal(await page.locator("main").evaluate((element) => element.inert), true);
  await page.keyboard.press("Enter");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label")?.includes("그림자 토네로스 화신폼"));
  assert.equal(await tornadusTrigger.evaluate((element) => document.activeElement === element), true);
  assert.equal(await page.locator("main").evaluate((element) => element.inert), false);
  const clefableBox = await clefableTrigger.boundingBox();
  assert(clefableBox);
  await page.keyboard.press("Space");
  assert.equal(await page.getByRole("dialog").count(), 1);
  assert.match(await page.getByRole("dialog").innerText(), /그림자 토네로스 화신폼/);
  await page.mouse.click(clefableBox.x + clefableBox.width / 2, clefableBox.y + clefableBox.height / 2);
  assert.equal(await page.getByRole("dialog").count(), 0);
  assert.equal(await page.locator("body").getByText("슈퍼 메가픽시", { exact: true }).count() > 0, true);
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label")?.includes("그림자 토네로스 화신폼"));
  await tornadusTrigger.click();
  assert.equal(await page.getByRole("dialog").count(), 1);
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label")?.includes("그림자 토네로스 화신폼"));
  assert.equal(await tornadusTrigger.evaluate((element) => document.activeElement === element), true);

  await page.goto(`${baseUrl}/schedule?date=2026-11-26&category=mega`, { waitUntil: "networkidle" });
  const megaMetagross = page.locator(".schedule-raid-row", { hasText: "메가메타그로스" }).first();
  assert.match(await megaMetagross.locator("img").getAttribute("src"), /pm376\.fMEGA\.icon\.png/);
  assert.equal(await megaMetagross.locator("img").evaluate((image) => image.complete && image.naturalWidth > 0), true);
  await page.close();
  console.log(JSON.stringify({ ok: true, viewports: [375, 390, 430], dates: ["2026-11-13", "2026-11-18", "2026-11-24", "2026-11-26"], timeLimitedDates: timedCases.map((item) => item.date), candidateGuides: ["zamazenta-crowned", "zekrom", "reshiram", "orthworm"] }, null, 2));
} finally {
  await browser.close();
}
