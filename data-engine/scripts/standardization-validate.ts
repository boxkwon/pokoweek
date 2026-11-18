import { writeJsonAtomic } from "../lib/files";
import { standardizationPaths, validatePokemonDetailStandardization } from "../standardization/validate";

async function main() {
  const { report } = await validatePokemonDetailStandardization();
  await writeJsonAtomic(standardizationPaths.validation, report);
  console.log(JSON.stringify({
    stage: "pokemon_detail_standardization_validate",
    errors: report.issues.filter((issue) => issue.severity === "error").length,
    reviews: report.issues.filter((issue) => issue.severity === "review").length,
    ready: report.editorialReadiness,
    approvalPerformed: false,
    publicationPerformed: false,
    output: standardizationPaths.validation,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
