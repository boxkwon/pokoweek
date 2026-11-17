import { hasFlag, requireOption } from "../lib/args";
import { approveManualCandidates } from "../manual/approval";

async function main() {
  if (!hasFlag("confirm")) throw new Error("Explicit --confirm is required. This command records human approval but does not publish.");
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
