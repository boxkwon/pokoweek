import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { z } from "zod";
import { FusionRecipeSchema, GuideCandidateBundleSchema, GuideCandidateSchema } from "../schemas";
import { ManualGuidePackageSchema } from "../manual/schemas";
import { aggregateFusionRecipes } from "../validators/fusion";
import { completeCandidate } from "./fixtures";

test("manual Kyurem recipes conform to the canonical fusion schema", async () => {
  const file = path.join(process.cwd(), "data/evidence/manual/kyurem-fusion-2026.json");
  const input = JSON.parse(await readFile(file, "utf8")) as { fusionRecipes: unknown[] };
  const recipes = z.array(FusionRecipeSchema).parse(input.fusionRecipes);
  assert.equal(recipes.length, 2);
  assert.equal(recipes.every((recipe) => recipe.moveTransformation.sourceMoveRequiredForFusion === false), true);
});

test("combined fusion keeps goal-scoped checklist state and totals both Kyurem", async () => {
  const file = path.join(process.cwd(), "data/evidence/manual/kyurem-fusion-2026.json");
  const input = JSON.parse(await readFile(file, "utf8")) as { fusionRecipes: unknown[] };
  const recipes = z.array(FusionRecipeSchema).parse(input.fusionRecipes);
  const combined = aggregateFusionRecipes(recipes);
  assert.equal(combined.materials.find((item) => item.type === "pokemon" && item.id === "kyurem")?.amount, 2);
  assert.equal(new Set(combined.checklist.map((item) => item.storageKey)).size, combined.checklist.length);
  assert.ok(combined.checklist.some((item) => item.storageKey.startsWith("white-kyurem:")));
  assert.ok(combined.checklist.some((item) => item.storageKey.startsWith("black-kyurem:")));
});

test("fixture candidates cannot be marked approved", () => {
  const candidate = completeCandidate();
  assert.throws(() => GuideCandidateSchema.parse({
    ...candidate,
    review: { status: "approved", reviewedAt: "2026-11-16T00:00:00.000Z", reviewer: "test" },
  }));
});

test("approved manual AI candidates retain package provenance and reviewer metadata", async () => {
  const packageFile = path.join(process.cwd(), "data/manual/packages/kyurem.json");
  const guidePackage = ManualGuidePackageSchema.parse(JSON.parse(await readFile(packageFile, "utf8")));
  const candidateFile = path.join(process.cwd(), "data/candidates/kyurem-family.json");
  const bundle = GuideCandidateBundleSchema.parse(JSON.parse(await readFile(candidateFile, "utf8")));
  const candidate = bundle.candidates.find((item) => item.pokemonId === "kyurem");
  assert.equal(bundle.usage, null);
  assert.equal(candidate?.generationMethod, "manual_ai");
  assert.equal(candidate?.generatedBy.sourcePackageHash, guidePackage.packageHash);
  assert.equal(candidate?.review.status, "approved");
  assert.equal(candidate?.review.status === "approved" ? candidate.review.reviewer : undefined, "boxkwon");
});

test("manual AI candidates require a source package hash", () => {
  const candidate = completeCandidate();
  const { sourcePackageHash: _sourcePackageHash, ...generatedBy } = candidate.generatedBy;
  assert.throws(() => GuideCandidateSchema.parse({
    ...candidate,
    origin: "manual_ai",
    generationMethod: "manual_ai",
    generatedBy: { ...generatedBy, provider: "codex", model: "test-model" },
  }));
});
