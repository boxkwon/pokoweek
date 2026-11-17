import { createHash } from "node:crypto";

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)]),
    );
  }
  return value;
}

export function stableJson(value: unknown) {
  return JSON.stringify(stableValue(value));
}

export function sha256(value: string | Buffer | unknown) {
  const input = typeof value === "string" || Buffer.isBuffer(value) ? value : stableJson(value);
  return createHash("sha256").update(input).digest("hex");
}
