import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { applyApprovedGuideOverlays } from "../../app/_data/approved-guide-adapter";
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
  assert.ok(guide.movesets.pvp?.conditions?.some((condition) => condition.includes("대단한 기술머신")));
  assert.equal(guide.useCases.raid, undefined);
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
    conditionalCost: { baseCost: { label: string; amount: number }[]; activeCost: { label: string; amount: number }[]; note: string };
  };
  assert.equal(action.eventId, dataset.mechanics.eternatus.event.id);
  assert.deepEqual(action.ownershipCondition.options.map((option) => option.id), ["never-caught", "caught-before"]);
  const caughtBefore = action.ownershipCondition.options.find((option) => option.id === "caught-before")!;
  assert.match(JSON.stringify(caughtBefore), /사탕 100개/);
  assert.doesNotMatch(caughtBefore.summary, /조우/);
  assert.deepEqual(action.conditionalCost.baseCost.map((cost) => cost.amount), [5000, 30]);
  assert.deepEqual(action.conditionalCost.activeCost.map((cost) => cost.amount), [2500, 15]);
  assert.match(action.conditionalCost.note, /CP 강화 비용/);
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
