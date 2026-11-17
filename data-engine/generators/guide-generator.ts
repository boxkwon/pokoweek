import type { EvidenceRegistry, GuideCandidate, NormalizedDataset, PokemonId } from "../schemas";

export type GuideGenerationInput = {
  pokemonId: PokemonId;
  facts: NormalizedDataset;
  evidence: EvidenceRegistry;
};

export type GuideGenerationUsage = {
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
  attempts: number;
};

export type GuideGenerationResult = {
  candidate: GuideCandidate;
  usage: GuideGenerationUsage;
};

/** Provider-neutral boundary. External adapters are added in Phase B-2. */
export interface GuideGenerator {
  generate(input: GuideGenerationInput): Promise<GuideGenerationResult>;
}
