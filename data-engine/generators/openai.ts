import {
  DATA_ENGINE_SCHEMA_VERSION,
  GuideCandidateSchema,
  GuideGenerationOutputSchema,
} from "../schemas";
import { calculateCostUsd, type ModelPrice } from "./cost";
import type { GuideGenerationInput, GuideGenerationResult, GuideGenerator } from "./guide-generator";
import { buildGuideModelInput } from "./input";
import { getGuideOutputJsonSchema } from "./json-schema";
import { GUIDE_PROMPT_VERSION, GUIDE_SYSTEM_PROMPT } from "./prompt";

type OpenAiResponseBody = {
  status?: string;
  error?: { message?: string };
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string; refusal?: string }> }>;
  usage?: { input_tokens?: number; output_tokens?: number };
};

class FatalGenerationError extends Error {}

export type OpenAiTransportRequest = {
  apiKey: string;
  body: Record<string, unknown>;
  timeoutMs: number;
};

export type OpenAiTransportResponse = {
  status: number;
  body: OpenAiResponseBody;
};

export type OpenAiTransport = (request: OpenAiTransportRequest) => Promise<OpenAiTransportResponse>;

export type OpenAiGuideGeneratorConfig = {
  apiKey: string;
  model: string;
  price: ModelPrice;
  maxOutputTokens: number;
  maxRetries: number;
  timeoutMs: number;
  transport?: OpenAiTransport;
  sleep?: (milliseconds: number) => Promise<void>;
};

async function defaultTransport(request: OpenAiTransportRequest): Promise<OpenAiTransportResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), request.timeoutMs);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${request.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request.body),
      signal: controller.signal,
    });
    return { status: response.status, body: await response.json() as OpenAiResponseBody };
  } finally {
    clearTimeout(timeout);
  }
}

function extractOutputText(body: OpenAiResponseBody) {
  if (body.output_text) return body.output_text;
  for (const item of body.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.refusal) throw new FatalGenerationError(`OpenAI refused the generation: ${content.refusal}`);
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  throw new Error("OpenAI response did not contain structured output text.");
}

function isRetryable(status: number) {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

export class OpenAiGuideGenerator implements GuideGenerator {
  readonly config: OpenAiGuideGeneratorConfig;
  readonly transport: OpenAiTransport;
  readonly sleep: (milliseconds: number) => Promise<void>;

  constructor(config: OpenAiGuideGeneratorConfig) {
    if (!config.apiKey) throw new Error("OPENAI_API_KEY is required for an actual generation run.");
    if (!config.model) throw new Error("An explicit OpenAI model is required; there is no stale default model.");
    if (config.maxRetries < 0 || config.maxRetries > 2) throw new Error("maxRetries must be between 0 and 2.");
    this.config = config;
    this.transport = config.transport ?? defaultTransport;
    this.sleep = config.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  }

  async generate(input: GuideGenerationInput): Promise<GuideGenerationResult> {
    const modelInput = buildGuideModelInput(input.pokemonId, input.facts, input.evidence);
    const requestBody = {
      model: this.config.model,
      instructions: GUIDE_SYSTEM_PROMPT,
      input: JSON.stringify(modelInput),
      max_output_tokens: this.config.maxOutputTokens,
      text: {
        format: {
          type: "json_schema",
          name: "pokoweek_guide_candidate",
          description: "Evidence-linked Pokémon GO investment guide candidate",
          strict: true,
          schema: getGuideOutputJsonSchema(),
        },
      },
    } satisfies Record<string, unknown>;

    let attempts = 0;
    let lastError: Error | undefined;
    while (attempts <= this.config.maxRetries) {
      attempts += 1;
      try {
        const response = await this.transport({
          apiKey: this.config.apiKey,
          body: requestBody,
          timeoutMs: this.config.timeoutMs,
        });
        if (response.status < 200 || response.status >= 300) {
          const message = response.body.error?.message ?? `OpenAI request failed with HTTP ${response.status}`;
          const error = isRetryable(response.status) ? new Error(message) : new FatalGenerationError(message);
          if (error instanceof FatalGenerationError || attempts > this.config.maxRetries) throw error;
          lastError = error;
          await this.sleep(250 * 2 ** (attempts - 1));
          continue;
        }
        if (response.body.status === "incomplete") throw new Error("OpenAI response was incomplete; candidate was not saved.");

        const output = GuideGenerationOutputSchema.parse(JSON.parse(extractOutputText(response.body)));
        if (output.pokemonId !== input.pokemonId) throw new FatalGenerationError(`Output Pokemon mismatch: expected ${input.pokemonId}, received ${output.pokemonId}`);
        const inputTokens = response.body.usage?.input_tokens ?? 0;
        const outputTokens = response.body.usage?.output_tokens ?? 0;
        const candidate = GuideCandidateSchema.parse({
          ...output,
          schemaVersion: DATA_ENGINE_SCHEMA_VERSION,
          origin: "external_ai",
          generationMethod: "openai_api",
          factsSnapshotHash: input.facts.sourceSnapshotHash,
          generatedBy: {
            provider: "openai",
            model: this.config.model,
            promptVersion: GUIDE_PROMPT_VERSION,
            generatedAt: new Date().toISOString(),
            inputTokens,
            outputTokens,
          },
          review: { status: "pending" },
        });
        return {
          candidate,
          usage: {
            provider: "openai",
            model: this.config.model,
            inputTokens,
            outputTokens,
            estimatedCostUsd: calculateCostUsd(inputTokens, outputTokens, this.config.price),
            attempts,
          },
        };
      } catch (error) {
        if (error instanceof FatalGenerationError || attempts > this.config.maxRetries) throw error;
        lastError = error instanceof Error ? error : new Error(String(error));
        await this.sleep(250 * 2 ** (attempts - 1));
      }
    }
    throw lastError ?? new Error("OpenAI generation failed.");
  }
}
