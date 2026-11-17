import type { CompletenessReport, EditorialReadinessReport, GuideCandidate, PokemonId } from "../schemas";

export function checkGuideCompleteness(
  pokemonId: PokemonId,
  candidate: GuideCandidate | undefined,
): CompletenessReport {
  if (!candidate) return { pokemonId, status: "missing", missing: ["guideCandidate"] };

  const missing: string[] = [];
  if (!candidate.verdict.label) missing.push("verdict");
  if (!candidate.verdict.summary) missing.push("verdict.summary");
  if (!candidate.verdict.analysis.reason) missing.push("verdict.reason");

  for (const mode of candidate.applicability.modes) {
    if (!candidate.useCases.some((item) => item.mode === mode)) missing.push(`useCases.${mode}`);
    const moveset = candidate.movesets.find((item) => item.mode === mode);
    if (!moveset) missing.push(`movesets.${mode}`);
    else if (moveset.acquisitionConditions.length === 0) missing.push(`movesets.${mode}.acquisitionConditions`);
  }

  if (candidate.investment.order.length === 0) missing.push("investment.order");
  if (!candidate.investment.stardust) missing.push("investment.stardust");
  if (!candidate.investment.candy) missing.push("investment.candy");
  if (!candidate.investment.eliteTm) missing.push("investment.eliteTm");
  if (candidate.applicability.secondMove && !candidate.investment.secondMove) missing.push("investment.secondMove");
  if (candidate.applicability.xlCandy && !candidate.investment.xlCandy) missing.push("investment.xlCandy");
  if (candidate.applicability.maxMove && !candidate.investment.maxMove) missing.push("investment.maxMove");
  if (candidate.applicability.specialActionGuide && !candidate.specialActionGuideId) missing.push("specialActionGuideId");
  if (candidate.actions.length === 0) missing.push("actions");
  const requiredQuestions = ["fusion_or_base", "white_or_black_priority", "required_moves", "missing_special_move", "post_fusion_first_step", "power_up_target", "second_move", "xl_and_stardust"];
  for (const questionId of requiredQuestions) {
    if (!candidate.decisionQuestions.some((item) => item.id === questionId)) missing.push(`decisionQuestions.${questionId}`);
  }

  const allAnalysis = [
    candidate.verdict.analysis,
    ...candidate.useCases.map((item) => item.analysis),
    ...candidate.movesets.map((item) => item.analysis),
    candidate.investment.stardust.analysis,
    candidate.investment.candy.analysis,
    candidate.investment.eliteTm.analysis,
    ...(candidate.investment.secondMove ? [candidate.investment.secondMove.analysis] : []),
    ...(candidate.investment.xlCandy ? [candidate.investment.xlCandy.analysis] : []),
    ...(candidate.investment.maxMove ? [candidate.investment.maxMove.analysis] : []),
  ];
  if (allAnalysis.some((analysis) => analysis.evidenceIds.length === 0)) missing.push("analysis.evidenceIds");

  return {
    pokemonId,
    status: missing.length === 0 ? "complete" : "incomplete",
    missing: [...new Set(missing)],
  };
}

export function checkEditorialReadiness(
  pokemonId: PokemonId,
  candidate: GuideCandidate | undefined,
): EditorialReadinessReport {
  if (!candidate) return { pokemonId, status: "blocked", ready: false, blockers: ["guideCandidate missing"] };

  const blockers: string[] = [];
  if (candidate.evidenceConfidence === "low") blockers.push("evidenceConfidence is low");
  if (candidate.editorialStatus !== "ready") blockers.push(`editorialStatus is ${candidate.editorialStatus}`);
  if (candidate.decisionQuestions.length !== 8) blockers.push("all eight decision questions are required");
  if (candidate.decisionQuestions.some((item) => item.conclusion.trim().length < 8 || item.reason.trim().length < 8)) {
    blockers.push("decision answers must contain actionable conclusions and reasons");
  }
  if (candidate.applicability.modes.includes("raid") && !candidate.raidAnalysis) {
    blockers.push("raid analysis is missing");
  }
  if (candidate.applicability.modes.includes("pvp") && !candidate.pvpAnalysis) {
    blockers.push("PvP evidence analysis is missing");
  }
  for (const stage of candidate.investment.powerUpStages) {
    if (stage.decision === "not_evaluated") blockers.push(`level ${stage.level} investment is not evaluated`);
  }

  const uniqueBlockers = [...new Set(blockers)];
  return {
    pokemonId,
    status: uniqueBlockers.length === 0 ? "ready" : candidate.editorialStatus === "blocked" ? "blocked" : "needs_review",
    ready: uniqueBlockers.length === 0,
    blockers: uniqueBlockers,
  };
}
