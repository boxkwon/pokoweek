import { hasFlag, readOption, requireOption } from "../lib/args";
import { publishApprovedCandidates } from "../manual/approval";
import { publishStandardGuides, STANDARD_GUIDE_TARGETS } from "../standardization/release";

function targets() {
  const raw = requireOption("pokemon");
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

async function main() {
  const dryRun = hasFlag("dry-run");
  const dataset = readOption("dataset") ?? "kyurem-family";
  if (dryRun && hasFlag("confirm")) throw new Error("Use either --dry-run or --confirm, not both.");
  if (!dryRun && !hasFlag("confirm")) throw new Error("Explicit --confirm is required to modify approved production overlays.");
  if (dataset === "pokemon-detail-standard-v1") {
    const virtualApproval = dryRun ? {
      reviewer: requireOption("reviewer"),
      qaCommitSha: requireOption("qa-commit"),
      expectedCandidateHash: requireOption("candidate-hash"),
      targets: targets(),
      ...(readOption("approved-at") ? { approvedAt: readOption("approved-at") } : {}),
    } : undefined;
    const result = await publishStandardGuides({ targets: targets(), dryRun, virtualApproval });
    console.log(JSON.stringify({
      stage: "publish",
      dataset: "pokemon-detail-standard-v1",
      targets: STANDARD_GUIDE_TARGETS,
      dryRun,
      noOp: result.noOp,
      existingHash: result.existingHash,
      resultHash: result.resultHash,
      published: result.manifest.guides,
    }, null, 2));
    return;
  }
  if (dataset !== "kyurem-family") throw new Error(`Unsupported publication dataset: ${dataset}`);
  if (dryRun) throw new Error("--dry-run is supported only with --dataset pokemon-detail-standard-v1.");
  const overlays = await publishApprovedCandidates();
  console.log(JSON.stringify({ stage: "publish", published: overlays.map((item) => item.id) }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
