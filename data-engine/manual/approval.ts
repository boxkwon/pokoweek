import { readJson, writeJsonAtomic } from "../lib/files";
import { sha256 } from "../lib/hash";
import { paths } from "../lib/paths";
import {
  ApprovalManifestSchema,
  GuideCandidateBundleSchema,
  type GuideCandidate,
  type PokemonId,
  type ValidationReport,
} from "../schemas";
import { GUIDE_TARGETS } from "../generators/run";
import { validateDataEngine } from "../validators/validate";
import { projectCandidateForApp, type AppGuideOverlay } from "./projection";

export function validationFingerprint(report: ValidationReport) {
  return sha256({
    datasetHash: report.datasetHash,
    schemaValid: report.schemaValid,
    factsStatus: report.factsStatus,
    fusionStatus: report.fusionStatus,
    issues: report.issues,
    structuralCompleteness: report.structuralCompleteness,
    editorialReadiness: report.editorialReadiness,
    factReviews: report.factReviews,
  });
}

export async function approveManualCandidates(reviewer: string, targets: readonly PokemonId[] = GUIDE_TARGETS) {
  const bundle = GuideCandidateBundleSchema.parse(await readJson(paths.candidateBundle));
  const report = await validateDataEngine();
  for (const pokemonId of targets) {
    const candidate = bundle.candidates.find((item) => item.pokemonId === pokemonId);
    if (!candidate) throw new Error(`Candidate not found: ${pokemonId}`);
    if (candidate.origin === "fixture") throw new Error("Fixture candidates cannot be approved.");
    const completeness = report.structuralCompleteness.find((item) => item.pokemonId === pokemonId);
    if (completeness?.status !== "complete") throw new Error(`${pokemonId} is not complete and cannot be approved.`);
    const readiness = report.editorialReadiness.find((item) => item.pokemonId === pokemonId);
    if (!readiness?.ready) throw new Error(`${pokemonId} is not editorially ready and cannot be approved.`);
    if (report.issues.some((issue) => issue.severity === "error" && (issue.path.includes(pokemonId) || issue.path === "candidates" || issue.path === "evidenceIds"))) {
      throw new Error(`${pokemonId} has validation errors and cannot be approved.`);
    }
  }

  const approvedAt = new Date().toISOString();
  const approvedTargets = new Set<PokemonId>(targets);
  const candidates = bundle.candidates.map((candidate) => approvedTargets.has(candidate.pokemonId)
    ? { ...candidate, review: { status: "approved" as const, reviewedAt: approvedAt, reviewer } }
    : candidate);
  const nextBundle = GuideCandidateBundleSchema.parse({ ...bundle, candidates });
  const manifest = ApprovalManifestSchema.parse(await readJson(paths.approvalManifest));
  const hash = validationFingerprint(report);
  const byId = new Map(manifest.guides.map((item) => [item.pokemonId, item]));
  for (const pokemonId of targets) {
    byId.set(pokemonId, {
      pokemonId,
      sourceSnapshotHash: bundle.sourceSnapshotHash,
      validationHash: hash,
      approvedAt,
      approvedBy: reviewer,
    });
  }
  const nextManifest = ApprovalManifestSchema.parse({ schemaVersion: 1, guides: [...byId.values()] });
  await writeJsonAtomic(paths.candidateBundle, nextBundle);
  await writeJsonAtomic(paths.approvalManifest, nextManifest);
  return { bundle: nextBundle, manifest: nextManifest, report };
}

export async function publishApprovedCandidates() {
  const bundle = GuideCandidateBundleSchema.parse(await readJson(paths.candidateBundle));
  const manifest = ApprovalManifestSchema.parse(await readJson(paths.approvalManifest));
  const report = await validateDataEngine();
  if (report.factsStatus !== "verified" || report.fusionStatus !== "verified") {
    throw new Error("Facts and fusion evidence must both be verified before publication.");
  }
  if (report.issues.some((issue) => issue.severity === "error")) throw new Error("Validation errors block publication.");
  if (report.structuralCompleteness.some((item) => item.status !== "complete")) throw new Error("Structurally incomplete candidates block publication.");
  if (report.editorialReadiness.some((item) => !item.ready)) throw new Error("Editorially unready candidates block publication.");
  const currentValidationHash = validationFingerprint(report);
  const manifestById = new Map(manifest.guides.map((item) => [item.pokemonId, item]));
  const overlays = await readJson<AppGuideOverlay[]>(pathForApprovedOverlays());
  const byId = new Map(overlays.map((item) => [item.id, item]));
  for (const candidate of bundle.candidates) {
    if (candidate.review.status !== "approved") throw new Error(`${candidate.pokemonId} has not been explicitly approved.`);
    const entry = manifestById.get(candidate.pokemonId);
    if (!entry || entry.validationHash !== currentValidationHash || entry.sourceSnapshotHash !== bundle.sourceSnapshotHash) {
      throw new Error(`${candidate.pokemonId} approval is stale or missing.`);
    }
    byId.set(candidate.pokemonId, projectCandidateForApp(candidate, {
      validationHash: entry.validationHash,
      approvedAt: entry.approvedAt,
    }));
  }
  const next = [...byId.values()];
  await writeJsonAtomic(pathForApprovedOverlays(), next);
  return next;
}

function pathForApprovedOverlays() {
  return `${process.cwd()}/data/approved/app-guide-overlays.json`;
}
