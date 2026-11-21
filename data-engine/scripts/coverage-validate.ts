import { writeJsonAtomic } from "../lib/files";
import { coveragePaths, validatePokemonGuideCoverage } from "../coverage/validate";

async function main() {
  const { report } = await validatePokemonGuideCoverage();
  await writeJsonAtomic(coveragePaths.validation, report);
  console.log(JSON.stringify({
    stage: "pokemon_guide_coverage_validate",
    errors: report.issues.filter((issue) => issue.severity === "error").length,
    ready: report.editorialReadiness,
    approvalPerformed: false,
    publicationPerformed: false,
    output: coveragePaths.validation,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
