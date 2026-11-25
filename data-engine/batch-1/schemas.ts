import { z } from "zod";
import { DateTimeSchema, EditorialStatusSchema, EvidenceConfidenceSchema, EvidenceRecordSchema, Sha256Schema } from "../schemas";
import { StandardAppGuideProjectionSchema } from "../standardization/schemas";

export const BatchOnePokemonIdSchema = z.enum([
  "super-mega-clefable",
  "mega-metagross",
  "shadow-cranidos",
  "shadow-tornadus-incarnate",
  "deoxys-defense",
]);

const ResourceCostSchema = z.object({
  stardust: z.number().int().nonnegative(),
  candy: z.number().int().nonnegative(),
  xlCandy: z.number().int().nonnegative(),
});

export const BatchOneNormalizedDatasetSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: DateTimeSchema,
  sourceSnapshot: z.string().min(1),
  sourceSnapshotHash: Sha256Schema,
  pokemon: z.array(z.object({
    id: BatchOnePokemonIdSchema,
    dexNumber: z.number().int().positive(),
    displayName: z.string().min(1),
    form: z.string().min(1),
    sourceForm: z.string().min(1),
    types: z.array(z.string().min(1)).min(1).max(2),
    baseStats: z.object({ attack: z.number().int().positive(), defense: z.number().int().positive(), stamina: z.number().int().positive() }),
    moves: z.object({
      fast: z.array(z.string().min(1)).min(1),
      charged: z.array(z.string().min(1)).min(1),
      eliteFast: z.array(z.string().min(1)),
      eliteCharged: z.array(z.string().min(1)),
      special: z.array(z.string().min(1)),
    }),
    progression: z.array(z.object({
      level: z.union([z.literal(30), z.literal(35), z.literal(40), z.literal(50)]),
      cp: z.number().int().positive(),
      cumulativeCost: ResourceCostSchema.nullable(),
    })).length(4),
    progressionBasis: z.enum(["owned_base_form", "current_form", "shadow_game_check"]),
    evidenceIds: z.array(z.string().min(1)).min(1),
  })).length(5),
});

const AppGuideSchema = StandardAppGuideProjectionSchema.extend({
  name: z.string().min(1),
  image: z.object({
    src: z.string().min(1),
    alt: z.string().min(1),
    scale: z.number().positive().optional(),
    objectPosition: z.string().min(1).optional(),
    placeholder: z.boolean().optional(),
  }),
  battleTypes: z.array(z.enum(["raid", "mega", "max", "gigantamax", "shadow"])),
  types: z.array(z.enum(["강철", "드래곤", "격투", "땅", "불꽃", "물", "얼음", "전기", "악", "페어리", "에스퍼", "비행", "독", "고스트", "벌레", "바위", "풀", "노말"])).min(1).max(2),
  category: z.enum(["raid", "mega", "max", "shadow"]),
  categoryLabel: z.string().min(1),
  rating: z.number().int().min(1).max(5).nullable(),
});

export const BatchOneCandidateSchema = z.object({
  pokemonId: BatchOnePokemonIdSchema,
  generationMethod: z.literal("manual_ai"),
  generatedBy: z.object({
    provider: z.literal("codex"),
    model: z.string().min(1),
    promptVersion: z.literal("pokemon-guide-coverage-batch-1-v1"),
    generatedAt: DateTimeSchema,
    sourcePackageHash: Sha256Schema,
  }),
  review: z.object({ status: z.literal("pending") }),
  evidenceConfidence: EvidenceConfidenceSchema,
  editorialStatus: EditorialStatusSchema,
  editorialLimitations: z.array(z.string().min(1)),
  evidenceIds: z.array(z.string().min(1)).min(1),
  guide: AppGuideSchema,
});

export const BatchOneCandidateBundleSchema = z.object({
  schemaVersion: z.literal(1),
  runId: z.string().min(1),
  generatedAt: DateTimeSchema,
  sourceSnapshotHash: Sha256Schema,
  promptVersion: z.literal("pokemon-guide-coverage-batch-1-v1"),
  usage: z.null(),
  candidates: z.array(BatchOneCandidateSchema).length(5),
});

export const BatchOneEvidenceSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: DateTimeSchema,
  records: z.array(EvidenceRecordSchema).min(1),
});

export type BatchOnePokemonId = z.infer<typeof BatchOnePokemonIdSchema>;
export type BatchOneCandidate = z.infer<typeof BatchOneCandidateSchema>;
