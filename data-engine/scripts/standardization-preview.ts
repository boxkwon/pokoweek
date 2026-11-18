import { writeJsonAtomic } from "../lib/files";
import { standardizationPaths, validatePokemonDetailStandardization } from "../standardization/validate";

async function main() {
  if (process.env.VERCEL_ENV === "production") {
    throw new Error("Standardization candidate overlays cannot be prepared in Production.");
  }
  const { bundle, report } = await validatePokemonDetailStandardization();
  if (report.issues.some((issue) => issue.severity === "error") || report.editorialReadiness.some((item) => !item.ready)) {
    throw new Error("Validation or editorial readiness errors block Preview overlay generation.");
  }
  const overlays = bundle.candidates.map((candidate) => ({
    id: candidate.pokemonId,
    validationHash: report.validationHash,
    previewOnly: true,
    guide: candidate.guide,
  }));
  await writeJsonAtomic(standardizationPaths.preview, overlays);
  console.log(JSON.stringify({
    stage: "pokemon_detail_standardization_preview",
    candidates: overlays.map((overlay) => overlay.id),
    reviewStatuses: bundle.candidates.map((candidate) => ({ id: candidate.pokemonId, status: candidate.review.status })),
    approved: false,
    published: false,
    output: standardizationPaths.preview,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
