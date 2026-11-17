import { readJson, writeJsonAtomic } from "../lib/files";
import { paths } from "../lib/paths";
import { validationFingerprint } from "../manual/approval";
import { projectCandidateForApp } from "../manual/projection";
import { GuideCandidateBundleSchema, NormalizedDatasetSchema } from "../schemas";
import { validateDataEngine } from "../validators/validate";

async function main() {
  if (process.env.VERCEL_ENV === "production") {
    throw new Error("Preview candidate overlays cannot be prepared in the Production environment.");
  }
  const bundle = GuideCandidateBundleSchema.parse(await readJson(paths.candidateBundle));
  const dataset = NormalizedDatasetSchema.parse(await readJson(paths.normalizedDataset));
  const report = await validateDataEngine();
  if (report.factsStatus !== "verified" || report.fusionStatus !== "verified") {
    throw new Error("Reviewed facts and fusion evidence are required before preparing a UI preview.");
  }
  if (report.issues.some((issue) => issue.severity === "error")) {
    throw new Error("Validation errors block UI preview preparation.");
  }
  if (report.structuralCompleteness.some((item) => item.status !== "complete")) {
    throw new Error("Structurally incomplete candidates block UI preview preparation.");
  }
  if (report.editorialReadiness.some((item) => !item.ready)) {
    throw new Error("Editorially unready candidates block UI preview preparation.");
  }

  const validationHash = validationFingerprint(report);
  const overlays = bundle.candidates.map((candidate) => projectCandidateForApp(candidate, {
    validationHash,
    previewOnly: true,
  }, dataset));
  await writeJsonAtomic(paths.previewOverlays, overlays);
  console.log(JSON.stringify({
    stage: "preview_prepare",
    candidates: overlays.map((item) => item.id),
    reviewStatuses: bundle.candidates.map((item) => ({ id: item.pokemonId, status: item.review.status })),
    approved: false,
    published: false,
    output: paths.previewOverlays,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
