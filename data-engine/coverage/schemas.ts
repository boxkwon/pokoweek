import { z } from "zod";
import { DateTimeSchema, EditorialStatusSchema, EvidenceConfidenceSchema, Sha256Schema } from "../schemas";
import { StandardAppGuideProjectionSchema } from "../standardization/schemas";

export const CoveragePokemonIdSchema = z.enum([
  "zamazenta-crowned",
  "druddigon",
  "orthworm",
  "zekrom",
  "reshiram",
]);

const CostSchema = z.object({
  stardust: z.number().int().nonnegative(),
  candy: z.number().int().nonnegative(),
  xlCandy: z.number().int().nonnegative(),
});

export const CoverageNormalizedDatasetSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: DateTimeSchema,
  sourceSnapshotHash: Sha256Schema,
  sourceSnapshot: z.string().min(1),
  pokemon: z.array(z.object({
    id: CoveragePokemonIdSchema,
    dexNumber: z.number().int().positive(),
    displayName: z.string().min(1),
    form: z.string().min(1),
    types: z.array(z.string().min(1)).min(1).max(2),
    baseStats: z.object({ attack: z.number().int().positive(), defense: z.number().int().positive(), stamina: z.number().int().positive() }),
    moves: z.object({
      fast: z.array(z.string().min(1)).min(1),
      charged: z.array(z.string().min(1)).min(1),
      special: z.array(z.string().min(1)),
    }),
    progression: z.array(z.object({
      level: z.union([z.literal(30), z.literal(35), z.literal(40), z.literal(50)]),
      cp: z.number().int().positive(),
      cumulativeCost: CostSchema,
    })).length(4),
    evidenceIds: z.array(z.string().min(1)).min(1),
  })).length(5),
  progressionEvidenceIds: z.array(z.string().min(1)).min(1),
});

const CoverageGuideProjectionSchema = StandardAppGuideProjectionSchema.extend({
  actionGuide: z.unknown().nullable().optional(),
  progressionContext: z.object({
    mode: z.enum(["default", "reference"]),
    title: z.string().min(1).optional(),
    notice: z.string().min(1).optional(),
  }).optional(),
});

export const CoverageGuideCandidateSchema = z.object({
  pokemonId: CoveragePokemonIdSchema,
  generationMethod: z.literal("manual_ai"),
  generatedBy: z.object({
    provider: z.literal("codex"),
    model: z.string().min(1),
    promptVersion: z.literal("pokemon-guide-coverage-v1"),
    generatedAt: DateTimeSchema,
    sourcePackageHash: Sha256Schema,
  }),
  review: z.object({ status: z.literal("pending") }),
  evidenceConfidence: EvidenceConfidenceSchema,
  editorialStatus: EditorialStatusSchema,
  editorialLimitations: z.array(z.string().min(1)),
  evidenceIds: z.array(z.string().min(1)).min(1),
  guide: CoverageGuideProjectionSchema,
});

export const CoverageGuideCandidateBundleSchema = z.object({
  schemaVersion: z.literal(1),
  runId: z.string().min(1),
  generatedAt: DateTimeSchema,
  sourceSnapshotHash: Sha256Schema,
  promptVersion: z.literal("pokemon-guide-coverage-v1"),
  usage: z.null(),
  candidates: z.array(CoverageGuideCandidateSchema).length(5),
});

export const CoverageGuideApprovalManifestSchema = z.object({
  schemaVersion: z.literal(1),
  dataset: z.literal("pokemon-guide-coverage-v1"),
  targets: z.array(CoveragePokemonIdSchema).length(5),
  candidateHash: Sha256Schema,
  sourceSnapshotHash: Sha256Schema,
  validationHash: Sha256Schema,
  approvedAt: DateTimeSchema,
  approvedBy: z.string().min(1),
  qaCommitSha: z.string().regex(/^[0-9a-f]{40}$/),
  guides: z.array(z.object({
    pokemonId: CoveragePokemonIdSchema,
    candidateGuideHash: Sha256Schema,
    publicationGuideHash: Sha256Schema,
  })).length(5),
});

export type CoveragePokemonId = z.infer<typeof CoveragePokemonIdSchema>;
export type CoverageGuideCandidate = z.infer<typeof CoverageGuideCandidateSchema>;
export type CoverageGuideApprovalManifest = z.infer<typeof CoverageGuideApprovalManifestSchema>;
