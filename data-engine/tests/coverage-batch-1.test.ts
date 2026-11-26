import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { applyApprovedGuideOverlays } from "../../app/_data/approved-guide-adapter";
import { BatchOneCandidateBundleSchema, BatchOneNormalizedDatasetSchema } from "../batch-1/schemas";
import { BATCH_ONE_TARGETS, validateBatchOne } from "../batch-1/validate";

const root = process.cwd();
async function json(file: string) { return JSON.parse(await readFile(path.join(root, file), "utf8")); }

test("raid coverage audit contains exactly 30 unique D-grade forms", async () => {
  const audit = await readFile(path.join(root, "data/validation/raid-coverage-audit-2026-11.md"), "utf8");
  const rows = audit.split("\n").filter((line) => /^\| 11\//.test(line) && /\| D \|/.test(line));
  const names = new Set(rows.map((line) => line.split("|")[4].trim()));
  assert.equal(names.size, 30);
});

test("Batch 1 contains exactly the five selected D-grade forms and remains pending", async () => {
  const bundle = BatchOneCandidateBundleSchema.parse(await json("data/candidates/pokemon-guide-coverage-batch-1.json"));
  assert.deepEqual(bundle.candidates.map((item) => item.pokemonId), [...BATCH_ONE_TARGETS]);
  assert.ok(bundle.candidates.every((item) => item.review.status === "pending"));
});

test("Batch 1 is structurally complete, editorial ready, and evidence-linked", async () => {
  const { report } = await validateBatchOne();
  assert.equal(report.structuralComplete, true);
  assert.equal(report.issues.filter((issue) => issue.severity === "error").length, 0);
  assert.ok(report.editorialReadiness.every((item) => item.structuralComplete && item.editorialReady));
  assert.equal(report.approvalPerformed, false);
  assert.equal(report.publicationPerformed, false);
});

test("form move pools and progression levels match the normalized snapshot", async () => {
  const normalized = BatchOneNormalizedDatasetSchema.parse(await json("data/normalized/pokemon-guide-coverage-batch-1.json"));
  const bundle = BatchOneCandidateBundleSchema.parse(await json("data/candidates/pokemon-guide-coverage-batch-1.json"));
  for (const candidate of bundle.candidates) {
    const pokemon = normalized.pokemon.find((item) => item.id === candidate.pokemonId)!;
    assert.deepEqual(pokemon.progression.map((stage) => stage.level), [30, 35, 40, 50]);
    assert.equal(candidate.guide.name, pokemon.displayName);
    assert.equal(candidate.guide.image.alt, pokemon.displayName);
    assert.equal(candidate.guide.overallRating, null);
    assert.equal(candidate.guide.counters.length, 0);
    assert.equal(candidate.guide.dataStatus.counters, "missing");
  }
  assert.deepEqual(normalized.pokemon.find((item) => item.id === "deoxys-defense")?.moves.fast, ["사두기", "카운터"]);
  assert.ok(normalized.pokemon.find((item) => item.id === "mega-metagross")?.moves.eliteCharged.includes("코멧펌치"));
});

test("shadow costs are not presented as ordinary costs and PvP caps remain explicit", async () => {
  const normalized = BatchOneNormalizedDatasetSchema.parse(await json("data/normalized/pokemon-guide-coverage-batch-1.json"));
  for (const id of ["shadow-cranidos", "shadow-tornadus-incarnate"] as const) {
    const pokemon = normalized.pokemon.find((item) => item.id === id)!;
    assert.ok(pokemon.progression.every((stage) => stage.cumulativeCost === null));
  }
  const bundle = BatchOneCandidateBundleSchema.parse(await json("data/candidates/pokemon-guide-coverage-batch-1.json"));
  const deoxys = bundle.candidates.find((item) => item.pokemonId === "deoxys-defense")!.guide;
  assert.deepEqual(deoxys.pvpLeagueTargets?.map((item) => item.cpLimit), [1500, 2500]);
  assert.match(JSON.stringify(deoxys), /최적 IV.*생성하지 않/);
});

test("Preview and published Production expose the five reviewed Batch 1 routes", { concurrency: false }, async () => {
  const previousFlag = process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES;
  const previousEnv = process.env.VERCEL_ENV;
  const base = [{ id: "kyurem", name: "큐레무" }];
  try {
    process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES = "true";
    process.env.VERCEL_ENV = "preview";
    const preview = applyApprovedGuideOverlays(base);
    for (const id of BATCH_ONE_TARGETS) assert.ok(preview.some((guide) => guide.id === id));

    process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES = "false";
    process.env.VERCEL_ENV = "production";
    const production = applyApprovedGuideOverlays(base);
    for (const id of BATCH_ONE_TARGETS) assert.ok(production.some((guide) => guide.id === id));
  } finally {
    process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES = previousFlag;
    process.env.VERCEL_ENV = previousEnv;
  }
});

test("the approved overlay retains all five published Batch 1 guides after Batch 2", async () => {
  const bytes = await readFile(path.join(root, "data/approved/app-guide-overlays.json"));
  const overlays = JSON.parse(bytes.toString()) as { id: string }[];
  assert.equal(overlays.length, 21);
  for (const id of BATCH_ONE_TARGETS) assert.ok(overlays.some((overlay) => overlay.id === id));
});
