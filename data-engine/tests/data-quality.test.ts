import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { GuideCandidateBundleSchema, NormalizedDatasetSchema } from "../schemas";
import { FactReviewManifestSchema } from "../schemas";
import { buildPokemonProgression } from "../analysis/progression";
import { buildKyuremRaidComparison } from "../analysis/raid";
import { kyuremFusionActionGuide } from "../../app/_data/guide-data";

async function normalized() {
  return NormalizedDatasetSchema.parse(JSON.parse(await readFile(path.join(process.cwd(), "data/normalized/kyurem-family.json"), "utf8")));
}

test("fusion-only Ice Burn keeps distinct PvE and PvP metrics and effect", async () => {
  const dataset = await normalized();
  const pokemon = dataset.pokemon.find((item) => item.id === "white-kyurem")!;
  const move = pokemon.moves.charged.find((item) => item.name === "Ice Burn")!;
  assert.equal(move.acquisition, "special");
  assert.deepEqual(move.pve, { type: "Ice", power: 90, energyDelta: -50, durationMs: 2000 });
  assert.deepEqual(move.pvp, {
    type: "Ice", power: 120, energyDelta: -60, turns: 1,
    effects: [{ activationChance: 0.3, target: "opponent", stat: "defense", stages: -1 }],
  });
});

test("fusion-only Freeze Shock keeps distinct PvE and PvP metrics and effect", async () => {
  const dataset = await normalized();
  const pokemon = dataset.pokemon.find((item) => item.id === "black-kyurem")!;
  const move = pokemon.moves.charged.find((item) => item.name === "Freeze Shock")!;
  assert.equal(move.acquisition, "special");
  assert.deepEqual(move.pve, { type: "Ice", power: 160, energyDelta: -100, durationMs: 1500 });
  assert.deepEqual(move.pvp, {
    type: "Ice", power: 120, energyDelta: -60, turns: 1,
    effects: [{ activationChance: 0.3, target: "opponent", stat: "attack", stages: -1 }],
  });
});

test("current, elite, and fusion-only charged move acquisition regressions are covered", async () => {
  const dataset = await normalized();
  const kyurem = dataset.pokemon.find((item) => item.id === "kyurem")!;
  const white = dataset.pokemon.find((item) => item.id === "white-kyurem")!;
  const black = dataset.pokemon.find((item) => item.id === "black-kyurem")!;
  assert.equal(kyurem.moves.fast.find((item) => item.name === "Dragon Breath")?.acquisition, "current");
  assert.equal(kyurem.moves.charged.find((item) => item.name === "Glaciate")?.acquisition, "elite");
  assert.equal(white.moves.charged.find((item) => item.name === "Fusion Flare")?.acquisition, "current");
  assert.equal(white.moves.charged.find((item) => item.name === "Ice Burn")?.acquisition, "special");
  assert.equal(black.moves.charged.find((item) => item.name === "Fusion Bolt")?.acquisition, "current");
  assert.equal(black.moves.charged.find((item) => item.name === "Freeze Shock")?.acquisition, "special");
});

test("published candidates retain unknown performance and their reviewed editorial decisions", async () => {
  const bundle = GuideCandidateBundleSchema.parse(JSON.parse(await readFile(path.join(process.cwd(), "data/candidates/kyurem-family.json"), "utf8")));
  assert.equal(bundle.candidates.every((item) => item.performanceRating === null), true);
  assert.equal(bundle.candidates.every((item) => item.review.status === "approved"), true);
  assert.equal(bundle.candidates.every((item) => item.review.status === "approved" && item.review.reviewer === "boxkwon"), true);
  assert.equal(bundle.candidates.every((item) => item.editorialStatus === "ready"), true);
  assert.equal(bundle.candidates.every((item) => item.decisionQuestions.length === 8), true);
});

test("level 30/35/40/50 CP and level-20 cumulative costs are reproducible", async () => {
  const dataset = await normalized();
  const kyurem = buildPokemonProgression(dataset, "kyurem");
  const white = buildPokemonProgression(dataset, "white-kyurem");
  assert.deepEqual(kyurem.levels.map((item) => item.cp), [3064, 3319, 3575, 4041]);
  assert.deepEqual(white.levels.map((item) => item.cp), [3947, 4276, 4605, 5206]);
  assert.deepEqual(white.levels.map((item) => item.cumulativeCostFromLevel20), [
    { stardust: 75000, candy: 66, xlCandy: 0 },
    { stardust: 137000, candy: 130, xlCandy: 0 },
    { stardust: 225000, candy: 248, xlCandy: 0 },
    { stardust: 475000, candy: 248, xlCandy: 296 },
  ]);
  assert.deepEqual(kyurem.cpCrossCheck, {
    calculatedLevel50Cp: 4041,
    reviewedLevel50: { level: 50, bestBuddyBoost: false, cp: 4041 },
    apiReportedMaxCp: 4090,
    reviewedLevel51: { level: 51, bestBuddyBoost: true, cp: 4090 },
    result: "matched_distinct_level_contexts",
    evidenceIds: ["review:kyurem-cp-level-context"],
  });
  assert.equal(white.cpCrossCheck?.apiReportedMaxCp, 5268);
  assert.equal(white.cpCrossCheck?.reviewedLevel50.cp, 5206);
});

test("required Kyurem facts are individually reviewed while limited benchmark claims remain non-blocking", async () => {
  const review = FactReviewManifestSchema.parse(JSON.parse(await readFile(path.join(process.cwd(), "data/evidence/manual/kyurem-fact-review-2026.json"), "utf8")));
  assert.equal(review.entries.filter((item) => item.requiredForPublish).every((item) => item.status === "reviewed"), true);
  assert.equal(review.entries.find((item) => item.category === "limited_benchmark_comparison")?.status, "needs_review");
});

test("fusion checklist state and post-fusion destinations stay independent for White and Black", () => {
  const [white, black] = kyuremFusionActionGuide.goals;
  assert.ok(white && black);
  assert.notEqual(white.id, black.id);
  assert.notEqual(white.postActionGuidePokemonId, black.postActionGuidePokemonId);
  const whiteMoveCheck = white.checklist?.find((item) => item.id.includes("move"));
  const blackMoveCheck = black.checklist?.find((item) => item.id.includes("move"));
  assert.ok(whiteMoveCheck?.label.includes("얼어붙은세계"));
  assert.ok(blackMoveCheck?.label.includes("얼어붙은세계"));
  assert.ok(whiteMoveCheck?.label.includes("화이트용"));
  assert.ok(blackMoveCheck?.label.includes("블랙용"));
  assert.notEqual(`${white.id}:${whiteMoveCheck?.id}`, `${black.id}:${blackMoveCheck?.id}`);
});

test("fusion recipes preserve field effect cost, extension limits, and distinct effects", async () => {
  const dataset = await normalized();
  const white = dataset.fusionRecipes.find((item) => item.resultPokemonId === "white-kyurem")!;
  const black = dataset.fusionRecipes.find((item) => item.resultPokemonId === "black-kyurem")!;
  for (const recipe of [white, black]) {
    assert.equal(recipe.fieldEffect.durationMinutes, 10);
    assert.equal(recipe.fieldEffect.stardust, 5000);
    assert.equal(recipe.fieldEffect.kyuremCandy, 5);
    assert.equal(recipe.fieldEffect.extensionMinutes, 10);
    assert.equal(recipe.fieldEffect.maxMinutesPerUse, 120);
    assert.equal(recipe.fieldEffect.maxTotalMinutes, 1440);
  }
  assert.equal(white.fieldEffect.effect, "slow_target_ring");
  assert.equal(black.fieldEffect.effect, "freeze_wild_pokemon");
});

test("limited raid benchmarks compare the same target profile without claiming DPS", async () => {
  const dataset = await normalized();
  const analysis = buildKyuremRaidComparison(dataset);
  const target = analysis.profiles.filter((item) => item.targetProfile === "Dragon/Flying");
  const byId = new Map(target.map((item) => [item.subjectId, item.relativeCycleIndex]));
  assert.ok(byId.get("white-kyurem")! > byId.get("galarian-darmanitan")!);
  assert.ok(byId.get("black-kyurem")! > byId.get("rayquaza")!);
  assert.ok(analysis.limitations.some((item) => item.includes("DPS/TDO")));
});

test("candidate import preserves a previous bundle in history", async () => {
  const history = await readdir(path.join(process.cwd(), "data/candidates/history"));
  assert.ok(history.some((file) => file.endsWith(".json")));
});
