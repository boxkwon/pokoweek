import { fileExists, readJson, writeJsonAtomic } from "../lib/files";
import { sha256 } from "../lib/hash";
import { dataRoot as defaultDataRoot } from "../lib/paths";
import {
  StandardGuideApprovalManifestSchema,
  type StandardGuideApprovalManifest,
  type StandardGuidePokemonId,
} from "./schemas";
import { getStandardizationPaths, validatePokemonDetailStandardization } from "./validate";

export const STANDARD_GUIDE_TARGETS = ["cresselia", "mega-banette", "eternamax-eternatus"] as const;

export type GuideOverlay = {
  id: string;
  validationHash: string;
  approvedAt?: string;
  previewOnly?: boolean;
  guide: Record<string, unknown>;
};

type ApprovalOptions = {
  reviewer: string;
  qaCommitSha: string;
  expectedCandidateHash: string;
  targets: readonly string[];
  dataRoot?: string;
  approvedAt?: string;
};

function assertExactTargets(targets: readonly string[]): asserts targets is readonly StandardGuidePokemonId[] {
  const unique = [...new Set(targets)];
  const allowed = new Set<string>(STANDARD_GUIDE_TARGETS);
  if (unique.length !== STANDARD_GUIDE_TARGETS.length
    || unique.some((target) => !allowed.has(target))
    || STANDARD_GUIDE_TARGETS.some((target) => !unique.includes(target))) {
    throw new Error(`Targets must be exactly: ${STANDARD_GUIDE_TARGETS.join(",")}`);
  }
}

function assertReleasable(report: Awaited<ReturnType<typeof validatePokemonDetailStandardization>>["report"]) {
  if (!report.schemaValid || report.issues.some((issue) => issue.severity === "error")) {
    throw new Error("Validation errors block approval or publication.");
  }
  if (report.editorialReadiness.some((item) => !item.ready)) {
    throw new Error("Editorially unready guides block approval or publication.");
  }
}

export function standardValidationFingerprint(
  report: Awaited<ReturnType<typeof validatePokemonDetailStandardization>>["report"],
) {
  return sha256({
    datasetHash: report.datasetHash,
    candidateHash: report.candidateHash,
    schemaValid: report.schemaValid,
    issues: report.issues,
    editorialReadiness: report.editorialReadiness,
  });
}

async function assertQaPreviewMatches(
  bundle: Awaited<ReturnType<typeof validatePokemonDetailStandardization>>["bundle"],
  previewPath: string,
) {
  const previews = await readJson<GuideOverlay[]>(previewPath);
  if (previews.length !== bundle.candidates.length) throw new Error("QA Preview target count differs from the candidate bundle.");
  for (const candidate of bundle.candidates) {
    const preview = previews.find((overlay) => overlay.id === candidate.pokemonId);
    if (!preview || preview.previewOnly !== true || sha256(preview.guide) !== sha256(candidate.guide)) {
      throw new Error(`${candidate.pokemonId} differs from the final QA Preview.`);
    }
  }
}

export async function planStandardGuideApproval(options: ApprovalOptions) {
  assertExactTargets(options.targets);
  const root = options.dataRoot ?? defaultDataRoot;
  const paths = getStandardizationPaths(root);
  const { bundle, report } = await validatePokemonDetailStandardization({ dataRoot: root });
  assertReleasable(report);
  if (report.candidateHash !== options.expectedCandidateHash) {
    throw new Error(`Candidate hash mismatch: expected ${options.expectedCandidateHash}, got ${report.candidateHash}`);
  }
  await assertQaPreviewMatches(bundle, paths.preview);

  const existing = await fileExists(paths.approval)
    ? StandardGuideApprovalManifestSchema.parse(await readJson(paths.approval))
    : undefined;
  if (existing) {
    assertExactTargets(existing.targets);
    const expectedGuideHashes = new Map(bundle.candidates.map((candidate) => [candidate.pokemonId, sha256(candidate.guide)]));
    if (existing.candidateHash !== report.candidateHash
      || existing.sourceSnapshotHash !== bundle.sourceSnapshotHash
      || existing.validationHash !== standardValidationFingerprint(report)
      || existing.qaCommitSha !== options.qaCommitSha
      || existing.approvedBy !== options.reviewer
      || existing.guides.some((entry) => expectedGuideHashes.get(entry.pokemonId) !== entry.candidateGuideHash
        || entry.publicationGuideHash !== entry.candidateGuideHash)) {
      throw new Error("An approval exists but does not match this candidate, QA commit, or reviewer.");
    }
    return { manifest: existing, report, bundle, noOp: true };
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
  const manifest = StandardGuideApprovalManifestSchema.parse({
    schemaVersion: 1,
    dataset: "pokemon-detail-standard-v1",
    targets: [...STANDARD_GUIDE_TARGETS],
    candidateHash: report.candidateHash,
    sourceSnapshotHash: bundle.sourceSnapshotHash,
    validationHash: standardValidationFingerprint(report),
    approvedAt,
    approvedBy: options.reviewer,
    qaCommitSha: options.qaCommitSha,
    guides,
  });
  return { manifest, report, bundle, noOp: false };
}

export async function approveStandardGuides(options: ApprovalOptions & { dryRun: boolean }) {
  const plan = await planStandardGuideApproval(options);
  if (!options.dryRun && !plan.noOp) {
    const paths = getStandardizationPaths(options.dataRoot ?? defaultDataRoot);
    await writeJsonAtomic(paths.approval, plan.manifest);
  }
  return plan;
}

type PublicationOptions = {
  targets: readonly string[];
  dataRoot?: string;
  dryRun: boolean;
  virtualApproval?: ApprovalOptions;
};

export async function publishStandardGuides(options: PublicationOptions) {
  assertExactTargets(options.targets);
  const root = options.dataRoot ?? defaultDataRoot;
  const paths = getStandardizationPaths(root);
  const { bundle, report } = await validatePokemonDetailStandardization({ dataRoot: root });
  assertReleasable(report);

  const manifest = await fileExists(paths.approval)
    ? StandardGuideApprovalManifestSchema.parse(await readJson(paths.approval))
    : options.dryRun && options.virtualApproval
      ? (await planStandardGuideApproval({ ...options.virtualApproval, dataRoot: root })).manifest
      : undefined;
  if (!manifest) throw new Error("No explicit approval manifest exists for this dataset.");
  assertExactTargets(manifest.targets);
  assertExactTargets(manifest.guides.map((entry) => entry.pokemonId));
  if (manifest.candidateHash !== report.candidateHash || manifest.sourceSnapshotHash !== bundle.sourceSnapshotHash) {
    throw new Error("Approval is stale: the candidate bundle changed after approval.");
  }
  if (manifest.validationHash !== standardValidationFingerprint(report)) {
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
  const byId = new Map(current.map((overlay) => [overlay.id, overlay]));
  for (const entry of manifest.guides) {
    const candidate = bundle.candidates.find((item) => item.pokemonId === entry.pokemonId)!;
    const guide = candidate.guide;
    if (sha256(guide) !== entry.publicationGuideHash) {
      throw new Error(`${entry.pokemonId} publication projection is not semantically equal to the approved guide.`);
    }
    byId.set(entry.pokemonId, {
      id: entry.pokemonId,
      validationHash: manifest.validationHash,
      approvedAt: manifest.approvedAt,
      guide,
    });
  }
  const overlays = [...byId.values()];
  if (!options.dryRun) await writeJsonAtomic(paths.approvedOverlays, overlays);
  return {
    overlays,
    manifest,
    noOp: sha256(current) === sha256(overlays),
    resultHash: sha256(overlays),
    existingHash: sha256(current),
  };
}
