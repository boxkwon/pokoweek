import { collectPogoApi } from "../collectors/pogoapi";
import { readPokemonArg } from "../lib/args";

async function main() {
  readPokemonArg();
  const manifest = await collectPogoApi();
  console.log(JSON.stringify({
    stage: "collect",
    source: manifest.sourceId,
    runId: manifest.runId,
    retrievedAt: manifest.retrievedAt,
    endpoints: manifest.endpoints.length,
    snapshotHash: manifest.snapshotHash,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
