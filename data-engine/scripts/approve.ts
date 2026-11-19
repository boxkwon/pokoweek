import { hasFlag, readOption, requireOption } from "../lib/args";
import { approveManualCandidates } from "../manual/approval";
import { approveStandardGuides, STANDARD_GUIDE_TARGETS } from "../standardization/release";

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
