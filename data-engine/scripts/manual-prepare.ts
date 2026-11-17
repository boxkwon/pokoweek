import { createManualGuidePackages } from "../manual/package";

async function main() {
  const result = await createManualGuidePackages();
  console.log(JSON.stringify({
    stage: "manual-prepare",
    apiCallPerformed: false,
    packages: result.packages.map((item) => ({ pokemonId: item.pokemonId, packageHash: item.packageHash })),
    prompt: result.promptPath,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
