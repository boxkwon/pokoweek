import { fileExists, readJson, writeJsonAtomic } from "../lib/files";
import { sha256 } from "../lib/hash";
import { dataRoot as defaultDataRoot } from "../lib/paths";
import type { GuideOverlay } from "../standardization/release";
import { BatchTwoApprovalManifestSchema, type BatchTwoPokemonId } from "./schemas";
import { BATCH_TWO_TARGETS, getBatchTwoPaths, validateBatchTwo } from "./validate";

type ApprovalOptions = { reviewer: string; qaCommitSha: string; expectedCandidateHash: string; targets: readonly string[]; dataRoot?: string; approvedAt?: string };
type PublicationOptions = { targets: readonly string[]; dataRoot?: string; dryRun: boolean; virtualApproval?: ApprovalOptions };

export function batchTwoFileHash(value: unknown) { return sha256(`${JSON.stringify(value, null, 2)}\n`); }

function assertExactTargets(targets: readonly string[]): asserts targets is readonly BatchTwoPokemonId[] {
  const unique = [...new Set(targets)];
  const allowed = new Set<string>(BATCH_TWO_TARGETS);
  if (unique.length !== BATCH_TWO_TARGETS.length || unique.some((id) => !allowed.has(id)) || BATCH_TWO_TARGETS.some((id) => !unique.includes(id))) throw new Error(`Targets must be exactly: ${BATCH_TWO_TARGETS.join(",")}`);
}

function assertReleasable(report: Awaited<ReturnType<typeof validateBatchTwo>>["report"]) {
  if (!report.structuralComplete || report.issues.some((issue) => issue.severity === "error")) throw new Error("Structural validation errors block approval or publication.");
  if (report.editorialReadiness.some((item) => !item.structuralComplete || !item.editorialReady)) throw new Error("Editorially unready guides block approval or publication.");
}

export function batchTwoValidationFingerprint(report: Awaited<ReturnType<typeof validateBatchTwo>>["report"]) {
  return sha256({ normalizedHash: report.normalizedHash, candidateHash: report.candidateHash, structuralComplete: report.structuralComplete, issues: report.issues, editorialReadiness: report.editorialReadiness });
}

async function assertPreviewMatches(bundle: Awaited<ReturnType<typeof validateBatchTwo>>["bundle"], previewPath: string) {
  const previews = await readJson<GuideOverlay[]>(previewPath);
  if (previews.length !== 5 || new Set(previews.map((item) => item.id)).size !== 5) throw new Error("QA Preview target count or IDs differ from candidates.");
  for (const candidate of bundle.candidates) {
    const preview = previews.find((item) => item.id === candidate.pokemonId);
    if (!preview || preview.previewOnly !== true || sha256(preview.guide) !== sha256(candidate.guide)) throw new Error(`${candidate.pokemonId} differs from the final QA Preview.`);
  }
}

export async function planBatchTwoApproval(options: ApprovalOptions) {
  assertExactTargets(options.targets);
  const root = options.dataRoot ?? defaultDataRoot;
  const paths = getBatchTwoPaths(root);
  const { bundle, report } = await validateBatchTwo(root);
  assertReleasable(report);
  if (bundle.candidates.some((item) => item.review.status !== "pending")) throw new Error("All Batch 2 candidates must remain pending before approval.");
  if (report.candidateHash !== options.expectedCandidateHash) throw new Error(`Candidate hash mismatch: expected ${options.expectedCandidateHash}, got ${report.candidateHash}`);
  await assertPreviewMatches(bundle, paths.preview);
  const current = await readJson<GuideOverlay[]>(paths.approved);
  if (new Set(current.map((item) => item.id)).size !== current.length) throw new Error("Existing approved overlays contain duplicate Pokemon IDs.");
  const existing = await fileExists(paths.approval) ? BatchTwoApprovalManifestSchema.parse(await readJson(paths.approval)) : undefined;
  const guideHashes = new Map(bundle.candidates.map((item) => [item.pokemonId, sha256(item.guide)]));
  if (existing) {
    assertExactTargets(existing.targets);
    if (existing.candidateHash !== report.candidateHash || existing.sourceSnapshotHash !== bundle.sourceSnapshotHash || existing.validationHash !== batchTwoValidationFingerprint(report) || existing.qaCommitSha !== options.qaCommitSha || existing.approvedBy !== options.reviewer || existing.guides.some((entry) => guideHashes.get(entry.pokemonId) !== entry.candidateGuideHash || entry.publicationGuideHash !== entry.candidateGuideHash)) throw new Error("Existing approval does not match candidate, QA commit, or reviewer.");
    return { manifest: existing, report, bundle, noOp: true, existingApprovedCount: current.length, newApprovedCount: 0, expectedTotalApprovedCount: current.length };
  }
  const collisions = current.filter((item) => BATCH_TWO_TARGETS.includes(item.id as BatchTwoPokemonId));
  if (collisions.length) throw new Error(`Batch 2 targets already exist without dataset approval: ${collisions.map((item) => item.id).join(",")}`);
  const manifest = BatchTwoApprovalManifestSchema.parse({ schemaVersion: 1, dataset: "pokemon-guide-coverage-batch-2", targets: [...BATCH_TWO_TARGETS], candidateHash: report.candidateHash, sourceSnapshotHash: bundle.sourceSnapshotHash, validationHash: batchTwoValidationFingerprint(report), approvedAt: options.approvedAt ?? new Date().toISOString(), approvedBy: options.reviewer, qaCommitSha: options.qaCommitSha, guides: bundle.candidates.map((item) => ({ pokemonId: item.pokemonId, candidateGuideHash: sha256(item.guide), publicationGuideHash: sha256(item.guide) })) });
  return { manifest, report, bundle, noOp: false, existingApprovedCount: current.length, newApprovedCount: 5, expectedTotalApprovedCount: current.length + 5 };
}

export async function approveBatchTwo(options: ApprovalOptions & { dryRun: boolean }) {
  const result = await planBatchTwoApproval(options);
  if (!options.dryRun && !result.noOp) await writeJsonAtomic(getBatchTwoPaths(options.dataRoot ?? defaultDataRoot).approval, result.manifest);
  return { ...result, manifestSemanticHash: sha256(result.manifest), manifestFileHash: batchTwoFileHash(result.manifest) };
}

export async function publishBatchTwo(options: PublicationOptions) {
  assertExactTargets(options.targets);
  const root = options.dataRoot ?? defaultDataRoot;
  const paths = getBatchTwoPaths(root);
  const { bundle, report } = await validateBatchTwo(root);
  assertReleasable(report);
  const manifest = await fileExists(paths.approval) ? BatchTwoApprovalManifestSchema.parse(await readJson(paths.approval)) : options.dryRun && options.virtualApproval ? (await planBatchTwoApproval({ ...options.virtualApproval, dataRoot: root })).manifest : undefined;
  if (!manifest) throw new Error("No explicit Batch 2 approval manifest exists.");
  if (manifest.candidateHash !== report.candidateHash || manifest.sourceSnapshotHash !== bundle.sourceSnapshotHash || manifest.validationHash !== batchTwoValidationFingerprint(report)) throw new Error("Approval is stale: Batch 2 changed after approval.");
  const current = await readJson<GuideOverlay[]>(paths.approved);
  if (new Set(current.map((item) => item.id)).size !== current.length) throw new Error("Existing approved overlays contain duplicate Pokemon IDs.");
  const preserved = new Map(current.filter((item) => !BATCH_TWO_TARGETS.includes(item.id as BatchTwoPokemonId)).map((item) => [item.id, sha256(item)]));
  const byId = new Map(current.map((item) => [item.id, item]));
  for (const entry of manifest.guides) {
    const candidate = bundle.candidates.find((item) => item.pokemonId === entry.pokemonId);
    if (!candidate || sha256(candidate.guide) !== entry.candidateGuideHash || entry.publicationGuideHash !== entry.candidateGuideHash) throw new Error(`${entry.pokemonId} approval is stale or not semantically equal.`);
    byId.set(entry.pokemonId, { id: entry.pokemonId, validationHash: manifest.validationHash, approvedAt: manifest.approvedAt, standalone: true, guide: candidate.guide } as GuideOverlay);
  }
  const overlays = [...byId.values()];
  for (const [id, hash] of preserved) if (sha256(overlays.find((item) => item.id === id)) !== hash) throw new Error(`Existing approved overlay changed or was removed: ${id}`);
  if (new Set(overlays.map((item) => item.id)).size !== overlays.length) throw new Error("Publication result contains duplicate Pokemon IDs.");
  const currentHash = sha256(current);
  if (!options.dryRun && sha256(overlays) !== currentHash) await writeJsonAtomic(paths.approved, overlays);
  const currentById = new Map(current.map((item) => [item.id, item]));
  const changedIds = overlays.filter((item) => !currentById.has(item.id) || sha256(currentById.get(item.id)) !== sha256(item)).map((item) => item.id);
  const deletedIds = current.filter((item) => !byId.has(item.id)).map((item) => item.id);
  return { overlays, manifest, noOp: currentHash === sha256(overlays), existingHash: currentHash, resultHash: sha256(overlays), resultFileHash: batchTwoFileHash(overlays), changedIds, deletedIds };
}
