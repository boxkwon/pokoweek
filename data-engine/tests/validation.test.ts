import assert from "node:assert/strict";
import test from "node:test";
import type { GuideCandidate, NormalizedDataset, ValidationIssue } from "../schemas";
import { checkEditorialReadiness, checkGuideCompleteness } from "../validators/completeness";
import { validateCandidateMoves } from "../validators/validate";
import { completeCandidate } from "./fixtures";

test("completeness reports an applicable missing XL decision", () => {
  const complete = completeCandidate();
  const incomplete = { ...complete, investment: { ...complete.investment, xlCandy: undefined } };
  const report = checkGuideCompleteness("kyurem", incomplete as unknown as GuideCandidate);
  assert.equal(report.status, "incomplete");
  assert.ok(report.missing.includes("investment.xlCandy"));
});

test("completeness does not require non-applicable decisions", () => {
  const complete = completeCandidate();
  const candidate = {
    ...complete,
    applicability: { ...complete.applicability, secondMove: false, xlCandy: false },
    investment: { ...complete.investment, secondMove: null, xlCandy: null },
  };
  assert.equal(checkGuideCompleteness("kyurem", candidate).status, "complete");
});

test("unknown performance rating does not block an actionable editorial guide", () => {
  const candidate = completeCandidate({
    performanceRating: null,
    editorialStatus: "ready",
    editorialLimitations: ["외부 성능 비교가 없음"],
    useCases: [{ mode: "raid", performanceRating: null, analysis: { reason: "근거 부족", evidenceIds: ["fixture:evidence"], modes: ["raid"] } }],
  });
  assert.equal(checkGuideCompleteness("kyurem", candidate).status, "complete");
  const editorial = checkEditorialReadiness("kyurem", candidate);
  assert.equal(editorial.ready, true);
  assert.equal(editorial.blockers.length, 0);
});

test("structural completeness can pass while editorial review is still required", () => {
  const candidate = completeCandidate({ editorialStatus: "needs_review" });
  assert.equal(checkGuideCompleteness("kyurem", candidate).status, "complete");
  assert.equal(checkEditorialReadiness("kyurem", candidate).ready, false);
});

test("recommended moves must exist in the normalized form move pool", () => {
  const candidate = completeCandidate({
    movesets: [{
      mode: "raid",
      fastMove: "Impossible Move",
      chargedMoves: ["Glaciate"],
      acquisitionConditions: ["이벤트 조건"],
      analysis: { reason: "테스트", evidenceIds: ["fixture:evidence"], modes: ["raid"] },
    }],
  });
  const dataset = {
    pokemon: [{
      id: "kyurem",
      moves: {
        fast: [{ name: "Dragon Breath", acquisition: "current" }],
        charged: [{ name: "Glaciate", acquisition: "elite" }],
      },
    }],
    fusionRecipes: [],
  } as unknown as NormalizedDataset;
  const issues: ValidationIssue[] = [];
  validateCandidateMoves(candidate, dataset, issues);
  assert.ok(issues.some((issue) => issue.code === "invalid_recommended_fast_move"));
});

test("official fusion move is valid only with an acquisition condition", () => {
  const candidate = completeCandidate({
    pokemonId: "white-kyurem",
    movesets: [{
      mode: "raid",
      fastMove: "Dragon Breath",
      chargedMoves: ["Ice Burn"],
      acquisitionConditions: ["얼어붙은세계를 배운 큐레무와 레시라무를 합체"],
      analysis: { reason: "공식 융합 조건", evidenceIds: ["official:white-move"], modes: ["raid"] },
    }],
  });
  const dataset = {
    pokemon: [{
      id: "white-kyurem",
      moves: {
        fast: [{ name: "Dragon Breath", acquisition: "current" }],
        charged: [],
      },
    }],
    fusionRecipes: [{ resultPokemonId: "white-kyurem", moveTransformation: { targetMove: "Ice Burn" } }],
  } as unknown as NormalizedDataset;
  const issues: ValidationIssue[] = [];
  validateCandidateMoves(candidate, dataset, issues);
  assert.equal(issues.length, 0);
});
