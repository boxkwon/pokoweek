import { hasFlag, readNumberOption, readPokemonArg, readOption, requireOption } from "../lib/args";
import { buildGenerationPlan, loadGenerationSources, runGeneration } from "../generators/run";
import { OpenAiGuideGenerator } from "../generators/openai";
import type { ModelPrice } from "../generators/cost";
import { validateDataEngine } from "../validators/validate";
import { writeReviewSummary } from "../review/summary";

function requireIsoDate(value: string, name: string) {
  if (!Number.isFinite(Date.parse(value))) throw new Error(`--${name} must be an ISO date-time.`);
  return new Date(value).toISOString();
}

function requireUrl(value: string, name: string) {
  try {
    return new URL(value).toString();
  } catch {
    throw new Error(`--${name} must be an absolute URL.`);
  }
}

async function main() {
  readPokemonArg();
  const execute = hasFlag("execute");
  const model = requireOption("model");
  const price: ModelPrice = {
    inputUsdPerMillion: readNumberOption("input-price"),
    outputUsdPerMillion: readNumberOption("output-price"),
    checkedAt: requireIsoDate(requireOption("price-checked-at"), "price-checked-at"),
    sourceUrl: requireUrl(requireOption("price-source-url"), "price-source-url"),
  };
  const maxOutputTokens = readNumberOption("max-output-tokens");
  const maxCostUsd = readNumberOption("max-cost-usd");
  const maxRetries = Number(readOption("max-retries") ?? "1");
  const timeoutMs = Number(readOption("timeout-ms") ?? "60000");
  if (!Number.isInteger(maxRetries) || maxRetries < 0 || maxRetries > 2) throw new Error("--max-retries must be 0, 1, or 2.");
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1_000) throw new Error("--timeout-ms must be at least 1000.");

  const { facts, evidence } = await loadGenerationSources();
  const plan = buildGenerationPlan(facts, evidence, maxOutputTokens, maxRetries, maxCostUsd, price);
  if (!execute) {
    console.log(JSON.stringify({
      mode: "dry-run",
      apiCallPerformed: false,
      candidateWritten: false,
      model,
      promptVersion: "pokoweek-guide-v1",
      plan: { ...plan, budgetAllowed: plan.worstCaseCostUsd <= plan.maxCostUsd },
      price,
      next: plan.worstCaseCostUsd <= plan.maxCostUsd
        ? "Review this plan, set OPENAI_API_KEY, then rerun with --execute only after explicit approval."
        : "Increase --max-cost-usd or reduce output/retry limits before an approved --execute run.",
    }, null, 2));
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (process.env.POKOWEEK_ENABLE_PAID_AI !== "true") {
    throw new Error("Paid AI is disabled. Set POKOWEEK_ENABLE_PAID_AI=true only after explicit approval.");
  }
  if (!apiKey) throw new Error("OPENAI_API_KEY is required with --execute. It is never written to logs.");
  const generator = new OpenAiGuideGenerator({
    apiKey,
    model,
    price,
    maxOutputTokens,
    maxRetries,
    timeoutMs,
  });
  const { bundle } = await runGeneration({ generator, model, price, maxOutputTokens, maxRetries, maxCostUsd });
  const validation = await validateDataEngine();
  const review = await writeReviewSummary(bundle, validation);
  console.log(JSON.stringify({
    mode: "executed",
    runId: bundle.runId,
    usage: bundle.usage,
    validationReport: "data/validation/kyurem-family.json",
    reviewSummary: "data/validation/kyurem-family-review.json",
    validationReady: review.guides.every((guide) => guide.validationReady),
    approvalRequired: true,
    publicationPerformed: false,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
