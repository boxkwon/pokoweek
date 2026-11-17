import assert from "node:assert/strict";
import test from "node:test";
import { applyApprovedGuideOverlays } from "../../app/_data/approved-guide-adapter";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { GuideCandidateBundleSchema, NormalizedDatasetSchema } from "../schemas";
import { projectCandidateForApp } from "../manual/projection";

test("approved overlays leave unrelated production guide objects unchanged", () => {
  const guides = [{ id: "unpublished-guide", reason: "legacy" }];
  const result = applyApprovedGuideOverlays(guides);
  assert.deepEqual(result, guides);
});

test("published Kyurem overlay is applied without inventing a performance rating", () => {
  const [guide] = applyApprovedGuideOverlays([{ id: "kyurem", reason: "legacy", overallRating: 5 as number | null }]);
  assert.notEqual(guide.reason, "legacy");
  assert.equal(guide.overallRating, null);
});

test("a candidate with unknown performance keeps null ratings instead of inventing stars", async () => {
  const bundle = GuideCandidateBundleSchema.parse(JSON.parse(await readFile(path.join(process.cwd(), "data/candidates/kyurem-family.json"), "utf8")));
  const dataset = NormalizedDatasetSchema.parse(JSON.parse(await readFile(path.join(process.cwd(), "data/normalized/kyurem-family.json"), "utf8")));
  const candidate = bundle.candidates.find((item) => item.pokemonId === "kyurem")!;
  const overlay = projectCandidateForApp(candidate, { validationHash: "test", previewOnly: true }, dataset);
  assert.equal(overlay.guide.overallRating, null);
  assert.equal((overlay.guide.useCases as Record<string, { rating: number | null }>).raid.rating, null);
  assert.ok((overlay.guide.movesets as Record<string, unknown>).raid);
  assert.ok((overlay.guide.investment as Record<string, unknown>).secondMove);
  assert.ok((overlay.guide.ivAdvice as { general: string }).general.length > 0);
});

test("preview projection separates fusion-first Kyurem from training-first fusion forms", async () => {
  const bundle = GuideCandidateBundleSchema.parse(JSON.parse(await readFile(path.join(process.cwd(), "data/candidates/kyurem-family.json"), "utf8")));
  const dataset = NormalizedDatasetSchema.parse(JSON.parse(await readFile(path.join(process.cwd(), "data/normalized/kyurem-family.json"), "utf8")));
  const overlays = Object.fromEntries(bundle.candidates.map((candidate) => [candidate.pokemonId, projectCandidateForApp(candidate, { validationHash: "test", previewOnly: true }, dataset).guide]));

  assert.equal(overlays.kyurem.presentationMode, "fusion-first");
  assert.equal(overlays["white-kyurem"].presentationMode, "training-first");
  assert.equal(overlays["black-kyurem"].presentationMode, "training-first");
  assert.deepEqual((overlays["white-kyurem"].progression as { stages: { cp: number }[] }).stages.map((stage) => stage.cp), [3947, 4276, 4605, 5206]);
  assert.match((overlays["white-kyurem"].fusionSummary as { fieldEffect: { extension: string } }).fieldEffect.extension, /최대 2시간.*최대 24시간/);
});
