import { z } from "zod";
import { GuideGenerationOutputSchema } from "../schemas";

const UNSUPPORTED_STRICT_KEYWORDS = new Set([
  "$schema",
  "minLength",
  "maxLength",
]);

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !UNSUPPORTED_STRICT_KEYWORDS.has(key))
      .map(([key, item]) => [key, sanitize(item)]),
  );
}

export function getGuideOutputJsonSchema() {
  return sanitize(z.toJSONSchema(GuideGenerationOutputSchema, { target: "draft-7" })) as Record<string, unknown>;
}
