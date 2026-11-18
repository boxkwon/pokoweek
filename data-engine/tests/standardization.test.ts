import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { applyApprovedGuideOverlays } from "../../app/_data/approved-guide-adapter";
import { pokemonGuides, type PokemonGuide } from "../../app/_data/guide-data";
import { derivePokemonGuideView, getActionEventPhase } from "../../app/_lib/pokemon-detail-view-model";
import { StandardGuideCandidateBundleSchema, StandardizedGuideDatasetSchema } from "../standardization/schemas";
import { validatePokemonDetailStandardization } from "../standardization/validate";

async function readFixture(file: string) {
  return JSON.parse(await readFile(path.join(process.cwd(), file), "utf8"));
}

test("standardization candidates remain pending and cover exactly the three requested Pokemon", async () => {
  const bundle = StandardGuideCandidateBundleSchema.parse(await readFixture("data/candidates/pokemon-detail-standard-v1.json"));
  assert.deepEqual(bundle.candidates.map((candidate) => candidate.pokemonId).sort(), ["cresselia", "eternamax-eternatus", "mega-banette"]);
  assert.ok(bundle.candidates.every((candidate) => candidate.review.status === "pending"));
  assert.equal(bundle.usage, null);
});

test("standardization validator accepts evidence, moves, and editorial answerability", async () => {
  const { report } = await validatePokemonDetailStandardization();
  assert.equal(report.issues.filter((issue) => issue.severity === "error").length, 0);
  assert.ok(report.editorialReadiness.every((item) => item.ready));
  assert.equal(report.approvalPerformed, false);
  assert.equal(report.publicationPerformed, false);
});

test("Cresselia preserves PvP league decisions and limited move conditions", async () => {
  const bundle = StandardGuideCandidateBundleSchema.parse(await readFixture("data/candidates/pokemon-detail-standard-v1.json"));
  const guide = bundle.candidates.find((candidate) => candidate.pokemonId === "cresselia")!.guide;
  assert.ok(guide.pvpLeagueTargets);
  assert.deepEqual(guide.pvpLeagueTargets.map((target) => target.league), ["great", "ultra", "master"]);
  assert.equal(guide.pvpLeagueTargets.find((target) => target.league === "master")?.cpLimit, undefined);
  assert.ok(guide.pvpLeagueTargets.every((target) => target.ivDirection && target.powerUpTarget && target.secondMove && target.xlCandy && target.useCase));
  assert.equal(guide.pvpLeagueTargets.find((target) => target.league === "master")?.moveset, undefined);
  assert.equal(guide.pvpLeagueTargets.find((target) => target.league === "master")?.contextView.investment?.secondMove, "hold");
  assert.ok(guide.movesets.pvp?.conditions?.some((condition) => condition.includes("대단한 기술머신")));
  assert.equal(guide.useCases.raid, undefined);
});

test("Cresselia league selection derives one coherent hero, order, and investment view", async () => {
  const bundle = StandardGuideCandidateBundleSchema.parse(await readFixture("data/candidates/pokemon-detail-standard-v1.json"));
  const projection = bundle.candidates.find((candidate) => candidate.pokemonId === "cresselia")!.guide;
  const base = pokemonGuides.find((guide) => guide.id === "cresselia")!;
  const guide = { ...base, ...projection } as unknown as PokemonGuide;
  const great = derivePokemonGuideView({ guide, selectedLeague: "great", eventPhase: "active" });
  const master = derivePokemonGuideView({ guide, selectedLeague: "master", eventPhase: "active" });
  const ultra = derivePokemonGuideView({ guide, selectedLeague: "ultra", eventPhase: "active" });
  assert.match(great.verdictLabel ?? "", /슈퍼리그/);
  assert.equal(great.investment?.secondMove, "recommended");
  assert.match(master.verdictLabel ?? "", /마스터리그/);
  assert.equal(master.investment?.secondMove, "hold");
  assert.equal(master.investment?.xlCandy, "hold");
  assert.equal(master.investment?.stardust, "hold");
  assert.doesNotMatch((master.investment?.order ?? []).map((item) => item.label).join(" "), /CP 상한 직전/);
  assert.match(ultra.verdictLabel ?? "", /하이퍼리그/);
  assert.equal(ultra.investment?.secondMove, "high");
});

test("Mega Banette uses verified mega energy and staged investment data", async () => {
  const dataset = StandardizedGuideDatasetSchema.parse(await readFixture("data/normalized/pokemon-detail-standard-v1.json"));
  const bundle = StandardGuideCandidateBundleSchema.parse(await readFixture("data/candidates/pokemon-detail-standard-v1.json"));
  const guide = bundle.candidates.find((candidate) => candidate.pokemonId === "mega-banette")!.guide;
  const action = guide.actionGuide as { type: string; megaRestGuide: { gameCheck: string; superMaxNote: string }; goals: { requirements: { amount: number }[] }[] };
  assert.equal(action.type, "mega");
  assert.equal(dataset.mechanics.mega.firstEvolutionEnergy, 100);
  assert.ok(action.goals[0].requirements.some((requirement) => requirement.amount === 100));
  assert.match(action.megaRestGuide.gameCheck, /상세 화면/);
  assert.match(action.megaRestGuide.superMaxNote, /24시간/);
  assert.match(action.megaRestGuide.superMaxNote, /확인되지/);
  assert.equal(dataset.mechanics.mega.restPolicy.decreasesWithMegaLevel, true);
  assert.equal((guide.progression as { stages: unknown[] }).stages.length, 4);
});

test("Eternatus separates the obtainable Pokemon from the uncatchable Eternamax boss", async () => {
  const dataset = StandardizedGuideDatasetSchema.parse(await readFixture("data/normalized/pokemon-detail-standard-v1.json"));
  const bundle = StandardGuideCandidateBundleSchema.parse(await readFixture("data/candidates/pokemon-detail-standard-v1.json"));
  const guide = bundle.candidates.find((candidate) => candidate.pokemonId === "eternamax-eternatus")!.guide;
  assert.equal(dataset.mechanics.eternatus.eternamaxCatchable, false);
  assert.equal(dataset.mechanics.eternatus.formChangeSupported, false);
  assert.match(guide.summary, /소유·육성하는 것은 일반 무한다이노/);
  assert.equal((guide.progression as { costStatus: string }).costStatus, "check_in_game");
  assert.equal(guide.counters.length, 0);
  const action = guide.actionGuide as {
    eventId: string;
    ownershipCondition: { options: { id: string; summary: string; steps: { title: string; description?: string }[] }[] };
    conditionalCost: { baseCost: { label: string; amount: number }[]; activeCost: { label: string; amount: number }[]; note: string; facts: string[] };
  };
  assert.equal(action.eventId, dataset.mechanics.eternatus.event.id);
  assert.deepEqual(action.ownershipCondition.options.map((option) => option.id), ["never-caught", "caught-before"]);
  const caughtBefore = action.ownershipCondition.options.find((option) => option.id === "caught-before")!;
  assert.match(JSON.stringify(caughtBefore), /사탕 100개/);
  assert.doesNotMatch(caughtBefore.summary, /조우/);
  assert.deepEqual(action.conditionalCost.baseCost.map((cost) => cost.amount), [5000, 30]);
  assert.deepEqual(action.conditionalCost.activeCost.map((cost) => cost.amount), [2500, 15]);
  assert.match(action.conditionalCost.note, /CP 강화 비용/);
  assert.match(action.conditionalCost.facts.join(" "), /10분/);
  assert.match(action.conditionalCost.facts.join(" "), /2시간/);
  assert.match(action.conditionalCost.facts.join(" "), /24시간/);
  assert.match(action.conditionalCost.facts.join(" "), /동시에 사용 불가/);
});

test("Eternatus event phase boundaries distinguish rank progress, claims, and expiration", () => {
  const window = {
    id: "dynamax-trails-2026",
    label: "11/16 ~ 11/23",
    startAt: "2026-11-16T10:00:00+09:00",
    endAt: "2026-11-23T20:00:00+09:00",
    claimEndAt: "2026-11-25T20:00:00+09:00",
  };
  assert.equal(getActionEventPhase(new Date("2026-11-18T12:00:00+09:00"), window), "active");
  assert.equal(getActionEventPhase(new Date("2026-11-23T19:59:00+09:00"), window), "active");
  assert.equal(getActionEventPhase(new Date("2026-11-23T20:00:00+09:00"), window), "claim_only");
  assert.equal(getActionEventPhase(new Date("2026-11-24T12:00:00+09:00"), window), "claim_only");
  assert.equal(getActionEventPhase(new Date("2026-11-25T20:00:00+09:00"), window), "ended");
  assert.equal(getActionEventPhase(new Date("2026-11-26T12:00:00+09:00"), window), "ended");
});

test("Eternatus ownership and event phase matrix never revives unavailable GO Pass actions", async () => {
  const bundle = StandardGuideCandidateBundleSchema.parse(await readFixture("data/candidates/pokemon-detail-standard-v1.json"));
  const projection = bundle.candidates.find((candidate) => candidate.pokemonId === "eternamax-eternatus")!.guide;
  const base = pokemonGuides.find((guide) => guide.id === "eternamax-eternatus")!;
  const guide = { ...base, ...projection } as unknown as PokemonGuide;
  for (const ownershipId of [undefined, "never-caught", "caught-before"] as const) {
    const active = derivePokemonGuideView({ guide, ownershipId, eventPhase: "active" });
    const claimOnly = derivePokemonGuideView({ guide, ownershipId, eventPhase: "claim_only" });
    const ended = derivePokemonGuideView({ guide, ownershipId, eventPhase: "ended" });
    assert.match(active.summary ?? "", /GO Pass|랭크/);
    assert.doesNotMatch((claimOnly.investment?.order ?? []).map((item) => item.label).join(" "), /랭크 진행/);
    assert.equal(ended.presentationMode, "training-first");
    assert.doesNotMatch(`${ended.summary} ${(ended.investment?.order ?? []).map((item) => item.label).join(" ")}`, /보상 수령|랭크 진행/);
  }
  const ownedActive = derivePokemonGuideView({ guide, ownershipId: "caught-before", eventPhase: "active" });
  assert.match(ownedActive.verdictLabel ?? "", /사탕 100개/);
  assert.doesNotMatch(ownedActive.verdictLabel ?? "", /본체 확보|조우/);
});

test("candidate overlays are Preview-only and never replace Production guides", { concurrency: false }, () => {
  const previousFlag = process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES;
  const previousVercelEnv = process.env.VERCEL_ENV;
  try {
    process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES = "true";
    process.env.VERCEL_ENV = "preview";
    const [previewGuide] = applyApprovedGuideOverlays([{ id: "cresselia", reason: "legacy" }]);
    assert.notEqual(previewGuide.reason, "legacy");

    process.env.VERCEL_ENV = "production";
    const [productionGuide] = applyApprovedGuideOverlays([{ id: "cresselia", reason: "legacy" }]);
    assert.equal(productionGuide.reason, "legacy");
  } finally {
    process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES = previousFlag;
    process.env.VERCEL_ENV = previousVercelEnv;
  }
});
