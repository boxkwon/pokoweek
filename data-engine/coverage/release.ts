import { fileExists, readJson, writeJsonAtomic } from "../lib/files";
import { sha256 } from "../lib/hash";
import { dataRoot as defaultDataRoot } from "../lib/paths";
import type { GuideOverlay } from "../standardization/release";
import {
  CoverageGuideApprovalManifestSchema,
  type CoveragePokemonId,
} from "./schemas";
import { COVERAGE_TARGETS, getCoveragePaths, validatePokemonGuideCoverage } from "./validate";

type ApprovalOptions = {
  reviewer: string;
  qaCommitSha: string;
  expectedCandidateHash: string;
  targets: readonly string[];
  dataRoot?: string;
  approvedAt?: string;
};

type PublicationOptions = {
  targets: readonly string[];
  dataRoot?: string;
  dryRun: boolean;
  virtualApproval?: ApprovalOptions;
};

export function coverageFileHash(value: unknown) {
  return sha256(`${JSON.stringify(value, null, 2)}\n`);
}

function assertExactTargets(targets: readonly string[]): asserts targets is readonly CoveragePokemonId[] {
  const unique = [...new Set(targets)];
  const allowed = new Set<string>(COVERAGE_TARGETS);
  if (unique.length !== COVERAGE_TARGETS.length
    || unique.some((target) => !allowed.has(target))
    || COVERAGE_TARGETS.some((target) => !unique.includes(target))) {
    throw new Error(`Targets must be exactly: ${COVERAGE_TARGETS.join(",")}`);
  }
}

function assertReleasable(report: Awaited<ReturnType<typeof validatePokemonGuideCoverage>>["report"]) {
  if (!report.structuralComplete || report.issues.some((issue) => issue.severity === "error")) {
    throw new Error("Structural validation errors block approval or publication.");
  }
  if (report.editorialReadiness.some((item) => !item.structuralComplete || !item.editorialReady)) {
    throw new Error("Editorially unready guides block approval or publication.");
  }
}

export function coverageValidationFingerprint(
  report: Awaited<ReturnType<typeof validatePokemonGuideCoverage>>["report"],
) {
  return sha256({
    normalizedHash: report.normalizedHash,
    candidateHash: report.candidateHash,
    structuralComplete: report.structuralComplete,
    issues: report.issues,
    editorialReadiness: report.editorialReadiness,
  });
}

async function assertQaPreviewMatches(
  bundle: Awaited<ReturnType<typeof validatePokemonGuideCoverage>>["bundle"],
  previewPath: string,
) {
  const previews = await readJson<GuideOverlay[]>(previewPath);
  if (previews.length !== bundle.candidates.length) {
    throw new Error("QA Preview target count differs from the candidate bundle.");
  }
  if (new Set(previews.map((overlay) => overlay.id)).size !== previews.length) {
    throw new Error("QA Preview contains duplicate Pokemon IDs.");
  }
  for (const candidate of bundle.candidates) {
    const preview = previews.find((overlay) => overlay.id === candidate.pokemonId);
    if (!preview || preview.previewOnly !== true || sha256(preview.guide) !== sha256(candidate.guide)) {
      throw new Error(`${candidate.pokemonId} differs from the final QA Preview.`);
    }
  }
}

async function assertApprovedOverlayIsSafe(root: string) {
  const paths = getCoveragePaths(root);
  const current = await readJson<GuideOverlay[]>(paths.approvedOverlays);
  if (new Set(current.map((overlay) => overlay.id)).size !== current.length) {
    throw new Error("Existing approved overlays contain duplicate Pokemon IDs.");
  }
  if (!await fileExists(paths.approval)) {
    const collisions = current.filter((overlay) => COVERAGE_TARGETS.includes(overlay.id as CoveragePokemonId));
    if (collisions.length > 0) {
      throw new Error(`Coverage targets already exist without this dataset approval: ${collisions.map((item) => item.id).join(",")}`);
    }
  }
  return current;
}

export async function planCoverageGuideApproval(options: ApprovalOptions) {
  assertExactTargets(options.targets);
  const root = options.dataRoot ?? defaultDataRoot;
  const paths = getCoveragePaths(root);
  const { bundle, report } = await validatePokemonGuideCoverage(root);
  assertReleasable(report);
  if (bundle.candidates.some((candidate) => candidate.review.status !== "pending")) {
    throw new Error("All coverage candidates must remain pending before approval.");
  }
  if (report.candidateHash !== options.expectedCandidateHash) {
    throw new Error(`Candidate hash mismatch: expected ${options.expectedCandidateHash}, got ${report.candidateHash}`);
  }
  await assertQaPreviewMatches(bundle, paths.preview);
  const currentApproved = await assertApprovedOverlayIsSafe(root);
  const currentIds = new Set(currentApproved.map((overlay) => overlay.id));
  const newApprovedCount = COVERAGE_TARGETS.filter((target) => !currentIds.has(target)).length;
  const approvalCounts = {
    existingApprovedCount: currentApproved.length,
    newApprovedCount,
    expectedTotalApprovedCount: currentApproved.length + newApprovedCount,
  };

  const existing = await fileExists(paths.approval)
    ? CoverageGuideApprovalManifestSchema.parse(await readJson(paths.approval))
    : undefined;
  if (existing) {
    assertExactTargets(existing.targets);
    const expectedGuideHashes = new Map(bundle.candidates.map((candidate) => [candidate.pokemonId, sha256(candidate.guide)]));
    if (existing.candidateHash !== report.candidateHash
      || existing.sourceSnapshotHash !== bundle.sourceSnapshotHash
      || existing.validationHash !== coverageValidationFingerprint(report)
      || existing.qaCommitSha !== options.qaCommitSha
      || existing.approvedBy !== options.reviewer
      || existing.guides.some((entry) => expectedGuideHashes.get(entry.pokemonId) !== entry.candidateGuideHash
        || entry.publicationGuideHash !== entry.candidateGuideHash)) {
      throw new Error("An approval exists but does not match this candidate, QA commit, or reviewer.");
    }
    return { manifest: existing, report, bundle, noOp: true, ...approvalCounts };
  }

  const approvedAt = options.approvedAt ?? new Date().toISOString();
  const guides = bundle.candidates.map((candidate) => {
    const candidateGuideHash = sha256(candidate.guide);
    return {
      pokemonId: candidate.pokemonId,
      candidateGuideHash,
      publicationGuideHash: candidateGuideHash,
    };
  });
  const manifest = CoverageGuideApprovalManifestSchema.parse({
    schemaVersion: 1,
    dataset: "pokemon-guide-coverage-v1",
    targets: [...COVERAGE_TARGETS],
    candidateHash: report.candidateHash,
    sourceSnapshotHash: bundle.sourceSnapshotHash,
    validationHash: coverageValidationFingerprint(report),
    approvedAt,
    approvedBy: options.reviewer,
    qaCommitSha: options.qaCommitSha,
    guides,
  });
  return { manifest, report, bundle, noOp: false, ...approvalCounts };
}

export async function approveCoverageGuides(options: ApprovalOptions & { dryRun: boolean }) {
  const plan = await planCoverageGuideApproval(options);
  if (!options.dryRun && !plan.noOp) {
    const paths = getCoveragePaths(options.dataRoot ?? defaultDataRoot);
    await writeJsonAtomic(paths.approval, plan.manifest);
  }
  return {
    ...plan,
    manifestSemanticHash: sha256(plan.manifest),
    manifestFileHash: coverageFileHash(plan.manifest),
  };
}

export async function publishCoverageGuides(options: PublicationOptions) {
  assertExactTargets(options.targets);
  const root = options.dataRoot ?? defaultDataRoot;
  const paths = getCoveragePaths(root);
  const { bundle, report } = await validatePokemonGuideCoverage(root);
  assertReleasable(report);

  const manifest = await fileExists(paths.approval)
    ? CoverageGuideApprovalManifestSchema.parse(await readJson(paths.approval))
    : options.dryRun && options.virtualApproval
      ? (await planCoverageGuideApproval({ ...options.virtualApproval, dataRoot: root })).manifest
      : undefined;
  if (!manifest) throw new Error("No explicit approval manifest exists for this dataset.");
  assertExactTargets(manifest.targets);
  assertExactTargets(manifest.guides.map((entry) => entry.pokemonId));
  if (manifest.candidateHash !== report.candidateHash || manifest.sourceSnapshotHash !== bundle.sourceSnapshotHash) {
    throw new Error("Approval is stale: the candidate bundle changed after approval.");
  }
  if (manifest.validationHash !== coverageValidationFingerprint(report)) {
    throw new Error("Approval is stale: the validation fingerprint changed after approval.");
  }
  for (const entry of manifest.guides) {
    const candidate = bundle.candidates.find((item) => item.pokemonId === entry.pokemonId);
    if (!candidate || sha256(candidate.guide) !== entry.candidateGuideHash) {
      throw new Error(`${entry.pokemonId} approval is stale or missing.`);
    }
  }

  const current = await readJson<GuideOverlay[]>(paths.approvedOverlays);
  if (new Set(current.map((overlay) => overlay.id)).size !== current.length) {
    throw new Error("Existing approved overlays contain duplicate Pokemon IDs.");
  }
  const preserved = new Map(current
    .filter((overlay) => !COVERAGE_TARGETS.includes(overlay.id as CoveragePokemonId))
    .map((overlay) => [overlay.id, sha256(overlay)]));
  const byId = new Map(current.map((overlay) => [overlay.id, overlay]));
  for (const entry of manifest.guides) {
    const candidate = bundle.candidates.find((item) => item.pokemonId === entry.pokemonId)!;
    if (sha256(candidate.guide) !== entry.publicationGuideHash) {
      throw new Error(`${entry.pokemonId} publication projection is not semantically equal to the approved guide.`);
    }
    byId.set(entry.pokemonId, {
      id: entry.pokemonId,
      validationHash: manifest.validationHash,
      approvedAt: manifest.approvedAt,
      guide: candidate.guide,
    });
  }
  const overlays = [...byId.values()];
  for (const [id, hash] of preserved) {
    const result = overlays.find((overlay) => overlay.id === id);
    if (!result || sha256(result) !== hash) throw new Error(`Existing approved overlay changed or was removed: ${id}`);
  }
  if (new Set(overlays.map((overlay) => overlay.id)).size !== overlays.length) {
    throw new Error("Publication result contains duplicate Pokemon IDs.");
  }
  if (!options.dryRun) await writeJsonAtomic(paths.approvedOverlays, overlays);
  const currentById = new Map(current.map((overlay) => [overlay.id, overlay]));
  const changedIds = overlays
    .filter((overlay) => {
      const previous = currentById.get(overlay.id);
      return !previous || sha256(previous) !== sha256(overlay);
    })
    .map((overlay) => overlay.id);
  const deletedIds = current.filter((overlay) => !byId.has(overlay.id)).map((overlay) => overlay.id);
  return {
    overlays,
    manifest,
    noOp: sha256(current) === sha256(overlays),
    resultHash: sha256(overlays),
    resultFileHash: coverageFileHash(overlays),
    existingHash: sha256(current),
    changedIds,
    deletedIds,
  };
}
