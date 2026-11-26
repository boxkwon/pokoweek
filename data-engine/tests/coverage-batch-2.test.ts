import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { applyApprovedGuideOverlays } from "../../app/_data/approved-guide-adapter";
import { BatchTwoCandidateBundleSchema, BatchTwoNormalizedDatasetSchema } from "../batch-2/schemas";
import { BATCH_TWO_TARGETS, validateBatchTwo } from "../batch-2/validate";

const root = process.cwd();
async function json(file: string) { return JSON.parse(await readFile(path.join(root, file), "utf8")); }

test("Batch 2 contains exactly the fixed P1 four plus selected shadow Mudkip", async () => {
  const bundle = BatchTwoCandidateBundleSchema.parse(await json("data/candidates/pokemon-guide-coverage-batch-2.json"));
  assert.deepEqual(bundle.candidates.map((item) => item.pokemonId), [...BATCH_TWO_TARGETS]);
  assert.ok(bundle.candidates.every((item) => item.review.status === "pending"));
});

test("Batch 2 is structurally complete, editorial ready, and evidence linked", async () => {
  const { report } = await validateBatchTwo();
  assert.equal(report.structuralComplete, true);
  assert.equal(report.issues.filter((issue) => issue.severity === "error").length, 0);
  assert.ok(report.editorialReadiness.every((item) => item.structuralComplete && item.editorialReady));
  assert.equal(report.approvalPerformed, false);
  assert.equal(report.publicationPerformed, false);
});

test("Deoxys forms preserve distinct stats, moves, and decisions", async () => {
  const normalized = BatchTwoNormalizedDatasetSchema.parse(await json("data/normalized/pokemon-guide-coverage-batch-2.json"));
  const stats = Object.fromEntries(normalized.pokemon.filter((item) => item.id.startsWith("deoxys-")).map((item) => [item.id, item.baseStats]));
  assert.deepEqual(stats["deoxys-normal"], { attack: 345, defense: 115, stamina: 137 });
  assert.deepEqual(stats["deoxys-attack"], { attack: 414, defense: 46, stamina: 137 });
  assert.deepEqual(stats["deoxys-speed"], { attack: 230, defense: 218, stamina: 137 });
  const bundle = BatchTwoCandidateBundleSchema.parse(await json("data/candidates/pokemon-guide-coverage-batch-2.json"));
  assert.equal(new Set(bundle.candidates.filter((item) => item.pokemonId.startsWith("deoxys-")).map((item) => item.guide.summary)).size, 3);
});

test("Shadow guides never expose ordinary costs and evolution moves are validated", async () => {
  const normalized = BatchTwoNormalizedDatasetSchema.parse(await json("data/normalized/pokemon-guide-coverage-batch-2.json"));
  for (const id of ["shadow-piloswine", "shadow-mudkip"] as const) assert.ok(normalized.pokemon.find((item) => item.id === id)!.progression.every((stage) => stage.cumulativeCost === null));
  const mudkip = normalized.pokemon.find((item) => item.id === "shadow-mudkip")!;
  assert.ok(mudkip.moves.evolutionFast.includes("머드숏"));
  assert.ok(mudkip.moves.evolutionEliteCharged.includes("하이드로캐논"));
  const bundle = BatchTwoCandidateBundleSchema.parse(await json("data/candidates/pokemon-guide-coverage-batch-2.json"));
  assert.match(JSON.stringify(bundle.candidates.find((item) => item.pokemonId === "shadow-mudkip")), /현재 대단한 기술머신스페셜 사용 가능 여부는 게임에서 확인/);
});

test("Batch 2 appears only in candidate Preview and never in Production mode", { concurrency: false }, () => {
  const oldFlag = process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES;
  const oldEnv = process.env.VERCEL_ENV;
  try {
    process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES = "true";
    process.env.VERCEL_ENV = "preview";
    const preview = applyApprovedGuideOverlays([{ id: "kyurem", name: "큐레무" }]);
    for (const id of BATCH_TWO_TARGETS) assert.ok(preview.some((item) => item.id === id));
    process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES = "false";
    process.env.VERCEL_ENV = "production";
    const production = applyApprovedGuideOverlays([{ id: "kyurem", name: "큐레무" }]);
    for (const id of BATCH_TWO_TARGETS) assert.ok(!production.some((item) => item.id === id));
  } finally {
    process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES = oldFlag;
    process.env.VERCEL_ENV = oldEnv;
  }
});

test("the approved 16-guide overlay remains byte-identical", async () => {
  const bytes = await readFile(path.join(root, "data/approved/app-guide-overlays.json"));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "796a1d015084b9aee8d5e33035f4573521e1da535b26af26d3bb4aca2b2091de");
  assert.equal((JSON.parse(bytes.toString()) as unknown[]).length, 16);
});
