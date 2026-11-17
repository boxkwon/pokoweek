import { hasFlag } from "../lib/args";
import { publishApprovedCandidates } from "../manual/approval";

async function main() {
  if (!hasFlag("confirm")) throw new Error("Explicit --confirm is required to modify approved production overlays.");
  const overlays = await publishApprovedCandidates();
  console.log(JSON.stringify({ stage: "publish", published: overlays.map((item) => item.id) }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
