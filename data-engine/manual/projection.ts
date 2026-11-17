import type { GuideCandidate } from "../schemas";

export type AppGuideOverlay = {
  id: string;
  validationHash: string;
  approvedAt?: string;
  previewOnly?: boolean;
  guide: Record<string, unknown>;
};

function decisionValue(value: GuideCandidate["investment"]["stardust"] | null) {
  if (!value || value.decision === "not_applicable") return undefined;
  return value.decision;
}

function verdictValue(rating: number | null) {
  if (rating === null) return undefined;
  if (rating === 5) return "must_build";
  if (rating === 4) return "recommended";
  if (rating === 3) return "conditional";
  if (rating === 2) return "hold";
  return "low_priority";
}

export function projectCandidateForApp(
  candidate: GuideCandidate,
  metadata: Omit<AppGuideOverlay, "id" | "guide">,
): AppGuideOverlay {
  const useCases = Object.fromEntries(candidate.useCases.map((item) => [item.mode, {
    rating: item.performanceRating,
    reason: item.analysis.reason,
  }]));
  const movesets = Object.fromEntries(candidate.movesets.map((item) => [item.mode, {
    fastMove: { name: item.fastMove },
    chargedMove: { name: item.chargedMoves[0] },
    ...(item.chargedMoves[1] ? { chargedMove2: { name: item.chargedMoves[1] } } : {}),
  }]));
  const eliteTmDecision = candidate.investment.eliteTm.decision;
  const eliteTm = eliteTmDecision === "high" ? "required"
    : eliteTmDecision === "recommended" ? "recommended"
      : eliteTmDecision === "conditional" ? "conditional" : "not_needed";
  const ivDecision = candidate.decisionQuestions.find((item) => item.id === "fusion_or_base");
  const verdict = verdictValue(candidate.performanceRating);

  return {
    id: candidate.pokemonId,
    ...metadata,
    guide: {
      overallRating: candidate.performanceRating,
      ...(verdict ? { verdict } : {}),
      verdictLabel: candidate.verdict.label,
      reason: candidate.verdict.label,
      summary: candidate.verdict.summary,
      useCases,
      movesets,
      investment: {
        order: candidate.investment.order.map(({ id, label, reason }) => ({ id, label, reason })),
        stardust: decisionValue(candidate.investment.stardust),
        candy: decisionValue(candidate.investment.candy),
        secondMove: decisionValue(candidate.investment.secondMove),
        xlCandy: decisionValue(candidate.investment.xlCandy),
        maxMove: decisionValue(candidate.investment.maxMove),
        eliteTm,
      },
      ...(ivDecision ? { ivAdvice: { general: `${ivDecision.conclusion} ${ivDecision.reason}` } } : {}),
      values: Object.fromEntries(candidate.useCases.map((item) => [item.mode, item.performanceRating])),
      valueReasons: Object.fromEntries(candidate.useCases.map((item) => [item.mode, item.analysis.reason])),
      recommendations: candidate.actions.map((item) => item.label),
    },
  };
}
