import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PokemonCounterSection, getVerifiedCounters } from "../../app/_components/pokemon-guide-shared-sections";
import { pokemonGuides } from "../../app/_data/guide-data";
import {
  getGuideSelectionForEvent,
  getGuidesForWeek,
  getPokemonGuide,
  getWeekByStartDate,
  getWeekEventActionHref,
  getWeekEventById,
} from "../../app/_data/queries";
import { getRouteDateContextFromSearch, withDateContext } from "../../app/_lib/internal-url";

test("past schedule actions preserve their selected date and exact Pokemon forms", () => {
  const week = getWeekByStartDate("2026-11-09");
  const threeStar = getWeekEventById(week, "weekday-three-star")!;
  const fiveStar = getWeekEventById(week, "weekday-five-star")!;
  const zamazentaHour = getWeekEventById(week, "zamazenta-raid-hour")!;

  assert.equal(getWeekEventActionHref(threeStar, "2026-11-13"), "/guide?event=weekday-three-star&date=2026-11-13");
  assert.equal(getWeekEventActionHref(fiveStar, "2026-11-13"), "/guide?event=weekday-five-star&date=2026-11-13");
  assert.equal(getWeekEventActionHref(zamazentaHour, "2026-11-10"), "/pokemon/zamazenta-crowned?date=2026-11-10");

  assert.deepEqual(getGuideSelectionForEvent(threeStar).map((item) => [item.pokemon.id, item.guide?.id]), [
    ["druddigon", "druddigon"],
    ["orthworm", "orthworm"],
  ]);
  assert.deepEqual(getGuideSelectionForEvent(fiveStar).map((item) => [item.pokemon.id, item.guide?.id]), [
    ["zacian-crowned", "zacian-crowned"],
    ["zamazenta-crowned", "zamazenta-crowned"],
  ]);
});

test("guide route date context is independent from the Preview-only app clock override", () => {
  assert.equal(getRouteDateContextFromSearch("?date=2026-11-13"), "2026-11-13");
  assert.equal(getRouteDateContextFromSearch("?date=2026-02-31"), undefined);
  assert.equal(withDateContext("/pokemon/druddigon", "2026-11-13"), "/pokemon/druddigon?date=2026-11-13");
  assert.equal(withDateContext("https://example.com", "2026-11-13"), "https://example.com");
});

test("past and current guide pools do not mix", () => {
  const previousIds = new Set(getGuidesForWeek(getWeekByStartDate("2026-11-09")).map((guide) => guide.id));
  const currentIds = new Set(getGuidesForWeek(getWeekByStartDate("2026-11-16")).map((guide) => guide.id));
  assert.equal(previousIds.has("druddigon"), true);
  assert.equal(previousIds.has("orthworm"), true);
  assert.equal(currentIds.has("druddigon"), false);
  assert.equal(currentIds.has("orthworm"), false);
  assert.equal(currentIds.has("cresselia"), true);
});

test("form mappings resolve to their own guide IDs", () => {
  const expected = [
    ["zacian-crowned", "검왕 자시안"],
    ["zamazenta-crowned", "방패왕 자마젠타"],
    ["kyurem", "큐레무"],
    ["white-kyurem", "화이트큐레무"],
    ["black-kyurem", "블랙큐레무"],
    ["mega-banette", "메가다크펫"],
  ] as const;
  for (const [id, name] of expected) assert.equal(getPokemonGuide(id)?.name, name);
});

test("unverified counter data and the disconnected ownership button stay hidden", async () => {
  assert.ok(pokemonGuides.every((guide) => getVerifiedCounters(guide).length === 0));
  const zacian = getPokemonGuide("zacian-crowned")!;
  assert.equal(renderToStaticMarkup(createElement(PokemonCounterSection, { guide: zacian })), "");

  const source = await readFile(path.join(process.cwd(), "app/_components/pokemon-guide-shared-sections.tsx"), "utf8");
  assert.doesNotMatch(source, /내가 가진 포켓몬으로 보기|owned-pokemon-button/);
});
