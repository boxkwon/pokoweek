import path from "node:path";
import { requireOption } from "../lib/args";
import { importManualCandidates } from "../manual/import";

async function main() {
  const authoringTool = requireOption("tool");
  if (authoringTool !== "chatgpt" && authoringTool !== "codex") throw new Error("--tool must be chatgpt or codex.");
  const result = await importManualCandidates({
    inputPath: path.resolve(requireOption("input")),
    authoringTool,
    model: requireOption("model"),
    writtenAt: requireOption("written-at"),
  });
  console.log(JSON.stringify({
    stage: "manual-import",
    runId: result.bundle.runId,
    apiCostUsd: 0,
    structuralCompleteness: result.validation.structuralCompleteness,
    editorialReadiness: result.validation.editorialReadiness,
    issueCount: result.validation.issues.length,
    approvalRequired: true,
    publicationPerformed: false,
  }, null, 2));
  if (result.validation.structuralCompleteness.some((item) => item.status !== "complete")
    || result.validation.issues.some((item) => item.severity === "error")) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
