import assert from "node:assert/strict";
import test from "node:test";
import { applyApprovedGuideOverlays } from "../../app/_data/approved-guide-adapter";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { GuideCandidateBundleSchema } from "../schemas";
import { projectCandidateForApp } from "../manual/projection";

test("empty approved overlays preserve current production guide objects", () => {
  const guides = [{ id: "kyurem", reason: "legacy" }];
  const result = applyApprovedGuideOverlays(guides);
  assert.deepEqual(result, guides);
});

test("a candidate with unknown performance keeps null ratings instead of inventing stars", async () => {
  const bundle = GuideCandidateBundleSchema.parse(JSON.parse(await readFile(path.join(process.cwd(), "data/candidates/kyurem-family.json"), "utf8")));
  const candidate = bundle.candidates.find((item) => item.pokemonId === "kyurem")!;
  const overlay = projectCandidateForApp(candidate, { validationHash: "test", previewOnly: true });
  assert.equal(overlay.guide.overallRating, null);
  assert.equal((overlay.guide.useCases as Record<string, { rating: number | null }>).raid.rating, null);
  assert.ok((overlay.guide.movesets as Record<string, unknown>).raid);
  assert.ok((overlay.guide.investment as Record<string, unknown>).secondMove);
  assert.ok((overlay.guide.ivAdvice as { general: string }).general.length > 0);
});
