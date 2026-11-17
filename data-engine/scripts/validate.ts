import { readPokemonArg } from "../lib/args";
import { validateDataEngine } from "../validators/validate";

async function main() {
  readPokemonArg();
  const report = await validateDataEngine();
  console.log(JSON.stringify({
    stage: "validate",
    schemaValid: report.schemaValid,
    factsStatus: report.factsStatus,
    fusionStatus: report.fusionStatus,
    issues: report.issues.length,
    structuralCompleteness: report.structuralCompleteness,
    editorialReadiness: report.editorialReadiness,
  }, null, 2));
  if (report.factsStatus === "invalid" || report.fusionStatus === "invalid") process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
