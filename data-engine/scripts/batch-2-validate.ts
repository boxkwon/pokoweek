import { writeJsonAtomic } from "../lib/files";
import { getBatchTwoPaths, validateBatchTwo } from "../batch-2/validate";

validateBatchTwo().then(async ({ report }) => { await writeJsonAtomic(getBatchTwoPaths().validation, report); console.log(JSON.stringify(report, null, 2)); if (!report.structuralComplete || report.editorialReadiness.some((item) => !item.editorialReady)) process.exitCode = 1; }).catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
