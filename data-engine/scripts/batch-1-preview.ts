import { writeJsonAtomic } from "../lib/files";
import { getBatchOnePaths, validateBatchOne } from "../batch-1/validate";

async function main() {
  if (process.env.VERCEL_ENV === "production") throw new Error("Batch 1 candidate overlays cannot be prepared in Production.");
  const { bundle, report } = await validateBatchOne();
  if (!report.structuralComplete || report.editorialReadiness.some((item) => !item.editorialReady)) throw new Error("Validation blocks Preview overlay generation.");
  const overlays = bundle.candidates.map((candidate) => ({ id: candidate.pokemonId, validationHash: report.validationHash, previewOnly: true, guide: candidate.guide }));
  await writeJsonAtomic(getBatchOnePaths().preview, overlays);
  console.log(JSON.stringify({ stage: "d_grade_batch_1_preview", candidates: overlays.map((item) => item.id), approved: false, published: false }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
