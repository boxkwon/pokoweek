import { readPokemonArg } from "../lib/args";
import { normalizeKyuremDataset } from "../normalizers/kyurem";

async function main() {
  readPokemonArg();
  const { dataset, registry } = await normalizeKyuremDataset();
  console.log(JSON.stringify({
    stage: "normalize",
    pokemon: dataset.pokemon.map((item) => `${item.id}:${item.form}`),
    fusionRecipes: dataset.fusionRecipes.map((item) => item.id),
    evidenceRecords: registry.records.length,
    sourceSnapshotHash: dataset.sourceSnapshotHash,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
