import { writeJsonAtomic } from "../lib/files";
import { getBatchOnePaths, validateBatchOne } from "../batch-1/validate";

validateBatchOne().then(async ({ report }) => {
  await writeJsonAtomic(getBatchOnePaths().validation, report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.structuralComplete || report.editorialReadiness.some((item) => !item.editorialReady)) process.exitCode = 1;
}).catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });

