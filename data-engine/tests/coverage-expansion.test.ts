import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { applyApprovedGuideOverlays } from "../../app/_data/approved-guide-adapter";
import { CoverageGuideCandidateBundleSchema, CoverageNormalizedDatasetSchema } from "../coverage/schemas";
import { COVERAGE_TARGETS, validatePokemonGuideCoverage } from "../coverage/validate";

async function readJson(file: string) {
  return JSON.parse(await readFile(path.join(process.cwd(), file), "utf8"));
}

test("coverage expansion targets exactly the five B-grade guides from the audit", async () => {
  const audit = await readFile(path.join(process.cwd(), "data/validation/raid-coverage-audit-2026-11.md"), "utf8");
  const expectedNames = ["방패왕 자마젠타", "크리만", "꿈트렁", "제크로무", "레시라무"];
  for (const name of expectedNames) assert.match(audit, new RegExp(`\\|[^\\n]*${name}[^\\n]*\\| B \\|`));
  assert.deepEqual([...COVERAGE_TARGETS], ["zamazenta-crowned", "druddigon", "orthworm", "zekrom", "reshiram"]);
});

test("all five candidates remain pending and pass structural and editorial validation", async () => {
  const bundle = CoverageGuideCandidateBundleSchema.parse(await readJson("data/candidates/pokemon-guide-coverage-v1.json"));
  const { report } = await validatePokemonGuideCoverage();
  assert.deepEqual(bundle.candidates.map((candidate) => candidate.pokemonId), [...COVERAGE_TARGETS]);
  assert.ok(bundle.candidates.every((candidate) => candidate.review.status === "pending"));
  assert.ok(bundle.candidates.every((candidate) => candidate.editorialStatus === "ready"));
  assert.equal(report.issues.filter((issue) => issue.severity === "error").length, 0);
  assert.ok(report.editorialReadiness.every((item) => item.structuralComplete && item.editorialReady));
  assert.equal(report.approvalPerformed, false);
  assert.equal(report.publicationPerformed, false);
});

test("recommended moves belong to each normalized form and limited moves keep acquisition conditions", async () => {
  const normalized = CoverageNormalizedDatasetSchema.parse(await readJson("data/normalized/pokemon-guide-coverage-v1.json"));
  const bundle = CoverageGuideCandidateBundleSchema.parse(await readJson("data/candidates/pokemon-guide-coverage-v1.json"));
  for (const candidate of bundle.candidates) {
    const pokemon = normalized.pokemon.find((item) => item.id === candidate.pokemonId)!;
    const fastMoves = new Set(pokemon.moves.fast);
    const chargedMoves = new Set([...pokemon.moves.charged, ...pokemon.moves.special]);
    for (const moveset of Object.values(candidate.guide.movesets)) {
      if (!moveset) continue;
      if (moveset.fastMove) assert.ok(fastMoves.has(moveset.fastMove.name), `${candidate.pokemonId}: invalid fast move`);
      for (const move of [moveset.chargedMove, moveset.chargedMove2]) {
        if (move) assert.ok(chargedMoves.has(move.name), `${candidate.pokemonId}: invalid charged move`);
      }
      const isLimited = [moveset.fastMove, moveset.chargedMove, moveset.chargedMove2]
        .some((move) => move?.tags?.some((tag: string) => tag === "elite_tm" || tag === "elite_tm_check" || tag === "event_limited"));
      if (isLimited) assert.ok(moveset.conditions?.length, `${candidate.pokemonId}: limited move requires conditions`);
    }
  }
});

test("each candidate answers progression, second move, XL, resources, IV, and action decisions", async () => {
  const bundle = CoverageGuideCandidateBundleSchema.parse(await readJson("data/candidates/pokemon-guide-coverage-v1.json"));
  for (const candidate of bundle.candidates) {
    const guide = candidate.guide;
    const progression = guide.progression as { stages: { level: number }[] };
    assert.deepEqual(progression.stages.map((stage) => stage.level), [30, 35, 40, 50]);
    for (const key of ["powerUp", "stardust", "candy", "secondMove", "xlCandy"] as const) {
      assert.ok(guide.investment[key], `${candidate.pokemonId}: missing ${key}`);
    }
    const order = guide.investment.order as unknown[];
    assert.ok(order.length > 0);
    assert.ok(guide.ivAdvice && Object.keys(guide.ivAdvice).length > 0);
    assert.ok(guide.recommendations.length > 0);
    assert.equal(guide.dataStatus.counters, "missing");
    assert.equal(guide.counters.length, 0);
    assert.equal(guide.overallRating, null);
  }
});

test("approved coverage overlays load in Production without the Candidate flag", { concurrency: false }, async () => {
  const previousFlag = process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES;
  const previousEnv = process.env.VERCEL_ENV;
  const base = COVERAGE_TARGETS.map((id) => ({ id, verdictLabel: "legacy", marker: id }));
  try {
    process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES = "true";
    process.env.VERCEL_ENV = "preview";
    const preview = applyApprovedGuideOverlays(base);
    assert.ok(preview.every((guide) => guide.verdictLabel !== "legacy"));

    process.env.VERCEL_ENV = "production";
    const production = applyApprovedGuideOverlays(base);
    assert.ok(production.every((guide) => guide.verdictLabel !== "legacy"));

    process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES = "false";
    process.env.VERCEL_ENV = "preview";
    const disabledPreview = applyApprovedGuideOverlays(base);
    assert.ok(disabledPreview.every((guide) => guide.verdictLabel !== "legacy"));
    assert.deepEqual(disabledPreview, production);
  } finally {
    process.env.NEXT_PUBLIC_ENABLE_CANDIDATE_GUIDES = previousFlag;
    process.env.VERCEL_ENV = previousEnv;
  }
});

test("existing approved Production overlays remain byte-for-byte unchanged", async () => {
  const bytes = await readFile(path.join(process.cwd(), "data/approved/app-guide-overlays.json"));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "94a20712029609bb494a8aefd8043891e5d99c6b48fcebfefc5383e30b673b09");
});

test("coverage QA copy keeps form-change, limited-move, and PvP caps accurate", async () => {
  const bundle = CoverageGuideCandidateBundleSchema.parse(await readJson("data/candidates/pokemon-guide-coverage-v1.json"));
  const byId = new Map(bundle.candidates.map((candidate) => [candidate.pokemonId, candidate.guide]));

  const zamazenta = byId.get("zamazenta-crowned")!;
  const zamazentaText = JSON.stringify(zamazenta);
  assert.match(zamazentaText, /아이언헤드를 배운 역전의 용사 자마젠타/);
  assert.match(zamazentaText, /실드 에너지/);
  assert.doesNotMatch(zamazentaText, /융합/);
  assert.deepEqual(zamazenta.movesets.raid?.chargedMove?.tags ?? [], []);
  assert.match(zamazenta.movesets.raid?.conditions?.join(" ") ?? "", /폼을 바꿀 때 전환/);

  for (const id of ["zekrom", "reshiram"] as const) {
    const guide = byId.get(id)!;
    assert.deepEqual(guide.movesets.raid?.chargedMove?.tags, ["elite_tm_check"]);
    assert.match(guide.movesets.raid?.conditions?.join(" ") ?? "", /습득 가능한지는.*확인/);
  }

  const orthworm = byId.get("orthworm")!;
  const firstAction = (orthworm.investment.order as { label: string; reason: string }[])[0];
  assert.match(firstAction.label, /슈퍼리그 CP 1,500 이하/);
  assert.match(firstAction.label, /하이퍼리그 CP 2,500 이하/);
  assert.match(firstAction.reason, /최적 IV를 단정하지 않습니다/);
});
