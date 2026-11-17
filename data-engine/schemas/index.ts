import { z } from "zod";

export const DATA_ENGINE_SCHEMA_VERSION = 1 as const;

export const PokemonIdSchema = z.enum([
  "kyurem",
  "white-kyurem",
  "black-kyurem",
  "reshiram",
  "zekrom",
]);

export const GuideModeSchema = z.enum(["raid", "mega", "max", "pvp"]);
export const GenerationMethodSchema = z.enum(["openai_api", "manual_ai", "fixture"]);
export const PerformanceRatingSchema = z.number().int().min(1).max(5).nullable();
export const EvidenceConfidenceSchema = z.enum(["low", "medium", "high"]);
export const EditorialStatusSchema = z.enum(["needs_review", "ready", "blocked"]);
export const ReviewStatusSchema = z.enum(["pending", "needs_review", "reviewed", "rejected"]);
export const ValidationStatusSchema = z.enum(["verified", "needs_review", "missing", "incomplete", "invalid"]);
export const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/, "SHA-256 hash expected");
export const DateTimeSchema = z.string().datetime({ offset: true });

export const EvidenceRecordSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  sourceType: z.enum(["api", "manual"]),
  url: z.string().url(),
  publisher: z.string().min(1),
  retrievedAt: DateTimeSchema.optional(),
  reviewedAt: DateTimeSchema.optional(),
  sourceHash: Sha256Schema,
  gameDataVersion: z.string().min(1).optional(),
  reviewStatus: ReviewStatusSchema,
  rawCollected: z.boolean(),
  claim: z.string().min(1),
  paths: z.array(z.string().min(1)).min(1),
}).superRefine((value, context) => {
  if (value.sourceType === "api" && !value.retrievedAt) {
    context.addIssue({ code: "custom", path: ["retrievedAt"], message: "API evidence requires retrievedAt" });
  }
  if (value.sourceType === "manual" && value.rawCollected) {
    context.addIssue({ code: "custom", path: ["rawCollected"], message: "Manual evidence cannot claim a raw collection" });
  }
  if (value.reviewStatus === "reviewed" && !value.reviewedAt) {
    context.addIssue({ code: "custom", path: ["reviewedAt"], message: "Reviewed evidence requires reviewedAt" });
  }
});

export const EvidenceRegistrySchema = z.object({
  schemaVersion: z.literal(DATA_ENGINE_SCHEMA_VERSION),
  generatedAt: DateTimeSchema,
  records: z.array(EvidenceRecordSchema),
});

export const FactReviewCategorySchema = z.enum([
  "base_stats_types",
  "form_move_pools",
  "pve_pvp_move_metrics",
  "acquisition_special_conditions",
  "cp_level_context",
  "power_up_costs",
  "limited_benchmark_comparison",
]);

export const FactReviewManifestSchema = z.object({
  schemaVersion: z.literal(DATA_ENGINE_SCHEMA_VERSION),
  reviewedAt: DateTimeSchema,
  entries: z.array(z.object({
    id: z.string().min(1),
    category: FactReviewCategorySchema,
    requiredForPublish: z.boolean(),
    status: z.enum(["reviewed", "needs_review"]),
    originalValue: z.string().min(1),
    comparisonResult: z.string().min(1),
    sourceEvidenceIds: z.array(z.string().min(1)).min(1),
    sources: z.array(z.object({
      url: z.string().url(),
      publisher: z.string().min(1),
      retrievedAt: DateTimeSchema,
    })).min(1),
    notes: z.array(z.string().min(1)),
  })).min(1),
  cpReferences: z.array(z.object({
    pokemonId: z.enum(["kyurem", "white-kyurem", "black-kyurem"]),
    ivs: z.object({ attack: z.literal(15), defense: z.literal(15), stamina: z.literal(15) }),
    level50: z.object({ level: z.literal(50), bestBuddyBoost: z.literal(false), cp: z.number().int().positive() }),
    level51: z.object({ level: z.literal(51), bestBuddyBoost: z.literal(true), cp: z.number().int().positive() }),
    apiReportedMaxCp: z.number().int().positive(),
    evidenceIds: z.array(z.string().min(1)).min(1),
  })).length(3),
});

export const MoveEffectSchema = z.object({
  activationChance: z.number().min(0).max(1),
  target: z.enum(["attacker", "opponent"]),
  stat: z.enum(["attack", "defense"]),
  stages: z.number().int(),
});

export const MoveMetricsSchema = z.object({
  type: z.string().min(1),
  power: z.number(),
  energyDelta: z.number(),
  durationMs: z.number().nonnegative().optional(),
  turns: z.number().nonnegative().optional(),
  effects: z.array(MoveEffectSchema).optional(),
});

export const NormalizedMoveSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["fast", "charged"]),
  acquisition: z.enum(["current", "elite", "special"]),
  pve: MoveMetricsSchema.optional(),
  pvp: MoveMetricsSchema.optional(),
  evidenceIds: z.array(z.string().min(1)).min(1),
});

export const NormalizedPokemonSchema = z.object({
  id: PokemonIdSchema,
  dexNumber: z.number().int().positive(),
  gameName: z.string().min(1),
  form: z.string().min(1),
  types: z.object({
    values: z.array(z.string().min(1)).min(1).max(2),
    evidenceIds: z.array(z.string().min(1)).min(1),
  }),
  baseStats: z.object({
    attack: z.number().int().positive(),
    defense: z.number().int().positive(),
    stamina: z.number().int().positive(),
    evidenceIds: z.array(z.string().min(1)).min(1),
  }),
  moves: z.object({
    fast: z.array(NormalizedMoveSchema),
    charged: z.array(NormalizedMoveSchema),
    evidenceIds: z.array(z.string().min(1)).min(1),
  }),
});

export const DecisionBenchmarkSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["ice", "dragon"]),
  dexNumber: z.number().int().positive(),
  gameName: z.string().min(1),
  form: z.string().min(1),
  types: z.array(z.string().min(1)).min(1).max(2),
  baseAttack: z.number().int().positive(),
  fastMove: NormalizedMoveSchema,
  chargedMove: NormalizedMoveSchema,
  evidenceIds: z.array(z.string().min(1)).min(1),
});

export const FusionMaterialSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("pokemon"), pokemonId: PokemonIdSchema, amount: z.number().int().positive() }),
  z.object({ type: z.literal("candy"), pokemonId: PokemonIdSchema, amount: z.number().int().positive() }),
  z.object({ type: z.literal("energy"), energyId: z.string().min(1), label: z.string().min(1), amount: z.number().int().positive() }),
]);

export const FusionRecipeSchema = z.object({
  id: z.enum(["white-kyurem", "black-kyurem"]),
  resultPokemonId: z.enum(["white-kyurem", "black-kyurem"]),
  basePokemonId: z.literal("kyurem"),
  partnerPokemonId: z.enum(["reshiram", "zekrom"]),
  partnerState: z.literal("bound_while_fused"),
  materials: z.array(FusionMaterialSchema).min(5),
  preFusionChecks: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    requiredForFusion: z.boolean(),
    reason: z.string().min(1),
    evidenceIds: z.array(z.string().min(1)).min(1),
  })),
  moveTransformation: z.object({
    sourceMove: z.string().min(1),
    targetMove: z.string().min(1),
    sourceMoveRequiredForFusion: z.literal(false),
    learnableByChargedTm: z.boolean(),
    learnableByEliteChargedTm: z.boolean(),
    revertsOnSeparation: z.boolean(),
    evidenceIds: z.array(z.string().min(1)).min(1),
  }),
  fieldEffect: z.object({
    move: z.string().min(1),
    stardust: z.number().int().nonnegative(),
    kyuremCandy: z.number().int().nonnegative(),
    durationMinutes: z.number().int().positive(),
    incompatibleWithOtherFieldEffects: z.boolean(),
    evidenceIds: z.array(z.string().min(1)).min(1),
  }),
  storageRestrictions: z.object({
    tradeBlocked: z.boolean(),
    professorTransferBlocked: z.boolean(),
    pokemonHomeTransferBlocked: z.boolean(),
    evidenceIds: z.array(z.string().min(1)).min(1),
  }),
  separation: z.object({
    energyCost: z.number().int().nonnegative(),
    candyCost: z.number().int().nonnegative(),
    releasesPartner: z.boolean(),
    evidenceIds: z.array(z.string().min(1)).min(1),
  }),
  postFusionGuidePokemonId: z.enum(["white-kyurem", "black-kyurem"]),
  evidenceIds: z.array(z.string().min(1)).min(1),
});

export const NormalizedDatasetSchema = z.object({
  schemaVersion: z.literal(DATA_ENGINE_SCHEMA_VERSION),
  generatedAt: DateTimeSchema,
  sourceSnapshotHash: Sha256Schema,
  pokemon: z.array(NormalizedPokemonSchema).length(5),
  fusionRecipes: z.array(FusionRecipeSchema).length(2),
  decisionBenchmarks: z.array(DecisionBenchmarkSchema).min(1),
  typeEffectiveness: z.object({
    values: z.record(z.string(), z.record(z.string(), z.number().positive())),
    evidenceIds: z.array(z.string().min(1)).min(1),
  }),
  progression: z.object({
    cpMultipliers: z.array(z.object({
      level: z.number().positive(),
      multiplier: z.number().positive(),
      evidenceIds: z.array(z.string().min(1)).min(1),
    })),
    powerUpRequirements: z.array(z.object({
      currentLevel: z.number().positive(),
      nextLevel: z.number().positive(),
      stardust: z.number().int().nonnegative(),
      candy: z.number().int().nonnegative(),
      xlCandy: z.number().int().nonnegative(),
      evidenceIds: z.array(z.string().min(1)).min(1),
    })),
    cpReferences: z.array(z.object({
      pokemonId: z.enum(["kyurem", "white-kyurem", "black-kyurem"]),
      ivs: z.object({ attack: z.literal(15), defense: z.literal(15), stamina: z.literal(15) }),
      level50: z.object({ level: z.literal(50), bestBuddyBoost: z.literal(false), cp: z.number().int().positive() }),
      level51: z.object({ level: z.literal(51), bestBuddyBoost: z.literal(true), cp: z.number().int().positive() }),
      apiReportedMaxCp: z.number().int().positive(),
      evidenceIds: z.array(z.string().min(1)).min(1),
    })).length(3),
  }),
});

export const AnalysisClaimSchema = z.object({
  reason: z.string().min(1),
  evidenceIds: z.array(z.string().min(1)).min(1),
  modes: z.array(GuideModeSchema).min(1),
});

export const MoveRecommendationSchema = z.object({
  mode: GuideModeSchema,
  fastMove: z.string().min(1),
  chargedMoves: z.array(z.string().min(1)).min(1).max(2),
  acquisitionConditions: z.array(z.string().min(1)),
  analysis: AnalysisClaimSchema,
});

export const InvestmentDecisionSchema = z.object({
  decision: z.enum(["high", "recommended", "conditional", "hold", "low", "not_applicable"]),
  analysis: AnalysisClaimSchema,
});

export const RaidPerformanceAnalysisSchema = z.object({
  method: z.literal("relative_cycle_index_v1"),
  profiles: z.array(z.object({
    subjectId: z.string().min(1),
    label: z.string().min(1),
    fastMove: z.string().min(1),
    chargedMove: z.string().min(1),
    targetProfile: z.string().min(1),
    defenderTypes: z.array(z.string().min(1)).max(2),
    fastEffectiveness: z.number().positive(),
    chargedEffectiveness: z.number().positive(),
    fastUsesPerCharged: z.number().int().positive(),
    cycleSeconds: z.number().positive(),
    relativeCycleIndex: z.number().positive(),
  })).min(1),
  assumptions: z.array(z.string().min(1)).min(1),
  limitations: z.array(z.string().min(1)).min(1),
  evidenceIds: z.array(z.string().min(1)).min(1),
});

export const PvpEvidenceAnalysisSchema = z.object({
  simulationPerformed: z.literal(false),
  observations: z.array(z.string().min(1)).min(1),
  limitations: z.array(z.string().min(1)).min(1),
  evidenceIds: z.array(z.string().min(1)).min(1),
});

export const GuideContentSchema = z.object({
  performanceRating: PerformanceRatingSchema,
  evidenceConfidence: EvidenceConfidenceSchema,
  editorialStatus: EditorialStatusSchema,
  editorialLimitations: z.array(z.string().min(1)),
  decisionQuestions: z.array(z.object({
    id: z.enum(["fusion_or_base", "white_or_black_priority", "required_moves", "missing_special_move", "post_fusion_first_step", "power_up_target", "second_move", "xl_and_stardust"]),
    conclusion: z.string().min(1),
    reason: z.string().min(1),
    conditions: z.array(z.string().min(1)),
    evidenceIds: z.array(z.string().min(1)).min(1),
  })).length(8),
  applicability: z.object({
    modes: z.array(GuideModeSchema).min(1),
    secondMove: z.boolean(),
    xlCandy: z.boolean(),
    maxMove: z.boolean(),
    specialActionGuide: z.boolean(),
  }),
  verdict: z.object({
    label: z.string().min(1),
    summary: z.string().min(1),
    analysis: AnalysisClaimSchema,
  }),
  useCases: z.array(z.object({ mode: GuideModeSchema, performanceRating: PerformanceRatingSchema, analysis: AnalysisClaimSchema })),
  movesets: z.array(MoveRecommendationSchema),
  raidAnalysis: RaidPerformanceAnalysisSchema.nullable(),
  pvpAnalysis: PvpEvidenceAnalysisSchema.nullable(),
  investment: z.object({
    order: z.array(z.object({ id: z.string().min(1), label: z.string().min(1), reason: z.string().min(1), evidenceIds: z.array(z.string().min(1)).min(1) })).min(1),
    stardust: InvestmentDecisionSchema,
    candy: InvestmentDecisionSchema,
    secondMove: InvestmentDecisionSchema.nullable(),
    xlCandy: InvestmentDecisionSchema.nullable(),
    eliteTm: InvestmentDecisionSchema,
    maxMove: InvestmentDecisionSchema.nullable(),
    powerUpStages: z.array(z.object({
      level: z.enum(["30", "35", "40", "50"]),
      decision: z.enum(["recommended", "conditional", "hold", "not_evaluated"]),
      reason: z.string().min(1),
      evidenceIds: z.array(z.string().min(1)).min(1),
    })).length(4),
  }),
  actions: z.array(z.object({ id: z.string().min(1), label: z.string().min(1), reason: z.string().min(1), evidenceIds: z.array(z.string().min(1)).min(1) })).min(1),
  warnings: z.array(z.object({ id: z.string().min(1), label: z.string().min(1), reason: z.string().min(1), evidenceIds: z.array(z.string().min(1)).min(1) })),
  specialActionGuideId: z.string().min(1).nullable(),
});

export const GuideGenerationOutputSchema = GuideContentSchema.extend({
  pokemonId: PokemonIdSchema,
});

export const GuideCandidateSchema = GuideContentSchema.extend({
  schemaVersion: z.literal(DATA_ENGINE_SCHEMA_VERSION),
  pokemonId: PokemonIdSchema,
  origin: z.enum(["external_ai", "manual_ai", "fixture"]),
  generationMethod: GenerationMethodSchema,
  factsSnapshotHash: Sha256Schema,
  generatedBy: z.object({
    provider: z.string().min(1),
    model: z.string().min(1),
    promptVersion: z.string().min(1),
    generatedAt: DateTimeSchema,
    sourcePackageHash: Sha256Schema.optional(),
    inputTokens: z.number().int().nonnegative().optional(),
    outputTokens: z.number().int().nonnegative().optional(),
  }),
  review: z.object({
    status: z.enum(["pending", "approved", "rejected"]),
    reviewedAt: DateTimeSchema.optional(),
    reviewer: z.string().min(1).optional(),
  }),
}).superRefine((value, context) => {
  if (value.review.status === "approved" && (!value.review.reviewedAt || !value.review.reviewer)) {
    context.addIssue({ code: "custom", path: ["review"], message: "Approved analysis requires reviewer and reviewedAt" });
  }
  if (value.origin === "fixture" && value.review.status === "approved") {
    context.addIssue({ code: "custom", path: ["review", "status"], message: "Fixture data can never be approved" });
  }
  if (value.origin === "manual_ai" && (value.generationMethod !== "manual_ai" || !value.generatedBy.sourcePackageHash)) {
    context.addIssue({ code: "custom", path: ["generatedBy", "sourcePackageHash"], message: "Manual AI candidates require generationMethod=manual_ai and a source package hash" });
  }
  if (value.origin === "external_ai" && value.generationMethod !== "openai_api") {
    context.addIssue({ code: "custom", path: ["generationMethod"], message: "External API candidates require generationMethod=openai_api" });
  }
  if (value.origin === "fixture" && value.generationMethod !== "fixture") {
    context.addIssue({ code: "custom", path: ["generationMethod"], message: "Fixture candidates require generationMethod=fixture" });
  }
  if (value.applicability.secondMove !== Boolean(value.investment.secondMove)) {
    context.addIssue({ code: "custom", path: ["investment", "secondMove"], message: "Second-move decision must match applicability" });
  }
  if (value.applicability.xlCandy !== Boolean(value.investment.xlCandy)) {
    context.addIssue({ code: "custom", path: ["investment", "xlCandy"], message: "XL Candy decision must match applicability" });
  }
  if (value.applicability.maxMove !== Boolean(value.investment.maxMove)) {
    context.addIssue({ code: "custom", path: ["investment", "maxMove"], message: "Max-move decision must match applicability" });
  }
  if (value.applicability.specialActionGuide !== Boolean(value.specialActionGuideId)) {
    context.addIssue({ code: "custom", path: ["specialActionGuideId"], message: "Special action guide must match applicability" });
  }
});

export const GuideCandidateBundleSchema = z.object({
  schemaVersion: z.literal(DATA_ENGINE_SCHEMA_VERSION),
  runId: z.string().min(1),
  generatedAt: DateTimeSchema,
  sourceSnapshotHash: Sha256Schema,
  promptVersion: z.string().min(1),
  candidates: z.array(GuideCandidateSchema).length(3),
  usage: z.object({
    calls: z.number().int().nonnegative(),
    attempts: z.number().int().nonnegative(),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    estimatedCostUsd: z.number().nonnegative(),
    priceSourceUrl: z.string().url(),
    priceCheckedAt: DateTimeSchema,
  }).nullable(),
});

export const ValidationIssueSchema = z.object({
  code: z.string().min(1),
  path: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(["error", "review", "info"]),
  evidenceIds: z.array(z.string().min(1)).optional(),
});

export const CompletenessReportSchema = z.object({
  pokemonId: PokemonIdSchema,
  status: z.enum(["complete", "incomplete", "missing"]),
  missing: z.array(z.string()),
});

export const EditorialReadinessReportSchema = z.object({
  pokemonId: PokemonIdSchema,
  status: EditorialStatusSchema,
  ready: z.boolean(),
  blockers: z.array(z.string()),
});

export const ValidationReportSchema = z.object({
  schemaVersion: z.literal(DATA_ENGINE_SCHEMA_VERSION),
  generatedAt: DateTimeSchema,
  datasetHash: Sha256Schema,
  schemaValid: z.boolean(),
  factsStatus: ValidationStatusSchema,
  fusionStatus: ValidationStatusSchema,
  factReviews: z.array(z.object({
    id: z.string().min(1),
    category: FactReviewCategorySchema,
    requiredForPublish: z.boolean(),
    status: z.enum(["reviewed", "needs_review"]),
  })),
  issues: z.array(ValidationIssueSchema),
  structuralCompleteness: z.array(CompletenessReportSchema),
  editorialReadiness: z.array(EditorialReadinessReportSchema),
});

export const ApprovalManifestSchema = z.object({
  schemaVersion: z.literal(DATA_ENGINE_SCHEMA_VERSION),
  guides: z.array(z.object({
    pokemonId: PokemonIdSchema,
    sourceSnapshotHash: Sha256Schema,
    validationHash: Sha256Schema,
    approvedAt: DateTimeSchema,
    approvedBy: z.string().min(1),
  })),
});

export type PokemonId = z.infer<typeof PokemonIdSchema>;
export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>;
export type EvidenceRegistry = z.infer<typeof EvidenceRegistrySchema>;
export type FactReviewManifest = z.infer<typeof FactReviewManifestSchema>;
export type NormalizedMove = z.infer<typeof NormalizedMoveSchema>;
export type NormalizedPokemon = z.infer<typeof NormalizedPokemonSchema>;
export type FusionRecipe = z.infer<typeof FusionRecipeSchema>;
export type NormalizedDataset = z.infer<typeof NormalizedDatasetSchema>;
export type GuideCandidate = z.infer<typeof GuideCandidateSchema>;
export type GuideGenerationOutput = z.infer<typeof GuideGenerationOutputSchema>;
export type GuideCandidateBundle = z.infer<typeof GuideCandidateBundleSchema>;
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;
export type CompletenessReport = z.infer<typeof CompletenessReportSchema>;
export type EditorialReadinessReport = z.infer<typeof EditorialReadinessReportSchema>;
export type ValidationReport = z.infer<typeof ValidationReportSchema>;
export type ApprovalManifest = z.infer<typeof ApprovalManifestSchema>;
