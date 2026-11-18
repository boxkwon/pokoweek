import { z } from "zod";
import { DateTimeSchema, EvidenceConfidenceSchema, EditorialStatusSchema, Sha256Schema } from "../schemas";

export const StandardGuidePokemonIdSchema = z.enum(["cresselia", "mega-banette", "eternamax-eternatus"]);
export const StandardGuideModeSchema = z.enum(["raid", "mega", "max", "pvp", "special"]);

const EvidenceIdsSchema = z.array(z.string().min(1)).min(1);
const MoveMetricsSchema = z.object({
  type: z.string().min(1),
  power: z.number(),
  energyDelta: z.number(),
  durationMs: z.number().nonnegative().optional(),
  turns: z.number().nonnegative().optional(),
  effects: z.array(z.object({
    activationChance: z.number().min(0).max(1),
    target: z.enum(["attacker", "opponent"]),
    stat: z.enum(["attack", "defense"]),
    stages: z.number().int(),
  })).optional(),
});

export const StandardMoveSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["fast", "charged"]),
  acquisition: z.enum(["current", "elite", "special"]),
  pve: MoveMetricsSchema.optional(),
  pvp: MoveMetricsSchema.optional(),
  evidenceIds: EvidenceIdsSchema,
});

const ResourceCostSchema = z.object({
  stardust: z.number().int().nonnegative(),
  candy: z.number().int().nonnegative(),
  xlCandy: z.number().int().nonnegative(),
});

export const StandardPokemonFactSchema = z.object({
  id: StandardGuidePokemonIdSchema,
  dexNumber: z.number().int().positive(),
  displayName: z.string().min(1),
  ownedFormName: z.string().min(1),
  encounterFormName: z.string().min(1).optional(),
  types: z.array(z.string().min(1)).min(1).max(2),
  baseStats: z.object({ attack: z.number().int().positive(), defense: z.number().int().positive(), stamina: z.number().int().positive() }),
  combatFormStats: z.object({ attack: z.number().int().positive(), defense: z.number().int().positive(), stamina: z.number().int().positive() }).optional(),
  moves: z.object({ fast: z.array(StandardMoveSchema), charged: z.array(StandardMoveSchema) }),
  progression: z.object({
    ivLabel: z.string().min(1),
    costBaselineLabel: z.string().min(1),
    costStatus: z.enum(["verified", "check_in_game"]),
    costNote: z.string().min(1),
    stages: z.array(z.object({
      level: z.union([z.literal(30), z.literal(35), z.literal(40), z.literal(50)]),
      cp: z.number().int().positive(),
      cumulativeCost: ResourceCostSchema.nullable(),
      incrementalCost: ResourceCostSchema.nullable(),
    })).min(1),
  }).optional(),
  notes: z.array(z.string().min(1)),
  evidenceIds: EvidenceIdsSchema,
});

export const StandardizedGuideDatasetSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: DateTimeSchema,
  sourceSnapshotHash: Sha256Schema,
  pokemon: z.array(StandardPokemonFactSchema).length(3),
  mechanics: z.object({
    mega: z.object({
      firstEvolutionEnergy: z.number().int().positive(),
      repeatEnergy: z.number().int().nonnegative(),
      durationHours: z.number().positive(),
      generalAttackBoost: z.number().positive(),
      sameTypeAttackBoost: z.number().positive(),
      freeAfterRest: z.boolean(),
      restPolicy: z.object({
        decreasesWithMegaLevel: z.literal(true),
        earlyReactivationUsesEnergy: z.literal(true),
        statusCheckedOnPokemonDetail: z.literal(true),
        superMaxRestHours: z.literal(24),
        superMaxEligibilitySpeciesSpecific: z.literal(true),
      }),
      evidenceIds: EvidenceIdsSchema,
    }),
    eternatus: z.object({
      obtainableForm: z.string().min(1),
      eternamaxCatchable: z.literal(false),
      eternamaxOwnable: z.literal(false),
      formChangeSupported: z.literal(false),
      oneCatchDuringEvent: z.literal(true),
      event: z.object({
        id: z.string().min(1),
        startAt: DateTimeSchema,
        endAt: DateTimeSchema,
        claimEndAt: DateTimeSchema,
        neverCaughtReward: z.literal("encounter"),
        alreadyCaughtCandy: z.literal(100),
        rank35AdventureEffectDiscount: z.object({
          factor: z.literal(0.5),
          stardust: z.literal(2500),
          candy: z.literal(15),
        }),
      }),
      adventureEffect: z.object({
        move: z.literal("Dynamax Cannon"),
        stardust: z.number().int().nonnegative(),
        candy: z.number().int().nonnegative(),
        durationMinutes: z.number().int().positive(),
        maxMinutesPerUse: z.number().int().positive(),
        maxTotalMinutes: z.number().int().positive(),
      }),
      evidenceIds: EvidenceIdsSchema,
    }),
  }),
});

const GuideUseCaseSchema = z.object({ rating: z.number().int().min(1).max(5).nullable(), reason: z.string().min(1) });
const GuideMoveSchema = z.object({ name: z.string().min(1), tags: z.array(z.enum(["fast_tm", "charged_tm", "elite_tm", "event_limited"])).optional() });
const GuideMovesetSchema = z.object({
  fastMove: GuideMoveSchema.optional(),
  chargedMove: GuideMoveSchema.optional(),
  chargedMove2: GuideMoveSchema.optional(),
  conditions: z.array(z.string().min(1)).optional(),
  reason: z.string().min(1).optional(),
});

const InvestmentLevelSchema = z.enum(["high", "recommended", "conditional", "hold", "low"]);
const GuideIvAdviceSchema = z.partialRecord(z.enum(["general", "raid", "mega", "max", "pvp"]), z.string().min(1));
const PokemonImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  scale: z.number().positive().optional(),
  objectPosition: z.string().min(1).optional(),
  placeholder: z.boolean().optional(),
});
const GuideContextViewSchema = z.object({
  overallRating: z.number().int().min(1).max(5).nullable().optional(),
  verdictLabel: z.string().min(1).optional(),
  summary: z.string().min(1).optional(),
  presentationMode: z.enum(["training-first", "action-first"]).optional(),
  order: z.array(z.object({ id: z.string().min(1), label: z.string().min(1), reason: z.string().min(1).optional() })).optional(),
  investment: z.partialRecord(z.enum(["stardust", "candy", "powerUp", "secondMove", "maxMove", "megaEnergy", "xlCandy", "rareCandy"]), InvestmentLevelSchema).optional(),
  investmentReasons: z.partialRecord(z.enum(["stardust", "candy", "powerUp", "secondMove", "maxMove", "megaEnergy", "xlCandy", "rareCandy"]), z.string().min(1)).optional(),
  ivAdvice: GuideIvAdviceSchema.optional(),
  recommendations: z.array(z.string().min(1)).optional(),
});
const PvpLeagueTargetSchema = z.object({
  league: z.enum(["great", "ultra", "master"]),
  label: z.string().min(1),
  cpLimit: z.number().int().positive().optional(),
  decision: z.enum(["recommended", "conditional", "hold"]),
  reason: z.string().min(1),
  checkBeforePowerUp: z.string().min(1),
  ivDirection: z.string().min(1),
  powerUpTarget: z.string().min(1),
  moveset: GuideMovesetSchema.optional(),
  secondMove: z.object({ decision: InvestmentLevelSchema, reason: z.string().min(1) }),
  xlCandy: z.object({ decision: InvestmentLevelSchema, reason: z.string().min(1) }),
  useCase: GuideUseCaseSchema,
  contextView: GuideContextViewSchema,
});

export const StandardAppGuideProjectionSchema = z.object({
  name: z.string().min(1).optional(),
  formName: z.string().min(1).optional(),
  heroBackground: z.string().min(1).optional(),
  image: PokemonImageSchema.optional(),
  overallRating: z.number().int().min(1).max(5).nullable(),
  verdict: z.enum(["must_build", "recommended", "conditional", "hold", "low_priority"]),
  verdictLabel: z.string().min(1),
  presentationMode: z.enum(["training-first", "action-first"]),
  reason: z.string().min(1),
  summary: z.string().min(1),
  useCases: z.partialRecord(StandardGuideModeSchema, GuideUseCaseSchema),
  movesets: z.partialRecord(StandardGuideModeSchema, GuideMovesetSchema),
  investment: z.record(z.string(), z.unknown()),
  investmentReasons: z.record(z.string(), z.string()).optional(),
  progression: z.unknown().optional(),
  pvpLeagueTargets: z.array(PvpLeagueTargetSchema).optional(),
  ivAdvice: GuideIvAdviceSchema,
  weaknesses: z.array(z.object({ type: z.string().min(1), multiplier: z.number().positive().optional() })),
  counters: z.array(z.record(z.string(), z.unknown())),
  counterRankingMode: z.enum(["ranked", "examples"]).optional(),
  values: z.partialRecord(StandardGuideModeSchema, z.number().int().min(1).max(5).nullable()),
  valueReasons: z.partialRecord(StandardGuideModeSchema, z.string()),
  dataStatus: z.object({
    counters: z.enum(["ready", "missing"]),
    values: z.enum(["ready", "missing"]),
    useCases: z.enum(["ready", "partial", "missing"]),
    movesets: z.enum(["ready", "partial", "missing"]),
    investment: z.enum(["ready", "partial", "missing"]),
    ivAdvice: z.enum(["ready", "partial", "missing"]),
  }),
  recommendations: z.array(z.string().min(1)).min(1),
  source: z.object({ name: z.string().min(1), url: z.string().url() }),
  actionGuide: z.record(z.string(), z.unknown()).optional(),
});

export const StandardGuideCandidateSchema = z.object({
  schemaVersion: z.literal(1),
  pokemonId: StandardGuidePokemonIdSchema,
  origin: z.literal("manual_ai"),
  generationMethod: z.literal("manual_ai"),
  factsSnapshotHash: Sha256Schema,
  generatedBy: z.object({
    provider: z.literal("codex"),
    model: z.string().min(1),
    promptVersion: z.string().min(1),
    generatedAt: DateTimeSchema,
    sourcePackageHash: Sha256Schema,
  }),
  review: z.object({ status: z.literal("pending") }),
  evidenceConfidence: EvidenceConfidenceSchema,
  editorialStatus: EditorialStatusSchema,
  editorialLimitations: z.array(z.string().min(1)),
  evidenceIds: EvidenceIdsSchema,
  guide: StandardAppGuideProjectionSchema,
});

export const StandardGuideCandidateBundleSchema = z.object({
  schemaVersion: z.literal(1),
  runId: z.string().min(1),
  generatedAt: DateTimeSchema,
  sourceSnapshotHash: Sha256Schema,
  promptVersion: z.string().min(1),
  candidates: z.array(StandardGuideCandidateSchema).length(3),
  usage: z.null(),
});

export const StandardGuideValidationReportSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: DateTimeSchema,
  datasetHash: Sha256Schema,
  candidateHash: Sha256Schema,
  validationHash: Sha256Schema,
  schemaValid: z.boolean(),
  issues: z.array(z.object({ pokemonId: StandardGuidePokemonIdSchema.optional(), code: z.string(), message: z.string(), severity: z.enum(["error", "review", "info"]) })),
  editorialReadiness: z.array(z.object({ pokemonId: StandardGuidePokemonIdSchema, ready: z.boolean(), blockers: z.array(z.string()) })),
  approvalPerformed: z.literal(false),
  publicationPerformed: z.literal(false),
});

export type StandardGuidePokemonId = z.infer<typeof StandardGuidePokemonIdSchema>;
export type StandardizedGuideDataset = z.infer<typeof StandardizedGuideDatasetSchema>;
export type StandardGuideCandidate = z.infer<typeof StandardGuideCandidateSchema>;
export type StandardGuideCandidateBundle = z.infer<typeof StandardGuideCandidateBundleSchema>;
