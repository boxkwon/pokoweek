import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { getEventsByCategory, getEventsByDate, getEventsByWeek, getRegisteredEventDetailHref, getWeekByStartDate, isTimeLimitedEvent, resolveWeekEventAction } from "../../app/_data/queries";
import { getWeekStartForDate, moveDateToWeek, resolveSelectedScheduleDate } from "../../app/_lib/daily-schedule";

test("valid date is the schedule source of truth and determines its week", () => {
  const selected = resolveSelectedScheduleDate({
    requestedDate: "2026-11-13",
    requestedWeek: "2026-11-16",
    todayDate: "2026-11-24",
  });
  assert.equal(selected, "2026-11-13");
  assert.equal(getWeekStartForDate(selected), "2026-11-09");
});

test("week navigation preserves the selected weekday", () => {
  assert.equal(moveDateToWeek("2026-11-18", "2026-11-16", "2026-11-09"), "2026-11-11");
  assert.equal(moveDateToWeek("2026-11-24", "2026-11-23", "2026-11-16"), "2026-11-17");
});

test("daily schedule returns only events active on the selected date", () => {
  const week = getWeekByStartDate("2026-11-09");
  const tier3 = getEventsByCategory(getEventsByWeek(week), "tier3");
  const friday = getEventsByDate(tier3, "2026-11-13");
  assert.ok(friday.some((event) => event.pokemon.some((pokemon) => pokemon.id === "druddigon")));
  assert.ok(friday.some((event) => event.pokemon.some((pokemon) => pokemon.id === "orthworm")));
  assert.ok(friday.every((event) => event.scheduleType === "range" || event.date === "2026-11-13"));
});

test("time-limited badge derives from the shared event time window", () => {
  const secondWeek = getWeekByStartDate("2026-11-16");
  const thirdWeek = getWeekByStartDate("2026-11-23");
  const eternamax = secondWeek.events.find((event) => event.id === "eternamax-eternatus-battle-2026")!;
  const superMega = thirdWeek.events.find((event) => event.id === "super-mega-clefable-raid-day-2026")!;
  const raidHour = thirdWeek.events.find((event) => event.id === "deoxys-raid-hour-2026-11-25")!;
  const spotlightHour = secondWeek.events.find((event) => event.id === "galar-starters-spotlight-hour-2026")!;
  const multiDay = thirdWeek.events.find((event) => event.id === "twilight-three-star-2026")!;

  assert.equal(eternamax.availabilityTime, "11:00 ~ 14:00");
  assert.equal(superMega.availabilityTime, "11/28 14:00 ~ 11/28 17:00");
  assert.equal(isTimeLimitedEvent(eternamax), true);
  assert.equal(isTimeLimitedEvent(superMega), true);
  assert.equal(isTimeLimitedEvent(raidHour), true);
  assert.equal(isTimeLimitedEvent(spotlightHour), true);
  assert.equal(isTimeLimitedEvent(multiDay), false);
  assert.equal(isTimeLimitedEvent({ ...eternamax, startAt: undefined, endAt: undefined, featuredHour: undefined }), false);
  assert.equal(isTimeLimitedEvent({ ...eternamax, startAt: "2026-11-21T00:00:00+09:00", endAt: "2026-11-21T23:59:00+09:00", featuredHour: undefined }), false);
});

test("event detail actions only resolve registered event routes", async () => {
  const secondWeek = getWeekByStartDate("2026-11-16");
  const dynamaxTrails = getEventsByWeek(secondWeek).find((event) => event.id === "dynamax-trails-schedule-2026")!;
  assert.equal(dynamaxTrails.eventHref, "/schedule?week=2026-11-16&category=event");
  assert.equal(getRegisteredEventDetailHref(dynamaxTrails), undefined);
  assert.deepEqual(resolveWeekEventAction(dynamaxTrails, "2026-11-19"), { kind: "unavailable", label: "상세 안내 미등록" });

  const firstWeek = getWeekByStartDate("2026-11-09");
  const wildArea = getEventsByWeek(firstWeek).find((event) => event.id === "wild-area-day-1")!;
  const action = resolveWeekEventAction(wildArea, "2026-11-14");
  assert.equal(getRegisteredEventDetailHref(wildArea), "/events/go-wild-area-global-2026");
  assert.deepEqual(action, { kind: "event", label: "이벤트 상세", href: "/events/go-wild-area-global-2026?date=2026-11-14" });
  await assert.doesNotReject(() => readFile(path.join(process.cwd(), `app${action.href!.split("?")[0]}/page.tsx`), "utf8"));
});

test("all configured event CTAs across the audited weeks are valid details or non-links", async () => {
  let configuredRows = 0;
  let validRows = 0;
  let unavailableRows = 0;

  for (const weekStart of ["2026-11-09", "2026-11-16", "2026-11-23"]) {
    for (const event of getEventsByWeek(getWeekByStartDate(weekStart))) {
      if (!event.eventHref) continue;
      configuredRows += 1;
      const action = resolveWeekEventAction(event, event.date);
      if (action.kind === "event") {
        validRows += 1;
        assert(action.href?.startsWith("/events/"));
        assert.notEqual(action.href?.split("?")[0], "/schedule");
        await assert.doesNotReject(() => readFile(path.join(process.cwd(), `app${action.href!.split("?")[0]}/page.tsx`), "utf8"));
      } else {
        unavailableRows += 1;
        assert.equal(action.href, undefined);
      }
    }
  }

  assert.deepEqual({ configuredRows, validRows, unavailableRows }, { configuredRows: 4, validRows: 2, unavailableRows: 2 });
});

test("schedule page renders one selected-day list with seven date tabs", async () => {
  const source = await readFile(path.join(process.cwd(), "app/schedule/page.tsx"), "utf8");
  assert.match(source, /schedule-day-tabs/);
  assert.match(source, /selectedEvents\.map/);
  assert.doesNotMatch(source, /days\.map\(\(day\) => \{\s*const events = getEventsByDate/);
  assert.match(source, /오늘 해당 일정이 없습니다/);
});

test("root and bottom navigation expose one schedule entry point and three tabs", async () => {
  const root = await readFile(path.join(process.cwd(), "app/page.tsx"), "utf8");
  const nav = await readFile(path.join(process.cwd(), "app/_components/bottom-nav.tsx"), "utf8");
  assert.match(root, /redirect\([\s\S]+\/schedule/);
  assert.doesNotMatch(nav, /label: "홈"/);
  for (const label of ["일정", "공략", "준비"]) assert.match(nav, new RegExp(`label: "${label}"`));
});
