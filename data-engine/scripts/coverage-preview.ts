import { writeJsonAtomic } from "../lib/files";
import { coveragePaths, validatePokemonGuideCoverage } from "../coverage/validate";

async function main() {
  if (process.env.VERCEL_ENV === "production") throw new Error("Coverage candidate overlays cannot be prepared in Production.");
  const { bundle, report } = await validatePokemonGuideCoverage();
  if (report.issues.some((issue) => issue.severity === "error") || report.editorialReadiness.some((item) => !item.editorialReady)) {
    throw new Error("Validation or editorial readiness errors block Preview overlay generation.");
  }
  const overlays = bundle.candidates.map((candidate) => ({
    id: candidate.pokemonId,
    validationHash: report.validationHash,
    previewOnly: true,
    guide: candidate.guide,
  }));
  await writeJsonAtomic(coveragePaths.preview, overlays);
  console.log(JSON.stringify({
    stage: "pokemon_guide_coverage_preview",
    candidates: overlays.map((overlay) => overlay.id),
    statuses: bundle.candidates.map((candidate) => ({ id: candidate.pokemonId, status: candidate.review.status })),
    approved: false,
    published: false,
    output: coveragePaths.preview,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
