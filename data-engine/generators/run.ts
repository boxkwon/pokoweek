import path from "node:path";
import { readJson, writeJsonAtomic } from "../lib/files";
import { paths } from "../lib/paths";
import {
  DATA_ENGINE_SCHEMA_VERSION,
  EvidenceRegistrySchema,
  GuideCandidateBundleSchema,
  NormalizedDatasetSchema,
  type EvidenceRegistry,
  type NormalizedDataset,
  type PokemonId,
} from "../schemas";
import { estimateInputTokens, maximumAttemptCostUsd, type ModelPrice } from "./cost";
import type { GuideGenerator } from "./guide-generator";
import { buildGuideModelInput } from "./input";
import { GUIDE_PROMPT_VERSION } from "./prompt";

export const GUIDE_TARGETS = ["kyurem", "white-kyurem", "black-kyurem"] as const satisfies readonly PokemonId[];

export type GenerationPlan = {
  targetCount: number;
  calls: number;
  maximumAttempts: number;
  estimatedInputTokens: number;
  maximumOutputTokens: number;
  worstCaseCostUsd: number;
  maxCostUsd: number;
};

export type GenerationRunConfig = {
  generator: GuideGenerator;
  model: string;
  price: ModelPrice;
  maxOutputTokens: number;
  maxRetries: number;
  maxCostUsd: number;
  now?: () => Date;
  runId?: string;
  output?: {
    candidateBundle: string;
    generationLogs: string;
  };
};

export async function loadGenerationSources() {
  const facts = NormalizedDatasetSchema.parse(await readJson(paths.normalizedDataset));
  const evidence = EvidenceRegistrySchema.parse(await readJson(paths.evidenceRegistry));
  return { facts, evidence };
}

export function buildGenerationPlan(
  facts: NormalizedDataset,
  evidence: EvidenceRegistry,
  maxOutputTokens: number,
  maxRetries: number,
  maxCostUsd: number,
  price: ModelPrice,
): GenerationPlan {
  const estimatedInputTokens = GUIDE_TARGETS.reduce(
    (sum, pokemonId) => sum + estimateInputTokens(buildGuideModelInput(pokemonId, facts, evidence)),
    0,
  );
  const worstCaseCostUsd = GUIDE_TARGETS.reduce((sum, pokemonId) => {
    const tokens = estimateInputTokens(buildGuideModelInput(pokemonId, facts, evidence));
    return sum + maximumAttemptCostUsd(tokens, maxOutputTokens, maxRetries, price);
  }, 0);
  return {
    targetCount: GUIDE_TARGETS.length,
    calls: GUIDE_TARGETS.length,
    maximumAttempts: GUIDE_TARGETS.length * (maxRetries + 1),
    estimatedInputTokens,
    maximumOutputTokens: GUIDE_TARGETS.length * maxOutputTokens,
    worstCaseCostUsd,
    maxCostUsd,
  };
}

function assertBudget(plan: GenerationPlan) {
  if (plan.worstCaseCostUsd > plan.maxCostUsd) {
    throw new Error(
      `Worst-case generation cost $${plan.worstCaseCostUsd.toFixed(4)} exceeds --max-cost-usd $${plan.maxCostUsd.toFixed(4)}. No API call was made.`,
    );
  }
}

export async function runGeneration(config: GenerationRunConfig) {
  const { facts, evidence } = await loadGenerationSources();
  const plan = buildGenerationPlan(
    facts,
    evidence,
    config.maxOutputTokens,
    config.maxRetries,
    config.maxCostUsd,
    config.price,
  );
  assertBudget(plan);

  const now = config.now ?? (() => new Date());
  const runId = config.runId ?? now().toISOString().replaceAll(/[:.]/g, "-");
  const output = config.output ?? {
    candidateBundle: paths.candidateBundle,
    generationLogs: paths.generationLogs,
  };
  const candidates = [];
  let attempts = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let estimatedCostUsd = 0;

  try {
    for (const pokemonId of GUIDE_TARGETS) {
      const result = await config.generator.generate({ pokemonId, facts, evidence });
      candidates.push(result.candidate);
      attempts += result.usage.attempts;
      inputTokens += result.usage.inputTokens ?? 0;
      outputTokens += result.usage.outputTokens ?? 0;
      estimatedCostUsd += result.usage.estimatedCostUsd ?? 0;
      if (estimatedCostUsd > config.maxCostUsd) {
        throw new Error(`Accumulated estimated cost exceeded the run limit after ${pokemonId}; no candidate bundle was saved.`);
      }
    }

    const generatedAt = now().toISOString();
    const bundle = GuideCandidateBundleSchema.parse({
      schemaVersion: DATA_ENGINE_SCHEMA_VERSION,
      runId,
      generatedAt,
      sourceSnapshotHash: facts.sourceSnapshotHash,
      promptVersion: GUIDE_PROMPT_VERSION,
      candidates,
      usage: {
        calls: GUIDE_TARGETS.length,
        attempts,
        inputTokens,
        outputTokens,
        estimatedCostUsd,
        priceSourceUrl: config.price.sourceUrl,
        priceCheckedAt: config.price.checkedAt,
      },
    });

    await writeJsonAtomic(output.candidateBundle, bundle);
    await writeJsonAtomic(path.join(output.generationLogs, `${runId}.json`), {
      runId,
      status: "candidate_saved",
      generatedAt,
      model: config.model,
      promptVersion: GUIDE_PROMPT_VERSION,
      targets: [...GUIDE_TARGETS],
      usage: bundle.usage,
      note: "Prompts, responses, and API credentials are intentionally excluded.",
    });
    return { bundle, plan };
  } catch (error) {
    await writeJsonAtomic(path.join(output.generationLogs, `${runId}.failed.json`), {
      runId,
      status: "failed",
      failedAt: now().toISOString(),
      model: config.model,
      promptVersion: GUIDE_PROMPT_VERSION,
      attempts,
      inputTokens,
      outputTokens,
      estimatedCostUsd,
      error: error instanceof Error ? error.message : String(error),
      note: "No candidate bundle was written by this failed run.",
    });
    throw error;
  }
}
