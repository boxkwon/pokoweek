import { readJson, fileExists, writeJsonAtomic } from "../lib/files";
import { sha256 } from "../lib/hash";
import { paths } from "../lib/paths";
import {
  DATA_ENGINE_SCHEMA_VERSION,
  ApprovalManifestSchema,
  EvidenceRegistrySchema,
  FactReviewManifestSchema,
  GuideCandidateBundleSchema,
  GuideCandidateSchema,
  NormalizedDatasetSchema,
  ValidationReportSchema,
  type EvidenceRegistry,
  type GuideCandidate,
  type NormalizedDataset,
  type PokemonId,
  type ValidationIssue,
} from "../schemas";
import { checkEditorialReadiness, checkGuideCompleteness } from "./completeness";
import { reviewCandidateQuality, reviewCrossCandidateQuality } from "./quality";

const GUIDE_TARGETS = ["kyurem", "white-kyurem", "black-kyurem"] as const satisfies readonly PokemonId[];

function collectEvidenceIds(value: unknown, output = new Set<string>()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectEvidenceIds(item, output));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if ((key === "evidenceIds" || key === "sourceEvidenceIds") && Array.isArray(item)) {
        item.forEach((id) => typeof id === "string" && output.add(id));
      } else {
        collectEvidenceIds(item, output);
      }
    }
  }
  return output;
}

function validateEvidenceReferences(value: unknown, registry: EvidenceRegistry, issues: ValidationIssue[]) {
  const known = new Set(registry.records.map((record) => record.id));
  for (const evidenceId of collectEvidenceIds(value)) {
    if (!known.has(evidenceId)) {
      issues.push({
        code: "missing_evidence_reference",
        path: "evidenceIds",
        message: `Unknown evidence ID: ${evidenceId}`,
        severity: "error",
        evidenceIds: [evidenceId],
      });
    }
  }
}

function validateFusion(dataset: NormalizedDataset, issues: ValidationIssue[]) {
  const byId = new Map(dataset.fusionRecipes.map((recipe) => [recipe.id, recipe]));
  const white = byId.get("white-kyurem");
  const black = byId.get("black-kyurem");
  if (!white || white.partnerPokemonId !== "reshiram") {
    issues.push({ code: "invalid_white_partner", path: "fusionRecipes.white-kyurem.partnerPokemonId", message: "White Kyurem must reference Reshiram.", severity: "error" });
  }
  if (!black || black.partnerPokemonId !== "zekrom") {
    issues.push({ code: "invalid_black_partner", path: "fusionRecipes.black-kyurem.partnerPokemonId", message: "Black Kyurem must reference Zekrom.", severity: "error" });
  }

  for (const recipe of dataset.fusionRecipes) {
    if (recipe.moveTransformation.sourceMoveRequiredForFusion) {
      issues.push({ code: "move_confused_with_fusion_requirement", path: `fusionRecipes.${recipe.id}.moveTransformation`, message: "Glaciate is a move transformation prerequisite, not a fusion prerequisite.", severity: "error" });
    }
    if (recipe.separation.energyCost !== 0 || recipe.separation.candyCost !== 0 || !recipe.separation.releasesPartner) {
      issues.push({ code: "invalid_separation_rule", path: `fusionRecipes.${recipe.id}.separation`, message: "Separation must cost no energy/candy and release the partner.", severity: "error" });
    }
    const pokemonMaterials = recipe.materials.filter((item) => item.type === "pokemon");
    if (!pokemonMaterials.some((item) => item.pokemonId === "kyurem" && item.amount === 1)
      || !pokemonMaterials.some((item) => item.pokemonId === recipe.partnerPokemonId && item.amount === 1)) {
      issues.push({ code: "invalid_fusion_pokemon_count", path: `fusionRecipes.${recipe.id}.materials`, message: "Each fusion requires one Kyurem and one matching partner.", severity: "error" });
    }
  }
}

export function validateCandidateMoves(candidate: GuideCandidate, dataset: NormalizedDataset, issues: ValidationIssue[]) {
  const pokemon = dataset.pokemon.find((item) => item.id === candidate.pokemonId);
  if (!pokemon) {
    issues.push({ code: "candidate_pokemon_missing", path: "pokemonId", message: `No normalized Pokemon for ${candidate.pokemonId}.`, severity: "error" });
    return;
  }
  const fastMoves = new Map(pokemon.moves.fast.map((move) => [move.name, move]));
  const chargedMoves = new Map(pokemon.moves.charged.map((move) => [move.name, move]));
  const specialChargedMoves = new Set(
    dataset.fusionRecipes
      .filter((recipe) => recipe.resultPokemonId === candidate.pokemonId)
      .map((recipe) => recipe.moveTransformation.targetMove),
  );
  for (const moveset of candidate.movesets) {
    const fast = fastMoves.get(moveset.fastMove);
    if (!fast) {
      issues.push({ code: "invalid_recommended_fast_move", path: `movesets.${moveset.mode}.fastMove`, message: `${moveset.fastMove} is not in the normalized move pool.`, severity: "error" });
    } else if (fast.acquisition !== "current" && moveset.acquisitionConditions.length === 0) {
      issues.push({ code: "missing_move_acquisition_condition", path: `movesets.${moveset.mode}.acquisitionConditions`, message: `${moveset.fastMove} requires an acquisition condition.`, severity: "error" });
    }
    for (const moveName of moveset.chargedMoves) {
      const charged = chargedMoves.get(moveName);
      if (!charged && !specialChargedMoves.has(moveName)) {
        issues.push({ code: "invalid_recommended_charged_move", path: `movesets.${moveset.mode}.chargedMoves`, message: `${moveName} is not in the normalized move pool.`, severity: "error" });
      } else if ((!charged || charged.acquisition !== "current") && moveset.acquisitionConditions.length === 0) {
        issues.push({ code: "missing_move_acquisition_condition", path: `movesets.${moveset.mode}.acquisitionConditions`, message: `${moveName} requires an acquisition condition.`, severity: "error" });
      }
    }
  }
}

async function loadCandidateBundle(issues: ValidationIssue[]) {
  if (!await fileExists(paths.candidateBundle)) return undefined;
  try {
    return GuideCandidateBundleSchema.parse(await readJson(paths.candidateBundle));
  } catch (error) {
    issues.push({ code: "candidate_bundle_schema_invalid", path: "candidates", message: error instanceof Error ? error.message : String(error), severity: "error" });
    return undefined;
  }
}

export async function validateDataEngine() {
  const issues: ValidationIssue[] = [];
  const dataset = NormalizedDatasetSchema.parse(await readJson(paths.normalizedDataset));
  const registry = EvidenceRegistrySchema.parse(await readJson(paths.evidenceRegistry));
  const factReview = FactReviewManifestSchema.parse(await readJson(paths.factReview));
  const approvalManifest = ApprovalManifestSchema.parse(await readJson(paths.approvalManifest));
  validateEvidenceReferences(dataset, registry, issues);
  validateEvidenceReferences(factReview, registry, issues);
  validateFusion(dataset, issues);

  const candidates = new Map<PokemonId, GuideCandidate>();
  const candidateBundle = await loadCandidateBundle(issues);
  if (candidateBundle && candidateBundle.sourceSnapshotHash !== dataset.sourceSnapshotHash) {
    issues.push({ code: "stale_candidate_bundle", path: "candidates.sourceSnapshotHash", message: "Candidate bundle was generated from an older API snapshot.", severity: "review" });
  }
  for (const pokemonId of GUIDE_TARGETS) {
    const candidate = candidateBundle?.candidates.find((item) => item.pokemonId === pokemonId);
    if (candidate) {
      GuideCandidateSchema.parse(candidate);
      candidates.set(pokemonId, candidate);
      validateEvidenceReferences(candidate, registry, issues);
      validateCandidateMoves(candidate, dataset, issues);
      issues.push(...reviewCandidateQuality(candidate));
      if (candidate.factsSnapshotHash !== dataset.sourceSnapshotHash) {
        issues.push({ code: "stale_candidate", path: `candidates.${pokemonId}.factsSnapshotHash`, message: "Candidate was generated from an older API snapshot.", severity: "review" });
      }
    }
  }
  issues.push(...reviewCrossCandidateQuality(candidates));

  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const requiredFactReviews = factReview.entries.filter((entry) => entry.requiredForPublish);
  const factsReviewed = requiredFactReviews.length > 0 && requiredFactReviews.every((entry) => entry.status === "reviewed");
  const fusionEvidenceIds = new Set(dataset.fusionRecipes.flatMap((recipe) => recipe.evidenceIds));
  const fusionEvidenceReviewed = [...fusionEvidenceIds].every((id) => registry.records.find((record) => record.id === id)?.reviewStatus === "reviewed");
  const structuralCompleteness = GUIDE_TARGETS.map((pokemonId) => checkGuideCompleteness(pokemonId, candidates.get(pokemonId)));
  const editorialReadiness = GUIDE_TARGETS.map((pokemonId) => checkEditorialReadiness(pokemonId, candidates.get(pokemonId)));
  for (const approved of approvalManifest.guides) {
    if (approved.sourceSnapshotHash !== dataset.sourceSnapshotHash) {
      issues.push({
        code: "approved_guide_source_changed",
        path: `approved.${approved.pokemonId}.sourceSnapshotHash`,
        message: "The PoGo API snapshot changed after this guide was approved. Keep the existing guide published, but require review before replacing it.",
        severity: "review",
      });
    }
  }

  const report = ValidationReportSchema.parse({
    schemaVersion: DATA_ENGINE_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    datasetHash: sha256(dataset),
    schemaValid: true,
    factsStatus: errorCount > 0 ? "invalid" : factsReviewed ? "verified" : "needs_review",
    fusionStatus: errorCount > 0 ? "invalid" : fusionEvidenceReviewed ? "verified" : "needs_review",
    factReviews: factReview.entries.map(({ id, category, requiredForPublish, status }) => ({ id, category, requiredForPublish, status })),
    issues,
    structuralCompleteness,
    editorialReadiness,
  });
  await writeJsonAtomic(paths.validationReport, report);
  return report;
}
