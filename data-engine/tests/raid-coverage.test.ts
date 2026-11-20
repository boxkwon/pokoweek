import assert from "node:assert/strict";
import test from "node:test";
import {
  getEventsByCategory,
  getEventsByDate,
  getGuideSelectionForEvent,
  getWeekByStartDate,
} from "../../app/_data/queries";

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
