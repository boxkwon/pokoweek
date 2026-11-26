import { hasFlag, readOption, requireOption } from "../lib/args";
import { approveCoverageGuides } from "../coverage/release";
import { COVERAGE_TARGETS, getCoveragePaths } from "../coverage/validate";
import { approveManualCandidates } from "../manual/approval";
import { approveStandardGuides, STANDARD_GUIDE_TARGETS } from "../standardization/release";
import { approveBatchOne } from "../batch-1/release";
import { BATCH_ONE_TARGETS, getBatchOnePaths } from "../batch-1/validate";
import { approveBatchTwo } from "../batch-2/release";
import { BATCH_TWO_TARGETS, getBatchTwoPaths } from "../batch-2/validate";

function targets() {
  const raw = requireOption("pokemon");
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

async function main() {
  const dryRun = hasFlag("dry-run");
  const dataset = readOption("dataset") ?? "kyurem-family";
  if (dryRun && hasFlag("confirm")) throw new Error("Use either --dry-run or --confirm, not both.");
  if (!dryRun && !hasFlag("confirm")) throw new Error("Explicit --confirm is required. This command records human approval but does not publish.");
  if (dataset === "pokemon-detail-standard-v1") {
    const result = await approveStandardGuides({
      reviewer: requireOption("reviewer"),
      qaCommitSha: requireOption("qa-commit"),
      expectedCandidateHash: requireOption("candidate-hash"),
      targets: targets(),
      dryRun,
      ...(readOption("approved-at") ? { approvedAt: readOption("approved-at") } : {}),
    });
    console.log(JSON.stringify({
      stage: "approve",
      dataset: "pokemon-detail-standard-v1",
      targets: STANDARD_GUIDE_TARGETS,
      dryRun,
      noOp: result.noOp,
      candidateHash: result.manifest.candidateHash,
      guides: result.manifest.guides,
      publicationPerformed: false,
    }, null, 2));
    return;
  }
  if (dataset === "pokemon-guide-coverage-v1") {
    const result = await approveCoverageGuides({
      reviewer: requireOption("reviewer"),
      qaCommitSha: requireOption("qa-commit"),
      expectedCandidateHash: requireOption("candidate-hash"),
      targets: targets(),
      dryRun,
      ...(readOption("approved-at") ? { approvedAt: readOption("approved-at") } : {}),
    });
    const paths = getCoveragePaths();
    console.log(JSON.stringify({
      stage: "approve",
      dataset: "pokemon-guide-coverage-v1",
      targets: COVERAGE_TARGETS,
      dryRun,
      noOp: result.noOp,
      existingApprovedCount: result.existingApprovedCount,
      newApprovedCount: result.newApprovedCount,
      expectedTotalApprovedCount: result.expectedTotalApprovedCount,
      candidateHash: result.manifest.candidateHash,
      manifestSemanticHash: result.manifestSemanticHash,
      manifestFileHash: result.manifestFileHash,
      changedFiles: [paths.approval],
      guides: result.manifest.guides,
      publicationPerformed: false,
    }, null, 2));
    return;
  }
  if (dataset === "pokemon-guide-coverage-batch-1") {
    const result = await approveBatchOne({ reviewer: requireOption("reviewer"), qaCommitSha: requireOption("qa-commit"), expectedCandidateHash: requireOption("candidate-hash"), targets: targets(), dryRun, ...(readOption("approved-at") ? { approvedAt: readOption("approved-at") } : {}) });
    console.log(JSON.stringify({ stage: "approve", dataset, targets: BATCH_ONE_TARGETS, dryRun, noOp: result.noOp, existingApprovedCount: result.existingApprovedCount, newApprovedCount: result.newApprovedCount, expectedTotalApprovedCount: result.expectedTotalApprovedCount, candidateHash: result.manifest.candidateHash, manifestSemanticHash: result.manifestSemanticHash, manifestFileHash: result.manifestFileHash, changedFiles: [getBatchOnePaths().approval], guides: result.manifest.guides, publicationPerformed: false }, null, 2));
    return;
  }
  if (dataset === "pokemon-guide-coverage-batch-2") {
    const result = await approveBatchTwo({ reviewer: requireOption("reviewer"), qaCommitSha: requireOption("qa-commit"), expectedCandidateHash: requireOption("candidate-hash"), targets: targets(), dryRun, ...(readOption("approved-at") ? { approvedAt: readOption("approved-at") } : {}) });
    console.log(JSON.stringify({ stage: "approve", dataset, targets: BATCH_TWO_TARGETS, dryRun, noOp: result.noOp, existingApprovedCount: result.existingApprovedCount, newApprovedCount: result.newApprovedCount, expectedTotalApprovedCount: result.expectedTotalApprovedCount, candidateHash: result.manifest.candidateHash, manifestSemanticHash: result.manifestSemanticHash, manifestFileHash: result.manifestFileHash, changedFiles: [getBatchTwoPaths().approval], guides: result.manifest.guides, publicationPerformed: false }, null, 2));
    return;
  }
  if (dataset !== "kyurem-family") throw new Error(`Unsupported approval dataset: ${dataset}`);
  if (dryRun) throw new Error("--dry-run is supported only with --dataset pokemon-detail-standard-v1.");
  const result = await approveManualCandidates(requireOption("reviewer"));
  console.log(JSON.stringify({
    stage: "approve",
    approved: result.bundle.candidates.map((item) => item.pokemonId),
    publicationPerformed: false,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
