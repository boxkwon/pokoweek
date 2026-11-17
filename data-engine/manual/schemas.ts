import { z } from "zod";
import {
  DATA_ENGINE_SCHEMA_VERSION,
  DateTimeSchema,
  GuideGenerationOutputSchema,
  PokemonIdSchema,
  Sha256Schema,
} from "../schemas";

export const MANUAL_PACKAGE_VERSION = "pokoweek-manual-guide-v1" as const;

export const ManualGuidePackageBodySchema = z.object({
  schemaVersion: z.literal(DATA_ENGINE_SCHEMA_VERSION),
  packageVersion: z.literal(MANUAL_PACKAGE_VERSION),
  generatedAt: DateTimeSchema,
  pokemonId: PokemonIdSchema,
  sourceSnapshotHash: Sha256Schema,
  promptVersion: z.string().min(1),
  modelInput: z.record(z.string(), z.unknown()),
  outputJsonSchema: z.record(z.string(), z.unknown()),
});

export const ManualGuidePackageSchema = ManualGuidePackageBodySchema.extend({
  packageHash: Sha256Schema,
});

export const ManualDraftBundleSchema = z.object({
  schemaVersion: z.literal(DATA_ENGINE_SCHEMA_VERSION),
  packageVersion: z.literal(MANUAL_PACKAGE_VERSION),
  candidates: z.array(z.object({
    inputPackageHash: Sha256Schema,
    guide: GuideGenerationOutputSchema,
  })).length(3),
});

export type ManualGuidePackage = z.infer<typeof ManualGuidePackageSchema>;
export type ManualDraftBundle = z.infer<typeof ManualDraftBundleSchema>;
