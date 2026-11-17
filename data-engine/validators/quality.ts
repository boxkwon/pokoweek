import type { GuideCandidate, PokemonId, ValidationIssue } from "../schemas";

const GENERIC_PHRASES = [
  "더욱 강해집니다",
  "강화하면 좋습니다",
  "상황에 따라 투자",
  "필요에 따라 투자",
];

export function reviewCandidateQuality(candidate: GuideCandidate) {
  const issues: ValidationIssue[] = [];
  const texts = [
    candidate.verdict.label,
    candidate.verdict.analysis.reason,
    ...candidate.actions.flatMap((item) => [item.label, item.reason]),
    ...candidate.investment.order.flatMap((item) => [item.label, item.reason]),
  ];
  for (const phrase of GENERIC_PHRASES) {
    if (texts.some((text) => text.includes(phrase))) {
      issues.push({
        code: "generic_recommendation_language",
        path: `candidates.${candidate.pokemonId}`,
        message: `Generic advice requires human review: ${phrase}`,
        severity: "review",
      });
    }
  }

  const actionLabels = candidate.actions.map((item) => item.label.trim());
  if (new Set(actionLabels).size !== actionLabels.length) {
    issues.push({
      code: "duplicate_action",
      path: `candidates.${candidate.pokemonId}.actions`,
      message: "Duplicate actions do not provide a usable sequence.",
      severity: "review",
    });
  }
  return issues;
}

export function reviewCrossCandidateQuality(candidates: Map<PokemonId, GuideCandidate>) {
  const issues: ValidationIssue[] = [];
  const sequences = new Map<string, PokemonId[]>();
  for (const [pokemonId, candidate] of candidates) {
    const signature = candidate.investment.order.map((item) => item.label.trim()).join(" → ");
    sequences.set(signature, [...(sequences.get(signature) ?? []), pokemonId]);
  }
  for (const [signature, pokemonIds] of sequences) {
    if (pokemonIds.length > 1) {
      issues.push({
        code: "duplicated_investment_sequence",
        path: "candidates",
        message: `${pokemonIds.join(", ")} share an identical investment sequence (${signature}); verify that it is not boilerplate.`,
        severity: "review",
      });
    }
  }
  return issues;
}
