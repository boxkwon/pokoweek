import path from "node:path";
import { copyFile, mkdir } from "node:fs/promises";
import { fileExists, readJson, writeJsonAtomic } from "../lib/files";
import { sha256 } from "../lib/hash";
import { paths } from "../lib/paths";
import {
  DATA_ENGINE_SCHEMA_VERSION,
  GuideCandidateBundleSchema,
  GuideCandidateSchema,
  type PokemonId,
} from "../schemas";
import { GUIDE_TARGETS, loadGenerationSources } from "../generators/run";
import { validateDataEngine } from "../validators/validate";
import { writeReviewSummary } from "../review/summary";
import { ManualDraftBundleSchema, ManualGuidePackageBodySchema, ManualGuidePackageSchema } from "./schemas";

export type ManualImportOptions = {
  inputPath: string;
  authoringTool: "chatgpt" | "codex";
  model: string;
  writtenAt: string;
  runId?: string;
};

function formatError(error: unknown) {
  if (error && typeof error === "object" && "issues" in error) {
    return { message: "Schema validation failed.", issues: (error as { issues: unknown }).issues };
  }
  return { message: error instanceof Error ? error.message : String(error) };
}

async function loadCurrentPackage(pokemonId: PokemonId) {
  const filePath = path.join(paths.manualPackages, `${pokemonId}.json`);
  const guidePackage = ManualGuidePackageSchema.parse(await readJson(filePath));
  const { packageHash, ...body } = guidePackage;
  const parsedBody = ManualGuidePackageBodySchema.parse(body);
  if (sha256(parsedBody) !== packageHash) throw new Error(`Manual input package hash is invalid: ${pokemonId}`);
  return guidePackage;
}

export async function importManualCandidates(options: ManualImportOptions) {
  try {
    const writtenAt = new Date(options.writtenAt);
    if (!Number.isFinite(writtenAt.getTime())) throw new Error("writtenAt must be a valid ISO date-time.");
    const draft = ManualDraftBundleSchema.parse(await readJson(options.inputPath));
    const { facts } = await loadGenerationSources();
    const draftsById = new Map(draft.candidates.map((entry) => [entry.guide.pokemonId, entry]));
    if (draftsById.size !== GUIDE_TARGETS.length || GUIDE_TARGETS.some((id) => !draftsById.has(id))) {
      throw new Error("Manual draft must contain kyurem, white-kyurem, and black-kyurem exactly once.");
    }

    const candidates = [];
    for (const pokemonId of GUIDE_TARGETS) {
      const entry = draftsById.get(pokemonId)!;
      const guidePackage = await loadCurrentPackage(pokemonId);
      if (guidePackage.sourceSnapshotHash !== facts.sourceSnapshotHash) {
        throw new Error(`Manual package is stale for ${pokemonId}; regenerate it before importing.`);
      }
      if (entry.inputPackageHash !== guidePackage.packageHash) {
        throw new Error(`Draft inputPackageHash does not match the current ${pokemonId} package.`);
      }
      candidates.push(GuideCandidateSchema.parse({
        ...entry.guide,
        schemaVersion: DATA_ENGINE_SCHEMA_VERSION,
        origin: "manual_ai",
        generationMethod: "manual_ai",
        factsSnapshotHash: facts.sourceSnapshotHash,
        generatedBy: {
          provider: options.authoringTool,
          model: options.model,
          promptVersion: guidePackage.promptVersion,
          generatedAt: writtenAt.toISOString(),
          sourcePackageHash: guidePackage.packageHash,
        },
        review: { status: "pending" },
      }));
    }

    const importedAt = new Date().toISOString();
    const bundle = GuideCandidateBundleSchema.parse({
      schemaVersion: DATA_ENGINE_SCHEMA_VERSION,
      runId: options.runId ?? `manual-${importedAt.replaceAll(/[:.]/g, "-")}`,
      generatedAt: importedAt,
      sourceSnapshotHash: facts.sourceSnapshotHash,
      promptVersion: candidates[0].generatedBy.promptVersion,
      candidates,
      usage: null,
    });

    if (await fileExists(paths.candidateBundle)) {
      const previous = await readJson<{ runId?: string }>(paths.candidateBundle);
      await mkdir(paths.candidateHistory, { recursive: true });
      const historyId = previous.runId ?? `legacy-${Date.now()}`;
      await copyFile(paths.candidateBundle, path.join(paths.candidateHistory, `${historyId}.json`));
    }
    await writeJsonAtomic(paths.candidateBundle, bundle);
    const validation = await validateDataEngine();
    const review = await writeReviewSummary(bundle, validation);
    await writeJsonAtomic(paths.manualImportReport, {
      importedAt,
      status: "candidate_saved_for_review",
      inputPath: path.relative(process.cwd(), options.inputPath),
      authoringTool: options.authoringTool,
      model: options.model,
      apiCostUsd: 0,
      approvalPerformed: false,
      publicationPerformed: false,
      qaTracking: [
        { id: "independent-white-black-selection", status: "covered_by_candidate_actions" },
        { id: "independent-glaciate-checks", status: "covered_by_candidate_actions" },
        { id: "fusion-partner-bound-state", status: "covered_by_candidate_warnings" },
        { id: "post-fusion-training-not-repeated", status: "covered_by_white_black_investment_guides" },
      ],
      structuralCompleteness: validation.structuralCompleteness,
      editorialReadiness: validation.editorialReadiness,
      issues: validation.issues,
    });
    return { bundle, validation, review };
  } catch (error) {
    const report = {
      failedAt: new Date().toISOString(),
      status: "rejected_import",
      inputPath: path.relative(process.cwd(), options.inputPath),
      apiCostUsd: 0,
      automaticRepairPerformed: false,
      ...formatError(error),
    };
    await writeJsonAtomic(paths.manualImportReport, report);
    throw error;
  }
}
