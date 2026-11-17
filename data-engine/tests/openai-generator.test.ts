import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { OpenAiGuideGenerator, type OpenAiTransport } from "../generators/openai";
import { buildGenerationPlan, loadGenerationSources, runGeneration } from "../generators/run";
import { getGuideOutputJsonSchema } from "../generators/json-schema";
import type { GuideGenerator } from "../generators/guide-generator";
import { buildGuideModelInput } from "../generators/input";
import type { GuideCandidate, PokemonId } from "../schemas";
import { completeCandidate } from "./fixtures";

const PRICE = {
  inputUsdPerMillion: 2,
  outputUsdPerMillion: 10,
  checkedAt: "2026-11-16T00:00:00.000Z",
  sourceUrl: "https://developers.openai.com/api/docs/pricing",
};

function generationOutput(pokemonId: PokemonId) {
  const candidate = completeCandidate({ pokemonId });
  const {
    schemaVersion: _schemaVersion,
    origin: _origin,
    factsSnapshotHash: _factsSnapshotHash,
    generatedBy: _generatedBy,
    review: _review,
    ...output
  } = candidate;
  return output;
}

function successTransport(pokemonId: PokemonId, calls?: { count: number }): OpenAiTransport {
  return async () => {
    if (calls) calls.count += 1;
    return {
      status: 200,
      body: {
        status: "completed",
        output_text: JSON.stringify(generationOutput(pokemonId)),
        usage: { input_tokens: 1_000, output_tokens: 2_000 },
      },
    };
  };
}

test("model input is compact and preserves evidence review status", async () => {
  const { facts, evidence } = await loadGenerationSources();
  const input = buildGuideModelInput("white-kyurem", facts, evidence);
  assert.equal("raw" in input, false);
  assert.ok(input.evidence.length > 0);
  assert.ok(input.evidence.every((record) => record.reviewStatus === "reviewed" || record.reviewStatus === "needs_review" || record.reviewStatus === "pending" || record.reviewStatus === "rejected"));
  assert.equal(input.fusionRecipes.length, 1);
});

test("strict JSON schema disallows extra fields and removes unsupported string keywords", () => {
  const schema = getGuideOutputJsonSchema();
  assert.equal(schema.additionalProperties, false);
  const serialized = JSON.stringify(schema);
  assert.equal(serialized.includes("minLength"), false);
  assert.equal(serialized.includes("maxLength"), false);
});

test("OpenAI adapter parses structured output and records usage without a real API call", async () => {
  const { facts, evidence } = await loadGenerationSources();
  const generator = new OpenAiGuideGenerator({
    apiKey: "test-key-never-logged",
    model: "test-model",
    price: PRICE,
    maxOutputTokens: 3_500,
    maxRetries: 1,
    timeoutMs: 5_000,
    transport: successTransport("kyurem"),
  });
  const result = await generator.generate({ pokemonId: "kyurem", facts, evidence });
  assert.equal(result.candidate.review.status, "pending");
  assert.equal(result.candidate.origin, "external_ai");
  assert.equal(result.usage.attempts, 1);
  assert.equal(result.usage.estimatedCostUsd, 0.022);
});

test("retryable errors retry only within the configured limit", async () => {
  const { facts, evidence } = await loadGenerationSources();
  let calls = 0;
  const transport: OpenAiTransport = async () => {
    calls += 1;
    if (calls === 1) return { status: 429, body: { error: { message: "rate limited" } } };
    return successTransport("kyurem")({ apiKey: "x", body: {}, timeoutMs: 1_000 });
  };
  const generator = new OpenAiGuideGenerator({
    apiKey: "test-key",
    model: "test-model",
    price: PRICE,
    maxOutputTokens: 3_500,
    maxRetries: 1,
    timeoutMs: 5_000,
    transport,
    sleep: async () => undefined,
  });
  const result = await generator.generate({ pokemonId: "kyurem", facts, evidence });
  assert.equal(calls, 2);
  assert.equal(result.usage.attempts, 2);
});

test("non-retryable API errors are not retried", async () => {
  const { facts, evidence } = await loadGenerationSources();
  let calls = 0;
  const generator = new OpenAiGuideGenerator({
    apiKey: "test-key",
    model: "test-model",
    price: PRICE,
    maxOutputTokens: 3_500,
    maxRetries: 2,
    timeoutMs: 5_000,
    transport: async () => {
      calls += 1;
      return { status: 400, body: { error: { message: "invalid request" } } };
    },
    sleep: async () => undefined,
  });
  await assert.rejects(() => generator.generate({ pokemonId: "kyurem", facts, evidence }), /invalid request/);
  assert.equal(calls, 1);
});

test("cost plan blocks an over-budget run before any API transport", async () => {
  const { facts, evidence } = await loadGenerationSources();
  const plan = buildGenerationPlan(facts, evidence, 3_500, 1, 0.001, PRICE);
  assert.ok(plan.worstCaseCostUsd > plan.maxCostUsd);
});

test("a failed three-target run preserves the previous candidate bundle", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "pokoweek-generator-"));
  const candidateBundle = path.join(temporary, "candidates.json");
  const generationLogs = path.join(temporary, "logs");
  await writeFile(candidateBundle, "previous-approved-candidate", "utf8");
  let call = 0;
  const generator: GuideGenerator = {
    async generate(input) {
      call += 1;
      if (call === 2) throw new Error("mock generation failure");
      return {
        candidate: completeCandidate({ pokemonId: input.pokemonId }) as GuideCandidate,
        usage: { provider: "mock", model: "mock", inputTokens: 10, outputTokens: 20, estimatedCostUsd: 0.001, attempts: 1 },
      };
    },
  };
  await assert.rejects(() => runGeneration({
    generator,
    model: "mock",
    price: PRICE,
    maxOutputTokens: 3_500,
    maxRetries: 0,
    maxCostUsd: 1,
    runId: "mock-failure",
    now: () => new Date("2026-11-16T00:00:00.000Z"),
    output: { candidateBundle, generationLogs },
  }), /mock generation failure/);
  assert.equal(await readFile(candidateBundle, "utf8"), "previous-approved-candidate");
});
