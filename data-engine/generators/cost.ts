export type ModelPrice = {
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  checkedAt: string;
  sourceUrl: string;
};

export function calculateCostUsd(inputTokens: number, outputTokens: number, price: ModelPrice) {
  return (inputTokens * price.inputUsdPerMillion + outputTokens * price.outputUsdPerMillion) / 1_000_000;
}

/** Conservative planning estimate only; actual billing uses API usage tokens. */
export function estimateInputTokens(value: unknown) {
  return Math.ceil(Buffer.byteLength(JSON.stringify(value), "utf8") / 2);
}

export function maximumAttemptCostUsd(
  estimatedInputTokens: number,
  maxOutputTokens: number,
  maxRetries: number,
  price: ModelPrice,
) {
  return calculateCostUsd(estimatedInputTokens, maxOutputTokens, price) * (maxRetries + 1);
}
