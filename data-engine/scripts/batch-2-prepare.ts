import { prepareBatchTwo } from "../batch-2/prepare";

prepareBatchTwo().then(({ bundle }) => console.log(JSON.stringify({ stage: "d_grade_batch_2_prepare", targets: bundle.candidates.map((item) => item.pokemonId), statuses: bundle.candidates.map((item) => item.review.status), paidApiCalls: 0 }, null, 2))).catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
