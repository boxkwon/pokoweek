import path from "node:path";
import { z } from "zod";
import { readJson, writeJsonAtomic } from "../lib/files";
import { sha256 } from "../lib/hash";
import { paths } from "../lib/paths";
import type { PogoApiCollectionManifest } from "../collectors/pogoapi";
import {
  DATA_ENGINE_SCHEMA_VERSION,
  EvidenceRegistrySchema,
  FactReviewManifestSchema,
  FusionRecipeSchema,
  NormalizedDatasetSchema,
  type EvidenceRecord,
  type NormalizedMove,
  type NormalizedPokemon,
  type PokemonId,
} from "../schemas";

const TargetSchema = z.object({
  id: z.number().int(),
  form: z.string(),
  normalizedId: z.string(),
});

const TARGETS = [
  { id: 646, form: "Normal", normalizedId: "kyurem" },
  { id: 646, form: "White", normalizedId: "white-kyurem" },
  { id: 646, form: "Black", normalizedId: "black-kyurem" },
  { id: 643, form: "Normal", normalizedId: "reshiram" },
  { id: 644, form: "Normal", normalizedId: "zekrom" },
] as const satisfies readonly z.infer<typeof TargetSchema>[];

const DECISION_BENCHMARKS = [
  { id: "mamoswine", role: "ice", dexNumber: 473, form: "Normal", fastMove: "Powder Snow", chargedMove: "Avalanche" },
  { id: "galarian-darmanitan", role: "ice", dexNumber: 555, form: "Galarian_standard", fastMove: "Ice Fang", chargedMove: "Avalanche" },
  { id: "baxcalibur", role: "ice", dexNumber: 998, form: "Normal", fastMove: "Ice Fang", chargedMove: "Avalanche" },
  { id: "rayquaza", role: "dragon", dexNumber: 384, form: "Normal", fastMove: "Dragon Tail", chargedMove: "Outrage" },
  { id: "origin-palkia", role: "dragon", dexNumber: 484, form: "Origin", fastMove: "Dragon Tail", chargedMove: "Draco Meteor" },
] as const;

const StatsSchema = z.object({
  pokemon_id: z.number().int(),
  pokemon_name: z.string(),
  form: z.string().default("Normal"),
  base_attack: z.coerce.number().int(),
  base_defense: z.coerce.number().int(),
  base_stamina: z.coerce.number().int(),
});

const TypesSchema = z.object({
  pokemon_id: z.number().int(),
  pokemon_name: z.string(),
  form: z.string().default("Normal"),
  type: z.array(z.string()).min(1).max(2),
});

const CurrentMovesSchema = z.object({
  pokemon_id: z.number().int(),
  pokemon_name: z.string(),
  form: z.string().default("Normal"),
  fast_moves: z.array(z.string()).default([]),
  charged_moves: z.array(z.string()).default([]),
  elite_fast_moves: z.array(z.string()).default([]),
  elite_charged_moves: z.array(z.string()).default([]),
});

const PveMoveSchema = z.object({
  name: z.string(),
  type: z.string(),
  power: z.coerce.number(),
  energy_delta: z.coerce.number(),
  duration: z.coerce.number().optional(),
});

const PvpMoveSchema = z.object({
  name: z.string(),
  type: z.string(),
  power: z.coerce.number(),
  energy_delta: z.coerce.number(),
  turn_duration: z.coerce.number().optional(),
  buffs: z.record(z.string(), z.unknown()).optional(),
});

const CpMultiplierSchema = z.object({
  level: z.coerce.number().positive(),
  multiplier: z.coerce.number().positive(),
});

const PowerUpRequirementSchema = z.object({
  candy_to_upgrade: z.coerce.number().int().nonnegative(),
  current_level: z.coerce.number().positive(),
  level_after_powering: z.coerce.number().positive(),
  stardust_to_upgrade: z.coerce.number().int().nonnegative(),
  xl_candy_to_upgrade: z.coerce.number().int().nonnegative(),
});

const MaxCpSchema = z.object({
  pokemon_id: z.number().int(),
  pokemon_name: z.string(),
  form: z.string().default("Normal"),
  max_cp: z.coerce.number().int().positive(),
});

const MechanicsEvidenceSchema = z.object({
  schemaVersion: z.literal(1),
  source: z.object({
    sourceId: z.string(),
    url: z.string().url(),
    publisher: z.string(),
    reviewedAt: z.string().datetime({ offset: true }),
    reviewStatus: z.literal("reviewed"),
    rawCollected: z.literal(false),
  }),
  claims: z.array(z.object({ id: z.string(), claim: z.string(), paths: z.array(z.string()).min(1) })),
  cpMultipliers: z.array(z.object({
    level: z.number().positive(),
    multiplier: z.number().positive(),
    evidenceIds: z.array(z.string()).min(1),
  })),
});

const ManualEvidenceSchema = z.object({
  schemaVersion: z.literal(1),
  source: z.object({
    sourceId: z.string(),
    url: z.string().url(),
    publisher: z.string(),
    reviewedAt: z.string().datetime({ offset: true }),
    reviewStatus: z.literal("reviewed"),
    rawCollected: z.literal(false),
  }),
  claims: z.array(z.object({
    id: z.string(),
    claim: z.string(),
    paths: z.array(z.string()).min(1),
  })),
  fusionRecipes: z.array(FusionRecipeSchema).length(2),
});

function recordKey(id: number, form: string) {
  return `${id}:${form.toLowerCase()}`;
}

function endpointEvidenceId(file: string, contentHash: string) {
  return `pogoapi:${file.replace(/\.json$/, "")}:${contentHash.slice(0, 12)}`;
}

function moveMetrics(
  move: z.infer<typeof PveMoveSchema> | z.infer<typeof PvpMoveSchema> | undefined,
  mode: "pve" | "pvp",
) {
  if (!move) return undefined;
  const effects = mode === "pvp" && "buffs" in move && move.buffs
    ? Object.entries(move.buffs)
      .filter(([key, value]) => key.endsWith("_stat_stage_change") && typeof value === "number" && value !== 0)
      .map(([key, value]) => ({
        activationChance: typeof move.buffs?.activation_chance === "number" ? move.buffs.activation_chance : 1,
        target: key.startsWith("attacker_") ? "attacker" as const : "opponent" as const,
        stat: key.includes("attack_stat") ? "attack" as const : "defense" as const,
        stages: value as number,
      }))
    : [];
  return {
    type: move.type,
    power: move.power,
    energyDelta: move.energy_delta,
    ...(mode === "pve" && "duration" in move && move.duration !== undefined ? { durationMs: move.duration } : {}),
    ...(mode === "pvp" && "turn_duration" in move && move.turn_duration !== undefined ? { turns: move.turn_duration } : {}),
    ...(effects.length ? { effects } : {}),
  };
}

export function buildMoves(
  names: readonly string[],
  eliteNames: readonly string[],
  specialNames: ReadonlyMap<string, readonly string[]>,
  kind: "fast" | "charged",
  pveMoves: Map<string, z.infer<typeof PveMoveSchema>>,
  pvpMoves: Map<string, z.infer<typeof PvpMoveSchema>>,
  evidenceIds: { pool: string; pve: string; pvp: string },
): NormalizedMove[] {
  const currentSet = new Set(names);
  const eliteSet = new Set(eliteNames);
  return [...new Set([...names, ...eliteNames, ...specialNames.keys()])].map((name) => {
    const acquisition = currentSet.has(name) ? "current" : eliteSet.has(name) ? "elite" : "special";
    const pve = moveMetrics(pveMoves.get(name), "pve");
    const pvp = moveMetrics(pvpMoves.get(name), "pvp");
    if (acquisition === "special" && (!pve || !pvp)) {
      throw new Error(`Verified special move is missing PvE or PvP metrics: ${name}`);
    }
    return {
      name,
      kind,
      acquisition,
      pve,
      pvp,
      evidenceIds: acquisition === "special"
        ? [evidenceIds.pve, evidenceIds.pvp, ...(specialNames.get(name) ?? [])]
        : [evidenceIds.pool, evidenceIds.pve, evidenceIds.pvp],
    };
  });
}

export async function normalizeKyuremDataset() {
  const latest = await readJson<{ runId: string; snapshotHash: string }>(path.join(paths.rawPogoApi, "latest.json"));
  const runDirectory = path.join(paths.rawPogoApi, latest.runId);
  const manifest = await readJson<PogoApiCollectionManifest>(path.join(runDirectory, "manifest.json"));

  const stats = z.array(StatsSchema).parse(await readJson(path.join(runDirectory, "pokemon_stats.json")));
  const types = z.array(TypesSchema).parse(await readJson(path.join(runDirectory, "pokemon_types.json")));
  const currentMoves = z.array(CurrentMovesSchema).parse(await readJson(path.join(runDirectory, "current_pokemon_moves.json")));
  const fastMoves = z.array(PveMoveSchema).parse(await readJson(path.join(runDirectory, "fast_moves.json")));
  const chargedMoves = z.array(PveMoveSchema).parse(await readJson(path.join(runDirectory, "charged_moves.json")));
  const pvpFastMoves = z.array(PvpMoveSchema).parse(await readJson(path.join(runDirectory, "pvp_fast_moves.json")));
  const pvpChargedMoves = z.array(PvpMoveSchema).parse(await readJson(path.join(runDirectory, "pvp_charged_moves.json")));
  const cpMultipliers = z.array(CpMultiplierSchema).parse(await readJson(path.join(runDirectory, "cp_multiplier.json")));
  const powerUpRequirements = z.record(z.string(), PowerUpRequirementSchema).parse(await readJson(path.join(runDirectory, "pokemon_powerup_requirements.json")));
  const typeEffectiveness = z.record(z.string(), z.record(z.string(), z.coerce.number().positive())).parse(await readJson(path.join(runDirectory, "type_effectiveness.json")));
  const maxCp = z.array(MaxCpSchema).parse(await readJson(path.join(runDirectory, "pokemon_max_cp.json")));
  const manualEvidence = ManualEvidenceSchema.parse(await readJson(paths.manualEvidence));
  const mechanicsEvidence = MechanicsEvidenceSchema.parse(await readJson(paths.mechanicsEvidence));
  const factReview = FactReviewManifestSchema.parse(await readJson(paths.factReview));

  const endpointByFile = new Map(manifest.endpoints.map((endpoint) => [endpoint.file, endpoint]));
  function evidenceId(file: string) {
    const endpoint = endpointByFile.get(file);
    if (!endpoint) throw new Error(`Missing endpoint metadata for ${file}`);
    return endpointEvidenceId(file, endpoint.contentSha256);
  }

  const apiEvidence: EvidenceRecord[] = manifest.endpoints.map((endpoint) => ({
    id: endpointEvidenceId(endpoint.file, endpoint.contentSha256),
    sourceId: "pogoapi",
    sourceType: "api",
    url: endpoint.url,
    publisher: "PoGo API",
    retrievedAt: manifest.retrievedAt,
    sourceHash: endpoint.contentSha256,
    reviewStatus: "needs_review",
    rawCollected: true,
    claim: `PoGo API ${endpoint.file} snapshot used for normalized game data.`,
    paths: [`pokemon.*.${endpoint.file.replace(/\.json$/, "")}`],
  }));

  const manualRecords: EvidenceRecord[] = manualEvidence.claims.map((claim) => ({
    id: claim.id,
    sourceId: manualEvidence.source.sourceId,
    sourceType: "manual",
    url: manualEvidence.source.url,
    publisher: manualEvidence.source.publisher,
    reviewedAt: manualEvidence.source.reviewedAt,
    sourceHash: sha256({ claim: claim.claim, paths: claim.paths }),
    reviewStatus: manualEvidence.source.reviewStatus,
    rawCollected: manualEvidence.source.rawCollected,
    claim: claim.claim,
    paths: claim.paths,
  }));
  const mechanicsRecords: EvidenceRecord[] = mechanicsEvidence.claims.map((claim) => ({
    id: claim.id,
    sourceId: mechanicsEvidence.source.sourceId,
    sourceType: "manual",
    url: mechanicsEvidence.source.url,
    publisher: mechanicsEvidence.source.publisher,
    reviewedAt: mechanicsEvidence.source.reviewedAt,
    sourceHash: sha256({ claim: claim.claim, paths: claim.paths }),
    reviewStatus: mechanicsEvidence.source.reviewStatus,
    rawCollected: mechanicsEvidence.source.rawCollected,
    claim: claim.claim,
    paths: claim.paths,
  }));
  const factReviewRecords: EvidenceRecord[] = factReview.entries.map((entry) => ({
    id: entry.id,
    sourceId: "kyurem-fact-review-2026",
    sourceType: "manual",
    url: entry.sources[0].url,
    publisher: entry.sources[0].publisher,
    reviewedAt: entry.status === "reviewed" ? factReview.reviewedAt : undefined,
    sourceHash: sha256(entry),
    reviewStatus: entry.status,
    rawCollected: false,
    claim: entry.comparisonResult,
    paths: [`factReviews.${entry.category}`],
  }));

  const statsByKey = new Map(stats.map((entry) => [recordKey(entry.pokemon_id, entry.form), entry]));
  const typesByKey = new Map(types.map((entry) => [recordKey(entry.pokemon_id, entry.form), entry]));
  const movesByKey = new Map(currentMoves.map((entry) => [recordKey(entry.pokemon_id, entry.form), entry]));
  const maxCpByKey = new Map(maxCp.map((entry) => [recordKey(entry.pokemon_id, entry.form), entry]));
  const pveFastByName = new Map(fastMoves.map((move) => [move.name, move]));
  const pveChargedByName = new Map(chargedMoves.map((move) => [move.name, move]));
  const pvpFastByName = new Map(pvpFastMoves.map((move) => [move.name, move]));
  const pvpChargedByName = new Map(pvpChargedMoves.map((move) => [move.name, move]));
  const specialMovesByPokemon = new Map<PokemonId, Map<string, readonly string[]>>();
  for (const recipe of manualEvidence.fusionRecipes) {
    const moves = specialMovesByPokemon.get(recipe.resultPokemonId) ?? new Map<string, readonly string[]>();
    moves.set(recipe.moveTransformation.targetMove, recipe.moveTransformation.evidenceIds);
    specialMovesByPokemon.set(recipe.resultPokemonId, moves);
  }

  const normalizedPokemon: NormalizedPokemon[] = TARGETS.map((target) => {
    const key = recordKey(target.id, target.form);
    const stat = statsByKey.get(key);
    const type = typesByKey.get(key);
    const movePool = movesByKey.get(key);
    if (!stat || !type || !movePool) {
      throw new Error(`PoGo API snapshot is missing ${target.normalizedId} (${key})`);
    }
    const poolEvidence = evidenceId("current_pokemon_moves.json");
    return {
      id: target.normalizedId as PokemonId,
      dexNumber: target.id,
      gameName: stat.pokemon_name,
      form: target.form,
      types: { values: type.type, evidenceIds: [evidenceId("pokemon_types.json")] },
      baseStats: {
        attack: stat.base_attack,
        defense: stat.base_defense,
        stamina: stat.base_stamina,
        evidenceIds: [evidenceId("pokemon_stats.json")],
      },
      moves: {
        fast: buildMoves(movePool.fast_moves, movePool.elite_fast_moves, new Map(), "fast", pveFastByName, pvpFastByName, {
          pool: poolEvidence,
          pve: evidenceId("fast_moves.json"),
          pvp: evidenceId("pvp_fast_moves.json"),
        }),
        charged: buildMoves(movePool.charged_moves, movePool.elite_charged_moves, specialMovesByPokemon.get(target.normalizedId as PokemonId) ?? new Map(), "charged", pveChargedByName, pvpChargedByName, {
          pool: poolEvidence,
          pve: evidenceId("charged_moves.json"),
          pvp: evidenceId("pvp_charged_moves.json"),
        }),
        evidenceIds: [poolEvidence],
      },
    };
  });

  const decisionBenchmarks = DECISION_BENCHMARKS.map((benchmark) => {
    const key = recordKey(benchmark.dexNumber, benchmark.form);
    const stat = statsByKey.get(key);
    const type = typesByKey.get(key);
    const movePool = movesByKey.get(key);
    if (!stat || !type || !movePool) throw new Error(`Decision benchmark is missing: ${benchmark.id}`);
    if (!movePool.fast_moves.includes(benchmark.fastMove) || !movePool.charged_moves.includes(benchmark.chargedMove)) {
      throw new Error(`Decision benchmark move is not current: ${benchmark.id}`);
    }
    const fastMove = buildMoves([benchmark.fastMove], [], new Map(), "fast", pveFastByName, pvpFastByName, {
      pool: evidenceId("current_pokemon_moves.json"), pve: evidenceId("fast_moves.json"), pvp: evidenceId("pvp_fast_moves.json"),
    })[0];
    const chargedMove = buildMoves([benchmark.chargedMove], [], new Map(), "charged", pveChargedByName, pvpChargedByName, {
      pool: evidenceId("current_pokemon_moves.json"), pve: evidenceId("charged_moves.json"), pvp: evidenceId("pvp_charged_moves.json"),
    })[0];
    return {
      id: benchmark.id,
      role: benchmark.role,
      dexNumber: benchmark.dexNumber,
      gameName: stat.pokemon_name,
      form: benchmark.form,
      types: type.type,
      baseAttack: stat.base_attack,
      fastMove,
      chargedMove,
      evidenceIds: [evidenceId("pokemon_stats.json"), evidenceId("pokemon_types.json"), evidenceId("current_pokemon_moves.json")],
    };
  });

  const registry = EvidenceRegistrySchema.parse({
    schemaVersion: DATA_ENGINE_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    records: [...apiEvidence, ...manualRecords, ...mechanicsRecords, ...factReviewRecords],
  });
  const dataset = NormalizedDatasetSchema.parse({
    schemaVersion: DATA_ENGINE_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    sourceSnapshotHash: manifest.snapshotHash,
    pokemon: normalizedPokemon,
    fusionRecipes: manualEvidence.fusionRecipes,
    decisionBenchmarks,
    typeEffectiveness: {
      values: typeEffectiveness,
      evidenceIds: [evidenceId("type_effectiveness.json")],
    },
    progression: {
      cpMultipliers: [...cpMultipliers.map((entry) => ({
        level: entry.level,
        multiplier: entry.multiplier,
        evidenceIds: [evidenceId("cp_multiplier.json")],
      })), ...mechanicsEvidence.cpMultipliers],
      powerUpRequirements: Object.values(powerUpRequirements).map((entry) => ({
        currentLevel: entry.current_level,
        nextLevel: entry.level_after_powering,
        stardust: entry.stardust_to_upgrade,
        candy: entry.candy_to_upgrade,
        xlCandy: entry.xl_candy_to_upgrade,
        evidenceIds: [evidenceId("pokemon_powerup_requirements.json")],
      })),
      cpReferences: factReview.cpReferences.map((reference) => {
        const target = TARGETS.find((item) => item.normalizedId === reference.pokemonId);
        if (!target) throw new Error(`CP reference target is not normalized: ${reference.pokemonId}`);
        const apiValue = maxCpByKey.get(recordKey(target.id, target.form))?.max_cp;
        if (apiValue === undefined) throw new Error(`PoGo API max CP is missing: ${reference.pokemonId}`);
        if (apiValue !== reference.apiReportedMaxCp || apiValue !== reference.level51.cp) {
          throw new Error(`PoGo API max CP does not match reviewed Lv.51 context: ${reference.pokemonId}`);
        }
        return reference;
      }),
    },
  });

  await writeJsonAtomic(paths.evidenceRegistry, registry);
  await writeJsonAtomic(paths.normalizedDataset, dataset);
  return { dataset, registry };
}
