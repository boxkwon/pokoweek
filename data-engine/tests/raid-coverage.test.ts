import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  getAvailableScheduleFilters,
  getEventsByCategory,
  getEventsByDate,
  getGuideSelectionForEvent,
  normalizeScheduleCategoryForEvents,
  resolveWeekEventAction,
  getWeekByStartDate,
} from "../../app/_data/queries";
import type { WeekEvent } from "../../app/_data/guide-data";
import { raidRotationArtwork } from "../../app/_data/raid-rotation-data";
import { hasRealPokemonArtwork } from "../../app/_lib/pokemon-artwork";
import { normalizeScheduleFilter } from "../../app/_lib/schedule-preferences";

function uniqueRaidPokemonIds(weekStart: string) {
  const events = getEventsByCategory(getWeekByStartDate(weekStart).events, "all");
  return new Set(events.flatMap((event) => event.pokemon.map((entry) => entry.id)));
}

test("all raid view contains every registered rotation independently of guide availability", () => {
  assert.equal(getEventsByCategory(getWeekByStartDate("2026-11-09").events, "all").length, 8);
  assert.equal(getEventsByCategory(getWeekByStartDate("2026-11-16").events, "all").length, 8);
  assert.equal(getEventsByCategory(getWeekByStartDate("2026-11-23").events, "all").length, 14);
  assert.equal(uniqueRaidPokemonIds("2026-11-09").size, 10);
  assert.equal(uniqueRaidPokemonIds("2026-11-16").size, 18);
  assert.equal(uniqueRaidPokemonIds("2026-11-23").size, 32);

  const week = getWeekByStartDate("2026-11-16");
  const oneStar = getEventsByCategory(week.events, "tier1");
  assert.deepEqual(oneStar.flatMap((event) => event.pokemon.map((entry) => entry.id)).sort(), [
    "alolan-meowth",
    "galarian-yamask",
    "misdreavus",
    "sandygast",
    "shadow-cranidos",
    "shadow-larvitar",
    "shadow-makuhita",
    "shadow-mudkip",
  ].sort());
  assert.equal(getEventsByCategory(week.events, "tier4").length, 0);
});

test("all 41 audited raid boss forms have a loadable local artwork mapping", async () => {
  const unique = new Map<string, WeekEvent["pokemon"][number]>();
  for (const weekStart of ["2026-11-09", "2026-11-16", "2026-11-23"]) {
    for (const event of getEventsByCategory(getWeekByStartDate(weekStart).events, "all")) {
      for (const entry of event.pokemon) unique.set(entry.id, entry);
    }
  }

  assert.equal(unique.size, 41);
  for (const entry of unique.values()) {
    assert.equal(hasRealPokemonArtwork(entry.image), true, `${entry.id}: placeholder artwork`);
    assert(entry.image.src.startsWith("/images/pokemon/"), `${entry.id}: non-local artwork`);
    await assert.doesNotReject(() => access(path.join(process.cwd(), "public", entry.image.src)));
  }

  const rotationAssets = Object.values(raidRotationArtwork);
  assert.equal(rotationAssets.filter((asset) => asset.match === "exact_form").length, 16);
  assert.equal(rotationAssets.filter((asset) => asset.match === "base_form").length, 13);
  assert.equal(rotationAssets.filter((asset) => asset.image.placeholder === true).length, 0);
});

test("raid difficulty and kind filters remain independent", () => {
  const week = getWeekByStartDate("2026-11-23");
  const megaIds = new Set(getEventsByCategory(week.events, "mega").flatMap((event) => event.pokemon.map((entry) => entry.id)));
  const specialIds = new Set(getEventsByCategory(week.events, "special").flatMap((event) => event.pokemon.map((entry) => entry.id)));
  const shadowIds = new Set(getEventsByCategory(week.events, "shadow").flatMap((event) => event.pokemon.map((entry) => entry.id)));

  assert(megaIds.has("mega-metagross"));
  assert(megaIds.has("mega-sableye"));
  assert(!megaIds.has("super-mega-clefable"));
  assert(specialIds.has("super-mega-clefable"));
  assert(specialIds.has("pikachu-sun-crown"));
  assert(shadowIds.has("shadow-tornadus-incarnate"));
  assert(!shadowIds.has("deoxys-normal"));
});

test("raid rotations intersect the viewed week and stop after their end", () => {
  const first = getWeekByStartDate("2026-11-09");
  const second = getWeekByStartDate("2026-11-16");
  const third = getWeekByStartDate("2026-11-23");

  assert(getEventsByDate(first.events, "2026-11-13").some((event) => event.id === "weekday-three-star"));
  assert(getEventsByDate(second.events, "2026-11-18").some((event) => event.id === "regular-one-star-2026-11-16"));
  assert(getEventsByDate(third.events, "2026-11-24").some((event) => event.id === "regular-one-star-2026-11-16"));
  assert(!getEventsByDate(third.events, "2026-11-26").some((event) => event.id === "regular-one-star-2026-11-16"));
  assert(getEventsByDate(third.events, "2026-11-26").some((event) => event.id === "deoxys-five-star-2026-11-25"));
});

test("missing detailed guides never remove confirmed raid bosses", () => {
  const week = getWeekByStartDate("2026-11-16");
  const event = week.events.find((entry) => entry.id === "regular-three-star-2026-11-16");
  assert(event);
  const selection = getGuideSelectionForEvent(event);
  assert.equal(selection.length, 3);
  assert(selection.every((item) => item.guide === undefined));
});

test("known forms keep exact IDs while costume raids do not reuse another guide", () => {
  const first = getWeekByStartDate("2026-11-09");
  const crowned = first.events.find((event) => event.id === "weekday-five-star");
  const jacket = first.events.find((event) => event.id === "weekend-three-star");
  assert.deepEqual(crowned?.guidePokemonIds, ["zacian-crowned", "zamazenta-crowned"]);
  assert.deepEqual(jacket?.guidePokemonIds, ["modern-jacket-machamp"]);
  assert.equal(getGuideSelectionForEvent(jacket!)[0].guide, undefined);
});

test("every added raid rotation records source and verification metadata", async () => {
  const { raidCoverageEvents } = await import("../../app/_data/raid-rotation-data");
  for (const event of raidCoverageEvents) {
    assert(event.verification);
    assert(event.verification.sources.length > 0);
    assert.match(event.verification.checkedAt, /^2026-11-20T/);
    assert(event.raidKind);
    assert(event.raidTier);
  }
});

test("single bosses without a registered guide render an unavailable state instead of a 404 href", () => {
  const cases = [
    ["2026-11-09", "weekend-three-star"],
    ["2026-11-16", "shadow-tornadus-weekend-2026-11-21"],
    ["2026-11-23", "super-mega-clefable-raid-day-2026"],
  ] as const;

  for (const [weekStart, eventId] of cases) {
    const event = getWeekByStartDate(weekStart).events.find((entry) => entry.id === eventId);
    assert(event);
    assert.deepEqual(resolveWeekEventAction(event, event.date), { kind: "unavailable", label: "상세 공략 준비 중" });
  }
});

test("all 60 weekly raid entries resolve to a valid guide or an explicit unavailable state", () => {
  let entries = 0;
  let validGuides = 0;
  let unavailable = 0;
  let brokenLinks = 0;
  let wrongForms = 0;
  const deduplicatedByWeek = new Map<string, boolean>();

  for (const weekStart of ["2026-11-09", "2026-11-16", "2026-11-23"]) {
    const events = getEventsByCategory(getWeekByStartDate(weekStart).events, "all");
    for (const event of events) {
      const selections = getGuideSelectionForEvent(event);
      entries += selections.length;
      for (const selection of selections) {
        deduplicatedByWeek.set(`${weekStart}:${selection.pokemon.id}`, Boolean(selection.guide));
        if (selection.guide) {
          validGuides += 1;
          if (selection.guide.id !== selection.pokemon.id) wrongForms += 1;
        } else {
          unavailable += 1;
        }
      }
      const action = resolveWeekEventAction(event, event.date);
      if (selections.length === 1 && !selections[0].guide && action.href) brokenLinks += 1;
      if (action.kind === "guide" && !selections.some((selection) => selection.guide && action.href?.startsWith(`/pokemon/${selection.guide.id}`))) brokenLinks += 1;
    }
  }

  const deduplicatedGuides = [...deduplicatedByWeek.values()].filter(Boolean).length;
  assert.deepEqual({ entries, validGuides, unavailable, brokenLinks, wrongForms, deduplicatedEntries: deduplicatedByWeek.size, deduplicatedGuides }, {
    entries: 68,
    validGuides: 18,
    unavailable: 50,
    brokenLinks: 0,
    wrongForms: 0,
    deduplicatedEntries: 60,
    deduplicatedGuides: 14,
  });
});

test("multi-boss selection uses the same guide resolver for mixed and unavailable data", () => {
  const week = getWeekByStartDate("2026-11-09");
  const known = week.events.find((event) => event.id === "weekday-three-star");
  assert(known);
  assert.equal(resolveWeekEventAction(known).kind, "selection");

  const mixed: WeekEvent = {
    ...known,
    id: "mixed-guide-test",
    pokemon: [known.pokemon[0], { ...known.pokemon[1], id: "missing-form", href: "/pokemon/missing-form" }],
    guidePokemonIds: [known.pokemon[0].id, "missing-form"],
  };
  const selection = getGuideSelectionForEvent(mixed);
  assert(selection[0].guide);
  assert.equal(selection[1].guide, undefined);
  assert.equal(resolveWeekEventAction(mixed).kind, "selection");

  const noGuides = getWeekByStartDate("2026-11-16").events.find((event) => event.id === "regular-three-star-2026-11-16");
  assert(noGuides);
  assert(getGuideSelectionForEvent(noGuides).every((entry) => !entry.guide));
  assert.equal(resolveWeekEventAction(noGuides).kind, "selection");
});

test("a category that disappears in the destination week normalizes to all", () => {
  const week23 = getEventsByCategory(getWeekByStartDate("2026-11-23").events, "special");
  const week16 = getWeekByStartDate("2026-11-16").events;
  assert(week23.length > 0);
  assert(!getAvailableScheduleFilters(week16).includes("special"));
  assert.equal(normalizeScheduleCategoryForEvents(week16, "special"), "all");
  assert.equal(normalizeScheduleCategoryForEvents(week16, "tier3"), "tier3");
  assert.equal(normalizeScheduleCategoryForEvents(getWeekByStartDate("2026-11-23").events, "tier3"), "tier3");
  assert.equal(normalizeScheduleCategoryForEvents(week16, normalizeScheduleFilter("not-a-filter")), "all");
});
